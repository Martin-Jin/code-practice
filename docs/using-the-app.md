# Using the app

The app is a practice interface for coding questions, modelled on a CodeRunner quiz: you read a task, write an answer in an editor, press Run, and see which tests pass. Question sets are folders under `sets/`, so more sets can be added later (see [question-format.md](question-format.md)).

## Where to open it

- **Published page (nothing to install):** the GitHub Pages site for this repo. It compiles your code on wandbox.org. See [deploying.md](deploying.md) for the address and what that means.
- **Local server (real g++, offline):** run `app/start.ps1` from PowerShell. It opens http://localhost:5270 and compiles with your MinGW g++. First run installs the packages and builds the app, which takes about a minute.

Both versions look and behave the same. The only difference is the **runner** (where your code is compiled). Switch it in Settings (the gear button on the dashboard, or **Settings…** in the cog menu inside a run). Local g++ appears there only when the local server is running.

## Help and shortcuts

The **?** button in the top bar of the dashboard, set and stats pages lists every keyboard shortcut. Inside a run, use **Keyboard shortcuts** in the cog menu.

The shortcuts can be changed. Click one in that list, then press the new keys (`Esc` cancels); **Reset** puts one default back and **Reset all** puts them all back. The choices are saved in this browser.

- A combination must include `Ctrl` or `Alt` (or be a function key, or `Esc` for going back), so ordinary typing is not affected.
- One already used by another action is refused, and you are told which.
- One that a browser also uses (`Ctrl+T` opens a tab, `Ctrl+W` closes it, `Ctrl+1` to `Ctrl+9` switch tabs and so on) is allowed only after a warning, because the browser may act on it first or as well.
- `Ctrl+S` does nothing in the app (it saves by itself), so a VS Code habit never opens the browser's save dialog.
- Defaults: run `Ctrl+Shift+Enter`, back to the dashboard `Esc`, task `Alt+T`, questions `Alt+Q`, output `Alt+O`, search `Ctrl+P`, name suggestions `Ctrl+Space`, format `Alt+Shift+F`. `Esc` only leaves the run when nothing else wants it: it first closes menus, dialogs, the suggestion list and a text selection.

## Theme

The sun, moon and half-circle button (top right of the dashboard, or **Theme** in the cog menu inside a run) cycles **Auto**, **Light** and **Dark**. Auto follows your system and changes with it; Light and Dark stay fixed. The choice is remembered in this browser.

## Search

- **In a run:** `Ctrl+P` (or the search box at the top of the question list) opens a fuzzy search over that run's questions. Type a few letters of the title, number or topic (for example `bst rem` finds Binary search tree: Remove()), use the arrow keys, and press Enter to jump to it. The editor keeps its focus afterwards.
- **On the dashboard, set and stats pages:** `Ctrl+P` or `/` (or the search box in the top bar) searches question sets and every question in them. Choosing a set opens it; choosing a question starts a one-question run.

## Pages

- **Dashboard** (`#/`): every question set, every run in progress, and finished runs. Runs keep their progress until you reset or abandon them. You can have several going at once, including several in the same set.
- **Set page**: choose a test mode and start a run. Also lists your runs in that set and links to its stats.
- **Library** (on the dashboard): question sets from folders on your computer. See [Your own question sets](#your-own-question-sets).
- **Run**: the workspace described below.
- **Stats**: counters per question for a set (attempts, correct, wrong, compile errors, crashes, pass rate). An *attempt* is one press of Run, so it counts compiles. Stats are lifetime counters: resetting or abandoning a run never changes them. Use **Reset stats** on the stats page to clear them.

## Test modes

- **Practice test:** a short mixed paper. For MECHENG270 it is 7 questions: 2 from complex numbers, DFT and FFT, plus 1 each from 5 topics chosen at random. The recipe lives in `set.json` (`practice`), so each set defines its own.
- **Random:** a random number of questions (you choose how many) from the assessed topics. Tick the boxes to also draw from quick revision or extra practice.
- **By topic:** every question in the topics you tick.
- **All questions:** the whole set. Quick revision and extra practice are off unless you tick them.

## Inside a run

- **Icon strip:** the narrow strip at the far left works like VS Code's activity bar. The door icon exits to the dashboard (progress is kept). Below it, one button per panel: the questions (`Alt+Q`) and the task (`Alt+T`); the lit one is open.
- **Top bar:** one bar for the whole run. On the left, the logo (back to the dashboard), the question number and title, attempts and a Passed badge. On the right, the progress bar, previous and next question, format, and **Run**. The cog at the bottom of the icon strip (in the top bar on a phone) opens a menu with the rest: reset code, suggest-as-you-type on or off, settings, theme, keyboard shortcuts, then the run options (rename, reset progress, new questions, change mode, abandon).
- **Question list:** grouped by topic under headings you can collapse. The icon shows the state: empty circle (not started), pencil (edited, not run), red cross (tests failing), amber triangle (does not compile), green tick (passed).
- **Task and editor:** the task text sits beside the editor so you can read it while you type. The **Task** button in the icon strip (or `Alt+T`, or the arrow on the task pane) hides it so the editor and output get the width; use the same button or key to bring it back. It always sits beside the editor and moves it over rather than covering it. Drag the divider between the task and the editor to resize it, or double-click it to reset. Drag it to the far left to hide the task; the output panel hides the same way when you drag its divider to the bottom. Sizes are saved in this browser and are the same for every question and run. The **Provided code** tab shows the code your answer is added to. The **Question list** button (or `Alt+Q`) hides the question list.
- **Output panel:** `Alt+O` (or the arrow on the output bar) hides the panel so the editor gets the whole height. The bar stays visible with the last result ("All passed", "3/5 passed", "Compile error"); click a tab on it to reopen. Pressing Run opens it again.
- **Editor:** the editor from VS Code, set up from this repo's `.vscode/settings.json`: no pop-up suggestions, brackets and quotes close themselves. Press `Ctrl+Space` to list names from your code and the provided code (variables, functions, classes, keywords); `Enter` or `Tab` accepts one. Ctrl+Space also turns on suggestions as you type, and they stay on in this browser until you switch **Suggest as you type** off in the cog menu (or untick it under **Editor** in Settings). `Alt+Shift+F` (or the format button) tidies the whole answer with clang-format in Google style, the course style; the formatter (about 2.5 MB) is downloaded the first time you use it. The editor starts with the starter code, never with your earlier answers.
- **Run** (`Ctrl+Shift+Enter` by default; plain `Ctrl+Enter` is VS Code's "insert line below"): compiles your answer and runs the tests. Your answer is put in the question file between the answer markers, so line numbers in compiler messages match the question file.
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

## On a phone

Below 820 px wide the run screen shows one panel at a time, chosen from the bar at the bottom: **Questions**, **Task**, **Code** and **Output**. Picking a question opens its Task, and pressing Run in the Code panel jumps to Output (a coloured dot on the tab shows the last result). The dashboard, set and stats pages simply stack into one column.

It works, but a phone is a cramped place to write C++: the on-screen keyboard covers most of the editor and brackets are awkward to reach. Expect to use it for reading tasks, checking results and light edits; use a laptop for real practice. Pane resizing and the keyboard shortcuts are desktop-only.

## Your own question sets

The dashboard's **Your library** section shows question sets that come from your own folders (practice PDFs, quiz screenshots), not from the repo. They must follow [question-set-format.md](question-set-format.md): a `.questions.json` file per set, with its images and PDF beside it.

1. Press **Add or update a folder…** and choose a folder. It works in Firefox, Edge and Chrome. Firefox and Chrome may say they are "uploading" the files; they are only being read on this computer.
2. The app lists the sets it found, with how many questions, the size and whether each is new, changed or up to date. Sets with problems say why, and PDFs without a manifest are listed as not imported.
3. Tick the sets and press **Import**. They are copied into this browser, so the folder is not needed again until it changes. Your folder is never modified.
4. **Browse** shows a set's questions by section; click a title to open it. **Remove** deletes the copy in this browser (not your folder).
   - A PDF with no manifest beside it shows **Find the questions**: the app reads the PDF and lists the questions it finds, with a warning if the count does not match the cover. It takes about half a minute for a 250-page PDF.
5. After you change files in the folder, choose it again: only changed sets and files are copied.

A question opens with its wording (typed text with maths, an image, or the page region from the PDF), an answer box for each part, and a panel beside it.

- **Number parts** take a typed number (`1,234.5`, `0,297` and `1e3` all work). **Check answer** (or Enter in a box) marks it right when it is within 1% of the answer, or within half a unit of the decimal places the question asks for, if that allows more. A wrong answer shows the right one. **Multiple choice** needs exactly the right options. **Self-marked** parts have **I got it** and **Not quite** buttons: read the solution, then mark yourself.
- A check counts as an attempt only when every part has an answer. The question shows how many times you were right or not right, and the set page shows it in the list.
- **Mark as difficult** (or `D`) flags a question. The flag is saved with your progress and shows in the set's list.
- **Solution** (or `S`) shows the worked solution: PDF pages with the blank space trimmed, images, or typed text. `←` and `→` move to the previous and next question.
- **Answer key** is where you add or correct what the app checks against: parts (number with unit, decimal places and accepted error; multiple choice with its options; self-marked), marks, tags, and for a PDF question the top and bottom of the crop. It is saved in this browser as your own correction (the imported file is not changed), is part of a backup, and **Revert to the imported version** removes it. A question the PDF indexer found starts with one self-marked part, so this is where to add the numeric answer from the solution. Questions of your library are found by the search box (`Ctrl+P` or `/`) through their title, section, source, tags and wording.

The first import asks the browser to protect the storage from automatic clearing (Firefox shows a prompt). The copies are not part of a backup; add the folder again to bring them back.

## Where your data lives

Runs, drafts, stats, your answers to library questions, difficult flags and your answer keys are saved in this browser (IndexedDB), automatically as you type. They are not sent anywhere and do not sync between browsers, computers or between the published page and the local server (different addresses count as different sites). Clearing site data deletes them.

In your browser's "clear browsing data" window, **cached images and files** is safe to clear. **Cookies and site data** deletes your progress, as does a "clear on close" setting or a private window.

### Back up and restore

**Settings > Backup** keeps a copy outside the browser.

- **Back up now** downloads one file, `code-practice-backup-YYYY-MM-DD.json`. It holds every run, draft and stat from every question set, plus your settings (theme, runner, shortcuts, pane sizes). Question sets themselves are not in it, because they come with the app.
- **Restore from a backup…** reads such a file and shows what is in it before changing anything. Choose how:
  - **Merge** (the default) keeps what is in this browser and adds what the file has. Where both have the same run or question, the newer one wins, and counters are never added together, so restoring the same file twice changes nothing.
  - **Replace everything** erases the runs, stats and settings here first. Use it on a clean machine.
- A restore reloads the page. If the browser cannot save the data, the restore stops with nothing changed.
- The dashboard shows a reminder once you have made 20 or more attempts since the last backup and the last backup is over a week old (or there is none). Abandoning a run or resetting stats mentions it too when your backup is out of date.
- Use the file to move progress between browsers, between the published page and the local server, or to a new computer.

## Limits

- The runner stops a program after 10 s (local) or at wandbox.org's own limit (online). That is reported as a timeout, with the test that was running.
- Hidden tests are hidden only in the sense of CodeRunner: their *results* appear after a run. Their source is in the question files and the published catalog, because the repo is public.
