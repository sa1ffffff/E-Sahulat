"""Optional local LLM (Ollama) that turns the verified official passages into a step-by-step answer.

It only runs after the pipeline has decided to answer, and it only sees the retrieved official passages, so it can't change
the answer/clarify/abstain decision or bring in outside facts. Numbers it writes are checked against the quotes.
"""
import json
import os
import re
import shutil
import subprocess
import time
from pathlib import Path

import requests

OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434")
# 3B is quicker and fine for English; 4B is slower but writes usable Urdu and Roman Urdu.
MODELS = {
    "3b": {"name": os.environ.get("ESAHULAT_LLM_3B", "qwen2.5:3b"), "label": "Qwen 3B"},
    "4b": {"name": os.environ.get("ESAHULAT_LLM_4B", "qwen3:4b-instruct-2507-q4_K_M"), "label": "Qwen 4B"},
}
DEFAULT = "3b"
LANG_NAME = {
    "en": "English",
    "ur": "Urdu, in Urdu script only, with no English sentences",
    "roman_ur": "Roman Urdu: Urdu written in English letters, like \"Aap online renew karwa sakte hain.\" "
                "Never use Urdu script or Hindi",
}
SYSTEM = """You are E-Sahulat, a helper for Pakistani passport services. Every question is about a Pakistani passport, \
even when it doesn't say so: "I want to renew" means renewing a passport.

Answer using ONLY the official DGI&P passages given. Write the whole answer in {lang}.
- Start with one short sentence that answers the question directly.
- Then give numbered steps (1., 2., 3.) the person should follow, one action per line, only steps the passages \
support. Skip the steps if the question is a simple fact.
- Keep every number, fee, document name and time period exactly as written in the passages.
- End each step with the id of the passage it comes from, as given in this question's passages.
- Never add documents, fees, offices or conditions that are not in the passages, even if commonly true.
- Stop after the last step: no notes, no summary, nothing about what the passages leave out.
- Every step must restate something a passage says. Don't add websites, offices, fees or follow-up advice.
- Speak to the citizen directly. Don't mention "passages" or "quotes"."""

# Models add a closing "Note: the passages don't say..." whatever the prompt says; it reads as doubt, so cut it.
STOP = ["Note:", "\nNote", "نوٹ:", "\n\nاس سے"]

# One worked example per reply language: small models copy the shape of an example far better than a list of rules.
EXAMPLE_PASSAGES = {
    "en": "[X1] For minors below 10 years of age must submit either an Original Child Registration Certificate (CRC / "
          "Form'B') OR a Family Registration Certificate (FRC), along with one photocopy.\n"
          "[X2] Original valid CNICs or Passports of both Parents along with photocopies. A minor ... shall be "
          "accompanied by either of the parents or legal guardian, appointed by the court of law.",
    "ur": "[X1] 10 سال سے کم عمر بچوں کے لیے اصل CRC/Form-B یا FRC میں سے ایک دستاویز اور اس کی فوٹو کاپی درکار ہے۔\n"
          "[X2] دونوں والدین کے اصل مؤثر CNIC یا پاسپورٹ اور فوٹو کاپیاں؛ نابالغ کے ساتھ والدین میں سے کوئی ایک یا عدالت کا "
          "مقرر کردہ سرپرست ہو۔",
}
EXAMPLE = {
    "en": ("My son is 7, he needs a passport",
           "For a child under 10, bring these when you apply:\n"
           "1. The child's original CRC (Form-B) or FRC, with one photocopy. [X1]\n"
           "2. Both parents' original valid CNICs or passports, with photocopies. [X2]\n"
           "3. One parent, or a court-appointed legal guardian, must come with the child. [X2]"),
    "roman_ur": ("Mere bete ki umar 7 saal hai, uska passport banwana hai",
                 "10 saal se kam umar ke bachay ke passport ke liye yeh saath layein:\n"
                 "1. Bachay ka original CRC (Form-B) ya FRC, aur us ki aik photocopy. [X1]\n"
                 "2. Dono walidain ke original valid CNIC ya passport, photocopies ke saath. [X2]\n"
                 "3. Bachay ke saath walidain mein se koi aik, ya adalat ka muqarrar karda guardian, zaroor aaye. [X2]"),
    "ur": ("میرا بیٹا 7 سال کا ہے، اس کا پاسپورٹ بنوانا ہے",
           "10 سال سے کم عمر بچے کے پاسپورٹ کے لیے یہ ساتھ لائیں:\n"
           "1. بچے کا اصل CRC/Form-B یا FRC اور اس کی ایک فوٹو کاپی۔ [X1]\n"
           "2. دونوں والدین کے اصل مؤثر CNIC یا پاسپورٹ اور ان کی فوٹو کاپیاں۔ [X2]\n"
           "3. بچے کے ساتھ والدین میں سے کوئی ایک یا عدالت کا مقرر کردہ سرپرست ضرور آئے۔ [X2]"),
}


def installed():
    """Keys of MODELS that Ollama has pulled, or None when Ollama isn't reachable."""
    try:
        names = {m["name"] for m in requests.get(f"{OLLAMA_URL}/api/tags", timeout=2).json().get("models", [])}
    except (requests.RequestException, ValueError):
        return None
    return [key for key, m in MODELS.items() if m["name"] in names]


def state():
    """'ready' (at least one model pulled), 'missing_model' (Ollama runs, neither is pulled) or 'offline'."""
    keys = installed()
    return "offline" if keys is None else "ready" if keys else "missing_model"


def start(wait=15):
    """Launch `ollama serve` in the background if it's installed and not already running. Returns state()."""
    if state() != "offline":
        return state()
    exe = shutil.which("ollama") or next(
        (str(p) for p in [Path(os.environ.get("LOCALAPPDATA", "")) / "Programs/Ollama/ollama.exe"] if p.exists()), None)
    if exe is None:
        return "offline"
    flags = getattr(subprocess, "CREATE_NO_WINDOW", 0) | getattr(subprocess, "DETACHED_PROCESS", 0)
    # one model in memory at a time: switching 3B/4B evicts the other instead of loading both
    env = {**os.environ, "OLLAMA_MAX_LOADED_MODELS": "1"}
    subprocess.Popen([exe, "serve"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, creationflags=flags,
                     start_new_session=os.name != "nt", env=env)
    deadline = time.monotonic() + wait
    while time.monotonic() < deadline:
        if (s := state()) != "offline":
            return s
        time.sleep(0.5)
    return "offline"


def evidence_text(resp):
    """The answer passage first, then related ones on the same topic."""
    passages = resp.get("context") or [dict(pid=ev["pid"], text=" ".join(ev["spans"]), text_ur=ev.get("text_ur"))
                                       for ev in resp["evidence"] if ev["role"] == "answer"]
    # Urdu replies get the Urdu text only, so the model copies its wording instead of translating
    ur = resp["lang"] == "ur"
    return "\n".join(f"[{p['pid']}] {p['text_ur'] if ur and p.get('text_ur') else p['text']}" for p in passages)


def example_turns(lang):
    question, answer = EXAMPLE[lang]
    passages = EXAMPLE_PASSAGES["ur" if lang == "ur" else "en"]
    return [{"role": "user", "content": f"Official passages:\n{passages}\n\nQuestion: {question}"},
            {"role": "assistant", "content": answer}]


def unload_others(model):
    """Free the other size's memory: both together with e5 leave a 16 GB laptop swapping."""
    for key, m in MODELS.items():
        if key != model:
            requests.post(f"{OLLAMA_URL}/api/generate", json={"model": m["name"], "keep_alive": 0}, timeout=10)


def stream_answer(question, resp, model=DEFAULT, handle=None):
    """Yield the reply in chunks.

    A caller can stop it from another thread: `handle["response"]` is the open Ollama request to close, and
    `handle["cancelled"]` covers the wait before Ollama answers (it can't be closed yet while a model loads)."""
    handle = {} if handle is None else handle
    unload_others(model)
    body = {"model": MODELS[model]["name"], "stream": True, "keep_alive": "30m",
            "options": {"temperature": 0, "num_predict": 450, "stop": STOP},
            "messages": [{"role": "system", "content": SYSTEM.format(lang=LANG_NAME[resp["lang"]])},
                         *example_turns(resp["lang"]),
                         {"role": "user", "content": f"Official passages:\n{evidence_text(resp)}\n\nQuestion: {question}"}]}
    with requests.post(f"{OLLAMA_URL}/api/chat", json=body, stream=True, timeout=180) as r:
        handle["response"] = r
        r.raise_for_status()
        for line in r.iter_lines():
            if handle.get("cancelled"):
                return  # leaving the with-block closes the request, which stops Ollama generating
            if line:
                yield json.loads(line).get("message", {}).get("content", "")


def unsupported_numbers(text, resp):
    """Numbers in the LLM text that don't appear in the evidence (int() also reads Urdu digits).

    Step numbers ("2.") and passage ids ("[F03]") are the answer's own scaffolding, not claims, so they're skipped."""
    text = re.sub(r"\[[A-Z]\d+\]", "", re.sub(r"(?m)^\s*[\d۰-۹٠-٩]+[.)۔]", "", text))
    numbers = lambda s: {int(n) for n in re.findall(r"\d+", s)}
    return sorted(numbers(text) - numbers(evidence_text(resp)))


def unknown_sources(text, resp):
    """Passage ids the LLM cites that it wasn't given (e.g. copied from the worked example)."""
    given = set(re.findall(r"\[(F\d+)\]", evidence_text(resp)))
    return sorted(set(re.findall(r"\[([A-Z]\d+)\]", text)) - given)
