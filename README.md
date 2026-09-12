# FigureMind

> The AI agent that thinks in figures.

FigureMind is a multimodal scientific figure-generation agent. It understands papers, PDFs, screenshots, text, and research topics; plans visual structures; and generates scientific diagrams, model architectures, technical roadmaps, experimental charts, and presentation-ready research assets.

[中文说明](README_CN.md)

## Highlights

- **Scientific figure agent** — extracts entities, relationships, and workflows from research content and plans the composition automatically.
- **Model architecture diagrams** — generates neural-network, system-architecture, and algorithm-flow figures with iterative refinement.
- **Technical roadmaps** — produces editable SVG and PPT diagrams with configurable templates and palettes.
- **Experimental figures** — turns tables and experimental data into publication- and presentation-ready charts.
- **Editable outputs** — exports PPTX, SVG, DrawIO, PNG, and PDF artifacts.
- **Extended workflows** — includes academic slides, posters, video, mind maps, citation exploration, and rebuttal assistance.

## Quick start

### Requirements

- Python 3.11+
- Node.js 18+
- Windows, Linux, or WSL

### Clone

```bash
git clone https://github.com/huokesi-0709/FigureMind.git
cd FigureMind
```

### Backend

```bash
python -m venv .venv
```

Windows:

```powershell
.\.venv\Scripts\Activate.ps1
pip install -r requirements-base.txt
python -m fastapi_app.main
```

Linux / WSL:

```bash
source .venv/bin/activate
pip install -r requirements-base.txt
python -m fastapi_app.main
```

### Frontend

```bash
cd frontend-workflow
npm install
npm run dev
```

The default local URL is `http://localhost:3000`.

## Configuration

Configuration templates:

- `fastapi_app/.env.simple.example`
- `fastapi_app/.env.example`
- `frontend-workflow/.env.simple.example`

Copy the required templates to their corresponding `.env` files and configure model APIs, storage, and optional services. Never commit real secrets.

## Project layout

```text
FigureMind/
├── dataflow_agent/                 # Agent and workflow engine
│   └── agentroles/figuremind_agents/
├── fastapi_app/                    # FastAPI backend
│   ├── routers/figuremind.py
│   └── services/figuremind_service.py
├── frontend-workflow/              # React / Vite frontend
├── script/                         # CLI and operations scripts
├── database/                       # Database initialization
├── deploy/                         # Deployment configuration
└── tests/                          # Automated tests
```

## Docker

```bash
docker compose up --build
```

See [DEPLOY.md](DEPLOY.md) and the [open deployment guide](docs/guides/open_source_deployment.md) for additional deployment details.

## Development and verification

```bash
pytest
```

```bash
cd frontend-workflow
npm run build
```

## Project links

- GitHub: [huokesi-0709/FigureMind](https://github.com/huokesi-0709/FigureMind)
- Issues: [Report a problem](https://github.com/huokesi-0709/FigureMind/issues)

## License

FigureMind is distributed under the [Apache License 2.0](LICENSE). Third-party components remain subject to their respective licenses.

## Maintainer

FigureMind is maintained by **linkinwise**.
