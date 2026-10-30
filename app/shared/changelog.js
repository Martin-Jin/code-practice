// The app's version and its change log (the five latest changes), shown in the welcome window (src/components/Welcome.jsx).
// Version numbers count pushes to main: 1.00 was the first, so a push that lands after N commits on main is
// `${1 + floor(N / 100)}.${N % 100, two digits}` (the 73rd push is 1.72). Every change a user can see adds an entry at the top,
// sets VERSION to it and drops the oldest, so the window opens on the change log after an update. A new feature also needs
// its place in the tutorial in Welcome.jsx.
export const VERSION = '1.95';

export const CHANGELOG = [
  {
    version: '1.95', date: '2026-10-30', title: 'Pinned PDF reset and roomier chat choice',
    items: [
      'The formula PDF Reset control stays in the sticky toolbar while you scroll, and the tutoring chat choice now sizes to fit its buttons.',
    ],
  },
  {
    version: '1.94', date: '2026-10-30', title: 'Tighter location breadcrumbs',
    items: [
      'Folder paths in the top bar now sit directly between their slash separators, with no uneven spacing.',
    ],
  },
  {
    version: '1.93', date: '2026-10-30', title: 'Sharper formula sheets',
    items: [
      'Formula-sheet PDFs now render at higher resolution without changing their displayed size, and the zoom Reset control works reliably.',
    ],
  },
  {
    version: '1.92', date: '2026-10-30', title: 'Choose where to open the tutor',
    items: [
      'Solve with agent now offers Claude Desktop or the configured chat website from one button. The clipboard includes the prompt as text and rich HTML with the question image embedded, alongside the image itself; chats that accept rich clipboard content can receive both in one paste.',
    ],
  },
  {
    version: '1.91', date: '2026-10-30', title: 'Try Claude Desktop',
    items: [
      'The solution view can launch Claude Desktop through its standard claude:// link and copy the tutoring prompt; the configured website remains available as a fallback.',
    ],
  },
];

// Which tab the welcome window opens on, given the version stored the last time it was shown: null (nothing to show) when
// the user has seen this version, the tutorial for someone who has never seen it, the change log after an update.
export function startTab(seen) {
  if (seen === VERSION) return null;
  return seen === null || seen === undefined ? 'tutorial' : 'changelog';
}
