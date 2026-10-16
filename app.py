"""Streamlit front end for the E-Sahulat notebook. Run: streamlit run app.py"""
import contextlib
import io
import json
import os
import time
from pathlib import Path

import numpy as np
import pandas as pd
import plotly.graph_objects as go
import streamlit as st

NOTEBOOK = Path(os.environ.get("ESAHULAT_NOTEBOOK", "E_Sahulat_AI_Hackathon.ipynb"))
METRICS = Path("esahulat/outputs/app_metrics.json")
SERIES = ["#2a78d6", "#eb6834", "#1baf7a"]          # categorical slots 1-3, validated as a set
DECISION_STYLE = {"answer": ("#0ca30c", "✓ Answer"), "clarify": ("#fab219", "? Needs clarification"),
                  "abstain": ("#d03b3b", "✕ Can't verify")}
LANGUAGES = {"Auto-detect": "auto", "English": "en", "اردو (Urdu)": "ur", "Roman Urdu": "roman_ur"}
EXAMPLES = ["Which documents are required to renew a passport?", "پاسپورٹ کی تجدید کے لیے کون سی دستاویزات درکار ہیں؟",
            "Passport renew karwanay ke liye kya documents chahiye?", "Kitni fee hai?",
            "Can a child under 15 get a ten-year passport?", "Who will win the next Cricket World Cup?"]

st.set_page_config(page_title="E-Sahulat AI", layout="wide")
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu&display=swap');
.rtl {direction: rtl; text-align: right; font-family: 'Noto Nastaliq Urdu', serif; font-size: 1.1rem; line-height: 2.3;}
.badge {display: inline-block; padding: 0.2rem 0.7rem; border-radius: 4px; color: #0b0b0b; font-weight: 600;}
.reason {color: #52514e; font-size: 0.85rem; margin-left: 0.5rem;}
blockquote {border-left: 3px solid #2a78d6; margin: 0.4rem 0; padding: 0.2rem 0.8rem;}
</style>""", unsafe_allow_html=True)


@st.cache_resource(show_spinner="Loading the pipeline from the notebook. The first run downloads the embedding model.")
def load_pipeline():
    os.environ.setdefault("ESAHULAT_HEADLESS", "1")
    os.environ.setdefault("ESAHULAT_NO_INSTALL", "1")
    cells = json.loads(NOTEBOOK.read_text(encoding="utf-8"))["cells"]
    ns = {"__name__": "esahulat_pipeline"}
    with contextlib.redirect_stdout(io.StringIO()):
        for cell in cells:
            if "pipeline" in cell.get("metadata", {}).get("tags", []):
                exec(compile("".join(cell["source"]), str(NOTEBOOK), "exec"), ns)
    return ns


def rtl(text):
    return f"<div class='rtl'>{text}</div>"


def show_response(resp, verified, issues, ns):
    color, label = DECISION_STYLE[resp["decision"]]
    st.markdown(f"<span class='badge' style='background:{color}'>{label}</span><span class='reason'>{resp['reason']}</span>",
                unsafe_allow_html=True)
    st.markdown(rtl(resp["message"]) if resp["lang"] == "ur" else resp["message"], unsafe_allow_html=True)
    for ev in resp["evidence"]:
        with st.container(border=True):
            if ev["role"] == "context":
                st.caption("Related official text. It doesn't answer the specific request.")
            for span in ev["spans"]:
                st.markdown(f"> {span}")
            if resp["lang"] == "ur" and ev["text_ur"]:
                st.markdown(rtl(ev["text_ur"]), unsafe_allow_html=True)
            st.markdown(f"**[{ev['pid']}]** [{ev['title']}]({ev['url']})")
            st.caption("Citation verified: quote, URL and numbers match the passage." if verified else f"Citation check failed: {issues}")
    for note in resp["notes"]:
        if note != ns["MSG"][resp["lang"]]["related"]:
            st.markdown(rtl(note) if resp["lang"] == "ur" else f"_{note}_", unsafe_allow_html=True)
    trace = resp["trace"]
    with st.expander("How this was decided"):
        st.write(f"Style: **{trace['style']}** · retriever: **{trace['retriever']}** · {resp['latency_ms']:.0f} ms")
        st.write(f"Concepts: {', '.join(trace['concepts']) or 'none'}")
        if trace["spelling_repairs"]:
            st.write("Spelling repairs: " + ", ".join(f"{a} → {b}" for a, b in trace["spelling_repairs"]))
        st.write(f"Dense similarity {trace['dense_max']} · keyword coverage {trace['coverage']}")
        st.dataframe(pd.DataFrame([{"rank": i + 1, "passage": pid, "topic": ns["PASS"][pid]["topic"]} for i, pid in enumerate(trace["top5"])]),
                     hide_index=True, use_container_width=True)


def ask_page(ns, lang):
    st.subheader("Ask a passport question")
    st.caption("English, Urdu or Roman Urdu. Answers quote official DGI&P text; anything the sources don't cover gets an honest \"can't verify\".")
    cols = st.columns(3)
    for i, example in enumerate(EXAMPLES):
        cols[i % 3].button(example, key=f"ex{i}", use_container_width=True,
                           on_click=lambda q=example: st.session_state.update(query=q))
    query = st.text_area("Your question", key="query", height=90)
    if st.button("Ask", type="primary") and query.strip():
        resp = ns["respond"](query.strip(), lang=lang)
        show_response(resp, *ns["verify_response"](resp), ns)


def kb_page(ns):
    st.subheader("Knowledge base")
    st.caption(f"{len(ns['PASSAGES'])} passages from {len(ns['DOCS'])} official DGI&P pages. Freshness: needs manual review.")
    term = st.text_input("Filter", placeholder="e.g. NOC, minor, fast track, تجدید")
    rows = pd.DataFrame(ns["PASSAGES"])[["pid", "topic", "text", "text_ur", "url"]]
    if term:
        needle = ns["normalize"](term)
        rows = rows[rows.apply(lambda r: needle in ns["normalize"](" ".join(r.astype(str))), axis=1)]
    st.dataframe(rows, hide_index=True, use_container_width=True,
                 column_config={"url": st.column_config.LinkColumn("source"), "text_ur": "Urdu text"})


def ease(t):
    return 1 - (1 - t) ** 3


def layout(fig, title, value_axis="y", percent=True):
    axis = dict(range=[0, 1.05], tickformat=".0%", gridcolor="rgba(128,128,128,0.15)") if percent else {}
    fig.update_layout(title=title, barmode="group", bargap=0.35, barcornerradius=4, height=360,
                      margin=dict(l=10, r=10, t=50, b=10), legend=dict(orientation="h", y=-0.15),
                      **{f"{value_axis}axis": axis})
    return fig


def grouped_bars(categories, series, t, title, horizontal=False):
    fig = go.Figure()
    for (name, values), color in zip(series.items(), SERIES):
        grown = [None if v is None or np.isnan(v) else v * t for v in values]
        x, y = (grown, categories) if horizontal else (categories, grown)
        fig.add_bar(name=name, x=x, y=y, orientation="h" if horizontal else "v", marker_color=color,
                    marker_line=dict(width=2, color="rgba(0,0,0,0)"),
                    hovertemplate=f"{name}<br>%{{{'y' if horizontal else 'x'}}}: %{{{'x' if horizontal else 'y'}:.1%}}<extra></extra>")
    fig = layout(fig, title, "x" if horizontal else "y")
    if len(series) == 1:
        fig.update_layout(showlegend=False)
    return fig


def latency_hist(samples, t):
    fig = go.Figure()
    upper = max(max(v) for v in samples.values())
    edges = np.linspace(0, upper * 1.05, 25)
    for (name, values), color in zip(samples.items(), SERIES):
        counts, _ = np.histogram(values, bins=edges)
        fig.add_bar(name=name, x=(edges[:-1] + edges[1:]) / 2, y=counts * t, marker_color=color, opacity=0.85,
                    hovertemplate=f"{name}<br>%{{x:.1f}} ms: %{{y:.0f}} queries<extra></extra>")
    fig = layout(fig, "Latency per query (ms)", percent=False)
    fig.update_layout(barmode="overlay", bargap=0.05, yaxis_title="queries", xaxis_title="ms")
    return fig


def confusion(m, t):
    z = np.array(m["values"], dtype=float)
    fig = go.Figure(go.Heatmap(z=z * t, x=m["cols"], y=m["rows"], zmin=0, zmax=z[:-1, :-1].max(),
                               colorscale=[[0, "#cde2fb"], [0.5, "#5598e7"], [1, "#104281"]], showscale=False,
                               text=np.rint(z * t).astype(int), texttemplate="%{text}",
                               hovertemplate="expected %{y}, got %{x}: %{text}<extra></extra>"))
    return layout(fig, "Official test: expected vs. produced decision", percent=False)


def eval_page():
    st.subheader("Evaluation")
    if not METRICS.exists():
        st.warning(f"{METRICS} not found. Run the notebook once; its export cell writes this file.")
        return
    m = json.loads(METRICS.read_text(encoding="utf-8"))
    st.caption(f"Pipeline {m['version']} · retriever {m['retriever']} · dense {m['dense_model']}")
    if m["dense_backend"] != "neural":
        st.warning("These numbers come from the char-ngram stand-in, not the neural embedding model. Re-run the notebook with e5.")
    replay = st.button("Replay animation")
    animate = replay or not st.session_state.get("animated")
    st.session_state["animated"] = True

    headline = m.get("blind") or {}
    test_dec = m["decisions"]["TEST (previously inspected)"]
    test_cit = m["citations"]["TEST (previously inspected)"]
    kpis = [("Blind decision accuracy", headline.get("decision accuracy")),
            ("Blind false-answer rate", headline.get("false-answer rate on unanswerable")),
            ("Blind citation support", headline.get("CITATION SUPPORT (verifier pass and gold)")),
            ("Blind retrieval Recall@5", headline.get("retrieval Recall@5"))]
    kpi_slots = [c.empty() for c in st.columns(4)]

    retrieval_split = st.radio("Retrieval split", ["test", "dev"], horizontal=True)
    retrieval = pd.DataFrame(m["retrieval"][retrieval_split]).set_index("method")
    by_lang = pd.Series(m["retrieval_test_by_language"]).dropna()
    splits = list(m["decisions"])
    decision_metrics = ["decision accuracy", "answer recall (answerable answered)", "false-answer rate on unanswerable"]

    charts = []
    if "blind" in m and "blind_baseline" in m:
        names = ["decision accuracy", "answer recall (answerable answered)", "false-answer rate on unanswerable",
                 "CITATION SUPPORT (verifier pass and gold)", "retrieval Recall@5", "retrieval MRR@5"]
        charts.append(("Blind set: baseline vs. final pipeline", lambda t: grouped_bars(
            [n.split(" (")[0] for n in names], {"baseline": [m["blind_baseline"][n] for n in names], "final": [m["blind"][n] for n in names]},
            t, "Blind set: baseline vs. final pipeline"),
            pd.DataFrame({"baseline": m["blind_baseline"], "final": m["blind"]}).loc[names]))
    charts.append(("Retrieval", lambda t: grouped_bars(list(retrieval.index), {"Recall@5": retrieval["Recall@5"].tolist(),
                                                                               "MRR@5": retrieval["MRR@5"].tolist()},
                                                       t, f"Retrieval by method ({retrieval_split}, n={int(retrieval['n'].iloc[0])})", horizontal=True),
                   retrieval))
    charts.append(("Decisions", lambda t: grouped_bars([n.split(" (")[0] for n in decision_metrics],
                                                       {s: [m["decisions"][s][n] for n in decision_metrics] for s in splits}, t,
                                                       "Decisions by split (test was inspected during development)"),
                   pd.DataFrame(m["decisions"]).loc[decision_metrics + ["n"]]))
    charts.append(("Recall@5 by language", lambda t: grouped_bars(list(by_lang.index), {"Recall@5": by_lang.tolist()}, t,
                                                                  f"Official test Recall@5 by variant / language ({m['retriever']})"),
                   by_lang.rename("Recall@5").to_frame()))
    latency = {"official test": m["latency_test_ms"]} | ({"blind": m["latency_blind_ms"]} if "latency_blind_ms" in m else {})
    charts.append(("Latency", lambda t: latency_hist(latency, t),
                   pd.DataFrame({k: pd.Series(v).describe(percentiles=[0.5, 0.95]) for k, v in latency.items()})))
    charts.append(("Confusion", lambda t: confusion(m["confusion_test"], t),
                   pd.DataFrame(m["confusion_test"]["values"], index=m["confusion_test"]["rows"], columns=m["confusion_test"]["cols"])))

    grid = st.columns(2)
    slots = []
    for i, (name, _, table) in enumerate(charts):
        with grid[i % 2]:
            slots.append(st.empty())
            with st.expander(f"Data: {name}"):
                st.dataframe(table, use_container_width=True)

    frames = np.linspace(0, 1, 24) if animate else [1.0]
    for k, t in enumerate(frames):
        e = ease(t)
        for slot, (label, value) in zip(kpi_slots, kpis):
            slot.metric(label, "n/a" if value is None else f"{value * e:.1%}")
        for i, (slot, (name, build, _)) in enumerate(zip(slots, charts)):
            slot.plotly_chart(build(e), use_container_width=True, key=f"chart{i}-{k}")
        if animate:
            time.sleep(0.03)
    st.caption(f"Official test (previously inspected): decision accuracy {test_dec['decision accuracy']:.3f} on n={int(test_dec['n'])}, "
               f"citation support {test_cit['CITATION SUPPORT RATE']:.3f}. Blind n per metric: {m.get('blind_n', {})}.")


ns = load_pipeline()
with st.sidebar:
    st.title("E-Sahulat AI")
    st.caption("Evidence-grounded passport help in English, اردو and Roman Urdu.")
    mode = st.radio("Mode", ["Ask", "Knowledge base", "Evaluation"])
    lang = LANGUAGES[st.selectbox("Response language", list(LANGUAGES))]
    st.divider()
    st.caption(f"Retriever: {ns['FINAL_METHOD']}\n\nDense model: {ns['ENC'].name}\n\nNo external APIs; models run locally.")

if mode == "Ask":
    ask_page(ns, lang)
elif mode == "Knowledge base":
    kb_page(ns)
else:
    eval_page()
