"""Optional local LLM (Ollama) that turns the verified evidence quotes into a short plain-language answer.

It only runs after the pipeline has decided to answer, and it only sees the quoted spans, so it can't change
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
MODEL = os.environ.get("ESAHULAT_LLM", "qwen2.5:3b")
LANG_NAME = {"en": "English", "ur": "Urdu in Urdu script", "roman_ur": "Roman Urdu (Urdu written in Latin letters)"}
SYSTEM = ("You answer questions about Pakistani passports using ONLY the official DGI&P quotes you are given. "
          "Reply in {lang}, in one to three short sentences. Keep every number, fee, document name and time period exactly "
          "as written in the quotes. Never mention any document, fee, step or condition that is not written in the quotes, "
          "even if it is commonly true. If the quotes don't fully answer the question, say only what they do state and "
          "add that the official text quoted here doesn't cover the rest. "
          "End each sentence with the passage id it comes from, like [F01].")


def state():
    """'ready', 'missing_model' (Ollama runs but MODEL isn't pulled) or 'offline'."""
    try:
        models = requests.get(f"{OLLAMA_URL}/api/tags", timeout=2).json().get("models", [])
    except (requests.RequestException, ValueError):
        return "offline"
    return "ready" if any(m["name"] == MODEL for m in models) else "missing_model"


def available():
    return state() == "ready"


def start(wait=15):
    """Launch `ollama serve` in the background if it's installed and not already running. Returns state()."""
    if state() != "offline":
        return state()
    exe = shutil.which("ollama") or next(
        (str(p) for p in [Path(os.environ.get("LOCALAPPDATA", "")) / "Programs/Ollama/ollama.exe"] if p.exists()), None)
    if exe is None:
        return "offline"
    flags = getattr(subprocess, "CREATE_NO_WINDOW", 0) | getattr(subprocess, "DETACHED_PROCESS", 0)
    subprocess.Popen([exe, "serve"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, creationflags=flags,
                     start_new_session=os.name != "nt")
    deadline = time.monotonic() + wait
    while time.monotonic() < deadline:
        if (s := state()) != "offline":
            return s
        time.sleep(0.5)
    return "offline"


def evidence_text(resp):
    lines = []
    for ev in resp["evidence"]:
        if ev["role"] != "answer":
            continue
        lines += [f"[{ev['pid']}] {span}" for span in ev["spans"]]
        if resp["lang"] == "ur" and ev.get("text_ur"):
            lines.append(f"[{ev['pid']}] (Urdu) {ev['text_ur']}")
    return "\n".join(lines)


def stream_answer(question, resp):
    body = {"model": MODEL, "stream": True, "keep_alive": "30m", "options": {"temperature": 0, "num_predict": 200},
            "messages": [{"role": "system", "content": SYSTEM.format(lang=LANG_NAME[resp["lang"]])},
                         {"role": "user", "content": f"Official quotes:\n{evidence_text(resp)}\n\nQuestion: {question}"}]}
    with requests.post(f"{OLLAMA_URL}/api/chat", json=body, stream=True, timeout=180) as r:
        r.raise_for_status()
        for line in r.iter_lines():
            if line:
                yield json.loads(line).get("message", {}).get("content", "")


def unsupported_numbers(text, resp):
    """Numbers in the LLM text that don't appear in the evidence (int() also reads Urdu digits)."""
    numbers = lambda s: {int(n) for n in re.findall(r"\d+", s)}
    return sorted(numbers(text) - numbers(evidence_text(resp)))
