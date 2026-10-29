// The app's version and its change log (the five latest changes), shown in the welcome window (src/components/Welcome.jsx).
// Version numbers count pushes to main: 1.00 was the first, so a push that lands after N commits on main is
// `${1 + floor(N / 100)}.${N % 100, two digits}` (the 70th push is 1.69). Every change a user can see adds an entry at the top,
// sets VERSION to it and drops the oldest, so the window opens on the change log after an update. A new feature also needs
// its place in the tutorial in Welcome.jsx.
export const VERSION = '1.69';

export const CHANGELOG = [
  {
    version: '1.69', date: '2026-10-29', title: 'Sample content, a new logo and Delete question set',
    items: [
      'New visitors start with a sample practice quiz (answer keys, diagrams, a formula sheet) and a small sample coding quiz, instead of course material.',
      'Delete question set is in the command palette (Alt+K): type the set and it asks before deleting.',
      'A new logo and tab icon, and the How to add questions button now sits under the storage note.',
      'The tutorial has a welcome title and a clearer first section, its search moved to the bottom bar, and there is more room for the scroll bar.',
    ],
  },
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
];

// Which tab the welcome window opens on, given the version stored the last time it was shown: null (nothing to show) when
// the user has seen this version, the tutorial for someone who has never seen it, the change log after an update.
export function startTab(seen) {
  if (seen === VERSION) return null;
  return seen === null || seen === undefined ? 'tutorial' : 'changelog';
}
