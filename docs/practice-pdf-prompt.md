# Practice PDF layout and an agent prompt to build it

The app finds the questions in a practice PDF **from its layout, with no AI**, so the PDF has to be laid out in one fixed way. You can:

- **Have an AI agent build it:** paste [the prompt](#the-prompt) into an agent that can read your source files and write PDFs (Claude Code, for example). It asks you for everything it needs, so there is nothing to fill in first.
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

The prompt is one self-contained file, [practice-pdf-agent-prompt.md](practice-pdf-agent-prompt.md), and the same text is in the app's tutorial (**Tutorial > Format a PDF with an agent > Copy the prompt**). Paste all of it into an AI agent. The agent then interviews you (what course, which material, where the files are, whether you want answer keys), builds the PDF in the layout above, checks it, writes down the answer keys and walks you through importing it. It carries the layout above word for word, so it works in an agent that cannot see this repository; a test (`app/test/agentprompt.test.js`) fails if the two drift apart. Change the layout in both places and in `app/shared/pdfindex.js`.
