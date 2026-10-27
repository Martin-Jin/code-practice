// Keyboard shortcuts: the actions that can be rebound, how a combination is written
// ("Ctrl+Shift+Enter") and which browser shortcuts deserve a warning. Pure functions, so they
// can be unit tested; the saved choices live in store.js and service.js.

export const ACTIONS = [
  { id: 'search', group: 'Anywhere', label: 'Search questions', def: 'Ctrl+P' },
  { id: 'run', group: 'In a run', label: 'Compile and run the tests', def: 'Ctrl+Shift+Enter' },
  { id: 'exit', group: 'In a run', label: 'Go back to the dashboard', def: 'Escape' },
  { id: 'task', group: 'In a run', label: 'Show or hide the task', def: 'Alt+T' },
  { id: 'side', group: 'In a run', label: 'Show or hide the questions', def: 'Alt+Q' },
  { id: 'output', group: 'In a run', label: 'Show or hide the output', def: 'Alt+O' },
  { id: 'suggest', group: 'In the editor', label: 'Open name suggestions', def: 'Ctrl+Space' },
  { id: 'format', group: 'In the editor', label: 'Format the code', def: 'Alt+Shift+F' },
];

// Shortcuts that cannot be changed (shown in the help dialog for completeness).
export const FIXED = [
  { group: 'Anywhere', label: 'Command palette: add a question, upload, move a set to a folder, go to a set, and more', combo: 'Alt+K' },
  { group: 'Anywhere', label: 'Search question sets and questions (dashboard)', combo: '/' },
  { group: 'Anywhere', label: 'Show or hide the formula sheets (practice questions)', combo: 'Alt+T' },
];

export const comboFor = (id, overrides = {}) => overrides[id] || ACTIONS.find((a) => a.id === id).def;
export const actionFor = (combo, overrides = {}) => ACTIONS.find((a) => comboFor(a.id, overrides) === combo);

const IGNORED = ['Control', 'Alt', 'Shift', 'Meta', 'AltGraph', 'Dead', 'Unidentified'];

// Letters and digits come from e.code so Shift or a non-US layout does not change the name.
function keyName(e) {
  if (/^Key[A-Z]$/.test(e.code || '')) return e.code.slice(3);
  if (/^Digit\d$/.test(e.code || '')) return e.code.slice(5);
  if (e.key === ' ') return 'Space';
  if (!e.key || IGNORED.includes(e.key)) return null;
  return e.key.length === 1 ? e.key.toUpperCase() : e.key;
}

// "Ctrl+Alt+Shift+Key". Cmd counts as Ctrl. Null while only a modifier is down.
export function eventCombo(e) {
  const key = keyName(e);
  if (!key) return null;
  const parts = [];
  if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey) parts.push('Shift');
  parts.push(key);
  return parts.join('+');
}

// What common browser (and editor) shortcuts do, so a clash can be explained.
const BROWSER = {
  'Ctrl+T': 'opens a new browser tab', 'Ctrl+Shift+T': 'reopens the last closed tab', 'Ctrl+W': 'closes the tab',
  'Ctrl+Shift+W': 'closes the window', 'Ctrl+N': 'opens a new browser window', 'Ctrl+Shift+N': 'opens a private window',
  'Ctrl+Tab': 'switches browser tab', 'Ctrl+Shift+Tab': 'switches browser tab', 'Ctrl+PageUp': 'switches browser tab',
  'Ctrl+PageDown': 'switches browser tab', 'Alt+F4': 'closes the window', 'Ctrl+Q': 'quits the browser on some systems',
  'Ctrl+L': 'focuses the address bar', 'Alt+D': 'focuses the address bar', F6: 'focuses the address bar',
  'Ctrl+K': 'focuses the browser search box', 'Ctrl+E': 'focuses the browser search box',
  'Ctrl+D': 'bookmarks the page', 'Ctrl+Shift+D': 'bookmarks all tabs', 'Ctrl+Shift+B': 'shows the bookmarks bar',
  'Ctrl+F': 'finds in the page', 'Ctrl+G': 'finds the next match', F3: 'finds the next match',
  'Ctrl+H': 'opens the history', 'Ctrl+J': 'opens the downloads', 'Ctrl+Shift+Delete': 'clears browsing data',
  'Ctrl+R': 'reloads the page', 'Ctrl+Shift+R': 'reloads the page', F5: 'reloads the page',
  'Ctrl+U': 'shows the page source', 'Ctrl+O': 'opens a file', 'Ctrl+S': 'saves the page (this app ignores it)',
  'Ctrl+P': 'prints the page',
  'Ctrl+Shift+I': 'opens the developer tools', 'Ctrl+Shift+J': 'opens the developer tools', 'Ctrl+Shift+C': 'opens the developer tools',
  F12: 'opens the developer tools', F11: 'toggles full screen', F1: 'opens the browser help', F7: 'toggles caret browsing',
  'Ctrl+0': 'resets the zoom', 'Ctrl+-': 'zooms out', 'Ctrl+=': 'zooms in', 'Ctrl++': 'zooms in',
  'Alt+ArrowLeft': 'goes back a page', 'Alt+ArrowRight': 'goes forward a page', 'Alt+Home': 'goes to the home page',
  'Ctrl+A': 'selects all text', 'Ctrl+C': 'copies', 'Ctrl+V': 'pastes', 'Ctrl+X': 'cuts', 'Ctrl+Z': 'undoes in the editor',
  'Ctrl+Y': 'redoes in the editor', 'Ctrl+Enter': 'inserts a line below in the editor',
};
for (let i = 1; i <= 9; i += 1) BROWSER[`Ctrl+${i}`] = 'switches to a browser tab';

export const browserClash = (combo) => BROWSER[combo] || null;

// Is this combination acceptable for `id`? { error } blocks it, { warning } asks the user to confirm.
export function checkCombo(combo, id, overrides = {}) {
  const parts = combo.split('+');
  const key = parts[parts.length - 1];
  if (combo !== 'Escape' && !parts.includes('Ctrl') && !parts.includes('Alt') && !/^F\d{1,2}$/.test(key)) {
    return { error: 'Include Ctrl or Alt (or use a function key), so ordinary typing is not affected.' };
  }
  const other = ACTIONS.find((a) => a.id !== id && comboFor(a.id, overrides) === combo);
  if (other) return { error: `${combo} is already used to ${other.label.toLowerCase()}. Change that one first.` };
  const clash = browserClash(combo);
  if (clash) return { warning: `${combo} ${clash}, so it may not work reliably or may do both.` };
  return {};
}
