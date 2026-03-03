# video-sweep-web — Copilot instructions

## Project overview
Web-based variant of video-sweep. Scans a source directory for video files, classifies them as movies or TV series, generates standardised filenames, and moves them to configured output directories — all from a browser UI.

## Architecture
- **Backend**: Node.js + Express + TypeScript (`backend/`). Exposes `/api/scan` and `/api/proceed`. Source/movies/series directories are mounted as Docker volumes at `/media/source`, `/media/movies`, `/media/series`.
- **Frontend**: Angular 17+ standalone app (`frontend/`). Served by nginx which proxies `/api/*` to the backend container.
- **Deployment**: Docker Compose (`docker-compose.yml`). Environment variables (`SOURCE_DIR`, `MOVIES_DIR`, `SERIES_DIR`, `OMDB_API_KEY`) are set in `.env`.

## Key conventions
- Backend uses `strict` TypeScript; no `any` unless unavoidable.
- Angular components are standalone (no NgModules).
- SCSS uses `@use 'sass:color'` — do not use deprecated `lighten()`/`darken()` global functions.
- Docker volumes replace config files; never hardcode directory paths.
- OMDb API key is optional; when absent, validation columns show `-`.

## Development
- Backend: `cd backend && npm run dev` (ts-node, port 3001)
- Frontend: `cd frontend && npm start` (port 4200, add proxy.conf.json for `/api`)
- Full stack: `docker compose up --build`
