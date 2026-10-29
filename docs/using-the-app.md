# Using the app

Can'tviz quizzes is a practice interface for coding questions, modelled on a CodeRunner quiz: you read a task, write an answer in an editor, press Run, and see which tests pass. Question sets are folders under `sets/`, so more sets can be added later (see [question-format.md](question-format.md)).

It also holds your own practice questions that are not code: PDFs, quiz screenshots and questions you make yourself. They are described under [Your own question sets](#your-own-question-sets), and everything you do in the app can be saved with [Back up and restore](#back-up-and-restore).

## Where to open it

- **Published page (nothing to install):** the GitHub Pages site for this repo. It compiles your code on wandbox.org. See [deploying.md](deploying.md) for the address and what that means.
- **Local server (real g++, offline):** run `app/start.ps1` from PowerShell. It opens http://localhost:5270 and compiles with your MinGW g++. First run installs the packages and builds the app, which takes about a minute.

Both versions look and behave the same. The only difference is the **runner** (where your code is compiled). Switch it in Settings (the gear button on the dashboard, or **Settings…** in the cog menu inside a run). Local g++ appears there only when the local server is running.

## Tutorial and what's new

A welcome window (about two-thirds of the screen, in the middle) has two tabs: **Tutorial** (how to use the app, how to import sets, how to have an agent format a practice PDF and how coding sets are added, which is by file in the project for now) and **What's new** (the five latest changes, each with its version number).

- It opens by itself the first time you visit, on the tutorial, and again after each update, on **What's new**. It is shown once per version, so closing it keeps it away until the next update.
- Reopen it any time from the three-dot menu at the top right (**Tutorial and what's new**), from **Settings > Help**, or from the command palette (Alt+K, then **Open the tutorial**).
- The tutorial opens with an index (part of the page), has a search above it (Ctrl+F while it is showing searches the guide, Enter for the next match) and a column of dots at the right edge, one per section. The section you are reading shows its name beside its dot for a moment, then it fades until you reach another section. Clicking an index entry or a dot scrolls smoothly to that section.
- Four sections have an animated walkthrough (importing a folder, the PDF agent, formula sheets for several sets, exporting chosen sets) with Pause and Replay. The buttons inside them work: clicking one jumps to the step that presses it, and **Copy the prompt** really copies the agent prompt. The **Format a PDF with an agent** section also has the whole prompt behind a **Copy the prompt** button: paste it into an AI agent, which asks you what material you have, builds the PDF in the layout the app reads, records answer keys and walks you through importing it (the text is `docs/practice-pdf-agent-prompt.md`). They run only while on screen and stay still for anyone with reduced motion turned on.
- Versions count pushes: `1.00` was the first. The list and the number are in `app/shared/changelog.js`; the tutorial text is in `app/src/components/Welcome.jsx`, its pictures in `app/public/tutorial/` and its animations in `app/src/components/Demo.jsx`.

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

- **Dashboard** (`#/`): a banner with a greeting that changes each visit (and a button to resume your latest session), then every run in progress and finished runs. The question sets are on their own tab, **Question sets** (`#/sets`). Runs keep their progress until you reset or abandon them. You can have several going at once, including several in the same set.
- **Set page**: choose a test mode and start a run. Also lists your runs in that set and links to its stats.
- **Library** (on the dashboard): question sets from folders on your computer. See [Your own question sets](#your-own-question-sets).
- **Run**: the workspace described below.
- **Stats**: counters per question for a set (attempts, correct, wrong, compile errors, crashes, pass rate). An *attempt* is one press of Run, so it counts compiles. Stats are lifetime counters: resetting or abandoning a run never changes them. Use **Reset stats** on the stats page to clear them.

## Drawing the questions you struggle with more often

**Settings > Practice > Draw questions I struggle with more often** (off by default) changes how random picks are made. It applies to the C++ practice test and Random mode, and to Random sessions in a library set. It is a weighted draw, not a filter: every question can still come up.

- A C++ question counts as troublesome when many of its runs did not pass (a compile error counts half). The share is smoothed, so one failed run is not a verdict, and halved once your latest run passed.
- A library question counts as troublesome when you marked it difficult (worth 0.7 on its own) or many of its checks were not right.
- A question with the most trouble is drawn five times as often as one with none; the constants are in `app/shared/weights.js`.

## Test modes

- **Practice test:** a short mixed paper. For a set with a recipe it is a fixed few questions plus one from each of some topics chosen at random (the sample set's is one array question and one other). The recipe lives in `set.json` (`practice`), so each set defines its own.
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

The **Question sets** tab shows the coding sets, then **Your library**: question sets that come from your own folders (practice PDFs, quiz screenshots), not from the repo. They must follow [question-set-format.md](question-set-format.md): a `.questions.json` file per set, with its images and PDF beside it. Each set is a tile; click it to open it, where **Browse**, **Stats**, **Add a question**, **Formula sheets** and **Remove** are.

**Sample content.** A new browser starts with a **Sample practice quiz** in its library (answer keys with units, a multiple-answer choice, self-marked parts, diagrams, notes and a formula sheet) so every feature can be tried on made-up questions, and the app ships one small **Sample coding quiz**. The quiz is imported once per browser (never into one that already has sets, and not again after you delete it). Delete any set with Alt+K, **Delete question set**, then type its name; it asks first.

Press **How to add questions** under **Your library** for a short guide to everything below (and [adding-questions.md](adding-questions.md) for the full one).

1. Press the round **+** button at the bottom right of **Question sets**, then **Add or update a folder of sets or PDFs** (hover a button to see what it does), and choose a folder. It works in Firefox, Edge and Chrome. Firefox and Chrome may say they are "uploading" the files; they are only being read on this computer.
2. The app lists the sets it found, with how many questions, the size and whether each is new, changed or up to date. Sets with problems say why. A PDF with no manifest beside it is read straight away, one at a time (about half a minute for a 250-page PDF), and listed as a set with a warning if the question count does not match the cover.
3. Tick the sets and press **Import**. They are copied into this browser, so the folder is not needed again until it changes. Your folder is never modified.
4. Click a set's tile to open it and **Browse** its questions by section; click a title to open one. **Remove from this browser** deletes the copy in this browser (not your folder).
5. After you change files in the folder, choose it again: only changed sets and files are copied.
5b. **Choosing several sets.** On **Question sets**, press **Select**, then press and drag over tiles to tick them all, or click one and shift-click another to tick the whole range; **Move** then moves them together. The formula-sheet and export dialogs work the same way on their lists, which stay empty until you type in the search box (the sets you choose stay visible below as chips you can remove).
6. The **+** button also has **Add a formula sheet to several sets** (choose the file, search and tick the sets; each gets its own copy) and **Export chosen sets** (search and tick sets, then download one zip with their PDFs, images and formula sheets, and no progress). On a set's page, **Edit this set > Formula sheets** lists its sheets so you can remove any. Details: [question-set-format.md](question-set-format.md#formula-sheets).

### Making your own questions

The **+** button's **Add a question from a screenshot** (also **Add a question** on a set's page, or Alt+K) makes a question from a screenshot, with no folder involved.

1. Paste a screenshot with `Ctrl+V` (or drop an image, or press **Choose an image**). Drag a box over the part to keep, then **Keep the selection** (or **Keep the whole image**). Images are scaled to at most 1400 px wide.
2. Give it a title in the form `Topic - what is asked` (search finds questions by it), a section, a source and optionally marks, tags and typed wording (maths between `$` signs).
3. Add the parts to answer: a number with its unit, multiple choice, or self-marked. Add a solution image or text if you have one.
4. **Save question** puts it in **My questions**, a set of its own on the dashboard that behaves like any other (practice sessions, answers, difficult flag, search). Its questions and images are kept in this browser and are part of a backup (unlike sets copied from a folder, there is no folder to get them back from). **Delete** on a question in the list, or **Delete all my questions**, removes them.

Questions can also be added to a folder's manifest by an AI agent: give it [question-set-format.md](question-set-format.md). A practice PDF must be laid out in a particular way for the app to find its questions: see [practice-pdf-prompt.md](practice-pdf-prompt.md).

### Practising a library set

A set's page (**Browse**) has a **Practise** panel. Choose a mode and press **Start**; the session keeps its list of questions, so you can leave and **Resume** it from the dashboard.

- **All questions**, in the order of the set; **Random** (you choose how many, optionally only from some sections); **By section**; **Marked difficult**; **Not seen yet**; **Not right last time**. A mode with nothing to pick says so instead of starting.
- A strip of numbers along the top shows each question's result in this session (green right, red not right, an orange underline for difficult) and takes you to it. **Finish** appears once you have checked every question that has an answer key (right or not right; a question with no key cannot be checked, so it does not hold the session back) and marks the session finished. It opens a summary with the counts, every question's result, and **Practise the questions not right** to start a retry session.
- Sessions appear on the dashboard beside C++ runs. Abandoning one keeps your answers, results and flags on the questions.

A question opens with its wording (typed text with maths, an image, or the page region from the PDF), an answer box for each part, and a panel beside it.

- **Number parts** take a typed number (`1,234.5`, `0,297` and `1e3` all work). **Check answer** (or Enter in a box) marks it right when it is within 1% of the answer, or within half a unit of the decimal places the question asks for, if that allows more. A wrong answer shows the right one. **Multiple choice** needs exactly the right options. **Self-marked** parts have **I got it** and **Not quite** buttons: read the solution, then mark yourself.
- A check counts as an attempt only when every part has an answer. The question shows how many times you were right or not right, and the set page shows it in the list.
- **Mark as difficult** (or `D`) flags a question. The flag is saved with your progress and shows in the set's list.
- **Solution** (or `S`) shows the worked solution: PDF pages with the blank space trimmed, images, or typed text. `←` and `→` move to the previous and next question.
- **Stats** (on a set's card or its page) shows how you are doing in that set: totals (checks, right, not right, right rate, questions solved, tried but never right, not checked yet, marked difficult), **Worth another go** (the questions you marked difficult or got not right, worst first, each a link), and a row per section with its solved count and right rate. **Reset stats** clears the counts and last results of the set; your typed answers, difficult marks and answer keys are kept. Only checks that count are included (see above), and the stats are part of a backup.
- **Enlarge a figure:** click any question or solution image or PDF crop (or its **Enlarge** button) to open it full window. A click on the figure toggles 200%, **+** and **−** (or the keys) step through 100%, 150%, 200%, 300% and 400%, `0` fits the window, drag to move around when zoomed, and `Esc` or a click outside closes it. PDF crops are redrawn at the new size, so they stay sharp.
- **Answer key** is where you add or correct what the app checks against: parts (number with unit, decimal places and accepted error; multiple choice with its options; self-marked), marks, tags, and for a PDF question the top and bottom of the crop. It is saved in this browser as your own correction (the imported file is not changed), is part of a backup, and **Revert to the imported version** removes it. A question the PDF indexer found starts with one self-marked part, so this is where to add the numeric answer from the solution. Questions of your library are found by the search box (`Ctrl+P` or `/`) through their title, section, source, tags and wording.

The first import asks the browser to protect the storage from automatic clearing (Firefox shows a prompt). The copies are not part of a backup; add the folder again to bring them back.

## Where your data lives

Runs, drafts, stats, your answers to library questions, difficult flags and your answer keys are saved in this browser (IndexedDB), automatically as you type. They are not sent anywhere and do not sync between browsers, computers or between the published page and the local server (different addresses count as different sites). Clearing site data deletes them.

In your browser's "clear browsing data" window, **cached images and files** is safe to clear. **Cookies and site data** deletes your progress, as does a "clear on close" setting or a private window.

### Back up and restore

**Settings > Backup** keeps a copy outside the browser.

- **Back up now** downloads one file, `code-practice-backup-YYYY-MM-DD.json`. It holds every run, draft and stat from every question set, plus this app's own settings (theme, runner, shortcuts, pane sizes). Nothing else in the browser's storage is included, so other pages on the same site (a GitHub Pages address is shared by all your projects) are not part of it.
- **Include my imported sets with their PDFs and images** (a checkbox above those buttons, shown once you have imported sets) makes the backup, or the export below, a `.zip` instead of a small JSON file: the same JSON as `backup.json`, plus every stored PDF, image and formula sheet under `files/`. Restoring it on a computer without those sets recreates them, so the folders need not be added again. A set the computer already has keeps its own copy (and its progress), and only gains questions you added to it. The library is often around 100 MB, so it is off by default. Restore accepts either kind of file.
- **Export my questions to share** downloads `code-practice-questions-YYYY-MM-DD.json` with only the questions you made in the app (and the answer keys on them): no progress, runs, stats, folders or settings. Give it to someone; they open it with **Restore from a backup…**, which only adds the questions to theirs and never replaces anything. Sets imported from a PDF are not in it unless you tick the checkbox above, which adds them and their PDFs (still no progress). To share only some sets, use **Export chosen sets** instead: on the **+** button, or Alt+K then **Export chosen sets** (the palette's **Back up now** exports everything). Course PDFs may not be yours to pass on, so tick it only for material you may share. Question sets themselves are not in it, because they come with the app.
- **Restore from a backup…** reads such a file and shows what is in it before changing anything. Choose how:
  - **Merge** (the default) keeps what is in this browser and adds what the file has. Where both have the same run or question, the newer one wins, and counters are never added together, so restoring the same file twice changes nothing.
  - **Replace everything** erases the runs, stats and settings here first. Use it on a clean machine.
- A restore reloads the page. If the browser cannot save the data, the restore stops with nothing changed.
- The dashboard shows a reminder once you have made 20 or more attempts since the last backup and the last backup is over a week old (or there is none). Abandoning a run or resetting stats mentions it too when your backup is out of date.
- Use the file to move progress between browsers, between the published page and the local server, or to a new computer.

## Limits

- The runner stops a program after 10 s (local) or at wandbox.org's own limit (online). That is reported as a timeout, with the test that was running.
- Hidden tests are hidden only in the sense of CodeRunner: their *results* appear after a run. Their source is in the question files and the published catalog, because the repo is public.

## Folders

## Folders

**Your library** on **Question sets** works like a file explorer: folders and sets sit side by side. **New folder** makes one. Click a folder to open it (an empty one just says so). Drag a set's tile onto a folder tile to file it there; inside a folder, drag a set onto the strip at the top to move it back out. A set's page also has a **Folder** menu, for doing the same without dragging. A set is in one folder at a time. Deleting a folder only deletes the folder: its sets go back to your library with all their questions and stats. Folders are part of a backup.

## Command palette (Alt+K)

Alt+K opens a palette from anywhere (the page behind it dims and blurs). Type to find a command and press Enter. A command that needs more asks for each piece in turn and fills in the best match as you type, so **move a set to a folder** is: `Alt+K`, `move`, Enter, the set's name, Enter, the folder's name, Enter. Typing a folder name that does not exist offers to create it. Enter or Tab picks the highlighted choice, Backspace on an empty box goes back a step, Esc closes.

| Command | What it does |
| --- | --- |
| Add a question | Opens the add-a-question dialog. |
| Upload questions | Opens the folder chooser for sets or PDFs. |
| Move question set to folder | Set, then folder (or "No folder" to move it out). |
| New folder | Asks for a name. |
| Open a question set / Show stats for a question set | Asks for the set (library or coding). |
| Go to the dashboard / question sets | Navigates. |
| Switch theme, Open settings, Keyboard shortcuts, Back up now | As named. |

It is Alt+K rather than Ctrl+K because browsers keep Ctrl+K for their own search box.
