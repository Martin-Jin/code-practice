// The app's version and its change log (the five latest changes), shown in the welcome window (src/components/Welcome.jsx).
// Version numbers count pushes to main: 1.00 was the first, so a push that lands after N commits on main is
// `${1 + floor(N / 100)}.${N % 100, two digits}` (the 73rd push is 1.72). Every change a user can see adds an entry at the top,
// sets VERSION to it and drops the oldest, so the window opens on the change log after an update. A new feature also needs
// its place in the tutorial in Welcome.jsx.
export const VERSION = '2.18';

export const CHANGELOG = [
  {
    version: '2.18', date: '2026-10-31', title: 'Thin run rows on the dashboard',
    items: [
      'The runs on the dashboard use the same thin rows as History, so more of them fit on screen, with a smaller Resume button. On a phone they take two short lines. When a row is too narrow for its name and set, the text is cut off and slides along while you hover over the row.',
    ],
  },
  {
    version: '2.17', date: '2026-10-31', title: 'History as a searchable list of runs',
    items: [
      'History is now a list with one short row per run (set, run name, progress and when), newest first. It shows as many rows as fit the window, and Show more adds another window of them. Clicking a row opens that run, or its results if it is finished.',
      'A search box at the top finds runs by set, run name or mode (fuzzy), and suggests set and run names as you type.',
    ],
  },
  {
    version: '2.16', date: '2026-10-31', title: 'Space under the session timer',
    items: [
      'In a practice session the page now starts below the floating timer, so the timer no longer sits level with the location line.',
    ],
  },
  {
    version: '2.15', date: '2026-10-31', title: 'No top bar in a session',
    items: [
      'During a practice session the top bar is gone. A back arrow at the start of the location line exits to the question sets, and the timer floats at the top centre of the page.',
      'Phones: question pages no longer stretch wider than the screen, the coding run keeps its timer in a smaller top bar (the previous and next buttons are hidden there; use the Questions tab), and the new Stats, menus, question strip and recent sessions were checked at phone width.',
    ],
  },
  {
    version: '2.14', date: '2026-10-31', title: 'Recent sessions beside the practice options',
    items: [
      'An imported set page now lists its latest practice sessions in the space beside the practice options, as many as fit, each opening its session or results. See all opens the window with every past session. The History button beside the title is gone, and the practice options block is a little narrower.',
    ],
  },
];

// Which tab the welcome window opens on, given the version stored the last time it was shown: null (nothing to show) when
// the user has seen this version, the tutorial for someone who has never seen it, the change log after an update.
export function startTab(seen) {
  if (seen === VERSION) return null;
  return seen === null || seen === undefined ? 'tutorial' : 'changelog';
}
