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

## Qwen summary (optional)

The "Qwen summary" switch in the Ask composer adds a short plain-language summary written only from the verified quotes. It needs [Ollama](https://ollama.com) and the Qwen2.5 3B model:

```bash
ollama pull qwen2.5:3b
```

If Ollama is installed but not running, switching Qwen on in the app starts it for you. The tag beside the switch shows its state: `qwen2.5:3b` (ready), `starting…`, `offline` or `model missing`. The first summary after start-up takes about 25 seconds while the model loads; later ones take about 8–17 seconds on a laptop CPU.

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
| Qwen tag says `model missing` | Run `ollama pull qwen2.5:3b`. |
| Qwen tag says `offline` | Install Ollama, or start it with `ollama serve`. |
| Out-of-memory error | Close other heavy programs. e5 and Qwen together need several GB of RAM. |

The older Streamlit front end still works with `streamlit run app.py`.
