# Practice PDF layout and an agent prompt to build it

The app finds the questions in a practice PDF **from its layout, with no AI**, so the PDF has to be laid out in one fixed way. You can:

- **Have an AI agent build it:** paste the [prompt below](#the-prompt) into an agent that can read your source files and write PDFs (Claude Code, for example), and fill in the three blanks at the top.
- **Lay it out by hand:** follow [the layout](#the-layout) exactly in whatever tool you use to make PDFs.

Either way, check the result before importing (see [Check it](#check-it)). A PDF that does not follow the layout is not wrong to keep, but the app will not find its questions: use **Add a question** for single questions instead (see [adding-questions.md](adding-questions.md)).

## The layout

Page size A4. Positions are in PDF points measured from the top-left of the page; the app reads them, so keep them exactly.

- **Cover:** lists every question as `QN. Title   page`, grouped by section, and states the count (for example `73 questions.`). The app compares what it finds with this count.
- **Question page** (one per question):
  - Header on one baseline at 26 pt, text 8.5 pt tall, from x = 36: the section on the left and `Question N` right-aligned to the right margin. A thin rule sits under it at 32 pt.
  - Title `QN.  Topic - what is asked`, 12.5 pt, at x = 36, baseline about 55 pt.
  - The question (statement, figure and given data), then a **dashed rule**: one horizontal stroke with dash pattern 3,3 from the left margin to the right margin. It ends the question; the app crops from the title down to it. Blank working space follows.
  - Footer `Source: ...` at 7.5 pt, x = 36, about 20 pt above the bottom edge, and the page number at the right.
- **Solution pages** (one or more per question, straight after its question page): header `Section  |  QN: title` on the left and `Worked solution (i/n)` on the right, then the solution, then the same footer.
- **Extra working space:** a question that leaves too little room may be followed by a blank page headed `Question N (extra working space)`.
- **Titles and sources:** a title is `Topic - what is asked` in plain ASCII, unique in the file. Each question has a distinct source label (`Tutorial 3, Q2`, not just `Tutorial`). Number the questions 1 to N in order.

**Do not reword a title or a `Source:` label later.** The app keeps your progress against an id made from the course, the source label and the title, so changing either makes the question look new and its old answers are left behind. Only the number in front of the title may change when you add questions.

## Check it

From the `app` folder of the repo:

```powershell
node tools/index-pdf.js --dry-run "path\to\Practice Questions.pdf"
```

It must report as many questions as the cover lists, and no unplaced pages. Without the repo, choose its folder in the import dialog, which reads the PDF for you (see [using-the-app.md](using-the-app.md#your-own-question-sets)); it shows the same report. Then open a few questions and check that the crop shows the whole question and nothing from a neighbour.

## The prompt

Fill in the blanks, then paste everything below the line into your agent.

---

**Course:** [course name or code]
**Target PDF:** [the practice questions PDF to build or extend, or "none, make a new one"]
**Sources to merge:** [tutorial sheets, problem sheets, practice tests and worked examples, and the folders they are in]

Merge the sources into the target PDF so every question sits in one place with its worked solution, using exactly the layout in `docs/practice-pdf-prompt.md` ("The layout"). Do not change the repo; write the PDF into the folder of the target (or the sources, for a new one).

1. **Before starting.** Open the target and copy its layout. Back up the target and the sources outside the course folder. Convert a source that is not a PDF first (retype it with the wording unchanged if nothing can convert it). Read handwritten solutions as images, never from the text layer, and straighten a rotated scan in a working copy before cropping.
2. **What counts as a question.** Every numbered question in a source, with its worked solution. Short conceptual questions with a written answer count; theory pages do not. Parts (a), (b), (c) stay in one entry. If a source holds only solutions, look the statements up in the course book, slides and other files before skipping anything; never reconstruct a statement from handwriting. Skip a question already in the target (and list it); keep one with different numbers or extra parts. Flag a question with no worked solution; never solve one yourself.
3. **Each entry** is a question page followed by its solution pages, laid out as in "The layout". Crop the question and the solution from the source, tight, keeping vector where the source is vector. A crop never includes a neighbouring question or cuts a line of working in half. Never shrink a solution to fit one page; let it run over extra pages.
4. **Placement and numbering.** Put each question in the section it belongs to by topic; add a section only when none fits. Renumber the whole file 1 to N so titles, headers, cover and bookmarks agree. Never reword an existing question's title or `Source:` label. Give each new question a title `Topic - what is asked` (plain ASCII, unique) and a distinct source label. Leave every existing page as it is apart from its numbers. The cover lists every section with its questions and page numbers, links each entry to its page, and carries the count; PDF bookmarks mirror it.
5. **Before finishing.** Render and view the cover and every new question and solution page; fix anything cut off, an incomplete or unreadably small crop, missing working space, and a wrong header, footer or page number. Check the cover count matches the entries, the numbering is continuous and every link lands on the right page, and the page count is the old count plus the new pages. Then run `node tools/index-pdf.js --dry-run "<PDF>"` from the repo's `app` folder: it must report as many questions as the cover and no unplaced pages. Fix the PDF if not.
6. **Hand-over.** Report the questions added by source and section, the questions skipped (duplicate or no solution), the backup location, and the page count before and after. Delete a source only if asked, and only after every question in it has been checked in the output.
