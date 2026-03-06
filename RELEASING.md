# Releasing video-sweep-web

This document describes the end-to-end process for creating a new release.

## Overview

- Releases are versioned with [Semantic Versioning](https://semver.org/): `vMAJOR.MINOR.PATCH`
- A single version tag covers both the backend and frontend
- Publishing a GitHub Release automatically builds and pushes versioned Docker images to [GitHub Container Registry (ghcr.io)](https://ghcr.io)

---

## Step 1 — Decide the version number

| Change type                        | Version bump                        |
|------------------------------------|-------------------------------------|
| Bug fixes only                     | Patch — `v1.0.0` → `v1.0.1`         |
| New features, backwards-compatible | Minor — `v1.0.0` → `v1.1.0`         |
| Breaking changes                   | Major — `v1.0.0` → `v2.0.0`         |

---

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

---

## Step 3 — Draft the GitHub Release

1. Go to the repository on GitHub
2. Click **Releases** in the right sidebar → **Draft a new release**
3. Click **Choose a tag**, type the new tag (e.g. `v1.1.0`), and click **Create new tag on publish**
4. Set the target branch to **master**
5. Set the release title to the tag name, e.g. `v1.1.0`
6. Click **Generate release notes** — GitHub will auto-populate the notes from merged PRs and commits since the last release
7. Review and edit the notes as needed
8. Click **Publish release**

---

## Step 4 — Wait for the release workflow

Publishing the release triggers the [Release workflow](.github/workflows/release.yml), which:

1. Builds the backend Docker image
2. Builds the frontend Docker image
3. Pushes both to ghcr.io with tags: `v1.1.0`, `1.1`, `1`, and `latest`

Monitor progress under **Actions → Release** on GitHub. The workflow typically takes 3–5 minutes.

Once complete, the images are visible under **Packages** on the repository page:

```text
ghcr.io/colinmakerofthings/video-sweep-web-backend:v1.1.0
ghcr.io/colinmakerofthings/video-sweep-web-frontend:v1.1.0
```

---

## Step 5 — Redeploy on Portainer

### Option A — Stack webhook (recommended)

Portainer stacks expose a webhook URL that triggers a pull + redeploy automatically.

To find the webhook URL:

1. Open Portainer → **Stacks** → click the `video-sweep` stack
2. Scroll to **Webhooks** and enable it if not already enabled
3. Copy the webhook URL

Trigger the redeploy with a simple POST:

```bash
curl -X POST "<your-webhook-url>"
```

You can store this URL as a secret and call it from a script or CI step to automate post-release deployment.

### Option B — Manual redeploy via the UI

1. Open Portainer → **Stacks** → click the `video-sweep` stack
2. Click **Pull and redeploy**
3. Confirm — Portainer will pull the new `latest` images and restart the containers

---

## Image tags reference

| Tag       | Meaning                                   |
|-----------|-------------------------------------------|
| `latest`  | Always points to the most recent release  |
| `1`       | Latest release with major version 1       |
| `1.1`     | Latest patch of minor version 1.1         |
| `v1.1.0`  | Exact release — pinned, immutable         |

Use `latest` in Portainer for automatic updates on redeploy. Pin to `v1.1.0` if you want explicit control.
