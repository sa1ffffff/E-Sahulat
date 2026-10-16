# Change log: round 2

Pipeline `e916468f2313` (baseline) → `841339e5e722` (final). Every number below was measured with the char-ngram stand-in dense backend, because the e5 model couldn't be downloaded in the build environment. Re-run in Colab to get e5 numbers, and report those as-is.

## Order of work

1. Wrote `blind_queries.csv` + `blind_answer_key.csv` (47 queries) and froze their hashes before touching code.
2. Ran the unchanged pipeline on the blind set once and recorded only the aggregates (`baseline/`).
3. Cleaned up the notebook without changing behavior. Dev, test and brief outputs matched the baseline on all 186 rows (decision, reason, citation, top-5, scores).
4. Made fixes from dev errors only (below).
5. Froze `841339e5e722` and ran the blind set once.
6. Re-ran the same frozen version once more to generate the app's metrics file. The blind summary was identical apart from latency. Both runs are in `results/blind_runs.log`.

## Changes

| Area | Change | Why |
|---|---|---|
| Blind evaluation (cell 20) | Two-file blind format, pipeline fingerprint (code + config + KB hash), run log, metrics with n and bootstrap CIs, cross-language groups | brief steps 2–3 |
| Dev data (cell 07) | 17 confusable-sibling queries (`TDC*`) and 8 in-domain unsupported queries (`TDU*`), dev split only | official dev had no confusable or in-domain negative cases to tune against |
| Normalization (cell 09) | fuzzy matching over multi-word forms (`fst track`) | `TDC10`: 3-letter typo inside a phrase |
| | number phrases: `N saal ka passport` → VALIDITY; `N year old` / `N saal ka bacha` → MINOR, plus UNDER/ABOVE at 10 | `TDC01`, `TDC16`, `TDC17`: age vs. validity confusion (F06/F07/F12) |
| | `PREVIOUS` concept (old / purana / پرانا), `dino` as a TIME form | `TDC15`, `TDC10` |
| Corpus (cell 04) | organisers' topic label indexed with each passage | `F02_EN`: F02's text never says "documents" or "adult" |
| Retrieval (cells 11, 13) | `+rerank` methods: concept-agreement reranking, λ tuned on dev MRR@5 | separate sibling passages |
| Decisions (cell 15) | abstain when a query names no specific topic and has ≥ n words the KB never uses (n tuned on dev); vectorized threshold search | `TDU02`–`TDU05` were answered |
| KB expansion (cell 05) | live-page fetch, provenance check, candidate passages written to `kb_review.csv`; only `approve=yes` rows join the KB; provenance asserts on every passage | brief step 5 |
| Regression tests (cell 15b) | asserts on concepts and on lexical+rerank ranking for each dev fix | brief step 4 |
| Report (cells 21, 21b) | `FINAL_EVALUATION_REPORT.md` with baseline vs. final blind; `app_metrics.json` for the app | brief step 6 |
| Cleanup | markdown 2,395 → 339 words; comment lines 69 → 22; plan table and narration removed; dense model load now fails loudly instead of silently falling back | readability |

The production retriever is still chosen by dev MRR@5. On the new dev set it moved from `BM25-norm+lex+bi` to `BM25-norm+lex`, which tied `BM25-norm+lex+bi+rerank` at 1.000 and comes first in the method list.

## Effect

| Metric | Baseline | Final | n |
|---|---|---|---|
| **Blind** decision accuracy | 0.766 | 0.723 | 47 |
| **Blind** answer recall | 0.909 | 0.848 | 33 |
| **Blind** false-answer rate | 0.571 | 0.571 | 14 |
| **Blind** citation support | 0.533 | 0.607 | 30 → 28 answered |
| **Blind** Recall@5 / MRR@5 | 0.939 / 0.677 | 0.848 / 0.672 | 33 |
| **Blind** cross-language same decision | 0.833 | 0.667 | 6 groups |
| **Blind** latency p50 / p95 (ms) | 1.7 / 2.5 | 5.8 / 8.7 | 47 |
| Dev decision accuracy (139 queries incl. new ones) | – | 0.964 | 139 |
| Test (inspected) citation support | 0.846 | 0.923 | 39 |
| Test cue-leakage ablation: accuracy / false-answer | 0.833 / 0.381 | 0.900 / 0.190 | 60 / 21 |

On the blind set, citation support went up and every other metric stayed level or went down. All the confidence intervals overlap, so none of the changes is significant at n=47. The dev gains (17 errors → 5) didn't carry over, which suggests the fixes are too specific to the dev phrasing. Latency rose because of the phrase-level fuzzy matcher.

## Known bug found after the final blind run (not fixed)

`fuzzy_phrase_concepts` matches "a passport" to "e passport", so EPASS fires on queries like "need for a passport" (see `TDC01` and `TDC16` in the report). I found it only after reading the final report. Fixing it now would be a change made after seeing blind results, so it needs a new blind set. The fix would require an exact match on the first token of a multi-word form.

## Remaining risks and next steps

- **False answers on the blind set: 8 of 14 unanswerable queries were answered.** The causes:
  - prompt injection without the cue words, such as "forget your sources";
  - questions on topics the KB doesn't cover (contact info, office hours, travel rules, fees);
  - ambiguous questions that contain a topic word.
  The next fix is a passage-level check that the passage states the specific claim asked about.
- **Wrong passage on 11 answered blind queries (10 unrelated, 1 sibling).** Retrieval often lands on a passage that shares one concept.
- **No independent test.** The blind set and the lexicon have the same author. A teammate should write a fresh set before any further changes.
- **No neural backend in these numbers.** Run the notebook with e5 in Colab and report that blind result as-is, without changing the code first.
- **KB is still 30 passages.** Run the ingestion cell with `CFG["scrape_official_pages"] = True` and approve passages by hand in `kb_review.csv`.

## Running the app

```
pip install -r requirements.txt
streamlit run app.py
```

Run it from the folder that holds the notebook, the dataset `.docx` and `esahulat/outputs/app_metrics.json` (written by the notebook). The app runs the notebook cells tagged `pipeline` at startup, so it uses exactly the notebook's code. It wasn't launched in the build environment, because Streamlit and Plotly couldn't be installed there. Its logic was exercised with stand-in modules in all three modes.
