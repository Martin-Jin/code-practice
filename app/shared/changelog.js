// The app's version and its change log (the five latest changes), shown in the welcome window (src/components/Welcome.jsx).
// Version numbers count pushes to main: 1.00 was the first, so a push that lands after N commits on main is
// `${1 + floor(N / 100)}.${N % 100, two digits}` (the 73rd push is 1.72). Every change a user can see adds an entry at the top,
// sets VERSION to it and drops the oldest, so the window opens on the change log after an update. A new feature also needs
// its place in the tutorial in Welcome.jsx.
export const VERSION = '1.93';

export const CHANGELOG = [
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
  {
    version: '1.90', date: '2026-10-30', title: 'Question images copy in Firefox',
    items: [
      'Solve with agent now starts the image clipboard write with the button click, so Firefox keeps permission while it prepares the image. SVG question images are converted through an image element when Firefox cannot decode them as a bitmap.',
    ],
  },
  {
    version: '1.89', date: '2026-10-30', title: 'Hints and solution reminders',
    items: [
      'Library questions can open your chosen HTTPS AI chat website (Claude by default) and copy a prompt with the question, saved answers and notes. The prompt asks for your working first when none is provided; attach the question image manually if clipboard image copy is unavailable.',
      'The first time you open a solution for a question in a run, a short reminder asks whether you have attempted it. Confirm once to skip the reminder for that question in the rest of the run; a new run asks again. The S shortcut follows the same rule.',
      'Formula-sheet PDFs now render inside the app, keeping shortcuts such as Alt+T available after clicking the page. The top bar stays on one line, hides path breadcrumbs when less than a full word fits, and keeps History available as an icon on small screens.',
    ],
  },
];

// Which tab the welcome window opens on, given the version stored the last time it was shown: null (nothing to show) when
// the user has seen this version, the tutorial for someone who has never seen it, the change log after an update.
export function startTab(seen) {
  if (seen === VERSION) return null;
  return seen === null || seen === undefined ? 'tutorial' : 'changelog';
}
