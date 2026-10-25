# Running E-Sahulat on your own computer

These steps use Windows (PowerShell or Command Prompt). You need Python 3.10 to 3.13 and Git. Python 3.14 does not work yet: the pinned Streamlit needs Pillow 10, which has no Windows build for 3.14, so `pip install` fails with a zlib error. If you only have 3.14, install 3.13 first (for example `uv venv --python 3.13 .venv`, or the installer from python.org).

If the project folder has a very long path, pip can fail with "Failed to persist temporary file". Create the environment in a short path such as `C:\esv` instead (`python -m venv C:\esv`), and use `C:\esv\Scripts\activate` in place of `.venv\Scripts\activate` below.

## One-time setup

Run these in the folder where you want the project:

```bash
git clone https://github.com/sa1ffffff/E-Sahulat.git
cd E-Sahulat
python -m venv .venv
.venv\Scripts\activate
pip install torch --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt
```

The first `pip` line installs the CPU-only build of PyTorch, which is much smaller than the default download.

## Every time you use it

```bash
cd E-Sahulat
.venv\Scripts\activate
python server.py
```

Then open http://127.0.0.1:8000 in your browser.

- The first start downloads the e5 model (about 1.1 GB). After that, startup takes about 15 seconds; the page shows a loading banner until the pipeline is ready.
- Press `Ctrl+C` in the terminal to stop the server.
- To use another port: `set PORT=8080` (Command Prompt) or `$env:PORT=8080` (PowerShell) before `python server.py`.

## Step-by-step answers with Qwen (optional)

The "Step-by-step (Qwen)" switch in the Ask composer turns each answer into a direct sentence plus numbered steps, in the language of the question, written only from the official text. It needs [Ollama](https://ollama.com) and one or both Qwen models:

```bash
ollama pull qwen2.5:3b
```

```bash
ollama pull qwen3:4b-instruct-2507-q4_K_M
```

The 3B / 4B toggle beside the switch picks between them, and the app remembers your choice:

- **3B** (about 1.9 GB) is faster and fine for English questions. Its Urdu and Roman Urdu are poor, so on those answers it offers "Rewrite with Qwen 4B".
- **4B** (about 2.5 GB) is slower but writes proper Urdu and Roman Urdu. Pull that exact tag: plain `qwen3:4b` is the "thinking" release, which reasons for minutes before it answers.

A size you haven't downloaded is greyed out. Only one model is kept in memory, so switching size unloads the other and cancels any answer still being written.

If Ollama is installed but not running, switching Qwen on in the app starts it for you. A tag beside the switch shows `starting…`, `offline` or `model missing` when Qwen isn't ready. The official sentence shows straight away and the steps replace it as they arrive. On a laptop CPU, 3B takes about 40–70 seconds for a full answer; 4B takes about 1 minute in English or Roman Urdu and about 2 minutes in Urdu. Switching size adds a few seconds to load the other model.

## Evaluation numbers

The e5 evaluation results are written to `esahulat/outputs/`, which is not stored on GitHub. On a fresh clone, the Evaluation page falls back to the older stand-in numbers in `results/app_metrics.json` and shows a "stand-in embedder" warning.

To get the e5 numbers, run the notebook once from top to bottom:

```bash
jupyter notebook E_Sahulat_AI_Hackathon.ipynb
```

It takes a few minutes and writes `esahulat/outputs/app_metrics.json`, which the app then reads. The Ask and Knowledge base pages use e5 either way.

## Rebuilding the technical report (optional)

After running the notebook, regenerate the report's numbers and compile it with [Tectonic](https://tectonic-typesetting.github.io):

```bash
python report/make_report_data.py
cd report
tectonic technical_report.tex
```

## Troubleshooting

| Problem | Fix |
|---|---|
| `python` is not recognized | Install Python from python.org and tick "Add Python to PATH". |
| Page stays on "Loading pipeline" | Watch the terminal; the first run is downloading e5. Check your internet connection. |
| Qwen tag says `model missing`, or 3B / 4B is greyed out | Run `ollama pull qwen2.5:3b` and/or `ollama pull qwen3:4b-instruct-2507-q4_K_M`. |
| Qwen tag says `offline` | Install Ollama, or start it with `ollama serve`. |
| Out-of-memory error | Close other heavy programs. e5 and Qwen together need several GB of RAM. |

The older Streamlit front end still works with `streamlit run app.py`.
