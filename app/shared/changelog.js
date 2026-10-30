// The app's version and its change log (the five latest changes), shown in the welcome window (src/components/Welcome.jsx).
// Version numbers count pushes to main: 1.00 was the first, so a push that lands after N commits on main is
// `${1 + floor(N / 100)}.${N % 100, two digits}` (the 73rd push is 1.72). Every change a user can see adds an entry at the top,
// sets VERSION to it and drops the oldest, so the window opens on the change log after an update. A new feature also needs
// its place in the tutorial in Welcome.jsx.
export const VERSION = '1.89';

export const CHANGELOG = [
  {
    version: '1.89', date: '2026-10-30', title: 'Hints and solution reminders',
    items: [
      'Library questions can open your chosen HTTPS AI chat website (Claude by default) and copy a prompt with the question, saved answers and notes. The prompt asks for your working first when none is provided; attach the question image manually if clipboard image copy is unavailable.',
      'The first time you open a solution for a question in a run, a short reminder asks whether you have attempted it. Confirm once to skip the reminder for that question in the rest of the run; a new run asks again. The S shortcut follows the same rule.',
      'Formula-sheet PDFs now render inside the app, keeping shortcuts such as Alt+T available after clicking the page. The top bar stays on one line, hides path breadcrumbs when less than a full word fits, and keeps History available as an icon on small screens.',
    ],
  },
  {
    version: '1.88', date: '2026-10-30', title: 'Side-by-side worked solution pages',
    items: [
      'Worked solution PDF pages now scroll horizontally. Enlarge any page to switch between pages with the arrows while keeping the same zoom level.',
    ],
  },
  {
    version: '1.87', date: '2026-10-30', title: 'Question counts and validation messages',
    items: [
      'Random mode now starts with no more questions than are available in the pool, for both coding and imported sets.',
      'Invalid fields and form entries now use consistent error pop-ups that fade away.',
    ],
  },
  {
    version: '1.85', date: '2026-10-30', title: 'Fixes to the I got it / Not quite buttons',
    items: [
      'Saving an empty answer key no longer makes I got it / Not quite disappear: with no key, the question keeps its self-marked part.',
      'Taking a mark back no longer shows the "Answer every part to check them all" message.',
    ],
  },
  {
    version: '1.84', date: '2026-10-30', title: 'I got it / Not quite toggle, and no needless Reset',
    items: [
      'I got it and Not quite are now a toggle: pressing the other one swaps the mark, and pressing the same one takes it back, with the right and not right counts following, so a question can no longer be counted twice in one session. A new session starts with both unpressed.',
      'Reset only shows when there is a typed or chosen answer to clear, not for a question that is only marked I got it / Not quite.',
    ],
  },
];

// Which tab the welcome window opens on, given the version stored the last time it was shown: null (nothing to show) when
// the user has seen this version, the tutorial for someone who has never seen it, the change log after an update.
export function startTab(seen) {
  if (seen === VERSION) return null;
  return seen === null || seen === undefined ? 'tutorial' : 'changelog';
}
