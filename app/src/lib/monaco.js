// Monaco (the editor inside VS Code), loaded only when a run is opened. Editor options come
// from the repo's .vscode/settings.json via catalog.json, so it behaves like the workspace.
import * as monaco from 'monaco-editor/esm/vs/editor/edcore.main.js';
import 'monaco-editor/esm/vs/basic-languages/cpp/cpp.contribution.js';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker.js?worker';

self.MonacoEnvironment = { getWorker: () => new EditorWorker() };

import { formatCpp } from './format-code.js';

export { monaco };

// model uri -> the question's provided code, so Ctrl+Space can suggest its names too
export const providedCode = new Map();

const KEYWORDS = ['auto', 'bool', 'break', 'case', 'catch', 'char', 'class', 'const', 'continue', 'delete', 'do', 'double',
  'else', 'enum', 'false', 'float', 'for', 'if', 'int', 'long', 'new', 'nullptr', 'private', 'protected', 'public',
  'return', 'short', 'sizeof', 'static', 'struct', 'switch', 'template', 'this', 'throw', 'true', 'try', 'typename',
  'unsigned', 'void', 'while'];
const STD_NAMES = ['std', 'cout', 'cin', 'cerr', 'endl', 'string', 'vector', 'size_t', 'complex', 'abs', 'sqrt', 'pow',
  'sin', 'cos', 'exp', 'arg', 'conj', 'polar', 'swap', 'min', 'max', 'to_string', 'ostringstream', 'getline', 'pair',
  'make_pair', 'M_PI', 'INT_MAX', 'INT_MIN'];

const strip = (code) => code
  .replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/.*$/gm, ' ')
  .replace(/"(?:\\.|[^"\\\n])*"/g, '""').replace(/'(?:\\.|[^'\\\n])*'/g, "''");

function identifiers(code) {
  const text = strip(code);
  const counts = new Map();
  for (const m of text.matchAll(/[A-Za-z_]\w*/g)) counts.set(m[0], (counts.get(m[0]) || 0) + 1);
  const kinds = new Map();
  for (const name of counts.keys()) {
    const esc = name.replace(/[$]/g, '\\$&');
    if (new RegExp(`\\b(?:class|struct|enum)\\s+${esc}\\b`).test(text)) kinds.set(name, 'Class');
    else if (new RegExp(`\\b${esc}\\s*\\(`).test(text)) kinds.set(name, 'Function');
    else kinds.set(name, 'Variable');
  }
  return { counts, kinds };
}

let registered = false;
function registerCompletions() {
  if (registered) return;
  registered = true;
  const kind = (k) => monaco.languages.CompletionItemKind[k];
  monaco.languages.registerCompletionItemProvider('cpp', {
    provideCompletionItems(model, position) {
      const word = model.getWordUntilPosition(position);
      const range = new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn);
      const mine = identifiers(model.getValue());
      const provided = identifiers(providedCode.get(model.uri.toString()) || '');
      const seen = new Set();
      const suggestions = [];
      const add = (label, k, detail, rank) => {
        if (seen.has(label) || label.length < 2) return;
        seen.add(label);
        suggestions.push({ label, kind: kind(k), insertText: label, detail, range, sortText: rank + label });
      };
      for (const [name, count] of mine.counts) {
        // The word being typed counts once; do not offer it back to itself.
        if (name === word.word && count === 1) continue;
        add(name, mine.kinds.get(name), 'your code', '0');
      }
      for (const name of provided.counts.keys()) add(name, provided.kinds.get(name), 'provided code', '1');
      for (const name of KEYWORDS) add(name, 'Keyword', 'keyword', '2');
      for (const name of STD_NAMES) add(name, 'Reference', 'std', '3');
      return { suggestions };
    },
  });
}

// Shift+Alt+F (Monaco's own binding) and the Format button run clang-format on the whole answer.
let formatError = () => {};
export const setFormatErrorHandler = (fn) => { formatError = fn; };

let formatterRegistered = false;
function registerFormatter() {
  if (formatterRegistered) return;
  formatterRegistered = true;
  monaco.languages.registerDocumentFormattingEditProvider('cpp', {
    displayName: 'clang-format (Google style)',
    async provideDocumentFormattingEdits(model) {
      try {
        return [{ range: model.getFullModelRange(), text: await formatCpp(model.getValue()) }];
      } catch (e) {
        formatError(`Could not format the code: ${e && e.message ? e.message : e}`);
        return [];
      }
    },
  });
}

export function setTheme(dark) {
  monaco.editor.setTheme(dark ? 'vs-dark' : 'vs');
}

export function createEditor(container, vscodeOptions, dark) {
  registerCompletions();
  registerFormatter();
  return monaco.editor.create(container, {
    language: 'cpp',
    theme: dark ? 'vs-dark' : 'vs',
    automaticLayout: true,
    minimap: { enabled: false },
    fontSize: 14,
    scrollBeyondLastLine: false,
    renderWhitespace: 'selection',
    padding: { top: 8 },
    ...vscodeOptions,
    // Enter accepts a suggestion just like Tab (the VS Code settings turn this off).
    acceptSuggestionOnEnter: 'on',
  });
}
