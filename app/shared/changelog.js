// The app's version and its change log (the five latest changes), shown in the welcome window (src/components/Welcome.jsx).
// Version numbers count pushes to main: 1.00 was the first, so a push that lands after N commits on main is
// `${1 + floor(N / 100)}.${N % 100, two digits}` (the 73rd push is 1.72). Every change a user can see adds an entry at the top,
// sets VERSION to it and drops the oldest, so the window opens on the change log after an update. A new feature also needs
// its place in the tutorial in Welcome.jsx.
export const VERSION = '1.88';

export const CHANGELOG = [
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
  {
    version: '1.83', date: '2026-10-30', title: 'Wider side panel, tidier answers, crop moved',
    items: [
      'The side panel on the question page is wider, and the Previous and Next buttons are gone (the arrow keys still move between questions; a practice session keeps Finish and Results, and its numbered strip).',
      'The answer box of each part now starts at the left edge of its label, below the wording, instead of beside it.',
      'The Top and Bottom crop settings of a PDF question moved out of the answer key editor into the Edit the question window (the pencil beside Question in edit mode), so editing answers no longer shows them.',
    ],
  },
];

// Which tab the welcome window opens on, given the version stored the last time it was shown: null (nothing to show) when
// the user has seen this version, the tutorial for someone who has never seen it, the change log after an update.
export function startTab(seen) {
  if (seen === VERSION) return null;
  return seen === null || seen === undefined ? 'tutorial' : 'changelog';
}
