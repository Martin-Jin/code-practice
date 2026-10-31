// The app's version and its change log (the five latest changes), shown in the welcome window (src/components/Welcome.jsx).
// Version numbers count pushes to main: 1.00 was the first, so a push that lands after N commits on main is
// `${1 + floor(N / 100)}.${N % 100, two digits}` (the 73rd push is 1.72). Every change a user can see adds an entry at the top,
// sets VERSION to it and drops the oldest, so the window opens on the change log after an update. A new feature also needs
// its place in the tutorial in Welcome.jsx.
export const VERSION = '2.12';

export const CHANGELOG = [
  {
    version: '2.12', date: '2026-10-31', title: 'One-row question strip',
    items: [
      'In a practice session the numbered strip is now a single row that slides to keep the current question in view, so long sessions no longer fill the top of the page. The All button at its end opens a searchable list of every question.',
    ],
  },
  {
    version: '2.11', date: '2026-10-31', title: 'Timer at the bottom right, one-line menus, symbols fixed',
    items: [
      'The timer note on imported-set questions moved from the top right to the bottom right, so it no longer sits over the page header and the notifications.',
      'Fixed garbled symbols (the sparkle in the attempted-this-question window, the arrows in the shortcut hints, and the dots and ellipsis in a few labels) that appeared after the last update.',
      'Items in the three-dot and cog menus now stay on one line. A long one slides sideways while you hover over it, so you can read the end.',
    ],
  },
  {
    version: '2.10', date: '2026-10-31', title: 'Timer follows the theme',
    items: [
      'The timer note now uses the same colours as the rest of the page, so it is dark in the dark theme and light in the light theme.',
    ],
  },
  {
    version: '2.09', date: '2026-10-31', title: 'Question timers and a tidier Stats page',
    items: [
      'Questions now have a timer. Imported-set questions show a note at the top right (coding runs show it in the top bar): the time on this question and, in a practice session, the session total. It runs while you are on the question, pauses when you switch away or leave the window, and stops when you mark the question right or not right. Click a time to pause everything; the refresh button resets the question\'s time and takes it off the total.',
      'Each right or not right mark (or counted Run in a coding run, where a run that fails keeps the timer going and a pass stops it) saves a time for that attempt. The Stats pages of imported and coding sets show the average time per question, a Time block, a "time consuming" filter, and a click-to-open list of every attempt\'s time.',
      'Stats is reorganised into three blocks (Results, Progress, Time), and the questions are chosen with a sentence: Display (filter) questions, ranked by (measure) with a highest/lowest first button. The drop-downs search as you type. Worth another go and the By section table are gone, as the sentence covers them, and the coding Stats page loses its Compile errors and Crashes columns (compile errors now count as not passed).',
    ],
  },
  {
    version: '2.07', date: '2026-10-31', title: 'Search and menu at the top right',
    items: [
      'The search box and the three-dot menu in the top bar now sit at the right edge instead of next to the page tabs.',
    ],
  },
];

// Which tab the welcome window opens on, given the version stored the last time it was shown: null (nothing to show) when
// the user has seen this version, the tutorial for someone who has never seen it, the change log after an update.
export function startTab(seen) {
  if (seen === VERSION) return null;
  return seen === null || seen === undefined ? 'tutorial' : 'changelog';
}
