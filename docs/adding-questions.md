# Getting started and adding questions

How to set the project up after cloning it, and how to add more questions: more coding questions to an existing set, a whole new coding set, or practice questions that are not code (PDFs, screenshots, typed questions). [question-format.md](question-format.md) is the reference for the coding question layout; this page is the walk-through.

## 1. After cloning

You need:

- **Node 22 or newer** (the project is developed on Node 24).
- **A C++ compiler, only to run or check coding questions on your own machine:** MinGW g++ with CMake and Ninja (on Windows, `C:\msys64\mingw64\bin`), or any g++ 13 or newer. The published page compiles on wandbox.org instead, so none of this is needed just to use the app.

Then, from the repo folder:

1. `cd app`, then `npm install`.
2. Start the app: run `app/start.ps1` in PowerShell (it builds the app and opens http://localhost:5270 with your own g++), or `npm run dev` for hot reload (see [deploying.md](deploying.md)).
3. Check the install: `npm test` should pass. `npm run verify` (about 3 minutes, needs g++) compiles every coding question's solution and starter code.

Your own practice questions (PDFs and screenshots) are never part of the repo. They stay in folders on your computer and are added from the app's dashboard; see [section 4](#4-add-practice-questions-that-are-not-code).

## 2. Add a coding question to an existing set

Questions are C++ files in `sets/<set-id>/questions/`. Work on a branch, and from PowerShell with MinGW on the path (`$env:Path = "C:\msys64\mingw64\bin;" + $env:Path`).

1. **Pick the next free number** in the set (two questions in a set cannot share one). Call it `NN` below.
2. **Copy a question file** that is close to what you want, such as [`templates/example-set/questions/q01_sum_array.cpp`](../templates/example-set/questions/q01_sum_array.cpp), to `sets/<set-id>/questions/qNN_<short_name>.cpp`.
3. **Edit it.** Keep the layout; change these:
   - line 2: `// Question NN  (M marks)  -  Title`, and the `// Topic:` line;
   - the task text, which ends at the `// ====` line;
   - `namespace qNN { using namespace std; ... }`: every question needs its own, because all questions of a set link into one program;
   - the provided code (declarations the student gets), then between the `YOUR ANSWER STARTS HERE` and `ENDS HERE` markers the **stub**: it must compile, return a harmless default and fail the tests (no crash, no endless loop);
   - at least **three visible** tests (`tf::Test`) and **two hidden** ones (`tf::HiddenTest`), including edge cases;
   - the last line outside the namespace: `REGISTER_QUESTION(NN, "Title", qNN::RunQNN);`.
4. **Write the solution** in `sets/<set-id>/solutions/qNN.inc`: only the code that replaces the stub.
5. **Add the number to a topic** in `sets/<set-id>/set.json` (`categories`), and a row to the set's `INDEX.md` if it has one. A question missing from every topic still works, but shows under "Uncategorised".
6. **Check it:**
   - `cmake -S . -B build_all -G Ninja -DUSE_SOLUTIONS=ON -DRUN_ALL=ON -DSET_NAME=<set-id>`, `cmake --build build_all`, `./build_all/practice.exe`: every test must pass with your solution. Re-run the configure step after adding a file, so CMake finds it.
   - `cd app`, then `node tools/verify.js NN`: the solution passes and the starter code compiles and fails cleanly, through the same path the app uses. It also names the file if a marker is missing or misplaced.
7. **See it in the app:** refresh the page if you started it with `app/start.ps1` (the catalog is rebuilt on every load).
8. Commit on your branch. Merging to `main` and pushing publishes the published page, which runs the same checks in CI.

To try the question yourself at the command line instead of in the app, set `constexpr int kQuestion = NN;` in `main.cpp` and build as in the [README](../README.md#doing-a-question-without-the-app).

## 3. Add a whole coding set

1. Copy `templates/example-set/` to `sets/<new-id>/` and set `"id"` in `set.json` to the folder name.
2. Replace its questions as in section 2, and edit `name`, `description`, the topics (`categories`) and the `practice` recipe (which questions the Practice test draws).
3. Check with `-DSET_NAME=<new-id>` as above, and `cd app` then `npm run verify`. The set appears on the dashboard after a refresh (local server) or the next `npm run build`.

The full list of `set.json` fields is in [question-format.md](question-format.md#setjson).

## 4. Add practice questions that are not code

PDFs of worked problems, screenshots of quiz questions and questions you type live in your own folders, not in the repo.

- **A practice PDF.** It must be laid out a certain way, because the app finds the questions from the layout (no AI). Build it with the agent prompt in [practice-pdf-prompt.md](practice-pdf-prompt.md), or lay it out by hand to the same rules. Then on the dashboard press **Add or update a folder…**, choose its folder, press **Find the questions** on the PDF, tick it and **Import**. Or run `node tools/index-pdf.js "<file.pdf>"` in `app/` to save a `.questions.json` beside the PDF, then import the folder.
- **A screenshot or a question you write:** press **Add a question…** on the dashboard and paste the screenshot. Or have an AI agent add it to a `.questions.json` file, pointing it at [question-set-format.md](question-set-format.md) for the rules.
- **Answers, difficulty, sessions and backup:** see [using-the-app.md](using-the-app.md#your-own-question-sets). The manifest format is in [question-set-format.md](question-set-format.md).
