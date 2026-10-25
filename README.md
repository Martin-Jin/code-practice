# Code Practice

A web interface for practising coding questions, with test modes, an in-browser editor, test output with highlighted diffs, saved progress and stats. Questions come in **sets**: folders under `sets/` that follow a fixed format, so adding more questions or a whole new set means adding files, not changing the app.

It also holds practice questions that are not code (PDFs of worked problems, quiz screenshots, questions you type or paste), kept in folders on your own computer and never committed. You can search them, answer and check them, mark them difficult, practise in sessions, and back up all your progress; see [docs/question-set-format.md](docs/question-set-format.md) for how to add them.

The first set, [`mecheng270`](sets/mecheng270/INDEX.md), has 87 CodeRunner-style C++ questions for MECHENG270 Part 2 (linked lists, stacks and queues, trees, recursion, searching, complex numbers, DFT/FFT) plus one big revision question.

## Open it

- **Published page:** `https://martin-jin.github.io/code-practice/`. Nothing to install. It compiles on wandbox.org.
- **Locally, with your own g++:** run `app/start.ps1` in PowerShell. It opens http://localhost:5270.
- **From the command line only:** see [Doing a question without the app](#doing-a-question-without-the-app).

[docs/using-the-app.md](docs/using-the-app.md) explains the modes, the editor, the output and where your progress is saved. [docs/deploying.md](docs/deploying.md) explains how the page is published.

## What's in the repo

| Folder / file | What it is for |
|---|---|
| [`app/`](docs/architecture.md) | The web app (React, Vite, Monaco) and the small local compile server. |
| `sets/<set-id>/` | A question set: `set.json`, `questions/`, `solutions/`. Add a folder here to add a set. |
| [`sets/mecheng270/INDEX.md`](sets/mecheng270/INDEX.md) | Every MECHENG270 question with title, marks and topic. |
| `framework/` | The small C++ test framework every question uses. You never need to edit it. |
| `templates/example-set/` | A two-question example set. Copy it to start a new set. |
| `app/tools/index-pdf.js` | Reads a practice-questions PDF and writes its `.questions.json` beside it (see [question-set-format.md](docs/question-set-format.md)). |
| `main.cpp`, `CMakeLists.txt` | Command-line build and runner (see below). |
| `.github/workflows/pages.yml` | Checks every question and publishes the app to GitHub Pages. |
| `docs/` | The guides listed below. |

## Docs

| Doc | Open it to |
|---|---|
| [docs/using-the-app.md](docs/using-the-app.md) | Learn the app: modes, runs, editor shortcuts, output, stats, where data is stored, backup and restore. |
| [docs/question-format.md](docs/question-format.md) | Add a question or a whole set, and check it. Describes the file layout the app depends on. |
| [docs/question-set-format.md](docs/question-set-format.md) | Add practice PDFs or quiz screenshots from your own folders: the `.questions.json` manifest and how sets are found. |
| [docs/architecture.md](docs/architecture.md) | Change the app: how a Run works, why it is built this way, limits. |
| [docs/deploying.md](docs/deploying.md) | Publish to GitHub Pages, run the local server, develop the app, see CI. |
| [sets/mecheng270/INDEX.md](sets/mecheng270/INDEX.md) | Pick a MECHENG270 question by topic and marks. |

## Doing a question without the app

You need a C++17 compiler (MinGW g++ or clang++) and CMake 3.16 or newer. In PowerShell, add MinGW to the path first: `$env:Path = "C:\msys64\mingw64\bin;" + $env:Path`.

1. Open `main.cpp` and set `constexpr int kQuestion = 7;` (`0` runs every question and prints a summary).
2. Open the question file in `sets/mecheng270/questions/` (extras are in `sets/mecheng270/extra_questions/questions/`), read the task, and write your answer between the `YOUR ANSWER STARTS HERE` and `YOUR ANSWER ENDS HERE` markers. Do not edit the provided code or the tests.
3. Build and run, with the VS Code build task (`Ctrl+Shift+B`) and the debug launch, or in PowerShell:

   ```powershell
   cmake -S . -B build -G Ninja
   cmake --build build
   ./build/practice.exe
   ```

   Run the configure step again after adding a question file, so CMake picks it up. Add `-DSET_NAME=<id>` to build another set from `sets/`.
4. A passing question prints `-> ALL PASSED (7/7 tests passed)`. A failing test shows what it expected and what your code produced. The name of each test is printed before it runs, so a crash shows which test caused it.

Printed output is compared ignoring trailing whitespace, as CodeRunner does. Some tasks say "must use recursion"; the tests cannot enforce that, so check it yourself.

### Check the reference solutions

Configure with `-DUSE_SOLUTIONS=ON` (in a separate folder such as `build_sol`) to build the solutions instead of your answers. To run every question with its solution (all 611 tests should pass), without touching `main.cpp`:

```powershell
cmake -S . -B build_all -G Ninja -DUSE_SOLUTIONS=ON -DRUN_ALL=ON
cmake --build build_all
./build_all/practice.exe
```

## Troubleshooting

- **`g++` or `cmake` not found.** Add `C:\msys64\mingw64\bin` to `PATH` (see above).
- **CMake picks the wrong generator.** Delete the `build` folder and configure again with `-G Ninja` (or `-G "MinGW Makefiles"`).
- **A new question file is not picked up.** Re-run the configure step; CMake finds files when it configures.
- **The app says Local g++ is unavailable.** Open the page from `app/start.ps1`, not from a file or the published site.
