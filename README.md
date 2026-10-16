# Multilingual E-Sahulat AI

Passport Q&A in English, Urdu and Roman Urdu over 30 official DGI&P evidence passages. Answers are verbatim quotes with a source link; the system abstains or asks for clarification when the passages don't support an answer. Everything runs locally; no API calls.

## Run

```
pip install -r requirements.txt
jupyter notebook E_Sahulat_AI_Hackathon.ipynb   # or open it in Colab and upload the repo files
streamlit run app.py
```

Run the notebook once before the app; it writes `esahulat/outputs/app_metrics.json`, which the app's Evaluation mode reads.

## Files

| Path | What it is |
|---|---|
| `E_Sahulat_AI_Hackathon.ipynb` | pipeline, tuning on dev, evaluation, report generation |
| `app.py` | Streamlit app (Ask, Knowledge base, Evaluation with animated charts); runs the notebook cells tagged `pipeline` |
| `Multilingual_E-Sahulat_AI_Hackathon_Dataset.docx` | organisers' dataset (corpus + official dev/test queries) |
| `blind_queries.csv`, `blind_answer_key.csv` | blind set, input and labels kept separate; provenance in `BLIND_SET.md` |
| `FINAL_EVALUATION_REPORT.md` | measured results, baseline vs. final |
| `CHANGELOG.md` | what changed in round 2, why, and the effect |
| `baseline/`, `results/` | blind summaries, per-query results, run log, app metrics |
| `report/report.tex` | LaTeX technical report; reads `esahulat/outputs/latex/results/` written by the notebook |

The numbers in `results/` were produced with a non-neural stand-in for the dense model, because the build environment couldn't download e5. Re-run the notebook with e5 for the real figures.
