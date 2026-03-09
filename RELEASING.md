# Releasing video-sweep-web

This document describes the end-to-end process for creating a new release.

## Step 1 — Decide the version number

| Change type                        | Version bump                        |
|------------------------------------|-------------------------------------|
| Bug fixes only                     | Patch — `v1.0.0` → `v1.0.1`         |
| New features, backwards-compatible | Minor — `v1.0.0` → `v1.1.0`         |
| Breaking changes                   | Major — `v1.0.0` → `v2.0.0`         |

## Step 2 — Update package versions

Edit the `version` field in **both** files to the new version (without the `v` prefix):

```text
backend/package.json
frontend/package.json
```

Example for `v1.1.0`:

```json
"version": "1.1.0"
```

Commit and push to `master`:

```bash
git add backend/package.json frontend/package.json
git commit -m "chore: bump version to 1.1.0"
git push origin master
```

## Step 3 — Draft the GitHub Release

1. Go to the repository on GitHub → **Releases** → **Draft a new release**
2. Click **Choose a tag**, type the new tag (e.g. `v1.1.0`), and select **Create new tag on publish**; set the target branch to **master**
3. Set the release title to the tag name, click **Generate release notes**, review, and click **Publish release**

## Step 4 — Wait for the release workflow

Publishing the release triggers the [Release workflow](.github/workflows/release.yml), which:

1. Builds the backend Docker image
2. Builds the frontend Docker image
3. Pushes both to ghcr.io with tags: `v1.1.0`, `1.1`, `1`, and `latest`

Monitor progress under **Actions → Release** on GitHub. Once complete, the images are visible under **Packages** on the repository page:

```text
ghcr.io/colinmakerofthings/video-sweep-web-backend:v1.1.0
ghcr.io/colinmakerofthings/video-sweep-web-frontend:v1.1.0
```

## Step 5 — Redeploy

Pull the new `latest` images and restart the containers however suits your setup.

### Via Docker Compose

```bash
docker compose pull
docker compose up -d
```

### Via a stack manager (Portainer, Dockge, etc.)

Most stack managers expose a **Pull and redeploy** button, or a webhook URL you can POST to trigger a redeploy automatically:

```bash
curl -X POST "<your-webhook-url>"
```

## Image tags reference

| Tag       | Meaning                                   |
|-----------|-------------------------------------------|
| `latest`  | Always points to the most recent release  |
| `1`       | Latest release with major version 1       |
| `1.1`     | Latest patch of minor version 1.1         |
| `v1.1.0`  | Exact release — pinned, immutable         |

Use `latest` for automatic updates on redeploy. Pin to `v1.1.0` if you want explicit control.
