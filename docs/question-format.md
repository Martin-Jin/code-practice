# Question format

Questions are plain C++ files in a fixed layout. The same file is read by three things: the command-line build (CMake), the web app (which cuts it into task, provided code, starter code and tests), and CI. So the layout is a contract. Follow it exactly and a new question or set shows up everywhere with no other code change.

To see a complete working example, read [`templates/example-set/`](../templates/example-set/). Copy it to start a new set.

## A set is a folder

```
sets/<set-id>/
  set.json              manifest: name, topics, practice-test recipe
  questions/qNN_<slug>.cpp   one file per question: task, provided code, answer stub, tests
  solutions/qNN.inc          reference solution: only the code that replaces the stub
  extra_questions/...        optional further folders (listed in set.json)
  INDEX.md                   optional human-readable table of the questions
```

The folder name must equal `"id"` in `set.json`. Question numbers are unique inside a set (two sets may reuse a number).

## set.json

| Field | Meaning |
| --- | --- |
| `id`, `name`, `description` | Shown on the dashboard. `id` is the folder name. |
| `language` | `"cpp"`. The only language supported so far. |
| `questionDirs` | Folders to read, each `{ "dir": "questions", "solutions": "solutions" }`, relative to the set folder. Optional; this is the default. |
| `groups` | Heading text for each group of topics, in display order. Groups named `core` are always drawn from; `revision` and `extra` are optional extras the student ticks. |
| `categories` | The topics: `{ "id", "name", "group", "questions": [numbers] }`. Order here is the order in the question list. Every question number must be in exactly one category. A question missing from every category still appears, under "Uncategorised". |
| `practice` | The Practice test recipe: `fixed` (`{ "category", "count" }` entries always included) and `pick` (`{ "count", "from": [category ids] }`, one question from each of `count` randomly chosen categories). |

## A question file

Every `qNN_<slug>.cpp` has these parts, in this order:

1. **Header comment.** Line 2 must read `// Question N  (M marks)  -  Title`. Then `// Topic: ...`, then the task text in the style of a real CodeRunner question. Optionally add `// Restrict: no-loops, recursive` straight after the topic (see below). End the comment with a line of `=` characters. The text between the topic and the closing line is shown to the student; the opening "Requirements for ..." line is dropped, and wrapped lines are re-joined.
2. `#include "framework/test_framework.h"` (plus any standard headers *before* it; they are shown in the provided code).
3. `namespace qNN { using namespace std; ... }`. Required: all questions of a set link into one program, so a unique namespace stops two `Node` classes clashing.
4. A line matching `// ---- PROVIDED CODE (do not edit) ----`, then the code the student does not write. The Provided code tab shows everything up to the answer marker.
5. `// ======= YOUR ANSWER STARTS HERE =======`, then exactly one `#ifndef USE_SOLUTIONS ... #else #include "../solutions/qNN.inc" #endif` block, then `// ======= YOUR ANSWER ENDS HERE =======`. The code between `#ifndef` and `#else` is the **starter code**: a stub that compiles, returns a harmless default (no undefined behaviour, no infinite loop) and fails the tests. "Fix the bug" questions put the buggy code there.
6. `void RunQNN()` containing the tests (below), then `}  // namespace qNN`.
7. `REGISTER_QUESTION(N, "Title", qNN::RunQNN);` at the bottom, outside the namespace.

Aim for at least 3 visible and 2 hidden tests, including edge cases (empty, single element, out of range). Tests must not crash or hang on a wrong answer where avoidable.

### Writing tests

| Call | Use |
| --- | --- |
| `tf::Test("name", [] { ... })` | A visible test. |
| `tf::HiddenTest("name", [] { ... })` | A hidden test (only the label differs). |
| `tf::ExpectEq(actual, expected, "what")` | Compare any two values that print with `<<`. |
| `tf::ExpectNear(actual, expected, "what", tol)` | Doubles within a tolerance. |
| `tf::ExpectComplexNear(actual, expected, "what", tol)` | Complex numbers within a tolerance. |
| `tf::ExpectOutput("expected text", [] { ... })` | What the body prints to `cout`, ignoring trailing whitespace. |
| `tf::ExpectTrue(cond, "what")`, `tf::Fail("message")` | Anything else. |

The framework prints one `PASS` or `FAIL` line per test with the failure messages beneath. When the app compiles the program it also turns on a second channel (see [architecture.md](architecture.md)) so it can draw diffs.

## The solution file

`solutions/qNN.inc` contains only the code that replaces the stub, nothing else. It is `#include`d in place of the stub when you build with `USE_SOLUTIONS`, and the verify tool pastes it into the editor path to prove every test can pass.

## Add a question

1. Copy `qNN_*.cpp` from an existing question (or the template) into the set's `questions/`. Rename it with the next free number.
2. Change the number, title, topic, task text, namespace, tests and `REGISTER_QUESTION`.
3. Write `solutions/qNN.inc`.
4. Add the number to a category in `set.json`, and a row to the set's `INDEX.md` if it has one.
5. Run the checks (below).

## Add a set

1. Copy `templates/example-set/` to `sets/<new-id>/` and set `"id"` to the folder name.
2. Replace the questions as above and edit the categories and the practice recipe.
3. Run the checks. The set appears on the dashboard after the next `npm run build` (the local server rebuilds the catalog on every page load, so a refresh is enough there).

## Check your work

From the repo root, in PowerShell with MinGW on the path (`$env:Path = "C:\msys64\mingw64\bin;" + $env:Path`):

1. **Command line:** `cmake -S . -B build_all -G Ninja -DUSE_SOLUTIONS=ON -DRUN_ALL=ON -DSET_NAME=<set-id>`, then `cmake --build build_all`, then `./build_all/practice.exe`. Every test must pass.
2. **App pipeline:** `cd app`, then `npm run verify`. For every question it checks that the solution passes, and that the starter code compiles and fails without hanging or crashing. It also catches layout mistakes (a missing marker, two `#ifndef` blocks) with a message naming the file.
3. **A sample set:** `SETS_DIR=../templates npm run verify` checks the example set instead (use `$env:SETS_DIR` in PowerShell).

## What the app relies on

If one of these changes, update `app/server/catalog.js` and `app/shared/program.js` in the same change:

- Line 2 of the header, the `// Topic:` line and the closing `// ====` line.
- The `PROVIDED CODE` line, the `YOUR ANSWER STARTS HERE` line, a single `#ifndef USE_SOLUTIONS` and its `#else`.
- The include line `#include "framework/test_framework.h"` before the answer region (the app replaces it with the framework source).
- Test names written as `tf::Test(` and `tf::HiddenTest(` (counted for the visible and hidden totals).

## Restrictions

A question that limits how the answer is written says so in a `// Restrict:` line after the topic, and the app checks the answer's source after every run (`app/shared/restrictions.js`). Breaking a rule fails the question however the tests went, and the broken rule is listed first in the results. Comments and string literals are ignored.

| Word | Meaning |
| --- | --- |
| `no-loops` | No `for`, `while` or `do` anywhere in the answer. |
| `recursive` | At least one function in the answer calls itself. |
| `no-recursion` | No function in the answer calls itself. |

The line is not shown in the task text; the task chips show it. Only the app checks it: the command-line runner does not. Every reference solution must satisfy its own restrictions (`npm run verify` checks).
