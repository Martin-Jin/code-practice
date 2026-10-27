# Letting an agent edit your questions

Short answer: yes, but not by handing it the whole backup file.

## Why not the backup

A backup (Settings > Back up now) is plain JSON, and an agent can edit it: your own questions are in `stores.libMine` (a manifest plus the images as data URLs) and answer keys in `stores.libEdits`. A restore keeps, record by record, the one with the newer `updatedAt`, so an edited record only wins if the agent sets `updatedAt` to now.

A backup made before this was changed also held `settings` copied from everything in the browser's localStorage for the site's address, including other apps on the same address (a GitHub Pages site serves all of a user's projects from one address), possibly with credentials. Newer backups hold only this app's own settings, and a restore ignores any other keys. Even so, do not commit a backup (`code-practice-backup-*.json` and `code-practice-questions-*.json` are ignored by git), and for someone else use **Export my questions to share** (see [using-the-app.md](using-the-app.md)) rather than a full backup.

## Better: a `.questions.json` in a folder

An agent can add or change questions in a `.questions.json` file beside your PDF with no risk to your progress. Use the [question set format](question-set-format.md); the prompt in the vault's `Add question prompt.md` does exactly this. Then add the folder again in the app. Progress stays, because it is filed under each question's `uid`.

## If you do want to edit a backup

Copy the file first, give the agent **only** this, and check the result yourself:

> Edit the copy of the Practice Questions backup at `<path to a copy>`. Change only `stores.libMine` (own questions) and `stores.libEdits` (answer keys); never read, print or change `settings`, and do not touch other stores.
>
> - A record in `libMine` is `{ "id", "updatedAt", "images": { "<path>": "data:image/...;base64,..." }, "manifest": { format: "practice-question-set", version: 1, id, title, course, pdf: null, questions: [...] } }`. A question needs `uid`, `title`, `section`, `stem` (`text` and/or `image`, the image being a key of `images`), and at least one part with distinct labels: `numeric` (`unit`, `answer`, optional `dp`, `relTol`), `mcq` (`options`, `correct` as 0-based indexes, `multi`) or `self`. Optional: `source`, `marks`, `tags`, `notes`, `solution` (`text`, `images`).
> - Give a new question a unique `uid` like `q-` plus 8 hex digits. Set the record's `updatedAt` to the current time as an ISO date.
> - An answer key in `libEdits` is `{ "key": "<set id>/<uid>", "setId", "uid", "updatedAt", "parts": [...] }`.
> - When done run `node tools/check-backup.js "<file>"` from the repo's `app` folder and fix every problem it lists until it says OK.

`check-backup.js` validates the file the way the app does on restore, checks every question and that each image is stored, and warns about settings that look like credentials.
