# video-sweep-web

A web-based variant of my [video-sweep](https://github.com/colinmakerofthings/video-sweep) tool — scan, classify, and rename video files from a browser UI. Runs as a Docker Compose app. The UI is mobile-friendly, with a slide-in sidebar and a card-based results layout on small screens.

## How it works

1. **Scan** — press the Scan button; the backend walks the `/media/source` volume, classifies each video as a *movie* or *series episode*, and generates standardised target filenames
2. **Review** — results appear in a table with original file, type, new filename, and destination path. If `OMDB_API_KEY` is set, movies also show an OMDb validation column
3. **Proceed** — if you are happy with the plan, press Proceed; files are moved to `/media/movies` or `/media/series` and empty source folders are cleaned up

## Prerequisites

- **Docker Engine 20.10+** — [Install Docker](https://docs.docker.com/engine/install/)
- **Docker Compose v2** — included with Docker Desktop and Docker Engine 20.10+; confirm with `docker compose version`

Docker Desktop covers both requirements on macOS and Windows. On a Raspberry Pi or other Linux host, install Docker Engine and then verify the `docker compose` (v2) plugin is available.

## Quick start

### 1. Clone the repo

```bash
git clone https://github.com/colinmakerofthings/video-sweep-web.git
cd video-sweep-web
```

### 2. Configure

```bash
cp .env.example .env
```

Edit `.env` and set the three directory paths and (optionally) your OMDb API key:

```env
SOURCE_DIR=/mnt/downloads      # where your downloaded video files live
MOVIES_DIR=/mnt/movies         # where movies should be moved
SERIES_DIR=/mnt/tv             # where TV series episodes should be moved
OMDB_API_KEY=                  # optional free key from omdbapi.com
```

### 3. Build and run

```bash
docker compose up --build -d
```

Open `http://<your-host-ip>:8080` in a browser. If you are running Docker locally, use `http://localhost:8080`.

## Naming conventions

### Movies

Input: `The.Dark.Knight.2008.1080p.BluRay.mkv`
Output: `The Dark Knight [2008].mkv` → `$MOVIES_DIR/The Dark Knight [2008].mkv`

### TV Series

Input: `Breaking.Bad.S01E01.Pilot.mkv`
Output: `Breaking Bad S01E01.mkv` → `$SERIES_DIR/Breaking Bad/Season 1/Breaking Bad S01E01.mkv`

## Optional: OMDb validation

### Getting a free API key

1. Go to <https://www.omdbapi.com/apikey.aspx>
2. Select the **FREE** tier and enter your email address
3. Submit the form — OMDb will send an activation link to your inbox
4. Click the activation link; your key is then shown on the confirmation page
5. Copy the key into your `.env` file:

   ```env
   OMDB_API_KEY=your_key_here
   ```

### What happens with the key set

When `OMDB_API_KEY` is set, movie rows show two extra columns in the scan table:

| Column | Meaning |
| --- | --- |
| **Valid** | `Yes` — OMDb confirmed the title exactly; `No` — OMDb found a different canonical title; `-` — no match returned |
| **Suggested Name** | The canonical OMDb title, e.g. `The Dark Knight [2008]` |

The backend first attempts a direct title lookup; if that returns no result it falls back to a fuzzy search using progressively shorter title substrings.

### What happens without the key

If `OMDB_API_KEY` is left blank (the default):

- **No requests** are made to the OMDb API
- The **Valid** and **Suggested Name** columns display `-` for every movie row
- All other scan and rename functionality works exactly as normal — the key is only needed for title validation

You can always add the key later and re-scan; no other configuration changes are required.

### Usage limits

| Tier | Daily request limit | Cost |
| --- | --- | --- |
| **Free** | 1,000 requests/day | Free (requires email activation) |
| **Patreon** | 100,000 requests/day | Paid |

Each movie in a scan consumes at most a few requests (one direct lookup, plus up to a handful of fuzzy-search attempts if the direct lookup fails). For typical home-media libraries the free tier is more than sufficient.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `SOURCE_DIR` | Yes | Host path mounted as `/media/source` inside the container |
| `MOVIES_DIR` | Yes | Host path mounted as `/media/movies` |
| `SERIES_DIR` | Yes | Host path mounted as `/media/series` |
| `OMDB_API_KEY` | No | Free OMDb API key; leave blank to disable validation (Valid / Suggested Name columns show `-`). Free tier: 1,000 req/day. Get one at <https://www.omdbapi.com/apikey.aspx> |

## Architecture

```mermaid
graph TB
    Browser["🌐 Browser\n:8080"]

    subgraph DC["Docker Compose"]
        Frontend["nginx\nAngular SPA\n:80"]
        Backend["Node.js / Express\n:3001\nPOST /api/scan\nPOST /api/proceed\nGET  /api/health"]
    end

    subgraph Volumes["Host Volumes"]
        Source["/media/source\n(SOURCE_DIR)"]
        Movies["/media/movies\n(MOVIES_DIR)"]
        Series["/media/series\n(SERIES_DIR)"]
    end

    OMDb["OMDb API\nomdbapi.com\n(optional)"]

    Browser   -->|"HTTP :8080"| Frontend
    Frontend  -->|"/api/* proxy → :3001"| Backend
    Backend   -->|"read"| Source
    Backend   -->|"write movies"| Movies
    Backend   -->|"write series"| Series
    Backend   -.->|"validate titles"| OMDb
```

## Development (without Docker)

### Backend

```bash
cd backend
npm install
# Set environment variables
$env:SOURCE_DIR = "C:/path/to/source"
$env:MOVIES_DIR = "C:/path/to/movies"
$env:SERIES_DIR = "C:/path/to/series"
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm start
```

Then open `http://localhost:4200`. The Angular dev server proxies `/api/*` to `http://localhost:3001` — add a `proxy.conf.json` if needed.

## API reference

### `GET /api/status`

Returns the number of video files currently present in `SOURCE_DIR`. Does not classify or call OMDb — it only counts, so it is fast and cheap to poll.

### Response

```json
{ "count": 42 }
```

`count` is the number of pending video files (`.mp4`, `.mkv`, `.avi`, `.m4v`). Non-video files are excluded.

The endpoint is exposed directly by the backend on port `3001`, not through the nginx proxy, so call it as:

```http
GET http://<host>:3001/api/status
```

## Testing

Both backend and frontend use [Vitest](https://vitest.dev/).

### Backend Testing

```bash
cd backend
npm test            # single run
npm run test:watch  # watch mode
```

Tests cover the classifier, renamer, and file-finder modules.

### Frontend Testing

```bash
cd frontend
npm test
```

Tests cover component logic including action toggling, OMDb suggestion acceptance, computed counts, and select-all state.

## CI

GitHub Actions runs both test suites on every push to `main` and on pull requests. See `.github/workflows/ci.yml`.
