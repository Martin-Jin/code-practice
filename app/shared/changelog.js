// The app's version and its change log (the five latest changes), shown in the welcome window (src/components/Welcome.jsx).
// Version numbers count pushes to main: 1.00 was the first, so a push that lands after N commits on main is
// `${1 + floor(N / 100)}.${N % 100, two digits}` (the 73rd push is 1.72). Every change a user can see adds an entry at the top,
// sets VERSION to it and drops the oldest, so the window opens on the change log after an update. A new feature also needs
// its place in the tutorial in Welcome.jsx.
export const VERSION = '1.72';

export const CHANGELOG = [
  {
    version: '1.72', date: '2026-10-29', title: 'Drag and shift-click to choose sets, and fixes',
    items: [
      'Choosing sets: press and drag over several to tick them all, or shift-click a range, on the Question sets page (Select) and in the formula-sheet and export dialogs. Those dialogs list nothing until you type in their search, and keep your chosen sets as removable chips.',
      'The Read the prompt arrow in the tutorial opens again, and so do the links in the tutorial (a click handler was cancelling them). The prompt box is now just the readable text, with the Copy button in the animation below it, and has more space above the animation.',
      'The search box in Add a formula sheet and Export chosen sets was drawn as a thin grey strip (it shared a style name with the progress bars); it is a normal box again.',
    ],
  },
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
];

// Which tab the welcome window opens on, given the version stored the last time it was shown: null (nothing to show) when
// the user has seen this version, the tutorial for someone who has never seen it, the change log after an update.
export function startTab(seen) {
  if (seen === VERSION) return null;
  return seen === null || seen === undefined ? 'tutorial' : 'changelog';
}
