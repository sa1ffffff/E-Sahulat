# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Delegated: the user asked for "top-notch, production grade" and left the stack open. The GUI moves from Streamlit to a hand-built HTML/CSS/JS front end served by a small FastAPI server (`server.py`) that runs the same notebook pipeline cells. The Streamlit `app.py` stays as a fallback.

## Users

Pakistani citizens with a passport question (renewal, child passport, lost passport, processing times, fees), reading English, Urdu (Nastaliq, right to left) or Roman Urdu, often on a phone. Secondary audience: university evaluators and peers viewing the project, who should be impressed on first look and able to inspect how answers are decided and measured.

## Product Purpose

Answer passport questions only from 30 official DGI&P evidence passages, quoting them verbatim with a source link. When the passages do not support an answer, the system asks for clarification or abstains instead of guessing. Success: a citizen gets a trustworthy, cited answer or an honest "can't verify", in their own script.

## Positioning

Not a chatbot: every answer is a verified verbatim quote from an official page, and refusing to answer is a first-class outcome. Three scripts (English, Urdu, Roman Urdu) resolve to the same evidence.

## Operating Context

- Three working areas: Ask (question → decision → quoted evidence → decision trace), Knowledge base (browse/filter the 30 passages), Evaluation (metrics from `esahulat/outputs/app_metrics.json` or `results/app_metrics.json`).
- Decisions: `answer`, `clarify`, `abstain`, each with a reason code.
- Optional local LLM (Ollama) writes a short plain-language answer from the quotes only; numbers not in the quotes are flagged.
- Everything runs locally; no external APIs.

## Capabilities and Constraints

- Corpus: 30 passages from 5 DGI&P pages; freshness "needs manual review".
- No fee schedule in the knowledge base; the UI must never imply one.
- Shipped metrics were produced with a non-neural stand-in embedder; the UI must say so when `dense_backend` is not `neural`.

## Evidence on Hand

- Real corpus and answers from the pipeline; demo questions in `DEMO_QUESTIONS.md`.
- Metrics in `results/app_metrics.json`.
- No logo, testimonials, or user counts exist; do not invent them.

## Product Principles

1. Evidence before prose: the quote and its source are the answer.
2. Honest refusal is a feature, shown with the same care as an answer.
3. Every script is first-class; Urdu is never a translated afterthought.
4. Show the reasoning on request, never hide the measurements.

## Accessibility & Inclusion

Urdu text renders right to left in a Nastaliq face with generous line height. Works on phone widths. WCAG AA contrast; full keyboard use.
