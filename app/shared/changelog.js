// The app's version and its change log (the five latest changes), shown in the welcome window (src/components/Welcome.jsx).
// Version numbers count pushes to main: 1.00 was the first, so a push that lands after N commits on main is
// `${1 + floor(N / 100)}.${N % 100, two digits}` (the 73rd push is 1.72). Every change a user can see adds an entry at the top,
// sets VERSION to it and drops the oldest, so the window opens on the change log after an update. A new feature also needs
// its place in the tutorial in Welcome.jsx.
export const VERSION = '1.78';

export const CHANGELOG = [
  {
    version: '1.78', date: '2026-10-30', title: 'Pick a section, and mark a whole section correct',
    items: [
      'An imported set\'s page now shows one section at a time. Under Questions in this set, click the underlined section name to turn it into a search box and pick a section from the matching list (arrow keys and Enter work).',
      'A tick beside it, Mark all correct, counts every question in the shown section as answered correctly, for work you finished before using the app. Questions already right are left alone, and it asks first.',
    ],
  },
  {
    version: '1.77', date: '2026-10-29', title: 'Random split and hide completed on imported sets, History tab, zoom out, faster formulas',
    items: [
      'Random on an imported set has a Split evenly across sections option (the number must be at least the number of sections and a multiple of it, or every question), and every practice mode has a Leave out completed questions box for questions you have got right at least once.',
      'Ctrl+P (and the search box) now lists question sets only on the dashboard and the list of sets; inside a set it searches only the questions of that set.',
      'The top bar no longer repeats the page name: the Dashboard and Question sets pages show no trail, and inside a folder or a set it shows the folders leading to it (click one to go back).',
      'A History tab in the top bar (and Go to history in the command palette, Alt+K) lists the last 5 question sets you ran, with how many runs each has and a link to open it.',
      'Figures and formula sheets can now zoom out to 50% as well as in: the full-window viewer has a 50% and a 75% step below Fit, and Ctrl + scroll on a figure in place shrinks it too (double-click or Reset puts it back).',
      'Alt+T no longer reloads the formula sheet each time: once opened it stays loaded while hidden, so showing it again is instant and keeps its scroll and zoom.',
    ],
  },
  {
    version: '1.76', date: '2026-10-29', title: 'Delete or select all from the Select menu',
    items: [
      'After you tick sets and folders on the Question sets page, the Move button is now an Actions menu: Move to a folder, Delete, Select all and Clear selection. Deleting several sets at once asks once; deleted folders keep their sets.',
    ],
  },
  {
    version: '1.75', date: '2026-10-29', title: 'Split random runs by topic, and leave out completed questions',
    items: [
      'Random runs have a Split evenly across topics option: the number of questions is shared equally between the topics, chosen at random inside each. The number must be at least the number of topics and a multiple of it; asking for every question runs as All questions.',
      'A Leave out completed questions box under the run modes drops every question you have got right at least once from the pool, for all modes.',
    ],
  },
];

// Which tab the welcome window opens on, given the version stored the last time it was shown: null (nothing to show) when
// the user has seen this version, the tutorial for someone who has never seen it, the change log after an update.
export function startTab(seen) {
  if (seen === VERSION) return null;
  return seen === null || seen === undefined ? 'tutorial' : 'changelog';
}
