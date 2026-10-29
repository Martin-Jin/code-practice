// The app's version and its change log (the five latest changes), shown in the welcome window (src/components/Welcome.jsx).
// Version numbers count pushes to main: 1.00 was the first, so a push that lands after N commits on main is
// `${1 + floor(N / 100)}.${N % 100, two digits}` (the 66th push is 1.65). Every change a user can see adds an entry at the top,
// sets VERSION to it and drops the oldest, so the window opens on the change log after an update. A new feature also needs
// its place in the tutorial in Welcome.jsx.
export const VERSION = '1.65';

export const CHANGELOG = [
  {
    version: '1.65', date: '2026-10-29', title: 'Tutorial and export in the command palette',
    items: [
      'The command palette (Alt+K) has Export chosen sets, which opens the screen for picking sets, and Add a formula sheet to several sets.',
      'Open the tutorial from Settings (Help) or from the command palette (Alt+K, then "Open the tutorial"), as well as the three-dot menu.',
    ],
  },
  {
    version: '1.64', date: '2026-10-29', title: 'Tutorial and change log',
    items: [
      'A welcome window with a short tutorial (an index, a search and a progress marker) and this change log.',
      'It opens on the tutorial the first time you visit, and on the change log after each update. Reopen it from the three-dot menu at the top right.',
    ],
  },
  {
    version: '1.63', date: '2026-10-29', title: 'Formula sheets for many sets, and exporting chosen sets',
    items: [
      'The + button can add one formula sheet to several sets at once. Each set keeps its own copy.',
      'On a set\'s page, Edit this set > Formula sheets lists its sheets so you can remove any.',
      'Export chosen sets downloads only the sets you tick, with their PDFs, images and formula sheets, and no progress.',
      'Restoring a zip now brings the formula sheet files back, not just their names.',
    ],
  },
  {
    version: '1.62', date: '2026-10-28', title: 'Easier set management',
    items: [
      'Select several sets and folders and move them together, with folders inside folders.',
      'Search your sets from the command palette (Alt+K).',
    ],
  },
  {
    version: '1.61', date: '2026-10-28', title: 'Tidier imported-set page',
    items: [
      'A mode dropdown and a search over the set\'s questions, and a name prompt when you start a session.',
    ],
  },
];

// Which tab the welcome window opens on, given the version stored the last time it was shown: null (nothing to show) when
// the user has seen this version, the tutorial for someone who has never seen it, the change log after an update.
export function startTab(seen) {
  if (seen === VERSION) return null;
  return seen === null || seen === undefined ? 'tutorial' : 'changelog';
}
