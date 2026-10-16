# Hackathon Challenge: Multilingual E-Sahulat AI

## Evidence-Grounded Multilingual NLP for Pakistan

> Handwritten note on the first page, next to the title: *"Semantic analysis"*

---

## 1. Problem Statement

Pakistan's public-service information is distributed across official websites, FAQs, procedural guides, and PDF documents, often written primarily in English or formal Urdu. Citizens may ask questions in Urdu script, Roman Urdu, English, or a mixture of these languages.

Conventional keyword-based search systems often fail to identify relevant information when the query differs in language, script, spelling, or terminology from the source documents. Furthermore, generative AI systems may produce unsupported or inaccurate answers, particularly when official procedures are incomplete, ambiguous, or outdated.

Your challenge is to develop Multilingual E-Sahulat AI, an evidence-grounded multilingual NLP assistant that enables users to retrieve reliable public-service information using Urdu, Roman Urdu, and English queries.

The system must understand variations in user queries, retrieve relevant passages from a curated collection of official documents, provide answers supported by traceable evidence, and abstain when sufficient evidence is unavailable.

Participants must demonstrate not only a functional application but also measurable improvements in retrieval quality, cross-script robustness, and answer reliability.

---

## 2. Scope and Constraints

**Time limit:** 3-3.5 hours

**Team size:** 2-3 participants

**Resource constraint:** Free and open-source tools, models, and datasets.

Permitted technologies include Python, Streamlit, and other suitable open-source NLP libraries but the models should be loaded in your own code for usage. API calls are not permitted.

Participants may use pretrained models but must identify their models, datasets, and preprocessing methods. Training a transformer from scratch is not required.

The prototype should focus on one well-defined public-service domain, such as passport procedures, identity-document information, or another domain supported by a verifiable document collection.

Using APIs from models like Gemini, ChatGPT, or Claude will be straightforwardly disqualified.

---

## 3. Functional Requirements

**FR-1: Multilingual input**
The system shall accept queries in Urdu script, Roman Urdu, English, and code-mixed language.

**FR-2: Query normalization**
The system shall handle common Unicode inconsistencies, whitespace variations, and selected Roman Urdu spelling variations without unnecessarily changing the meaning of the query.

**FR-3: Information retrieval**
The system should retrieve relevant source passages using at least two approaches and provide a comparative evaluation.

**FR-4: Evidence-grounded answers**
One or more retrieved passages shall support each substantive answer. The interface shall identify the corresponding source and provide a usable source link where available.

**FR-5: Unanswerable queries**
When the available evidence does not support an answer, the system shall communicate that the information cannot be verified from its knowledge base.

**FR-6: Traceability**
The system shall preserve document identifiers, source URLs, and passage-level references so that answers can be checked against the underlying material.

**FR-7: Evaluation**
The application or accompanying report shall present retrieval performance and validation results using a documented test set.

**FR-8: Usability**
The application shall provide an accessible interface for entering questions, selecting a response language, viewing answers, and inspecting supporting evidence.

---

## 4. Expected Deliverables

Each team must submit:

- A working application or live demonstration.
- Source code and installation instructions.
- A documented dataset with source provenance.
- Validation queries covering multiple language styles and failure cases.
- Quantitative evaluation results and a short error analysis.
- A brief demonstration explaining the system architecture, technical contribution, limitations, and potential real-world impact.

---

## 5. Judging Rubric

| Criterion | Points | Assessment |
|---|---|---|
| NLP innovation and technical depth | 20 | Quality of multilingual processing, normalization, retrieval design, and meaningful technical contribution |
| Retrieval quality and relevance | 20 | Ability to retrieve the correct evidence across Urdu, Roman Urdu, English, paraphrases, and spelling variations |
| Answer reliability and grounding | 20 | Correctness relative to source documents, citation accuracy, appropriate abstention, and avoidance of unsupported claims |
| Validation and experimental rigor | 15 | Quality of test cases, baseline comparisons, metrics, reproducibility, and error analysis |
| Working prototype and usability | 10 | Functional interface, response clarity, language selection, source inspection, and stability |
| Practical impact and relevance | 10 | Usefulness for Pakistan's public-service information needs, accessibility, and responsible deployment |
| Presentation and demonstration | 5 | Clarity, time management, demonstration quality, and explanation of results |
| **Total** | **100** | |

### Scoring guidance

- **Excellent:** Fully implemented, quantitatively validated, robust across languages, and supported by traceable evidence.
- **Good:** Functional and reasonably evaluated, with identifiable limitations.
- **Satisfactory:** Basic functionality demonstrated but limited cross-language testing, grounding, or experimental evidence.
- **Needs improvement:** Incomplete functionality, unsupported claims, missing evaluation, or irreproducible results.

Judges should award points based on demonstrated evidence rather than claimed capabilities.

---

## 6. Validation Cases

Teams must test the system against a fixed set of validation categories. The examples below are illustrative; the actual expected answers must be prepared from the selected official documents.

### Case 1 — Urdu-script query
**Input:** "پاسپورٹ کی تجدید کے لیے کون سی دستاویزات درکار ہیں؟"

**Expected behavior:**
- Identify the passport-renewal intent.
- Retrieve the applicable official requirements.
- Provide a relevant answer and source reference.

### Case 2 — Roman Urdu query
**Input:** "Passport renew karwanay ke liye kya documents chahiye?"

**Expected behavior:**
- Retrieve evidence relevant to the same intent as Case 1.
- Avoid requiring the user to rewrite the question in English.

### Case 3 — English query
**Input:** "Which documents are required to renew a passport?"

**Expected behavior:**
- Retrieve the relevant requirements.
- Provide a traceable source and answer supported by the document.

### Case 4 — Code-mixed query
**Input:** "Passport renewal ke liye online apply karna hota hai ya office jana hota hai?"

**Expected behavior:**
- Identify the procedural question.
- Return only the procedure supported by the indexed evidence.
- Indicate any relevant distinctions or missing information.

### Case 5 — Roman Urdu spelling variation
**Input A:** "passport renew karwana hai"
**Input B:** "pasport renu karwana hy"

**Expected behavior:**
- Demonstrate whether normalization or semantic retrieval helps recover relevant passages.
- Record retrieval performance for both inputs.

### Case 6 — Paraphrased query
**Input:** "I need to replace my expired passport. Where should I start?"

**Expected behavior:**
- Retrieve relevant information even if the wording differs from the source document.
- Distinguish renewal from other passport services when the source makes that distinction.

### Case 7 — Unsupported question
**Input:** "What is the guaranteed processing time for my individual application?"

**Expected behavior:**
- Abstain if the indexed documents do not establish a guaranteed processing time.
- Avoid inventing a date or making an unsupported promise.

### Case 8 — Out-of-domain question
**Input:** "Who will win the next cricket World Cup?"

**Expected behavior:**
- Recognize that the question falls outside the selected public-service knowledge base.
- Clearly indicate that it cannot answer the question from the available sources.

### Case 9 — Ambiguous question
**Input:** "How much does it cost?"

**Expected behavior:**
- Ask for clarification if the service or applicant category cannot be determined.
- Avoid returning an arbitrary fee.

### Case 10 — Contradictory or potentially outdated evidence
**Input:** A question for which two collected documents state different requirements or fees.

**Expected behavior:**
- Identify the conflict where possible.
- Prefer a demonstrably current and authoritative source when dates and provenance support that decision.
- Otherwise disclose the uncertainty rather than silently choosing an answer.

### Case 11 — Citation integrity
**Input:** Any answerable query.

**Expected behavior:**
- Verify that the cited passage actually supports the answer.
- Ensure the source URL corresponds to the cited document.
- Do not fabricate citations or claim that an uncited statement was verified.

### Case 12 — Query with no semantic relevance
**Input:** Random text or an unrelated string.

**Expected behavior:**
- Avoid returning a confident answer based on a weakly related passage.
- Display a clarification request or an appropriate no-result message.

---

## 7. Quantitative Validation Protocol

Each team must prepare at least 30 test queries, preferably expanding to 45 or more when time permits.

The test set should include:

- Urdu-script questions.
- Roman Urdu questions with spelling variations.
- English questions.
- Code-mixed queries and paraphrases.
- Ambiguous, unsupported, and out-of-domain questions.

Where possible, create language variants of the same underlying question and map them to a shared expected evidence passage. Keep test queries separate from any data used to tune normalization rules or ranking parameters.

### Required metrics

1. **Recall@5:** Proportion of answerable queries for which a relevant evidence passage appears among the top five retrieved passages.
2. **MRR@5:** Measures how highly the first relevant passage is ranked.
3. **Citation support rate:** Proportion of evaluated answers whose substantive claims are supported by their cited evidence.
4. **Abstention performance:** Evaluate whether the system correctly abstains unanswerable questions and answers supported questions.
5. **Cross-script consistency:** Measure whether semantically equivalent queries retrieve appropriate evidence across the supported language styles.
6. **Latency:** Report typical response time under the test conditions.

Teams must report actual measured values, sample sizes, and notable failure cases. Suggested target thresholds may be used for internal development, but scores must not be fabricated or presented as achieved results without experimental evidence.

---

## 8. Final Demonstration

Each team should demonstrate the following within a short presentation:

1. Submit equivalent questions in Urdu script, Roman Urdu, and English.
2. Show the retrieved evidence and the source supporting the answer.
3. Demonstrate an unsupported or ambiguous query and show appropriate abstention or clarification.
4. Compare the keyword, semantic, and hybrid retrieval results using actual measurements.
5. Explain the system's technical contribution, limitations, and potential application in Pakistan.

**Success criterion:** A successful solution is not merely a chatbot that produces fluent text. It is a reproducible multilingual NLP system that retrieves relevant evidence, answers within the limits of that evidence, and demonstrates its reliability through systematic validation.

---

## 9. Dataset

| Dataset component | Contents |
|---|---|
| Multilingual questions | English, Urdu script, and Roman Urdu |
| Reference answers | Expected responses in English and Urdu |
| Ground-truth evidence | Supporting excerpts and official source URLs |
| Robustness testing | Roman Urdu spelling variations and paraphrases |
| Negative validation | Ambiguous, unsupported, and out-of-domain questions |
| Safety testing | Prompt-injection attempts and requests for unsupported claims |
| Evaluation metadata | Query IDs, topics, answerability, and data splits |

---

## 10. Suggested Evaluation Outcome

The highest-scoring projects should combine technical depth with a usable application and convincing empirical results. A simple interface backed by reliable multilingual retrieval and transparent evidence should score more highly than an elaborate interface that produces unsupported answers.
