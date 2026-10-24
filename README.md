# Multilingual E-Sahulat AI

Passport Q&A in English, Urdu and Roman Urdu over 30 official DGI&P evidence passages. Answers are verbatim quotes with a source link; the system abstains or asks for clarification when the passages don't support an answer. Everything runs locally; no API calls.

## Run

```
pip install -r requirements.txt
jupyter notebook E_Sahulat_AI_Hackathon.ipynb   # or open it in Colab and upload the repo files
python server.py                                 # then open http://127.0.0.1:8000
```

The web app (`server.py` + `web/`) has three sections: **Ask** (each answer is stamped *Verified true copy*, *Particulars required* or *Not on record*, with the verbatim quote, the Urdu text, the source link and the decision trace), **Knowledge base** (filter the 30 passages; citation codes link straight to them) and **Evaluation** (blind-set KPIs against the baseline and six charts, each with a table view). The pipeline loads in the background; the page shows progress until it is ready. Set `PORT` or `HOST` to change where it listens.

Run the notebook once before the app; it writes `esahulat/outputs/app_metrics.json`, which the Evaluation section reads (it falls back to `results/app_metrics.json`). The older Streamlit front end still works with `streamlit run app.py`.

### Optional: local LLM answer

With [Ollama](https://ollama.com) running and `ollama pull qwen2.5:3b` done, the Ask page adds a short plain-language answer above the quotes (sidebar toggle). It only runs when the pipeline has already decided to answer and the citation verified, it sees only the quoted spans, and any number it writes that isn't in the quotes is flagged. Set `ESAHULAT_LLM` to use another Ollama model, `OLLAMA_URL` for a non-default host.

## Files

| Path | What it is |
|---|---|
| `E_Sahulat_AI_Hackathon.ipynb` | pipeline, tuning on dev, evaluation, report generation |
| `server.py`, `web/` | web app (FastAPI + plain HTML/CSS/JS); runs the notebook cells tagged `pipeline` |
| `app.py` | previous Streamlit front end, kept as a fallback |
| `llm.py` | optional local LLM (Ollama) that rewrites the verified quotes into a short answer |
| `Multilingual_E-Sahulat_AI_Hackathon_Dataset.docx` | organisers' dataset (corpus + official dev/test queries) |
| `blind_queries.csv`, `blind_answer_key.csv` | blind set, input and labels kept separate; provenance in `BLIND_SET.md` |
| `FINAL_EVALUATION_REPORT.md` | measured results, baseline vs. final |
| `CHANGELOG.md` | what changed in round 2, why, and the effect |
| `baseline/`, `results/` | blind summaries, per-query results, run log, app metrics |
| `report/technical_report.tex`, `.pdf` | full technical report (architecture, worked example, models, GUI, e5 results with charts); `python report/make_report_data.py` then `tectonic technical_report.tex` rebuilds it from the notebook's outputs |
| `report/report.tex` | earlier LaTeX report; reads `esahulat/outputs/latex/results/` written by the notebook |

The numbers in `results/` were produced with a non-neural stand-in for the dense model, because the build environment couldn't download e5. Re-run the notebook with e5 for the real figures.
