"""Web front end for the E-Sahulat notebook. Run: python server.py  (then open http://127.0.0.1:8000)"""
import contextlib
import io
import json
import os
import threading
import time
from pathlib import Path

import requests
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from starlette.concurrency import iterate_in_threadpool

import llm

ROOT = Path(__file__).resolve().parent
NOTEBOOK = Path(os.environ.get("ESAHULAT_NOTEBOOK", ROOT / "E_Sahulat_AI_Hackathon.ipynb"))
METRICS = [ROOT / "esahulat/outputs/app_metrics.json", ROOT / "results/app_metrics.json"]
WEB = ROOT / "web"
LANGS = {"auto", "en", "ur", "roman_ur"}

state = {"ns": None, "error": None, "llm": "offline"}


def load_pipeline():
    """Exec the notebook cells tagged `pipeline`, as app.py does. Runs in a thread so the page can show progress."""
    os.environ.setdefault("ESAHULAT_HEADLESS", "1")
    os.environ.setdefault("ESAHULAT_NO_INSTALL", "1")
    os.chdir(ROOT)
    try:
        cells = json.loads(NOTEBOOK.read_text(encoding="utf-8"))["cells"]
        ns = {"__name__": "esahulat_pipeline"}
        with contextlib.redirect_stdout(io.StringIO()):
            for cell in cells:
                if "pipeline" in cell.get("metadata", {}).get("tags", []):
                    exec(compile("".join(cell["source"]), str(NOTEBOOK), "exec"), ns)
        state["ns"] = ns
    except Exception as exc:  # surfaced to the UI through /api/status
        state["error"] = f"{type(exc).__name__}: {exc}"


def watch_llm():
    """Probe Ollama off the request path so the status poll stays fast."""
    while True:
        refresh_llm()
        time.sleep(30)


def refresh_llm():
    state["llm_installed"] = llm.installed() or []
    state["llm"] = llm.state()


def pipeline():
    if state["ns"] is None:
        raise HTTPException(503, state["error"] or "The pipeline is still loading.")
    return state["ns"]


app = FastAPI(title="E-Sahulat AI", docs_url=None, redoc_url=None)
threading.Thread(target=load_pipeline, daemon=True).start()
threading.Thread(target=watch_llm, daemon=True).start()


@app.middleware("http")
async def revalidate(request, call_next):
    response = await call_next(request)
    response.headers.setdefault("Cache-Control", "no-cache")
    return response


class Ask(BaseModel):
    query: str
    lang: str = "auto"


class LlmRequest(BaseModel):
    query: str
    response: dict
    model: str = llm.DEFAULT


@app.get("/api/status")
def status():
    ns = state["ns"]
    if ns is None:
        return {"ready": False, "error": state["error"]}
    return {"ready": True, "retriever": ns["FINAL_METHOD"], "dense_model": ns["ENC"].name,
            "passages": len(ns["PASSAGES"]), "documents": len(ns["DOCS"]),
            "llm": llm_info()}


def llm_info():
    return {"available": state["llm"] == "ready", "state": state["llm"], "default": llm.DEFAULT,
            "models": [{"key": key, "label": m["label"], "name": m["name"], "installed": key in state.get("llm_installed", [])}
                       for key, m in llm.MODELS.items()]}


@app.post("/api/llm/start")
def llm_start():
    """Start Ollama on this machine when the user switches Qwen on and it isn't running."""
    llm.start()
    refresh_llm()
    return llm_info()


def respond_as_passport_question(ns, query, lang):
    """Everyone using this app is asking about a passport, so "I want to renew" means renewing one.

    When a query doesn't name the passport and falls short of the answer threshold, ask again with the word in front.
    The retry still has to pass the same threshold, so off-topic queries ("hello", cricket) stay refused.
    """
    resp = ns["respond"](query, lang=lang)
    q = ns["analyze"](query)
    if resp["reason"] != "insufficient_evidence" or "PASSPORT" in q.concepts:
        return resp
    retry = ns["respond"](f"{'پاسپورٹ' if q.style == 'ur' else 'passport'} {query}", lang=resp["lang"])
    if retry["decision"] == "abstain":
        return resp
    retry["query"] = query
    retry["trace"]["assumed_passport"] = True
    return retry


def related_passages(ns, resp, limit=3):
    """The answer passage plus retrieved passages on the same topic, so Qwen can write the steps around it.

    Same topic = the topic labels share a word stem ("online renewal" and "renew before expiry")."""
    answer = next((ev["pid"] for ev in resp["evidence"] if ev["role"] == "answer"), None)
    if answer is None:
        return []
    stems = lambda p: {w[:5] for w in p["label"].split() if len(w) > 2} - {"passp"}
    first = ns["PASS"][answer]
    picked = [first] + [p for pid in resp["trace"]["top5"] if pid != answer
                        and (p := ns["PASS"][pid])["authority"] == "official" and stems(p) & stems(first)]
    return [{k: p.get(k) for k in ("pid", "title", "url", "text", "text_ur")} for p in picked[:limit]]


@app.post("/api/ask")
def ask(body: Ask):
    ns = pipeline()
    query = body.query.strip()[:1000]
    if not query:
        raise HTTPException(422, "Type a question first.")
    resp = respond_as_passport_question(ns, query, body.lang if body.lang in LANGS else "auto")
    verified, issues = ns["verify_response"](resp)
    resp["context"] = related_passages(ns, resp)
    related = ns["MSG"][resp["lang"]]["related"]
    resp["notes"] = [n for n in resp["notes"] if n != related]
    for pid in resp["trace"]["top5"]:
        resp["trace"].setdefault("top5_topics", []).append(ns["PASS"][pid]["label"])
    return {"response": resp, "verified": verified, "issues": issues}


@app.get("/api/passages")
def passages(q: str = ""):
    ns = pipeline()
    keep = ["pid", "doc_id", "topic", "label", "title", "text", "text_ur", "url", "freshness"]
    rows = [{k: p.get(k) for k in keep} for p in ns["PASSAGES"]]
    if q.strip():
        needle = ns["normalize"](q)
        rows = [r for r in rows if needle in ns["normalize"](" ".join(str(v) for v in r.values()))]
    return rows


@app.get("/api/metrics")
def metrics():
    for path in METRICS:
        if path.exists():
            # the notebook writes NaN for empty slices; browsers can't parse it
            data = json.loads(path.read_text(encoding="utf-8"), parse_constant=lambda _: None)
            data["_source"] = str(path.relative_to(ROOT)).replace("\\", "/")
            return JSONResponse(data)
    raise HTTPException(404, "No app_metrics.json yet. Run the notebook once; its export cell writes it.")


@app.post("/api/llm")
def llm_answer(body: LlmRequest, request: Request):
    """NDJSON stream: {"t": chunk} lines, then {"done": true, "unsupported": [...], "unknown_sources": [...]} or {"error": "..."}."""
    resp = body.response
    if body.model not in llm.MODELS:
        raise HTTPException(422, f"Unknown model {body.model!r}; use one of {', '.join(llm.MODELS)}.")

    async def stream():
        text = ""
        handle = {}
        try:
            async for chunk in iterate_in_threadpool(llm.stream_answer(body.query, resp, body.model, handle)):
                if await request.is_disconnected():
                    return  # the page moved on; the finally below stops Ollama
                text += chunk
                yield json.dumps({"t": chunk}, ensure_ascii=False) + "\n"
            yield json.dumps({"done": True, "unsupported": llm.unsupported_numbers(text, resp),
                              "unknown_sources": llm.unknown_sources(text, resp)}) + "\n"
        except requests.ConnectionError:
            yield json.dumps({"error": f"Ollama isn't reachable at {llm.OLLAMA_URL}"}) + "\n"
        except Exception as exc:
            yield json.dumps({"error": str(exc)}) + "\n"
        finally:
            # closing our request is what makes Ollama stop generating
            handle["cancelled"] = True
            if response := handle.get("response"):
                response.close()

    return StreamingResponse(stream(), media_type="application/x-ndjson")


@app.get("/")
def index():
    return FileResponse(WEB / "index.html")


app.mount("/", StaticFiles(directory=WEB), name="web")

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=os.environ.get("HOST", "127.0.0.1"), port=int(os.environ.get("PORT", "8000")))
