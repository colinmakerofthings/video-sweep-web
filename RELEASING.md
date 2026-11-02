# Releasing video-sweep-web

This document describes the end-to-end process for creating a new release.

## Step 1 — Decide the version number

| Change type | Version bump |
| --- | --- |
| Bug fixes only | Patch — increment `PATCH` |
| New features, backwards-compatible | Minor — increment `MINOR`, reset `PATCH` |
| Breaking changes | Major — increment `MAJOR`, reset `MINOR` and `PATCH` |

## Step 2 — Update package versions

Edit the `version` field in **both** files to the new version (without the `v` prefix):

```text
backend/package.json
frontend/package.json
```

Set the package version to the release number without the `v` prefix. Replace the placeholders with the actual version numbers:

```json
"version": "<major>.<minor>.<patch>"
```

Commit and push to `master`:

```bash
git add backend/package.json frontend/package.json
git commit -m "chore: bump version to <major>.<minor>.<patch>"
git push origin master
```

## Step 3 — Draft the GitHub Release

1. Go to the repository on GitHub → **Releases** → **Draft a new release**
2. Click **Choose a tag**, type `v<major>.<minor>.<patch>` with the actual version numbers, and select **Create new tag on publish**; set the target branch to **master**
3. Set the release title to the tag name, click **Generate release notes**, review, and click **Publish release**

## Step 4 — Wait for the release workflow

Publishing the release triggers the [Release workflow](.github/workflows/release.yml), which:

1. Builds the backend Docker image
2. Builds the frontend Docker image
3. Pushes both to ghcr.io with tags: `v<major>.<minor>.<patch>`, `<major>.<minor>`, `<major>`, and `latest`

Monitor progress under **Actions → Release** on GitHub. Once complete, the images are visible under **Packages** on the repository page:

```text
ghcr.io/colinmakerofthings/video-sweep-web-backend:v<major>.<minor>.<patch>
ghcr.io/colinmakerofthings/video-sweep-web-frontend:v<major>.<minor>.<patch>
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

| Tag | Meaning |
| --- | --- |
| `latest` | Always points to the most recent release |
| `<major>` | Latest release with that major version |
| `<major>.<minor>` | Latest patch of that minor version |
| `v<major>.<minor>.<patch>` | Exact release — pinned, immutable |

Use `latest` for automatic updates on redeploy. Pin to an exact `v<major>.<minor>.<patch>` tag if you want explicit control.
