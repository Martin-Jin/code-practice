You are helping me turn my study material into a practice-question PDF for a web app called Can'tviz quizzes, and then add it to the app. Work with me step by step, like an interview. Do NOT start building until you have asked me the questions in Step 1 and I have answered them. Ask a few questions at a time (never all at once), wait for my answers, and keep going until you have everything you need. If I am unsure about something, suggest a sensible default and tell me what it is.

## Step 1: Ask me what you need

Ask me, in small groups:
1. What course is this for, and what should the PDF be called (for example "Thermodynamics - Practice Questions")?
2. What material do I want turned into questions? Tutorial sheets, problem sets, past tests, lecture examples? Where are the files? (Ask me to attach them, paste their folder path, or list them, depending on what you can read.)
3. Is this a new PDF, or should the questions be added to an existing practice PDF? If existing, ask me to attach it.
4. Do the sources include worked solutions? (If a question has none, you will flag it and leave it out. You never solve questions yourself.)
5. Do I want answer keys? That is the final answer of each part (numbers with units, multiple-choice answers) written down so the app can check what I type. The default is yes.
6. What can you do here? Can you read my files, write files into my folders and run commands? If you cannot write a PDF directly, tell me what you can do instead (for example build it with code in a sandbox and let me download it) before going on.

When you have the answers, summarise what you understood in a short list and ask me to say "go". Then continue with Step 2.

## Step 2: Build the PDF

Before starting: if you can write files, back up the sources and any existing PDF to a folder outside the course folder first. Convert a source that is not a PDF first (retype it with the wording unchanged if nothing can convert it). Read handwritten solutions as images, never from the text layer, and straighten a rotated scan in a working copy before cropping.

What counts as a question: every numbered question in a source, with its worked solution. Short conceptual questions with a written answer count; theory pages do not. Parts (a), (b), (c) stay in one entry. If a source holds only solutions, look the statements up in the course book, slides and other files before skipping anything; never reconstruct a statement from handwriting. Skip a question already in the PDF (and tell me); keep one with different numbers or extra parts. Flag a question with no worked solution; never solve one yourself.

Each entry is a question page followed by its solution pages. Crop the question and the solution from the source, tight, keeping vector where the source is vector. A crop never includes a neighbouring question or cuts a line of working in half. Never shrink a solution to fit one page; let it run over extra pages.

Placement and numbering: put each question in the section it belongs to by topic, and add a section only when none fits. Number the whole file 1 to N so titles, headers, cover and bookmarks agree. Give each new question a title `Topic - what is asked` (plain ASCII, unique) and a distinct source label. The cover lists every section with its questions and page numbers, links each entry to its page, and carries the count; PDF bookmarks mirror it.

Use exactly this layout, because the app finds the questions from it, with no AI:

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

## Step 3: Check it

Render and look at the cover and every new question and solution page. Fix anything cut off, an incomplete or unreadably small crop, missing working space, and a wrong header, footer or page number. Check that the cover count matches the number of entries, the numbering is continuous, every cover link lands on the right page, and the page count is the old count plus the new pages. Do not tell me it is finished until you have looked.

## Step 4: Answer keys (unless I said no)

While cropping each solution, note the final answer of every part that its worked solution or source shows. Never work one out yourself: a wrong key marks right answers wrong. Read handwriting only from the final-answer line, as an image. Then give me the keys as a table in your reply: `Question number and title | part | answer | unit | decimal places asked for`. For a multiple-choice question give the options and which are correct. Leave conceptual questions and any part with no clear final answer out of the table (I will mark those myself).

If you are working inside the app's repository and can run commands, you may instead run `node tools/index-pdf.js "<PDF>"` from its `app` folder, which writes `<PDF name>.questions.json` beside the PDF, and put the keys in that file following docs/question-set-format.md ("Parts"). Otherwise the table is enough.

## Step 5: Hand over, then walk me through adding it to the app

Tell me where the PDF (and any other files) ended up, how many questions went in from each source and section, which questions you skipped or flagged (duplicate, or no worked solution), and where the backups are. Never delete a source unless I ask.

Then walk me through adding it, one step at a time, waiting for me to say each step is done:
1. Open the app (Can'tviz quizzes) and go to the "Question sets" tab.
2. Press the round + button at the bottom right, then "Add or update a folder of sets or PDFs", and choose the folder that holds the PDF (and the .questions.json, if there is one).
3. The app reads the PDF by itself (about half a minute for a big one) and lists what it found. Check the number of questions matches the cover. Tick the set and press Import.
4. Open the new set from "Your library", open a few questions and check each crop shows the whole question and nothing from a neighbour.
5. If you gave me an answer-key table, open each question, press the pen beside "Answers" and type the keys in (or tell me if you would rather I check a few first).

Finally, remind me that I can come back and add more questions later: never reword an existing question's title or `Source:` label, because the app keeps my progress against them.
