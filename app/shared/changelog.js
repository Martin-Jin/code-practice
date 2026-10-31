// The app's version and its change log (the five latest changes), shown in the welcome window (src/components/Welcome.jsx).
// Version numbers count pushes to main: 1.00 was the first, so a push that lands after N commits on main is
// `${1 + floor(N / 100)}.${N % 100, two digits}` (the 73rd push is 1.72). Every change a user can see adds an entry at the top,
// sets VERSION to it and drops the oldest, so the window opens on the change log after an update. A new feature also needs
// its place in the tutorial in Welcome.jsx.
export const VERSION = '2.14';

export const CHANGELOG = [
  {
    version: '2.14', date: '2026-10-31', title: 'Recent sessions beside the practice options',
    items: [
      'An imported set page now lists its latest practice sessions in the space beside the practice options, as many as fit, each opening its session or results. See all opens the window with every past session. The History button beside the title is gone, and the practice options block is a little narrower.',
    ],
  },
  {
    version: '2.13', date: '2026-10-31', title: 'Cleaner top bar in a session',
    items: [
      'During a practice session the top bar keeps only the logo, the menu and the timer, which now sits in the middle. The page tabs and the search box are hidden, since the All button on the question strip searches the session.',
      'Fixed the question strip with a long session: it stretched the page instead of scrolling within one row.',
    ],
  },
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
];

// Which tab the welcome window opens on, given the version stored the last time it was shown: null (nothing to show) when
// the user has seen this version, the tutorial for someone who has never seen it, the change log after an update.
export function startTab(seen) {
  if (seen === VERSION) return null;
  return seen === null || seen === undefined ? 'tutorial' : 'changelog';
}
