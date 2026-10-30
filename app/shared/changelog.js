// The app's version and its change log (the five latest changes), shown in the welcome window (src/components/Welcome.jsx).
// Version numbers count pushes to main: 1.00 was the first, so a push that lands after N commits on main is
// `${1 + floor(N / 100)}.${N % 100, two digits}` (the 73rd push is 1.72). Every change a user can see adds an entry at the top,
// sets VERSION to it and drops the oldest, so the window opens on the change log after an update. A new feature also needs
// its place in the tutorial in Welcome.jsx.
export const VERSION = '2.00';

export const CHANGELOG = [
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
  {
    version: '1.98', date: '2026-10-31', title: 'Solutions with several pages',
    items: [
      'Adding or editing a solution now takes as many images as it needs, one per page, which you can reorder or remove. When editing, new pages can replace the existing ones or be added after them. Writing them into a PDF puts one image on each of its existing solution pages.',
    ],
  },
  {
    version: '1.97', date: '2026-10-31', title: 'Same practice modes for coding questions',
    items: [
      'Coding sets now offer the same modes as imported sets: Marked difficult, Not seen yet and Not right last time, alongside Practice test, Random, By topic and All. Tick topics to limit Random, All and those modes to them. Mark a question as difficult from its Task tab. Split evenly no longer fails when ticked.',
    ],
  },
  {
    version: '1.96', date: '2026-10-30', title: 'Practise folders as combined sets',
    items: [
      'Practise a whole library folder, or every set at the root, with the same mode cards and session controls as an individual set. Practice-mode selection now uses consistent cards throughout.',
    ],
  },
];

// Which tab the welcome window opens on, given the version stored the last time it was shown: null (nothing to show) when
// the user has seen this version, the tutorial for someone who has never seen it, the change log after an update.
export function startTab(seen) {
  if (seen === VERSION) return null;
  return seen === null || seen === undefined ? 'tutorial' : 'changelog';
}
