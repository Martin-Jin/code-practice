// Turns the repo's .vscode/settings.json into Monaco editor options, so the web editor
// behaves like the VS Code workspace (no auto-popup suggestions, bracket auto-closing, ...).
import fs from 'node:fs';

// settings.json allows comments and trailing commas.
function parseJsonc(text) {
  let out = '', i = 0, inStr = false;
  while (i < text.length) {
    const c = text[i], n = text[i + 1];
    if (inStr) {
      out += c;
      if (c === '\\') { out += n; i += 2; continue; }
      if (c === '"') inStr = false;
      i++;
    } else if (c === '"') { inStr = true; out += c; i++; }
    else if (c === '/' && n === '/') { while (i < text.length && text[i] !== '\n') i++; }
    else if (c === '/' && n === '*') { i = text.indexOf('*/', i + 2); i = i < 0 ? text.length : i + 2; }
    else { out += c; i++; }
  }
  return JSON.parse(out.replace(/,(\s*[}\]])/g, '$1'));
}

// VS Code settings that have no meaning in an embedded editor.
const SKIP = new Set(['codeActionsOnSave', 'formatOnSave', 'defaultFormatter']);

function toMonaco(settings) {
  const options = {};
  for (const [key, value] of Object.entries(settings)) {
    if (!key.startsWith('editor.')) continue;
    const name = key.slice('editor.'.length);
    if (SKIP.has(name)) continue;
    const [head, sub] = name.split('.');
    if (sub) {
      // e.g. hover.enabled is "on"/"off" in VS Code but a boolean in Monaco.
      const v = head === 'hover' && (value === 'on' || value === 'off') ? value === 'on' : value;
      options[head] = { ...(options[head] || {}), [sub]: v };
    } else {
      options[head] = value;
    }
  }
  return options;
}

export function editorOptions(settingsFile) {
  try {
    const settings = parseJsonc(fs.readFileSync(settingsFile, 'utf8'));
    return { ...toMonaco(settings), ...toMonaco(settings['[cpp]'] || {}) };
  } catch {
    return {};
  }
}
