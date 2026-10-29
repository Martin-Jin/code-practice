// The app's version and its change log (the five latest changes), shown in the welcome window (src/components/Welcome.jsx).
// Version numbers count pushes to main: 1.00 was the first, so a push that lands after N commits on main is
// `${1 + floor(N / 100)}.${N % 100, two digits}` (the 73rd push is 1.72). Every change a user can see adds an entry at the top,
// sets VERSION to it and drops the oldest, so the window opens on the change log after an update. A new feature also needs
// its place in the tutorial in Welcome.jsx.
export const VERSION = '1.75';

export const CHANGELOG = [
  {
    version: '1.75', date: '2026-10-29', title: 'Split random runs by topic, and leave out completed questions',
    items: [
      'Random runs have a Split evenly across topics option: the number of questions is shared equally between the topics, chosen at random inside each. The number must be at least the number of topics and a multiple of it; asking for every question runs as All questions.',
      'A Leave out completed questions box under the run modes drops every question you have got right at least once from the pool, for all modes.',
    ],
  },
  {
    version: '1.73', date: '2026-10-29', title: 'The add-questions help opens the tutorial',
    items: [
      'The How to add questions button under Your library now opens the tutorial at its Add your own questions section, instead of a second, separate guide that repeated it.',
      'The tutorial now says that adding coding questions needs a copy of the project on your computer (clone it from GitHub), and how.',
    ],
  },
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
];

// Which tab the welcome window opens on, given the version stored the last time it was shown: null (nothing to show) when
// the user has seen this version, the tutorial for someone who has never seen it, the change log after an update.
export function startTab(seen) {
  if (seen === VERSION) return null;
  return seen === null || seen === undefined ? 'tutorial' : 'changelog';
}
