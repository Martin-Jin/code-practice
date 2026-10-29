// The app's version and its change log (the five latest changes), shown in the welcome window (src/components/Welcome.jsx).
// Version numbers count pushes to main: 1.00 was the first, so a push that lands after N commits on main is
// `${1 + floor(N / 100)}.${N % 100, two digits}` (the 72nd push is 1.71). Every change a user can see adds an entry at the top,
// sets VERSION to it and drops the oldest, so the window opens on the change log after an update. A new feature also needs
// its place in the tutorial in Welcome.jsx.
export const VERSION = '1.71';

export const CHANGELOG = [
  {
    version: '1.71', date: '2026-10-29', title: 'Tutorial: how to add your own coding questions',
    items: [
      'The tutorial now explains that coding sets are C++ files in the project, how to add or share one, and where the guides are. Importing and exporting them inside the app is not available yet.',
    ],
  },
  {
    version: '1.70', date: '2026-10-29', title: 'One prompt that walks you through adding a question set',
    items: [
      'The tutorial has a full copy-paste prompt for an AI agent. The agent asks what material you have, builds the practice PDF in the exact layout the app reads, records the answer keys and walks you through importing it.',
      'The buttons in the animations work: Copy the prompt really copies it, and clicking any other button jumps to that step.',
    ],
  },
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
];

// Which tab the welcome window opens on, given the version stored the last time it was shown: null (nothing to show) when
// the user has seen this version, the tutorial for someone who has never seen it, the change log after an update.
export function startTab(seen) {
  if (seen === VERSION) return null;
  return seen === null || seen === undefined ? 'tutorial' : 'changelog';
}
