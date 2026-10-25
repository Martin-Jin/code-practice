# Using the app

The app is a practice interface for coding questions, modelled on a CodeRunner quiz: you read a task, write an answer in an editor, press Run, and see which tests pass. Question sets are folders under `sets/`, so more sets can be added later (see [question-format.md](question-format.md)).

## Where to open it

- **Published page (nothing to install):** the GitHub Pages site for this repo. It compiles your code on wandbox.org. See [deploying.md](deploying.md) for the address and what that means.
- **Local server (real g++, offline):** run `app/start.ps1` from PowerShell. It opens http://localhost:5270 and compiles with your MinGW g++. First run installs the packages and builds the app, which takes about a minute.

Both versions look and behave the same. The only difference is the **runner** (where your code is compiled). Switch it with the gear button, top right. Local g++ appears there only when the local server is running.

## Pages

- **Dashboard** (`#/`): every question set, every run in progress, and finished runs. Runs keep their progress until you reset or abandon them. You can have several going at once, including several in the same set.
- **Set page**: choose a test mode and start a run. Also lists your runs in that set and links to its stats.
- **Run**: the workspace described below.
- **Stats**: counters per question for a set (attempts, correct, wrong, compile errors, crashes, pass rate). An *attempt* is one press of Run, so it counts compiles. Stats are lifetime counters: resetting or abandoning a run never changes them. Use **Reset stats** on the stats page to clear them.

## Test modes

- **Practice test:** a short mixed paper. For MECHENG270 it is 7 questions: 2 from complex numbers, DFT and FFT, plus 1 each from 5 topics chosen at random. The recipe lives in `set.json` (`practice`), so each set defines its own.
- **Random:** a random number of questions (you choose how many) from the assessed topics. Tick the boxes to also draw from quick revision or extra practice.
- **By topic:** every question in the topics you tick.
- **All questions:** the whole set. Quick revision and extra practice are off unless you tick them.

## Inside a run

- **Question list (left):** grouped by topic under headings you can collapse. The icon shows the state: empty circle (not started), pencil (edited, not run), red cross (tests failing), amber triangle (does not compile), green tick (passed).
- **Task and editor:** the task text sits beside the editor so you can read it while you type. **Task** (or `Alt+T`, or the arrow on the task pane) collapses it to a thin rail; click the rail or press `Alt+T` to peek at it over the editor, and `Esc` or the arrow to close the peek. The **Provided code** tab shows the code your answer is added to. `Alt+B` hides the question list.
- **Output panel:** **Output** (or `Alt+O`, or the arrow on the output bar) hides the panel so the editor gets the whole height. The bar stays visible with the last result ("All passed", "3/5 passed", "Compile error"); click a tab on it to reopen. Pressing Run opens it again.
- **Editor:** the editor from VS Code, set up from this repo's `.vscode/settings.json`: no pop-up suggestions, brackets and quotes close themselves. Press `Ctrl+Space` to list names from your code and the provided code (variables, functions, classes, keywords), then `Tab` to accept. The editor starts with the starter code, never with your earlier answers.
- **Run** (`Ctrl+Enter`): compiles your answer and runs the tests. Your answer is put in the question file between the answer markers, so line numbers in compiler messages match the question file.
- **Output:**
  - **Results:** a banner (passed, failed, compile error, crash, timeout) and one card per test. A failing test shows the message exactly as the framework printed it, plus a highlighted comparison of expected and got. Printed output is compared line by line (as CodeRunner does, ignoring trailing spaces).
  - **Compiler:** the g++ output unchanged. Locations that point into your answer are clickable and also mark the line in the editor.
  - **Raw output:** everything the program printed, and its exit code.
- **Run options (top right):**
  - *Rename run*.
  - *Reset progress*: every question goes back to the starter code; the selection stays.
  - *New questions (re-draw)*: a fresh random selection (Practice test and Random only).
  - *Change test mode*: pick a different mode and options.
  - *Abandon run*: deletes the run.
- **Finish screen:** when every question passes, a summary shows attempts, wrong runs, compile errors and time. **Review my answers** returns to the editor; **Results** on the dashboard reopens it.

## Where your data lives

Runs, drafts and stats are saved in this browser (IndexedDB), automatically as you type. They are not sent anywhere and do not sync between browsers, computers or between the published page and the local server (different addresses count as different sites). Clearing site data deletes them.

## Limits

- The runner stops a program after 10 s (local) or at wandbox.org's own limit (online). That is reported as a timeout, with the test that was running.
- Hidden tests are hidden only in the sense of CodeRunner: their *results* appear after a run. Their source is in the question files and the published catalog, because the repo is public.
