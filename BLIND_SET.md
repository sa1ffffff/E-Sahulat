# Blind set provenance

- `blind_queries.csv` holds the model input (`qid, language, query`). `blind_answer_key.csv` holds the labels (`group, answerable, expected_decision, expected_intent, expected_topic, gold_evidence_ids, expected_behavior, notes`). The notebook joins them on `qid` only after the system has answered.
- 47 queries: 22 English, 14 Roman Urdu, 11 Urdu. Expected decisions: 33 answer, 8 abstain, 4 clarify, 2 either (`no_answer`).
- Six `group`s are the same question in English, Urdu and Roman Urdu, used for cross-language consistency.
- Confusable pairs covered: child vs. adult validity (B19–B21), under-10 vs. 10-plus ID (B21, B22), renewal vs. new application (B07–B09, B23), normal vs. fast track (B24, B25), online vs. in-person (B34), MRP vs. e-passport (B26).
- Gold IDs refer only to passages F01–F30 in the current KB.
- Written on 2026-10-16 before any round-2 code change. Hashes are in `blind_freeze.json`. The blind set was never used to tune rules, lexicon, thresholds or retriever choice.
- It's not independent: the same person wrote the lexicon and the rules. Treat it as blind to tuning, not as a third-party test. If anyone debugs against it, write a new set before the next final evaluation.
