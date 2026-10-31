// The app's version and its change log (the five latest changes), shown in the welcome window (src/components/Welcome.jsx).
// Version numbers count pushes to main: 1.00 was the first, so a push that lands after N commits on main is
// `${1 + floor(N / 100)}.${N % 100, two digits}` (the 73rd push is 1.72). Every change a user can see adds an entry at the top,
// sets VERSION to it and drops the oldest, so the window opens on the change log after an update. A new feature also needs
// its place in the tutorial in Welcome.jsx.
export const VERSION = '2.03';

export const CHANGELOG = [
  {
    version: '2.03', date: '2026-10-31', title: 'Undo and redo',
    items: [
      'Changes to folders, questions, sessions, removed sets and difficult marks now show a note at the top right, under the top bar. Click it within a second to undo, or press Ctrl+Z; Ctrl+Shift+Z redoes. Up to three notes stack, and error messages moved there too.',
      'Writing a change into a PDF, or restoring a backup, clears the undo history, because those cannot be rolled back.',
    ],
  },
  {
    version: '2.02', date: '2026-10-31', title: 'Topic list stays level with the practice options',
    items: [
      'On a set page the topic list now stops at the height of the practice options and scrolls, instead of pushing the page down, and its top lines up with them.',
      'A new button beside Stats and Search in an imported set title opens a window listing every topic in the set.',
    ],
  },
  {
    version: '2.01', date: '2026-10-31', title: 'Customise a run by topic',
    items: [
      'A button beside the Practice mode dropdown opens a window listing every topic (or section): choose which to include and, for Random, how many questions from each. It replaces the topic tick boxes, and coding sets and imported sets now share the same layout, with the topic list beside the picker.',
      'The page location (for example / Question sets / Folder / This set) now sits above the page title instead of in the top bar. Run rows no longer wrap their progress text.',
    ],
  },
  {
    version: '2.00', date: '2026-10-31', title: 'Practice mode dropdown everywhere',
    items: [
      'Imported sets, library folders and coding sets all choose their practice mode from one dropdown, showing only the options for the chosen mode (question count, sections or topics to draw from), instead of a vertical list of every mode.',
    ],
  },
  {
    version: '1.99', date: '2026-10-31', title: 'No blank solution pages in the PDF',
    items: [
      'Changing a multi-page solution in the PDF with fewer images (or text) now removes the leftover solution pages instead of leaving them blank under a "Worked solution" header.',
    ],
  },
];

// Which tab the welcome window opens on, given the version stored the last time it was shown: null (nothing to show) when
// the user has seen this version, the tutorial for someone who has never seen it, the change log after an update.
export function startTab(seen) {
  if (seen === VERSION) return null;
  return seen === null || seen === undefined ? 'tutorial' : 'changelog';
}
