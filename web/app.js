const $ = (sel, root = document) => root.querySelector(sel);
const URDU = /[؀-ۿ]/;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");

function h(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") node.className = v;
    else if (k === "style") node.style.cssText = v;
    else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v === true ? "" : v);
  }
  for (const c of children.flat()) if (c != null && c !== false) node.append(c instanceof Node ? c : String(c));
  return node;
}
const icon = (name) => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "icon");
  svg.setAttribute("aria-hidden", "true");
  const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
  use.setAttribute("href", `#i-${name}`);
  svg.append(use);
  return svg;
};
const text = (s, cls = "") => h("p", { class: `${cls} ${URDU.test(s) ? "ur" : ""}`.trim(), lang: URDU.test(s) ? "ur" : null }, s);
const pct = (v, d = 1) => (v == null || Number.isNaN(v) ? "n/a" : `${(v * 100).toFixed(d)}%`);
const store = {
  get(k, fallback) { try { return JSON.parse(sessionStorage.getItem(k)) ?? fallback; } catch { return fallback; } },
  set(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
};
// remembered across visits (the asked-questions file stays per tab)
const prefs = {
  get(k, fallback) { try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch { return fallback; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
};

async function api(path, options) {
  const res = await fetch(path, options);
  if (!res.ok) {
    let detail = res.statusText;
    try { detail = (await res.json()).detail ?? detail; } catch { /* not json */ }
    throw new Error(detail);
  }
  return res;
}

/* ---------------- Status ---------------- */
const status = { ready: false, llm: { available: false, state: "checking", model: "qwen2.5:3b" } };
async function pollStatus() {
  try {
    const s = await (await api("/api/status")).json();
    Object.assign(status, s);
    if (s.ready) return onReady();
    if (s.error) return onBootError(s.error);
  } catch { /* server still starting */ }
  $("#boot-banner").hidden = false;
  setTimeout(pollStatus, 1000);
}
function onReady() {
  $("#boot-banner").hidden = true;
  $("#pulse").className = "pulse ready";
  $("#status-label").textContent = `${status.passages} passages · runs locally`;
  $("#ask-btn").disabled = false;
  setLlm(status.llm);
  $("#use-llm").disabled = false;
  $("#use-llm").checked = status.llm.available && prefs.get("useQwen", true);
  $("#about").replaceChildren(
    h("dt", {}, "Retriever"), h("dd", {}, status.retriever),
    h("dt", {}, "Dense model"), h("dd", {}, status.dense_model),
    h("dt", {}, "Privacy"), h("dd", {}, "Questions are answered on this machine and never sent to an outside service."),
  );
  if (currentView === "kb") loadKb();
  setInterval(refreshLlm, 30000);
}
async function refreshLlm() {
  try {
    const s = await (await api("/api/status")).json();
    const was = status.llm.available;
    setLlm(s.llm);
    if (!s.llm.available) $("#use-llm").checked = false;
    else if (!was) $("#use-llm").checked = prefs.get("useQwen", true);
  } catch { /* server restarting */ }
}

/* ---------------- Qwen switch ---------------- */
const LLM_STATE = { ready: null, starting: "starting…", offline: "offline", missing_model: "model missing", checking: "checking" };
function setLlm(info) {
  status.llm = info;
  const st = info.state ?? (info.available ? "ready" : "offline");
  const chip = $("#llm-state");
  chip.dataset.state = st;
  chip.textContent = LLM_STATE[st] ?? info.model;
  if (st === "ready") chip.textContent = info.model;
  $("#llm-switch").title = {
    ready: `${info.model} adds a short summary written only from the quoted text. Switch off for quotes only.`,
    starting: "Starting Ollama on this machine…",
    offline: "Qwen runs through Ollama. Switching this on starts Ollama if it's installed.",
    missing_model: `Ollama is running but the model isn't downloaded. Run: ollama pull ${info.model}`,
  }[st] ?? "";
}
$("#use-llm").addEventListener("change", async (e) => {
  const sw = e.target;
  if (sw.checked && !status.llm.available) {
    sw.disabled = true;
    setLlm({ ...status.llm, state: "starting" });
    try {
      setLlm(await (await api("/api/llm/start", { method: "POST" })).json());
    } catch {
      setLlm({ ...status.llm, state: "offline" });
    }
    sw.disabled = false;
    sw.checked = status.llm.available;
    if (!sw.checked) return;
  }
  prefs.set("useQwen", sw.checked);
  applySummary();
});
const qwenOn = () => $("#use-llm").checked && status.llm.available;

// Add or remove the summary on the answer already on screen, so the switch acts immediately.
function applySummary() {
  const entry = history.find((e) => e.id === activeId);
  const doc = $("#result .document");
  if (!entry || !doc) return;
  doc.querySelector(".summary")?.remove();
  const { response: r, verified } = entry.data;
  if (qwenOn() && r.decision === "answer" && verified) doc.querySelector(".doc-message").after(summaryBlock(entry));
}
function onBootError(message) {
  $("#pulse").className = "pulse failed";
  $("#status-label").textContent = "Pipeline failed to load";
  const banner = $("#boot-banner");
  banner.hidden = false;
  banner.className = "banner";
  banner.replaceChildren(icon("alert"), h("div", {}, h("strong", {}, "The pipeline could not load. "), message,
    h("br"), "Check that the notebook and dataset are in the project folder, then restart the server."));
}

/* ---------------- Router ---------------- */
let currentView = "ask";
function route() {
  const [, view = "ask", arg] = location.hash.match(/^#\/(\w+)(?:\/(\w+))?/) ?? [];
  currentView = ["ask", "kb", "eval"].includes(view) ? view : "ask";
  for (const v of ["ask", "kb", "eval"]) $(`#view-${v}`).hidden = v !== currentView;
  document.querySelectorAll(".tab").forEach((t) => {
    if (t.dataset.view === currentView) t.setAttribute("aria-current", "page");
    else t.removeAttribute("aria-current");
  });
  moveIndicator();
  if (currentView === "kb") loadKb(arg);
  if (currentView === "eval") loadEval();
  document.title = { ask: "E-Sahulat · Passport answers from official sources", kb: "Knowledge base · E-Sahulat", eval: "Evaluation · E-Sahulat" }[currentView];
}
function moveIndicator() {
  const active = $(`.tab[data-view="${currentView}"]`);
  // fixed 100px bar scaled to the label, so only transform animates
  $(".tab-indicator").style.transform = `translateX(${active.offsetLeft + 14}px) scaleX(${(active.offsetWidth - 28) / 100})`;
}
addEventListener("hashchange", () => { route(); scrollTo({ top: 0 }); });
addEventListener("resize", () => { moveIndicator(); scheduleChartResize(); });

/* ---------------- Ask ---------------- */
const EXAMPLES = [
  "Which documents are required to renew a passport?",
  "پاسپورٹ کی تجدید کے لیے کون سی دستاویزات درکار ہیں؟",
  "Passport renew karwanay ke liye kya documents chahiye?",
  "Kitni fee hai?",
  "Can a child under 15 get a ten-year passport?",
  "How long does urgent passport processing take?",
  "Who will win the next Cricket World Cup?",
];
const STAMP = {
  answer: { title: "Verified true copy", label: "Answered" },
  clarify: { title: "Particulars required", label: "Needs detail" },
  abstain: { title: "Not on record", label: "Can't verify" },
};
const REASONS = {
  supported: "Supported by official text", clarify_fee: "Fee depends on passport details", clarify_generic: "Which service is unclear",
  out_of_scope: "Outside passport services", prompt_injection: "Instruction refused", unsafe: "Unlawful request refused",
  personal: "Individual application status", guarantee: "No guarantee in the sources", action: "Bookings aren't possible here",
  no_result: "No question found", unsupported: "The sources don't cover this", low_confidence: "Evidence too weak to quote",
};
const reasonText = (r) => REASONS[r] ?? r.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
const today = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date());

let lang = "auto";
let history = store.get("file", []);
let activeId = null;

const form = $("#ask-form");
const queryBox = $("#query");
queryBox.addEventListener("input", autosize);
queryBox.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); form.requestSubmit(); }
});
function autosize() { queryBox.style.height = "auto"; queryBox.style.height = `${Math.min(queryBox.scrollHeight, 240)}px`; }
$("#lang").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  lang = b.dataset.lang;
  $("#lang").querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
});
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const query = queryBox.value.trim();
  if (!query || !status.ready) { queryBox.focus(); return; }
  const btn = $("#ask-btn");
  btn.disabled = true;
  try {
    const data = await (await api("/api/ask", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ query, lang }) })).json();
    const entry = { id: Date.now().toString(36), query, data };
    history = [entry, ...history].slice(0, 30);
    store.set("file", history);
    showEntry(entry, true);
    renderFile();
  } catch (err) {
    $("#result").replaceChildren(h("div", { class: "banner" }, icon("alert"), h("div", {}, h("strong", {}, "That question couldn't be checked. "), err.message, " Try again in a moment.")));
  } finally {
    btn.disabled = false;
  }
});

for (const q of EXAMPLES) {
  $("#examples").append(h("button", { type: "button", class: `chip ${URDU.test(q) ? "ur" : ""}`, lang: URDU.test(q) ? "ur" : null, title: q, onclick: () => {
    queryBox.value = q; autosize(); form.requestSubmit();
  } }, q));
}

function showEntry(entry, fresh = false) {
  activeId = entry.id;
  const { response: r, verified, issues } = entry.data;
  const decision = r.decision === "answer" && !verified ? "abstain" : r.decision;
  const ur = r.lang === "ur";
  const answerCode = r.evidence.find((e) => e.role === "answer")?.pid;

  const stampTitle = r.decision === "answer" && !verified ? "Copy not verified" : STAMP[decision].title;
  const stampSub = decision === "answer" ? [`${answerCode ?? ""} · quoted from dgip.gov.pk`, `Checked ${today}`] : [reasonText(r.reason)];
  const stamp = h("div", { class: `stamp ${fresh ? "land" : ""}`, "data-decision": decision, role: "img", "aria-label": `${stampTitle}. ${stampSub.join(". ")}` },
    h("div", { class: "stamp-inner" }, h("b", {}, stampTitle), stampSub.map((line) => h("small", {}, line))));

  const doc = h("article", { class: `document ${fresh ? "enter" : ""}`, "data-decision": decision, "aria-label": "Answer" },
    h("div", { class: "doc-head" },
      h("div", {},
        h("h2", { class: `doc-query ${URDU.test(r.query) ? "ur" : ""}`, lang: URDU.test(r.query) ? "ur" : null }, r.query),
        h("div", { class: "doc-meta" },
          h("span", {}, reasonText(r.reason)),
          h("span", {}, { en: "English", ur: "Urdu", roman_ur: "Roman Urdu" }[r.lang] ?? r.lang),
          h("span", {}, `${Math.max(1, Math.round(r.latency_ms))} ms`))),
      stamp),
    text(r.message, "doc-message"));

  if (qwenOn() && r.decision === "answer" && verified && (fresh || entry.summary)) doc.append(summaryBlock(entry));

  if (r.evidence.length) {
    doc.append(h("div", { class: "evidence" }, r.evidence.map((ev, i) => {
      const hasUr = Boolean(ev.text_ur);
      return h("section", { class: "copy", style: `--i:${i}` },
        ev.role === "context" ? h("p", { class: "copy-context" }, icon("link"), "Related official text. It doesn't answer the specific request.") : null,
        h("div", { class: `spine ${hasUr ? "" : "single"} ${ur && hasUr ? "urdu-first" : ""}` },
          h("div", { class: "quote", lang: "en" }, ev.spans.map((s) => h("q", {}, s))),
          h("i", { "aria-hidden": "true" }),
          hasUr ? h("p", { class: "quote-ur ur", lang: "ur" }, ev.text_ur) : null),
        h("div", { class: "source" },
          h("a", { class: "code", href: `#/kb/${ev.pid}`, title: `Open passage ${ev.pid} in the knowledge base` }, ev.pid),
          h("a", { class: "ext", href: ev.url, target: "_blank", rel: "noopener" }, ev.title.replace(/^DGI&P — /, ""), icon("ext")),
          h("span", { class: `verified ${verified ? "" : "failed"}` }, icon(verified ? "check" : "alert"),
            verified ? "Citation verified: quote, URL and numbers match" : `Citation check failed: ${issues.join("; ")}`)));
    })));
  }
  doc.append(h("div", { class: "notes" }, r.notes.map((n) => text(n)),
    text(ur ? "ای سہولت ایک غیر سرکاری یونیورسٹی منصوبہ ہے، یہ DGI&P یا NADRA کی سروس نہیں۔"
      : "E-Sahulat is an unofficial university project, not a DGI&P or NADRA service.")));
  doc.append(traceBlock(r.trace, r.latency_ms));

  $("#result").replaceChildren(doc);
  renderFile();
  if (fresh && doc.getBoundingClientRect().top > innerHeight * 0.55) {
    doc.scrollIntoView({ block: "start", behavior: reduceMotion.matches ? "auto" : "smooth" });
  }
}

function summaryBlock(entry) {
  const r = entry.data.response;
  const out = h("p", { class: "summary-text streaming", dir: "auto", lang: r.lang === "ur" ? "ur" : null });
  if (r.lang === "ur") out.classList.add("ur");
  const warn = (nums) => h("p", { class: "warn" }, icon("alert"), `The summary contains numbers that aren't in the quotes (${nums.join(", ")}). Trust the quotes below.`);
  const box = h("div", { class: "summary" },
    h("div", { class: "doc-label" }, icon("spark"), `Qwen summary · ${status.llm.model}, written only from the quotes below`), out);
  if (entry.summary) {
    out.textContent = entry.summary.text;
    out.classList.remove("streaming");
    if (entry.summary.unsupported.length) box.append(warn(entry.summary.unsupported));
    return box;
  }
  (async () => {
    try {
      const res = await api("/api/llm", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ query: r.query, response: r }) });
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += value;
        const lines = buf.split("\n");
        buf = lines.pop();
        for (const line of lines.filter(Boolean)) {
          const msg = JSON.parse(line);
          if (msg.t) out.textContent += msg.t;
          if (msg.error) throw new Error(msg.error);
          if (msg.done) {
            if (msg.unsupported.length) box.append(warn(msg.unsupported));
            entry.summary = { text: out.textContent, unsupported: msg.unsupported };
            store.set("file", history);
          }
        }
      }
    } catch (err) {
      out.textContent = `The local model couldn't write a summary (${err.message}). The verified quotes below are unaffected.`;
    } finally {
      out.classList.remove("streaming");
    }
  })();
  return box;
}

function traceBlock(t, latency) {
  const cell = (label, value, cls = "") => h("div", { class: `trace-cell ${cls}` }, h("dt", {}, label), h("dd", {}, value));
  const tags = (xs) => (xs.length ? h("span", { class: "tags" }, xs.map((x) => h("span", { class: "tag" }, x))) : "none");
  return h("details", { class: "trace" },
    h("summary", {}, icon("chev"), "How this was decided"),
    h("dl", { class: "trace-body" },
      cell("Script detected", { en: "English", ur: "Urdu", roman_ur: "Roman Urdu" }[t.style] ?? t.style),
      cell("Retriever", t.retriever),
      cell("Dense similarity", String(t.dense_max)),
      cell("Keyword coverage", String(t.coverage)),
      cell("Concepts", tags(t.concepts), "wide"),
      cell("Spelling repairs", t.spelling_repairs.length ? t.spelling_repairs.map(([a, b]) => `${a} → ${b}`).join(", ") : "none", "wide"),
      cell("Top passages retrieved", t.top5.length
        ? h("ol", { class: "ranks" }, t.top5.map((pid, i) => h("li", {}, h("span", {}, i + 1), h("a", { class: "code", href: `#/kb/${pid}` }, pid), h("span", {}, t.top5_topics?.[i] ?? ""))))
        : "No passage passed the retrieval threshold.", "full"),
      cell("Latency", `${latency.toFixed(1)} ms`)));
}

function renderFile() {
  const list = $("#file-list");
  list.replaceChildren(...history.map((e) => {
    const d = e.data.response.decision === "answer" && !e.data.verified ? "abstain" : e.data.response.decision;
    return h("li", {}, h("button", { type: "button", class: "file-item", "aria-current": String(e.id === activeId), onclick: () => { showEntry(e); if (matchMedia("(max-width: 1080px)").matches) $("#result").scrollIntoView({ behavior: "smooth" }); } },
      h("span", { class: "mark", "data-decision": d, "aria-hidden": "true" }),
      h("span", { class: `q ${URDU.test(e.query) ? "ur" : ""}` }, e.query),
      h("span", { class: "d" }, STAMP[d].label)));
  }));
  $("#file-empty").hidden = history.length > 0;
  $("#clear-file").hidden = history.length === 0;
  if (!history.length && !$("#result").firstChild?.classList?.contains("document")) renderOutcomes();
}
$("#clear-file").addEventListener("click", () => { history = []; activeId = null; store.set("file", []); $("#result").replaceChildren(); renderFile(); });

function renderOutcomes() {
  const o = (d, body) => h("div", { class: "outcome" },
    h("div", { class: "stamp", "data-decision": d, "aria-hidden": "true" }, h("div", { class: "stamp-inner" }, h("b", {}, STAMP[d].title))), h("p", {}, body));
  $("#result").replaceChildren(h("section", { class: "outcomes", "aria-label": "What to expect" },
    h("h2", {}, "Every question gets one of three stamps"),
    h("p", {}, "The assistant never writes its own answer. It finds the official sentence, checks the quote, and stamps the result."),
    h("div", { class: "outcome-row" },
      o("answer", "Answered with an exact quote from a DGI&P page, linked to its source."),
      o("clarify", "Your question could mean several services. You'll be asked which one."),
      o("abstain", "The official pages don't cover it, so nothing is guessed."))));
}

/* ---------------- Knowledge base ---------------- */
let passages = null;
let kbTimer;
async function loadKb(focusPid) {
  if (!status.ready) { $("#kb-list").replaceChildren(...Array.from({ length: 5 }, () => h("li", { class: "skeleton-row", "aria-hidden": "true" }))); return; }
  if (!passages) {
    passages = await (await api("/api/passages")).json();
    const docs = new Set(passages.map((p) => p.doc_id)).size;
    $("#kb-lede").textContent = `${passages.length} passages from ${docs} official DGI&P pages. Every answer is quoted from one of these. Freshness: needs manual review against dgip.gov.pk.`;
    const topics = [...new Set(passages.map((p) => p.label))].sort();
    $("#kb-topic").append(...topics.map((t) => h("option", { value: t }, t.replace(/^\w/, (c) => c.toUpperCase()))));
  }
  if (focusPid) { $("#kb-q").value = ""; $("#kb-topic").value = ""; }
  await renderKb();
  if (focusPid) {
    const row = document.getElementById(`p-${focusPid}`);
    if (row) { row.scrollIntoView({ block: "center", behavior: reduceMotion.matches ? "auto" : "smooth" }); row.classList.remove("flash"); void row.offsetWidth; row.classList.add("flash"); }
  }
}
async function renderKb() {
  const q = $("#kb-q").value.trim();
  const topic = $("#kb-topic").value;
  let rows = q ? await (await api(`/api/passages?q=${encodeURIComponent(q)}`)).json() : passages;
  if (topic) rows = rows.filter((p) => p.label === topic);
  $("#kb-count").textContent = rows.length === passages.length ? `${rows.length} passages` : `Showing ${rows.length} of ${passages.length}`;
  const mark = (s) => {
    if (!q) return s;
    const i = s.toLowerCase().indexOf(q.toLowerCase());
    return i < 0 ? s : [s.slice(0, i), h("mark", {}, s.slice(i, i + q.length)), s.slice(i + q.length)];
  };
  if (!rows.length) {
    $("#kb-list").replaceChildren(h("li", { class: "kb-empty" },
      h("p", {}, `No passage mentions “${q || topic}”.`), h("p", {}, "Try a broader word such as renewal, child or urgent, or clear the filters."),
      h("button", { class: "btn btn-quiet", type: "button", onclick: () => { $("#kb-q").value = ""; $("#kb-topic").value = ""; renderKb(); } }, "Clear filters")));
    return;
  }
  $("#kb-list").replaceChildren(...rows.map((p) => h("li", { class: "kb-row", id: `p-${p.pid}` },
    h("div", {}, h("span", { class: "code" }, p.pid)),
    h("div", {},
      h("p", { class: "en", lang: "en" }, mark(p.text)),
      h("div", { class: "src" }, h("span", { class: "topic" }, p.label.replace(/^\w/, (c) => c.toUpperCase())), h("a", { href: p.url, target: "_blank", rel: "noopener" }, p.title.replace(/^DGI&P — /, ""), icon("ext")), h("span", {}, new URL(p.url).hostname))),
    p.text_ur ? h("p", { class: "ur", lang: "ur" }, mark(p.text_ur)) : h("p", { class: "ur" }))));
}
$("#kb-q").addEventListener("input", () => { clearTimeout(kbTimer); kbTimer = setTimeout(renderKb, 140); });
$("#kb-topic").addEventListener("change", renderKb);

/* ---------------- Evaluation ---------------- */
let metrics = null;
let evalRendered = false;
const SPLIT_NAME = { "TEST (previously inspected)": "Official test", BRIEF: "Brief", DEV: "Dev" };
const SERIES = ["var(--series-1)", "var(--series-2)", "var(--series-3)"];
const tooltip = $("#tooltip");
const charts = [];

async function loadEval() {
  if (evalRendered) return;
  try {
    metrics = await (await api("/api/metrics")).json();
  } catch (err) {
    $("#eval-body").replaceChildren(h("div", { class: "banner" }, icon("alert"), h("div", {}, h("strong", {}, "No measurements yet. "), err.message)));
    return;
  }
  evalRendered = true;
  const m = metrics;
  $("#eval-meta").replaceChildren(
    h("span", {}, "Pipeline ", h("b", {}, m.version)), h("span", {}, "Retriever ", h("b", {}, m.retriever)),
    h("span", {}, "Dense model ", h("b", {}, m.dense_model)), h("span", {}, "Source ", h("b", {}, m._source)));
  const body = $("#eval-body");
  body.replaceChildren();
  if (m.dense_backend !== "neural") {
    body.append(h("div", { class: "banner" }, icon("alert"), h("div", {}, h("strong", {}, "Stand-in embedder. "),
      "These numbers come from the char n-gram stand-in, not the neural e5 model. Re-run the notebook with e5 for the real figures.")));
  }
  const b = m.blind ?? {}, base = m.blind_baseline ?? {}, n = m.blind_n ?? {};
  const kpis = [
    ["Decision accuracy", "decision accuracy", true],
    ["False answers on unanswerable", "false-answer rate on unanswerable", false],
    ["Citation support", "CITATION SUPPORT (verifier pass and gold)", true],
    ["Retrieval Recall@5", "retrieval Recall@5", true],
  ];
  const report = h("div", { class: "report" });
  body.append(report);
  report.append(h("h2", { class: "report-title" }, "Blind set: final pipeline against the baseline"),
    h("dl", { class: "kpis" }, kpis.map(([label, key, higherBetter]) => {
      const v = b[key], d = v != null && base[key] != null ? v - base[key] : null;
      const verdict = d == null ? "" : d === 0 ? "unchanged" : (d > 0) === higherBetter ? "better" : "worse";
      return h("div", { class: "kpi" }, h("dt", {}, label), h("dd", {},
        h("span", { class: "value", "data-value": v ?? "" }, pct(v)),
        h("span", { class: "delta" }, d == null ? "No baseline" : [h("b", {}, `${d > 0 ? "+" : ""}${(d * 100).toFixed(1)} pts`), ` ${verdict}, baseline ${pct(base[key])}`],
          n[key] ? h("span", { class: "n" }, ` · n=${n[key]}`) : null)));
    })));
  countUp(report.querySelectorAll(".kpi .value"));

  const grid = h("div", { class: "charts" });
  report.append(grid);
  const names = ["decision accuracy", "answer recall (answerable answered)", "false-answer rate on unanswerable", "CITATION SUPPORT (verifier pass and gold)", "retrieval Recall@5", "retrieval MRR@5"];
  const short = (s) => s.split(" (")[0].replace(/^CITATION SUPPORT/, "citation support").replace(/^\w/, (c) => c.toUpperCase());
  if (m.blind && m.blind_baseline) {
    addChart(grid, { title: "Blind set: baseline vs. final", sub: `Held-out queries, n=${n["decision accuracy"] ?? "?"}. False-answer rate: lower is better.`,
      draw: (el) => hbars(el, { cats: names.map(short), series: [{ name: "Baseline", values: names.map((k) => base[k]) }, { name: "Final", values: names.map((k) => b[k]) }] }),
      table: { cols: ["Metric", "Baseline", "Final"], rows: names.map((k) => [short(k), pct(base[k]), pct(b[k])]) } });
  }
  let split = "test";
  const retrievalChart = addChart(grid, { title: "Retrieval by method", sub: "", control: segmented(["test", "dev"], (v) => { split = v; retrievalChart.redraw(true); }),
    draw: (el, head) => {
      const rows = m.retrieval[split];
      head.querySelector(".sub").textContent = `${split === "test" ? "Official test" : "Dev"} split, n=${rows[0].n}. Bold = method in use.`;
      hbars(el, { cats: rows.map((r) => r.method), highlight: m.retriever, series: [{ name: "Recall@5", values: rows.map((r) => r["Recall@5"]) }, { name: "MRR@5", values: rows.map((r) => r["MRR@5"]) }] });
    },
    table: () => ({ cols: ["Method", "Recall@5", "MRR@5", "Hit@1"], rows: m.retrieval[split].map((r) => [r.method, pct(r["Recall@5"]), pct(r["MRR@5"]), pct(r["Hit@1"])]) }) });
  const dm = ["decision accuracy", "answer recall (answerable answered)", "false-answer rate on unanswerable"];
  const splits = Object.keys(m.decisions);
  addChart(grid, { title: "Decisions by split", sub: "The official test was inspected during development.",
    draw: (el) => hbars(el, { cats: dm.map(short), series: splits.map((s) => ({ name: `${SPLIT_NAME[s] ?? s} (n=${m.decisions[s].n})`, values: dm.map((k) => m.decisions[s][k]) })) }),
    table: { cols: ["Metric", ...splits.map((s) => SPLIT_NAME[s] ?? s)], rows: dm.map((k) => [short(k), ...splits.map((s) => pct(m.decisions[s][k]))]) } });
  const byLang = Object.entries(m.retrieval_test_by_language).filter(([, v]) => v != null);
  addChart(grid, { title: "Recall@5 by script", sub: `Official test, ${m.retriever}.`,
    draw: (el) => hbars(el, { cats: byLang.map(([k]) => k), series: [{ name: "Recall@5", values: byLang.map(([, v]) => v) }], labelAll: true }),
    table: { cols: ["Variant / language", "Recall@5"], rows: byLang.map(([k, v]) => [k, pct(v)]) } });
  const lat = { "Official test": m.latency_test_ms, ...(m.latency_blind_ms ? { Blind: m.latency_blind_ms } : {}) };
  addChart(grid, { title: "Latency per query", sub: "Milliseconds, one bar per bin.", draw: (el) => histograms(el, lat),
    table: { cols: ["Set", "n", "median", "p95", "max"], rows: Object.entries(lat).map(([k, v]) => { const s = [...v].sort((a, c) => a - c); return [k, s.length, `${quant(s, 0.5).toFixed(1)} ms`, `${quant(s, 0.95).toFixed(1)} ms`, `${s.at(-1).toFixed(1)} ms`]; }) } });
  const cm = m.confusion_test;
  addChart(grid, { title: "Expected vs. produced decision", sub: "Official test. Rows are what the label expected.", draw: (el) => heatmap(el, cm),
    table: { cols: ["Expected \\ produced", ...cm.cols], rows: cm.rows.map((r, i) => [r, ...cm.values[i]]) } });
  const td = m.decisions["TEST (previously inspected)"], tc = m.citations["TEST (previously inspected)"];
  report.append(h("p", { class: "foot-note" }, `Official test (previously inspected): decision accuracy ${pct(td["decision accuracy"])} on n=${td.n}, citation support ${pct(tc["CITATION SUPPORT RATE"])}. The blind set was frozen before the final round and is the honest measure.`));
}

function segmented(values, onChange) {
  const g = h("div", { class: "segmented", role: "group", "aria-label": "Split" });
  for (const v of values) g.append(h("button", { type: "button", "aria-pressed": String(v === values[0]), onclick: (e) => {
    g.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === e.currentTarget))); onChange(v);
  } }, v === "test" ? "Test" : "Dev"));
  return g;
}

function addChart(grid, spec) {
  const head = h("div", {}, h("h3", {}, spec.title), h("p", { class: "sub" }, spec.sub));
  const plot = h("div", { class: "plot" });
  const tableBox = h("div", { class: "table-wrap" });
  const fig = h("figure", { class: "chart", style: "margin:0" },
    h("div", { class: "chart-head" }, head, spec.control ?? null), plot,
    h("details", { class: "data-toggle" }, h("summary", {}, icon("chev"), "View data as a table"), tableBox));
  grid.append(fig);
  const chart = {
    redraw(animate) {
      plot.replaceChildren();
      plot.classList.toggle("reveal", Boolean(animate) && !reduceMotion.matches);
      spec.draw(plot, head);
      const t = typeof spec.table === "function" ? spec.table() : spec.table;
      tableBox.replaceChildren(h("table", {}, h("thead", {}, h("tr", {}, t.cols.map((c) => h("th", { scope: "col" }, c)))),
        h("tbody", {}, t.rows.map((r) => h("tr", {}, r.map((c, i) => (i ? h("td", {}, c) : h("th", { scope: "row" }, c))))))));
    },
  };
  charts.push(chart);
  chart.redraw(true);
  return chart;
}
let resizeTimer;
function scheduleChartResize() { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { if (currentView === "eval") charts.forEach((c) => c.redraw(false)); }, 150); }

const SVGNS = "http://www.w3.org/2000/svg";
function s(tag, attrs = {}, ...kids) {
  const n = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null) n.setAttribute(k, v);
  kids.flat().forEach((k) => k != null && n.append(k instanceof Node ? k : document.createTextNode(String(k))));
  return n;
}
function legend(el, names) {
  if (names.length < 2) return;
  el.before(h("div", { class: "legend" }, names.map((nm, i) => h("span", {}, h("i", { style: `--c:${SERIES[i]}` }), nm))));
}
function tip(node, html) {
  const show = (e) => { tooltip.innerHTML = html; tooltip.classList.add("on"); place(e); };
  const place = (e) => {
    const r = tooltip.getBoundingClientRect();
    const x = Math.min(innerWidth - r.width - 8, Math.max(8, e.clientX - r.width / 2));
    tooltip.style.left = `${x}px`; tooltip.style.top = `${e.clientY - r.height - 14}px`;
  };
  node.addEventListener("pointerenter", show);
  node.addEventListener("pointermove", place);
  node.addEventListener("pointerleave", () => tooltip.classList.remove("on"));
}
const barPath = (x, y, w, hgt, r = 4) => {
  if (w <= 0) return "";
  r = Math.min(r, w, hgt / 2);
  return `M${x},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + hgt - r}Q${x + w},${y + hgt} ${x + w - r},${y + hgt}H${x}Z`;
};
const vbarPath = (x, y, w, hgt, r = 3) => {
  if (hgt <= 0) return "";
  r = Math.min(r, hgt, w / 2);
  return `M${x},${y + hgt}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + hgt}Z`;
};

function hbars(el, { cats, series, highlight, labelAll }) {
  legend(el, series.map((x) => x.name));
  const W = Math.max(300, el.clientWidth);
  const labelW = Math.min(190, Math.round(W * 0.36));
  const barH = series.length > 2 ? 9 : 11, gap = 2, pad = 14;
  const groupH = series.length * barH + (series.length - 1) * gap;
  const top = 6, plotW = W - labelW - 44;
  const H = top + cats.length * (groupH + pad) + 22;
  const svg = s("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Bar chart; the table below has the values" });
  for (const t of [0, 0.25, 0.5, 0.75, 1]) {
    const x = labelW + t * plotW;
    svg.append(s("line", { class: "grid", x1: x, x2: x, y1: top - 4, y2: H - 20 }), s("text", { class: "axis-label", x, y: H - 4, "text-anchor": "middle" }, `${t * 100}%`));
  }
  let k = 0;
  cats.forEach((cat, ci) => {
    const y0 = top + ci * (groupH + pad);
    svg.append(s("text", { x: labelW - 10, y: y0 + groupH / 2 + 4, "text-anchor": "end", class: cat === highlight ? "highlight-label" : null }, cat));
    const g = s("g", { class: "bar-group" });
    series.forEach((ser, si) => {
      const v = ser.values[ci];
      const y = y0 + si * (barH + gap);
      if (v == null || Number.isNaN(v)) {
        g.append(s("text", { class: "axis-label", x: labelW + 4, y: y + barH - 2 }, "n/a"));
        return;
      }
      g.append(s("path", { class: "bar", d: barPath(labelW, y, Math.max(1, v * plotW), barH), fill: SERIES[si], style: `--i:${k++}` }));
      if (labelAll || si === series.length - 1) g.append(s("text", { class: "value-label", x: labelW + v * plotW + 5, y: y + barH - 1.5 }, pct(v, 0)));
    });
    const hit = s("rect", { class: "hit", x: 0, y: y0 - pad / 2, width: W, height: groupH + pad });
    g.prepend(hit);
    tip(g, `<b>${cat}</b><br>${series.map((ser, si) => `<i class="swatch" style="--c:${SERIES[si]}"></i>${ser.name}: ${pct(ser.values[ci])}`).join("<br>")}`);
    svg.append(g);
  });
  el.append(svg);
}

const quant = (sorted, q) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
function histograms(el, sets) {
  const names = Object.keys(sets);
  legend(el, names);
  const W = Math.max(300, el.clientWidth);
  const upper = Math.max(...names.flatMap((n) => sets[n])) * 1.05;
  const bins = 24, step = upper / bins;
  const left = 30, plotW = W - left - 8, rowH = 74, gapY = 26;
  const H = names.length * (rowH + gapY) + 10;
  const svg = s("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Latency histograms; the table below has the summary" });
  let k = 0;
  names.forEach((name, ni) => {
    const counts = Array(bins).fill(0);
    sets[name].forEach((v) => counts[Math.min(bins - 1, Math.floor(v / step))]++);
    const maxC = Math.max(...counts);
    const y0 = ni * (rowH + gapY);
    svg.append(s("text", { class: "axis-label", x: left, y: y0 + 10 }, `${name} · median ${quant([...sets[name]].sort((a, b) => a - b), 0.5).toFixed(1)} ms`));
    const base = y0 + rowH;
    svg.append(s("line", { class: "grid", x1: left, x2: W - 8, y1: base, y2: base }));
    const bw = plotW / bins;
    counts.forEach((c, i) => {
      const bh = (c / maxC) * (rowH - 20);
      const g = s("g", { class: "bar-group" });
      g.append(s("rect", { class: "hit", x: left + i * bw, y: y0 + 14, width: bw, height: rowH - 14 }));
      if (c) g.append(s("path", { class: "bar v", d: vbarPath(left + i * bw + 1, base - bh, bw - 2, bh), fill: SERIES[ni], style: `--i:${k++}` }));
      tip(g, `<b>${name}</b><br>${(i * step).toFixed(1)} to ${((i + 1) * step).toFixed(1)} ms: ${c} ${c === 1 ? "query" : "queries"}`);
      svg.append(g);
    });
    svg.append(s("text", { class: "axis-label", x: left - 6, y: y0 + 22, "text-anchor": "end" }, maxC));
  });
  for (const t of [0, 0.25, 0.5, 0.75, 1]) {
    svg.append(s("text", { class: "axis-label", x: left + t * plotW, y: H - 2, "text-anchor": t === 0 ? "start" : t === 1 ? "end" : "middle" }, `${(t * upper).toFixed(0)} ms`));
  }
  el.append(svg);
}

function heatmap(el, cm) {
  const W = Math.max(300, el.clientWidth);
  const rows = cm.rows, cols = cm.cols;
  const labelW = 96, top = 26, cw = (W - labelW) / cols.length, ch = 40;
  const H = top + rows.length * ch + 4;
  const inner = cm.values.slice(0, -1).flatMap((r) => r.slice(0, -1));
  const max = Math.max(...inner);
  const ramp = ["#eef6f1", "#cfe7da", "#9fd0b6", "#5fae88", "#2f8a60", "#1d6646"];
  const svg = s("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Confusion matrix; the table below has the counts" });
  cols.forEach((c, j) => svg.append(s("text", { class: "axis-label", x: labelW + j * cw + cw / 2, y: 14, "text-anchor": "middle" }, c)));
  let k = 0;
  rows.forEach((r, i) => {
    svg.append(s("text", { x: labelW - 10, y: top + i * ch + ch / 2 + 4, "text-anchor": "end" }, r));
    cols.forEach((c, j) => {
      const v = cm.values[i][j];
      const total = r === "All" || c === "All";
      const step = total ? -1 : v === 0 ? 0 : Math.min(ramp.length - 1, 1 + Math.round((v / max) * (ramp.length - 2)));
      const fill = total ? "var(--paper)" : ramp[step];
      const g = s("g", { class: "bar-group" });
      g.append(s("rect", { x: labelW + j * cw + 1, y: top + i * ch + 1, width: cw - 2, height: ch - 2, rx: 4, fill, style: `--i:${k++}`, class: "bar v" }));
      g.append(s("text", { x: labelW + j * cw + cw / 2, y: top + i * ch + ch / 2 + 4, "text-anchor": "middle", class: "value-label", style: step >= 4 ? "fill:#fff" : null }, v));
      tip(g, `Expected <b>${r}</b>, produced <b>${c}</b>: ${v}`);
      svg.append(g);
    });
  });
  el.append(svg);
}

function countUp(nodes) {
  if (reduceMotion.matches) return;
  const t0 = performance.now(), dur = 700;
  const targets = [...nodes].map((n) => [n, parseFloat(n.dataset.value)]).filter(([, v]) => !Number.isNaN(v));
  const tick = (now) => {
    const t = Math.min(1, (now - t0) / dur), e = 1 - (1 - t) ** 3;
    targets.forEach(([n, v]) => { n.textContent = pct(v * e); });
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* ---------------- Boot ---------------- */
renderFile();
if (history[0]) showEntry(history[0]);
route();
document.fonts?.ready.then(moveIndicator);
pollStatus();
