import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { state } from '../../lib/store.js';
import { getQuestion } from '../../lib/catalog.js';
import { saveCode, setCurrent, flushSaves } from '../../lib/service.js';
import { toast } from '../../components/Toasts.jsx';

// The Monaco editor. One model per question, so undo history and cursor position survive
// switching questions. Exposes getCode / setCode / setMarkers / reveal to the run view.
const EditorPane = forwardRef(function EditorPane({ run, n, dark, onRun, autoSuggest, onAutoSuggest }, ref) {
  const host = useRef(null);
  const live = useRef({});          // editor, monaco module, models, view states
  const [ready, setReady] = useState(false);
  const onRunRef = useRef(onRun);
  onRunRef.current = onRun;
  const onAutoSuggestRef = useRef(onAutoSuggest);
  onAutoSuggestRef.current = onAutoSuggest;

  useImperativeHandle(ref, () => ({
    getCode: () => (live.current.editor ? live.current.editor.getValue() : run.state[n].code),
    setCode: (code) => live.current.editor && live.current.editor.setValue(code),
    focus: () => live.current.editor && live.current.editor.focus(),
    format: () => {
      const { editor } = live.current;
      if (!editor) return;
      editor.focus();
      const action = editor.getAction('editor.action.formatDocument');
      if (action) action.run();
    },
    // Drop unsaved edits (used right before the run is reset, so they cannot overwrite the reset).
    discard: () => live.current.dirty && live.current.dirty.clear(),
    // Save edits still waiting on the autosave timer, then write everything to disk now.
    flush: () => {
      const { models, dirty } = live.current;
      if (models) {
        for (const [k, m] of models) {
          if (dirty.has(k)) { saveCode(run.id, k, m.getValue()); dirty.delete(k); }
        }
      }
      flushSaves();
    },
    reveal: (line, col) => {
      const { editor } = live.current;
      if (!editor) return;
      editor.revealLineInCenter(line);
      editor.setPosition({ lineNumber: line, column: col || 1 });
      editor.focus();
    },
    setMarkers: (diags) => {
      const { monaco, editor } = live.current;
      if (!monaco || !editor) return;
      const model = editor.getModel();
      const sev = { error: monaco.MarkerSeverity.Error, warning: monaco.MarkerSeverity.Warning, note: monaco.MarkerSeverity.Info };
      monaco.editor.setModelMarkers(model, 'g++', diags.filter((d) => d.answerLine).map((d) => ({
        severity: sev[d.severity], message: d.message, startLineNumber: d.answerLine, startColumn: d.col,
        endLineNumber: d.answerLine, endColumn: model.getLineMaxColumn(d.answerLine),
      })));
    },
  }));

  // Create the editor once.
  useEffect(() => {
    let disposed = false;
    import('../../lib/monaco.js').then((mod) => {
      if (disposed) return;
      const { monaco, createEditor } = mod;
      const editor = createEditor(host.current, state.catalog.editor, dark);
      mod.setFormatErrorHandler((message) => toast(message, 'bad'));
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => onRunRef.current());
      // Ctrl+Space opens the suggestion list and also turns on suggestions-as-you-type.
      const openSuggestions = () => { onAutoSuggestRef.current(true); editor.trigger('keyboard', 'editor.action.triggerSuggest', {}); };
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space, openSuggestions);
      editor.addCommand(monaco.KeyMod.WinCtrl | monaco.KeyCode.Space, openSuggestions);
      // dirty: questions edited since their last autosave
      live.current = { editor, monaco, mod, models: new Map(), views: new Map(), dirty: new Set() };
      setReady(true);
    });
    return () => {
      disposed = true;
      const { editor, models } = live.current;
      if (models) {
        // Save edits still waiting on the autosave timer before the models go away.
        for (const [k, m] of models) {
          if (live.current.dirty.has(k)) saveCode(run.id, k, m.getValue());
          m.dispose();
        }
      }
      if (editor) editor.dispose();
      live.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show the model for the selected question.
  useEffect(() => {
    if (!ready) return undefined;
    const { editor, monaco, mod, models, views } = live.current;
    const prev = editor.getModel();
    if (prev) for (const [k, m] of models) if (m === prev) views.set(k, editor.saveViewState());

    let model = models.get(n);
    if (!model) {
      const uri = monaco.Uri.parse(`inmemory://${run.id}/q${n}.cpp`);
      model = monaco.editor.createModel(run.state[n].code, 'cpp', uri);
      mod.providedCode.set(uri.toString(), getQuestion(run.setId, n).provided);
      let timer;
      model.onDidChangeContent(() => {
        monaco.editor.setModelMarkers(model, 'g++', []);  // old compiler squiggles no longer match the text
        live.current.dirty.add(n);
        clearTimeout(timer);
        timer = setTimeout(() => {
          const { dirty } = live.current;
          if (!dirty || !dirty.has(n)) return;  // discarded or unmounted in the meantime
          saveCode(run.id, n, model.getValue());
          dirty.delete(n);
        }, 500);
      });
      models.set(n, model);
    }
    editor.setModel(model);
    const view = views.get(n);
    if (view) editor.restoreViewState(view);
    setCurrent(run.id, n);
    return undefined;
  }, [ready, n, run.id]);

  useEffect(() => {
    if (ready) live.current.mod.setTheme(dark);
  }, [ready, dark]);

  // Suggestions as you type are off until Ctrl+Space turns them on.
  useEffect(() => {
    if (!ready) return;
    const base = state.catalog.editor;
    live.current.editor.updateOptions(autoSuggest
      ? { quickSuggestions: { other: true, comments: false, strings: false }, suggestOnTriggerCharacters: true }
      : { quickSuggestions: base.quickSuggestions ?? false, suggestOnTriggerCharacters: base.suggestOnTriggerCharacters ?? false });
  }, [ready, autoSuggest]);

  return <div className="editor-host" ref={host} />;
});

export default EditorPane;
