# Publishing and running

Two ways to use the app: the published page (GitHub Pages) and the local server. This page covers setting up both and what CI checks.

## Published page (GitHub Pages)

**Why:** you can open the app from any browser without starting anything.

**What gets published:** `app/dist`, the built app plus `catalog.json` (questions without solutions). The address is `https://martin-jin.github.io/code-practice/`.

### One-time setup

1. In the repo on GitHub, open **Settings, Pages**, and set **Source** to **GitHub Actions**. Or run `gh api -X POST repos/<user>/<repo>/pages -f build_type=workflow`.
2. Push to `main` (or run the workflow by hand from the **Actions** tab). The first run creates the Pages site.
3. Open the address above. You should see the dashboard.

### What the workflow does

`.github/workflows/pages.yml` runs on every push and pull request. Jobs:

1. **questions:** builds every question with its reference solution (CMake, g++ on Linux) and runs all tests.
2. **app:** unit tests, then `npm run verify` (every solution passes, every stub compiles and fails cleanly) and the same check on the example set.
3. **build:** `npm run build` and uploads `app/dist`.
4. **deploy:** only for a push to `main`, and only if the three jobs above passed. A broken question therefore never reaches the published page.

To publish a change, merge it to `main`. To check a change first, open a pull request: the checks run but nothing is published.

### Compiling on the published page

GitHub Pages serves static files only, so it cannot run g++. The page compiles on [wandbox.org](https://wandbox.org), a free public service, from your browser. Your answer and the question's tests are sent there when you press Run, and the page asks you once before the first online run. It needs internet and can be slow or rate-limited. If it fails, the output panel says so; switch to the local runner or try again.

## Local server (real g++)

1. Install Node 22 or newer and MinGW g++ (`C:\msys64\mingw64\bin`; set `MINGW_BIN` if it lives elsewhere).
2. Run `app/start.ps1` from PowerShell. It runs `npm install` and `npm run build` if needed, opens http://localhost:5270 and starts the server.
3. In the app, the gear button should show **Local g++** and the g++ version. If not, the page was not opened from the local server.

Press `Ctrl+C` in the terminal to stop it. After changing `app/src`, run `app/start.ps1 -Rebuild`. After changing a question file, refresh the page: the server rebuilds the catalog on every load.

## Developing the app

- `cd app`, then `npm run dev` for hot reload on http://localhost:5173. Compile requests are forwarded to `npm run serve` (start it in a second terminal), so the local runner works in dev too. Run `npm run catalog` first to create `public/catalog.json`.
- `npm test` runs the unit tests; `npm run verify` runs the full compile check (about 3 minutes for 87 questions).

## Environment variables

| Variable | Used by | Default |
| --- | --- | --- |
| `PORT` | local server | `5270` |
| `MINGW_BIN` | local runner | `C:\msys64\mingw64\bin` |
| `RUN_TIMEOUT_MS` | local runner | `10000` |
| `CATALOG_SOURCE=worktree` | catalog builder | read questions from git `HEAD` |
| `SETS_DIR` | catalog builder, verify | `sets/` |
