# Demo Dataset

This directory contains a set of placeholder files that demonstrate the full range of video-sweep-web's file-scanning and renaming capabilities. All video files are empty (zero bytes) — they are purely for testing the UI workflow without needing real media.

## Contents

### `source/` — files to be scanned

| File | Type | Convention |
|------|------|------------|
| `Gullivers.Travels.1939.mkv` | Movie | Dot-separated |
| `The_Little_Shop_of_Horrors_1960.avi` | Movie | Underscore-separated |
| `Night of the Living Dead (1968).mp4` | Movie | Spaces with year in parentheses |
| `The-Stranger-1946.m4v` | Movie | Dash-separated |
| `cover.jpg` | Non-video | JPEG at source root |
| `White Zombie (1932)/White.Zombie.1932.mkv` | Movie | Dot-separated inside a subdirectory |
| `White Zombie (1932)/backdrop.jpeg` | Non-video | JPEG inside a subdirectory |
| `The Lone Ranger/The.Lone.Ranger.S01E01.mkv` | TV Series | Dot-separated S##E## |
| `The Lone Ranger/The.Lone.Ranger.S01E02.avi` | TV Series | Dot-separated S##E## |
| `The Lone Ranger/The.Lone.Ranger.S01E03.mp4` | TV Series | Dot-separated S##E## |
| `The Lone Ranger/poster.jpg` | Non-video | JPEG inside a subdirectory |

All five movies are in the public domain (expired copyright). The Lone Ranger episodes are from Season 1.

### `movies/` and `series/` — output directories

Empty directories (kept with `.gitkeep`) where the app will move files after you press **Proceed**.

## Using the demo

### With Docker Compose

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and point the three directory variables at the demo subdirectories. Paths must be absolute — run `pwd` from the repo root to get the prefix:
   ```env
   SOURCE_DIR=<absolute-repo-path>/demo/source
   MOVIES_DIR=<absolute-repo-path>/demo/movies
   SERIES_DIR=<absolute-repo-path>/demo/series
   OMDB_API_KEY=
   ```

3. Start the stack:
   ```bash
   docker compose up --build -d
   ```

4. Open `http://localhost:8080` and click **Scan**.

### What to expect

- **5 movies** are detected and renamed using standardised `Title [YYYY].ext` filenames.
- **3 TV series episodes** are detected and placed under `The Lone Ranger/Season 1/`.
- **3 JPEG files** appear in the non-video section, ready to be deleted.
- Files inside subdirectories (`White Zombie (1932)/` and `The Lone Ranger/`) demonstrate recursive scanning.

### Resetting after a demo run

After pressing **Proceed**, the video files are moved out of `source/`. To reset and run the demo again:

```bash
git restore demo/
```

This restores all the empty placeholder files to their original locations.
