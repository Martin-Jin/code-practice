# Can'tviz quizzes

A practice-question and quiz web app, called **Can'tviz quizzes** in the app itself (the repo and its GitHub address are still `practice-questions`, so existing links keep working). It runs two kinds of question side by side, with search, saved progress, stats and a backup of everything:

- **Coding questions:** C++ questions in CodeRunner style, with test modes, an in-browser editor, test output with highlighted diffs and stats. They come in **sets**: folders under `sets/` that follow a fixed format, so adding more questions or a whole new set means adding files, not changing the app.
- **Your own practice questions:** PDFs of worked problems, quiz screenshots and questions you type or paste. They stay in folders on your own computer and are never committed. You can answer and check them, mark them difficult, practise a set or combine every set in a library folder into one session, and ask for the ones you struggle with to come up more often.

**New here?** [docs/adding-questions.md](docs/adding-questions.md) walks through setting the project up after cloning and adding questions of either kind.

The repo ships one small sample set, [`sample`](sets/sample/INDEX.md): nine original CodeRunner-style C++ questions that show the format (arrays, printing, linked lists, a fix-the-bug question, recursion, complex numbers, strings and one extra). A new browser also starts with a **sample practice quiz** in its library, with answer keys, diagrams and a formula sheet, to show the library features. Put your own sets under `sets/` (a folder there is picked up by the app and the build), or follow [docs/adding-questions.md](docs/adding-questions.md).

## Open it

- **Published page:** `https://martin-jin.github.io/practice-questions/`. Nothing to install. It compiles on wandbox.org.
- **Locally, with your own g++:** run `app/start.ps1` in PowerShell. It opens http://localhost:5270.
- **From the command line only:** see [Doing a question without the app](#doing-a-question-without-the-app).

[docs/using-the-app.md](docs/using-the-app.md) explains the modes, the editor, the output and where your progress is saved. [docs/deploying.md](docs/deploying.md) explains how the page is published.

## What's in the repo

| Folder / file | What it is for |
|---|---|
| [`app/`](docs/architecture.md) | The web app (React, Vite, Monaco) and the small local compile server. |
| `sets/<set-id>/` | A question set: `set.json`, `questions/`, `solutions/`. Add a folder here to add a set. |
| [`sets/sample/INDEX.md`](sets/sample/INDEX.md) | Every question of the sample set with title, marks and topic. |
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
| [docs/adding-questions.md](docs/adding-questions.md) | Set up after cloning, and add more coding questions, a whole coding set, or your own practice questions. Start here. |
| [docs/question-format.md](docs/question-format.md) | Add a question or a whole set, and check it. Describes the file layout the app depends on. |
| [docs/practice-pdf-agent-prompt.md](docs/practice-pdf-agent-prompt.md) | The one prompt to paste into an AI agent: it asks what you want, builds the practice PDF, records answer keys and walks you through importing. Also in the app's tutorial. |
| [docs/practice-pdf-prompt.md](docs/practice-pdf-prompt.md) | The layout a practice PDF must have for the app to find its questions, and an agent prompt that builds one. |
| [docs/editing-a-backup-with-an-agent.md](docs/editing-a-backup-with-an-agent.md) | Whether and how an agent can edit your questions, and the checker for a backup file. |
| [docs/question-set-format.md](docs/question-set-format.md) | Add practice PDFs or quiz screenshots from your own folders: the `.questions.json` manifest and how sets are found. |
| [docs/architecture.md](docs/architecture.md) | Change the app: how a Run works, why it is built this way, limits. |
| [docs/deploying.md](docs/deploying.md) | Publish to GitHub Pages, run the local server, develop the app, see CI. |
| [sets/sample/INDEX.md](sets/sample/INDEX.md) | Pick a question of the sample set by topic and marks. |

## Doing a question without the app

You need a C++17 compiler (MinGW g++ or clang++) and CMake 3.16 or newer. In PowerShell, add MinGW to the path first: `$env:Path = "C:\msys64\mingw64\bin;" + $env:Path`.

1. Open `main.cpp` and set `constexpr int kQuestion = 7;` (`0` runs every question and prints a summary).
2. Open the question file in `sets/sample/questions/` (the extra is in `sets/sample/extra_questions/questions/`), read the task, and write your answer between the `YOUR ANSWER STARTS HERE` and `YOUR ANSWER ENDS HERE` markers. Do not edit the provided code or the tests.
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

## Licence

Released under the [MIT licence](LICENSE): anyone may use, copy and change it.

This is an independent student project. It is not affiliated with or endorsed by Canvas (Instructure) or any university, and it ships only original sample questions. Please don't sue me, Canvas. Course PDFs and other material you add are yours to keep private, and may not be yours to share.

## Selected for XERJ's Corpus Hub

The tutorial animation and readability improvements were selected for inclusion in [XERJ's public Corpus Hub](https://github.com/xerj-org/xerj), an open index of code solutions for coding agents.
