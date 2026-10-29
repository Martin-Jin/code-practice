// The app's version and its change log (the five latest changes), shown in the welcome window (src/components/Welcome.jsx).
// Version numbers count pushes to main: 1.00 was the first, so a push that lands after N commits on main is
// `${1 + floor(N / 100)}.${N % 100, two digits}` (the 69th push is 1.68). Every change a user can see adds an entry at the top,
// sets VERSION to it and drops the oldest, so the window opens on the change log after an update. A new feature also needs
// its place in the tutorial in Welcome.jsx.
export const VERSION = '1.68';

export const CHANGELOG = [
  {
    version: '1.68', date: '2026-10-29', title: "Renamed to Can'tviz quizzes",
    items: [
      "The app is now called Can'tviz quizzes: in the browser tab, the top bar, the welcome window and the backup messages. Your saved progress and backups are unaffected.",
    ],
  },
  {
    version: '1.66', date: '2026-10-29', title: 'Animated tutorial, and a bigger window',
    items: [
      'The tutorial shows importing a folder, formatting a PDF with an agent, adding a formula sheet to several sets and exporting chosen sets as short animations, with pause and replay.',
      'The window is larger and easier to read, the index is now part of the page, and the section name beside the progress dots fades after a moment and returns when you reach a new section.',
    ],
  },
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
];

// Which tab the welcome window opens on, given the version stored the last time it was shown: null (nothing to show) when
// the user has seen this version, the tutorial for someone who has never seen it, the change log after an update.
export function startTab(seen) {
  if (seen === VERSION) return null;
  return seen === null || seen === undefined ? 'tutorial' : 'changelog';
}
