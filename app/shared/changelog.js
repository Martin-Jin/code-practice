// The app's version and its change log (the five latest changes), shown in the welcome window (src/components/Welcome.jsx).
// Version numbers count pushes to main: 1.00 was the first, so a push that lands after N commits on main is
// `${1 + floor(N / 100)}.${N % 100, two digits}` (the 73rd push is 1.72). Every change a user can see adds an entry at the top,
// sets VERSION to it and drops the oldest, so the window opens on the change log after an update. A new feature also needs
// its place in the tutorial in Welcome.jsx.
export const VERSION = '2.07';

export const CHANGELOG = [
  {
    version: '2.07', date: '2026-10-31', title: 'Search and menu at the top right',
    items: [
      'The search box and the three-dot menu in the top bar now sit at the right edge instead of next to the page tabs.',
    ],
  },
  {
    version: '2.06', date: '2026-10-31', title: 'Rename a question set from its page',
    items: [
      'The title on an imported set page is underlined: click it and type to rename the set in place (Enter saves, Esc cancels). The name is kept when you import the folder or re-index the PDF again, and Ctrl+Z undoes it.',
    ],
  },
  {
    version: '2.05', date: '2026-10-31', title: 'Struggling means not right last time',
    items: [
      'The Struggling filter on the Stats pages now lists questions you got wrong at least once and did not get right the last time, the same ones the Not right last time practice mode draws, for coding sets and imported sets alike.',
    ],
  },
  {
    version: '2.04', date: '2026-10-31', title: 'Past sessions in a window',
    items: [
      'On an imported set, the new history button beside Stats and Search opens a window with every past session of that set. The sessions and sections lists beside the practice options are gone; the topics are still chosen with the button beside the practice mode.',
      'Coding sets and folders lose their topic list beside the practice options too.',
    ],
  },
  {
    version: '2.03', date: '2026-10-31', title: 'Undo and redo',
    items: [
      'Changes to folders, questions, sessions, removed sets and difficult marks now show a note at the top right, under the top bar. Click it within a second to undo, or press Ctrl+Z; Ctrl+Shift+Z redoes. Up to three notes stack, and error messages moved there too.',
      'Writing a change into a PDF, or restoring a backup, clears the undo history, because those cannot be rolled back.',
    ],
  },
];

// Which tab the welcome window opens on, given the version stored the last time it was shown: null (nothing to show) when
// the user has seen this version, the tutorial for someone who has never seen it, the change log after an update.
export function startTab(seen) {
  if (seen === VERSION) return null;
  return seen === null || seen === undefined ? 'tutorial' : 'changelog';
}
