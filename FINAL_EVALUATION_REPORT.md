# E-Sahulat AI: final evaluation report

Generated 2026-10-16T18:42 from the notebook. Every number below comes from this run.

## Configuration
| item | value |
|---|---|
| pipeline version (code + config + KB hash) | `841339e5e722` |
| dense backend | stub (char-ngram-LSA (stand-in)) |
| production retriever (chosen on dev MRR@5) | BM25-norm+lex |
| thresholds (tuned on dev) | dense ≥ 0.6003, coverage ≥ 0.0, out-of-scope dense < 0.6422 |
| knowledge base | 30 passages from 5 DGI&P pages; freshness: needs manual review |
| dataset sha256 | `5e0e45bce102a95a` |
| blind set sha256 | `2d821119487a` |
| seed | 42 |

## Data
| split | en | roman_ur | ur | All |
|---|---|---|---|---|
| brief | 4 | 4 | 4 | 12 |
| dev | 53 | 46 | 40 | 139 |
| test | 13 | 40 | 7 | 60 |
| All | 70 | 90 | 51 | 211 |

Blind set: 47 queries, {'en': 22, 'roman_ur': 14, 'ur': 11}. Written by the system author before any fix in this round and never used for tuning. It is blind to tuning, but not independent of the person who wrote the lexicon.

## Blind evaluation (primary result)
| metric | baseline e916468f2313 | final 841339e5e722 | n |
|---|---|---|---|
| decision accuracy | 0.766 [0.64, 0.87] | 0.723 [0.60, 0.85] | 47 |
| answer recall (answerable answered) | 0.909 [0.82, 1.00] | 0.848 [0.70, 0.94] | 33 |
| false-answer rate on unanswerable | 0.571 [0.36, 0.79] | 0.571 [0.36, 0.79] | 14 |
| clarify accuracy | 0.500 [0.00, 1.00] | 0.500 [0.00, 1.00] | 4 |
| retrieval Recall@5 | 0.939 [0.85, 1.00] | 0.848 [0.73, 0.97] | 33 |
| retrieval MRR@5 | 0.677 [0.56, 0.79] | 0.672 [0.55, 0.80] | 33 |
| citation: verifier pass (answered) | 1.000 [1.00, 1.00] | 1.000 [1.00, 1.00] | 36 |
| citation: cited passage is gold (answered w/ gold) | 0.533 [0.37, 0.70] | 0.607 [0.43, 0.79] | 28 |
| CITATION SUPPORT (verifier pass and gold) | 0.533 [0.37, 0.70] | 0.607 [0.43, 0.79] | 28 |
| cross-language: same decision | 0.833 | 0.667 | 6 |
| cross-language: same decision and citation | 0.500 | 0.500 | 6 |
| cross-language: all variants correct | 0.833 | 0.667 | 6 |
| latency p50 / p95 ms | 1.7 / 2.5 | 5.8 / 8.7 | 47 |

Retrieval success is gold-in-top-5. Correct abstention is counted in decision accuracy and the false-answer rate. Citation support means the answer quotes the gold passage and the verifier passes.

Blind errors by type:
| error_type | count |
|---|---|
| false answer on ambiguous | 2 |
| false answer on contact_info | 1 |
| false answer on fee_amount | 1 |
| false answer on office_hours | 1 |
| false answer on online_vs_in_person | 1 |
| false answer on prompt_injection | 1 |
| false answer on travel_rules | 1 |
| missed answer: evidence below threshold | 4 |
| missed answer: rule gate 'clarify_generic' | 1 |
| wrong passage: confusable sibling | 1 |
| wrong passage: unrelated | 10 |

## Official test (previously inspected; regression check only)
| method | n | Recall@5 | MRR@5 | Hit@1 |
|---|---|---|---|---|
| BM25-raw | 40 | 0.875 | 0.769 | 0.700 |
| BM25-norm+lex+bi | 40 | 1.000 | 0.971 | 0.950 |
| BM25-norm+lex | 40 | 1.000 | 0.958 | 0.925 |

|  | TEST (previously inspected) | BRIEF | DEV |
|---|---|---|---|
| n | 60 | 12 | 139 |
| decision accuracy | 1.000 | 1.000 | 0.964 |
| decision acc 95%CI | [1.00, 1.00] | [1.00, 1.00] | [0.93, 0.99] |
| answer precision | 1.000 | 1.000 | 0.972 |
| answer recall (answerable answered) | 1.000 | 1.000 | 0.981 |
| answer F1 | 1.000 | 1.000 | 0.977 |
| false-answer rate on unanswerable | 0.000 | 0.000 | 0.094 |
| clarify accuracy (ambiguous) | 1.000 | - | 1.000 |
| n answerable | 39 | 8 | 107 |
| n unanswerable/ambiguous | 21 | 4 | 32 |

|  | TEST (previously inspected) | BRIEF | DEV |
|---|---|---|---|
| n answered | 39 | 8 | 108 |
| verifier pass rate (quote/URL/numbers) | 1.000 | 1.000 | 1.000 |
| cited passage = gold (answered w/ gold) | 0.923 | 0.875 | 1.000 |
| CITATION SUPPORT RATE | 0.923 | 0.875 | 1.000 |
| citation support 95%CI | [0.85, 1.00] | [0.62, 1.00] | [1.00, 1.00] |
| n answered w/ gold | 39 | 8 | 105 |
| mean answer token-F1 vs expected_answer_en | 0.615 | - | 0.647 |

Leakage ablations on the official test: dropping 19 test-only lexicon forms gives Recall@5 0.975 (from 1.000). Dropping 29 test-only cue phrases gives decision accuracy 0.900 (from 1.000) and false-answer rate 0.190 (from 0.000).

## Cross-language consistency
| method | intents | dev: same top-1 in en/ur/roman | dev: all 3 scripts hit@5 | dev: mean pairwise Jaccard@5 | test SV(noisy roman) top-1 = dev EN top-1 |
|---|---|---|---|---|---|
| BM25-norm+lex | 30 | 1.000 | 1.000 | 0.695 | 0.933 |

Dev, end to end: same decision for en/ur/roman in 0.933 of 30 intents; same decision and citation in 0.933.

## Latency (ms, caches cleared, model loaded)
|  | TEST (previously inspected) | BRIEF | DEV |
|---|---|---|---|
| n | 60 | 12 | 139 |
| p50 ms | 5.5 | 4.5 | 5.6 |
| p95 ms | 8.9 | 6.9 | 7.3 |
| mean ms | 5.8 | 4.1 | 5.6 |
| max ms | 10.7 | 7.4 | 7.9 |

## Dev-driven fixes
| qid | query | gold | cause | fix | concepts | rerank_top1 | production_top1 | decision |
|---|---|---|---|---|---|---|---|---|
| TDC10 | Fst track MRP kitne dino mein milta hai? | F15 | 'fst' is too short for token repair; 'dino' not a TIME form | fuzzy match on multi-word forms; add 'dino' | ['FASTTRACK', 'MRP', 'TIME'] | F15 | F15 | answer |
| TDC16 | Which identity document does a 7-year-old need for a passport? | F06 | '7-year-old' not read as an age | number phrases: age below 10 -> MINOR + UNDER | ['DOCUMENT', 'EPASS', 'IDENTITY', 'MINOR', 'PASSPORT', 'REQUIRE', 'UNDER', 'YEARS'] | F06 | F06 | answer |
| TDC17 | 13 saal ke bachay ke liye juvenile card chalega? | F07 | age 13 not linked to the 10-plus passage | number phrases: age 10-17 -> MINOR + ABOVE | ['ABOVE', 'IDENTITY', 'MINOR', 'YEARS'] | F07 | F07 | answer |
| TDC01 | Can my 9-year-old get a passport valid for ten years? | F12 | '10 years' matched 'below 10 years of age' (F06) | number phrases: 'N saal ka passport' -> VALIDITY | ['EPASS', 'MINOR', 'PASSPORT', 'UNDER', 'VALIDITY', 'YEARS'] | F12 | F12 | answer |
| F02_EN | What documents should an adult applicant bring for a Pakistani passport? | F02 | F02 text never says 'documents' or 'adult' | index the organisers' topic label with each passage | ['ADULT', 'CITIZEN', 'DOCUMENT', 'PASSPORT', 'REQUIRE'] | F02 | F02 | answer |
| TDC15 | تجدید کے لیے پرانا پاسپورٹ اور شناختی کارڈ لانا ضروری ہے؟ | F02 | CNIC matched the address passage F24; 'old passport' unmapped | PREVIOUS concept (old / purana / پرانا) | ['CNIC', 'IDENTITY', 'PASSPORT', 'PREVIOUS', 'RENEW', 'REQUIRE'] | F02 | F02 | answer |
| TDU02 | Passport banwane ke liye blood group zaroori hai? |  | every word generic or unknown; coverage threshold tuned to 0 | abstain when no specific topic and >= n unknown words (n tuned on dev) | ['PASSPORT', 'REQUIRE'] | F05 | F05 | abstain |

## Known limitations
- 30 passages, so retrieval is close to intent classification. No passages were added in this round because none could be verified against the live pages.
- The lexicon and rule gates are hand-written by the same person who wrote the blind set.
- Answers are verbatim quotes. The Urdu text is the organisers' translation; the English excerpt is what's cited.
- There's no fee schedule in the KB; fee questions get a clarification or an abstention.
- If the dense backend above is `stub`, the dense scores and thresholds aren't from the neural model, and the blind result has to be re-run with e5.

## Reproduce
1. Put the dataset `.docx`, `blind_queries.csv` and `blind_answer_key.csv` next to the notebook.
2. Run all cells. The blind set runs once in Step 9, and the run is appended to `esahulat/outputs/blind_runs.log`.
3. This file is written to `FINAL_EVALUATION_REPORT.md`; per-query results are in `esahulat/outputs/`.
