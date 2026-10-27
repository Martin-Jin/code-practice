# Question set format (your own folders)

The app can read question sets from folders on your computer, such as practice PDFs and quiz screenshots. These are separate from the C++ sets under `sets/`, which are described in [question-format.md](question-format.md). Nothing from your folders is ever committed or uploaded: the app copies the sets you choose into the browser's storage.

The code that checks this format is `app/shared/questionset.js`. It is the format an agent writes when asked to add a question, so keep this doc, the code and any prompt you give an agent in step.

## How a set is found

1. On **Question sets**, the **+** button and then **Add or update a folder of sets or PDFs** opens the browser's folder chooser. Pick any folder; it can be a parent of several sets.
2. The app looks through it for files ending in `.questions.json`. Each one is a set. Where the file sits does not matter.
3. A set's files (its PDF and images) are named in the manifest by paths **relative to the manifest's own folder**, and must be inside it. A path that starts with `/`, has a drive letter or contains `..` is refused.
4. Sets you tick are copied into the browser. Choosing the folder again shows each set as **New**, **Changed** or **Up to date**, and copies only what changed.
5. A manifest that is not valid JSON, or has the wrong header, is listed with the reason and cannot be ticked.
6. A PDF with no manifest beside it is read automatically in the browser, one at a time, and its questions are added to the list (see [Practice-question PDFs](#practice-question-pdfs)).

```
any-folder-you-choose/
  MECHENG222/Practice questions/
    MECHENG222 - Practice Questions.pdf
    MECHENG222 - Practice Questions.questions.json   <- a set, names the PDF
  Rigid body quiz/
    rigid-body.questions.json                         <- a set with no PDF
    images/q-3f9a1c2e.png
```

Only files the manifest names are copied. Everything else in the folder (slides, notes, other PDFs) is ignored.

## The manifest

```json
{
  "format": "practice-question-set",
  "version": 1,
  "id": "mecheng222-rigid-body",
  "title": "MECHENG222 rigid body quiz",
  "course": "MECHENG222",
  "pdf": null,
  "questions": [ ]
}
```

| Field | Meaning |
|---|---|
| `format`, `version` | Always `practice-question-set` and `1`. A file made for a newer version is refused. |
| `id` | Letters, digits, `.`, `-`, `_`. Unique among your sets: importing a second set with the same id replaces the first. |
| `title`, `course` | Shown on the dashboard. `course` may be empty. |
| `pdf` | The PDF beside the manifest that `stem.pdf` and `solution.pdf` crops refer to, or `null`. |
| `questions` | The questions, in the order to show them. |

## A question

```json
{
  "uid": "q-3f9a1c2e",
  "title": "Rigid body kinetics - mass and moment of inertia of a slender-rod assembly",
  "section": "Rigid body kinetics",
  "source": "MECHENG222 Quiz 1, Q3",
  "marks": 3,
  "tags": ["mass moment of inertia", "slender rod"],
  "stem": { "text": "The assembly is pivoted at $O$ ...", "image": "images/q-3f9a1c2e.png" },
  "parts": [
    { "label": "a", "type": "numeric", "prompt": "Calculate the mass.", "unit": "kg", "answer": 0.297, "dp": 3 },
    { "label": "b", "type": "mcq", "prompt": "Select all that are true.", "multi": true, "options": ["...", "..."], "correct": [0, 2] },
    { "label": "c", "type": "self", "prompt": "Explain why ..." }
  ],
  "solution": { "images": ["images/q-3f9a1c2e-solution.png"], "text": "" },
  "flags": []
}
```

| Field | Rules |
|---|---|
| `uid` | Required. Permanent and unique in the set. Progress is kept against it, so it never changes when questions are renumbered, reordered or the PDF is rebuilt. |
| `title` | Required. The question's name, in the form `Topic - what is asked`, with no question number. Search matches it, so make it descriptive. |
| `section` | Required. Questions are grouped by it. |
| `source` | Where it came from. Optional. |
| `marks` | The total, a number from 0. Optional. |
| `tags` | Extra search phrases. Optional. |
| `stem` | Required. At least one of `text` (Markdown, maths between `$...$`), `image` (a file) or `pdf` (a crop). |
| `parts` | Required, but it may be empty (a question with nothing to answer, which is just read). Otherwise distinct `label`s (use `""` for a single part). |
| `solution` | Optional: `images` (files), `pdf` (a list of crops) and `text`. `null` when there is none. |
| `notes` | Optional text (Markdown) shown in the question's **Notes** box: what went wrong last time, a reminder. You can also type notes in the app; those are kept apart from the set and are part of a backup. |
| `flags` | Optional notes for you: `needs-crop`, `check-text`, `no-answer`. |

A **crop** is `{ "page": 12, "box": [x0, y0, x1, y1] }`: a page number from 1 and a rectangle in PDF points measured from the top-left of the page as drawn. Crops need the set's `pdf`.

### Parts

How an answer is checked (`app/shared/answers.js`): a number is right when it is within `relTol` of the `answer` (1% if not given), or within half a unit of the last decimal place `dp` asks for, whichever allows more. A `null` answer means the part cannot be checked yet.

- **`numeric`**: `unit` (text, `""` for none; `^` for powers, as in `m/s^2`), `answer` (a number, or `null` until known), optional `dp` (the decimal places the question asks for) and `relTol` (accepted error as a fraction, default 0.01).
- **`mcq`**: `options` (at least two strings), `correct` (distinct option numbers counting from 0; `[]` until known), `multi` (`true` when more than one can be right; default `false`).
- **`self`**: no checkable answer. You read the solution and mark yourself.

## Practice-question PDFs

A practice PDF has to follow a fixed layout (the exact positions and an agent prompt that builds it are in [practice-pdf-prompt.md](practice-pdf-prompt.md)): a cover with a table of contents, then for each question a question page (header with the section and `Question N`, a title `QN. Topic - what is asked`, the question, a dashed rule, blank working space, and a footer `Source: ...`) followed by its worked solution pages (header `Section | QN: title` and `Worked solution (i/n)`). The app finds the questions from that layout with no AI:

- The import dialog reads each PDF that has no manifest in the browser, automatically, with about half a minute of work for a 250-page file, and imports the result as a set. It shows how many questions it found, warns if the cover lists a different number, and lists pages it could not place.
- `node tools/index-pdf.js "<file.pdf>"` (from the `app` folder of the repo) does the same and writes `<pdf name>.questions.json` beside the PDF. Run it again after the PDF changes: questions are matched by `uid`, so answers, marks and tags already in the manifest are kept. Add `--dry-run` to see the report only.
- Each question's `stem.pdf` crop runs from just under the title to the dashed rule, and each solution page's crop runs from under the header to above the footer. The viewer trims the blank space at the bottom of a solution page.
- A question's `uid` is `q-` plus the first 8 hex digits of SHA-1 over `course|source|title` in lower case. Indexing the same PDF again gives the same uids, so progress stays attached even if the manifest is lost.
- Every question starts with one `self` part (you read the solution and mark yourself). Add numeric or choice answers when you have them; the manifest's `parts` are kept when the PDF is indexed again.
- **Updating the PDF.** Add the folder again (or run the tool again) and the import dialog reads the changed PDF again by itself. The set keeps its id, and each question keeps its `uid`, so stats, answers, difficult marks, answer keys and notes stay. A new question is matched to a saved one by `uid`, then by source and title, then by source alone, then by title alone; the last two only when exactly one question on each side has it. So **rewording a title is safe while its `Source:` label stays the same** (and the reverse), but changing both makes the question look new, and its old progress is left behind. The import screen says how many questions kept their progress, how many are new and which ones are no longer in the PDF (their progress stays saved in case they come back). Renaming the PDF file makes a different set id, so it counts as a new set: keep the name.
- A question whose solution pages are missing is flagged `no-solution`; one whose dashed rule is not found is flagged `needs-crop`.

If the prompt's layout changes (header height, fonts, margins), `app/shared/pdfindex.js` needs the same change.

## What happens to a bad question

A bad question does not stop its set. It is left out, and the import screen says which one and why (a missing title, a part with the wrong shape, a repeated `uid`, an unsafe path). The set itself is refused only when its header is wrong: wrong `format` or `version`, an invalid `id`, no `title`, or no `questions` list.

A file named by the set but missing from the folder does not stop the import either. The question is kept, shown without that file, and the set card says how many files are missing.

## Questions made in the app

**Add a question** (the **+** button, a set's page or Alt+K) asks which set the question is for, then the question itself. A name that matches an existing set fills in that set's usual section, source and tags; a new name makes a new set. Sets made this way are stored in the browser (store `libMine`, one record per set), with the same question format and the images as data URLs, and are part of a backup. No folder may use the id of one of them: the import screen refuses a manifest that does. "My questions" is the first such set.

A question added to a set **imported from a folder** is marked `own` and kept with the stored copy of that set. Importing the folder again carries it over. It is not in a backup (the stored sets are copies), so keep the question in the folder's manifest too if you want it to survive clearing site data.

## Your changes

The user can add or correct parts, marks, tags and a PDF question's crop box in the app (**Answer key**). Those are saved apart from the set, as an overlay on the question with the same `uid`, so importing the folder again never overwrites them and they are part of a backup. The same goes for answers typed, results and the difficult flag. This is another reason a `uid` must not change.

## Formula sheets

Each set can have formula sheets (PDFs or images). In a question of an imported set, **Formulas** (or Alt+T) opens a side panel with one tab per sheet; if the set has none, the panel offers an upload. They are copies kept in the browser like the PDFs, so they are not part of a backup.

## Keeping the PDF and the set in step

For a set the app indexed from a PDF (Chromium browsers, such as Edge or Chrome), **Link the PDF file** keeps a handle to the file. Then:

- When the file changes (checked when the page opens and when the window is focused, or with **Check for changes**), the set is indexed again and keeps its progress, as described above. A file that no longer reads as a practice PDF is refused and the old copy stays.
- **Add a question** can also append it to the PDF as a new question page and solution page in the PDF layout. Edit mode (the pen beside a question's title) can draw a replacement image or wording over a question's or solution's part of the page. **Delete** can remove a question's pages. These write into the linked file. The PDF's cover is not updated, so the indexer may warn that the cover lists fewer questions than were found.
- Without a link, or in a browser that cannot link files (Firefox), the same changes download an updated PDF, which you replace your original with. The app's stored copy is updated either way.
- A question's title can be changed in the app but not in the PDF. Marks, tags, answers and notes are not in the PDF at all.
- Deleting a question without the PDF option hides it in the app only; indexing again does not bring it back.

## Where the copies live

Imported sets are kept in the browser's IndexedDB (`libSets` for the manifests, `libFiles` for the PDFs and images; `libFormulas` lists the formula sheets and `libHandles` holds the linked PDF files). They are copies, so they are not part of a backup: add the folder again to restore them. Your progress on them is stored separately and is part of a backup. Clearing "cookies and site data" removes the copies, so keep the folder.
