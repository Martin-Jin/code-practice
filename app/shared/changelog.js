// The app's version and its change log (the five latest changes), shown in the welcome window (src/components/Welcome.jsx).
// Version numbers count pushes to main: 1.00 was the first, so a push that lands after N commits on main is
// `${1 + floor(N / 100)}.${N % 100, two digits}` (the 73rd push is 1.72). Every change a user can see adds an entry at the top,
// sets VERSION to it and drops the oldest, so the window opens on the change log after an update. A new feature also needs
// its place in the tutorial in Welcome.jsx.
export const VERSION = '1.83';

export const CHANGELOG = [
  {
    version: '1.83', date: '2026-10-30', title: 'Wider side panel, tidier answers, crop moved',
    items: [
      'The side panel on the question page is wider, and the Previous and Next buttons are gone (the arrow keys still move between questions; a practice session keeps Finish and Results, and its numbered strip).',
      'The answer box of each part now starts at the left edge of its label, below the wording, instead of beside it.',
      'The Top and Bottom crop settings of a PDF question moved out of the answer key editor into the Edit the question window (the pencil beside Question in edit mode), so editing answers no longer shows them.',
    ],
  },
  {
    version: '1.82', date: '2026-10-30', title: 'Question page: controls in the side panel, bigger question',
    items: [
      'On an imported question, Previous and Next and the I got it / Not quite buttons moved to the side panel under Notes, with the shortcut hints beneath them, so the question card no longer needs extra height.',
      'The question column is wider, so the question image shows larger.',
      'The question title is smaller and kept to one line; a longer title slides along to show the rest when you hover or focus it, and can be scrolled by hand.',
    ],
  },
  {
    version: '1.81', date: '2026-10-30', title: 'The formula sheet sits flush under the top bar',
    items: [
      'The formula sheet now starts exactly under the top bar (no gap, even when the bar wraps on a narrow or zoomed window) and fills the page down to the bottom, still opening over the question.',
    ],
  },
  {
    version: '1.79', date: '2026-10-30', title: 'A tidier section heading',
    items: [
      'The Questions in this set heading on an imported set\'s page is slightly larger and sits closer to the section picker below it.',
    ],
  },
  {
    version: '1.78', date: '2026-10-30', title: 'Pick a section, and mark a whole section correct',
    items: [
      'An imported set\'s page now shows one section at a time. Under Questions in this set, click the underlined section name to turn it into a search box and pick a section from the matching list (arrow keys and Enter work).',
      'A tick beside it, Mark all correct, counts every question in the shown section as answered correctly, for work you finished before using the app. Questions already right are left alone, and it asks first.',
    ],
  },
];

// Which tab the welcome window opens on, given the version stored the last time it was shown: null (nothing to show) when
// the user has seen this version, the tutorial for someone who has never seen it, the change log after an update.
export function startTab(seen) {
  if (seen === VERSION) return null;
  return seen === null || seen === undefined ? 'tutorial' : 'changelog';
}
