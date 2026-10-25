import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

export function Modal({ title, children, footer, onClose, wide }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
    return () => { if (d && d.open) d.close(); };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal${wide ? ' wide' : ''}`}
      onCancel={(e) => { e.preventDefault(); onClose && onClose(); }}
      onMouseDown={(e) => { if (e.target === ref.current && onClose) onClose(); }}
    >
      <form method="dialog" onSubmit={(e) => e.preventDefault()}>
        <div className="m-head"><h2>{title}</h2></div>
        <div className="m-body">{children}</div>
        <div className="m-foot">{footer}</div>
      </form>
    </dialog>
  );
}

const Ctx = createContext(null);
export const useDialogs = () => useContext(Ctx);

function PromptBody({ label, initial, placeholder, onSubmit }) {
  const [value, setValue] = useState(initial || '');
  return (
    <>
      <label className="muted" htmlFor="prompt-input">{label}</label>
      <input
        id="prompt-input" type="text" autoFocus value={value} placeholder={placeholder}
        onChange={(e) => { setValue(e.target.value); onSubmit.current = e.target.value; }}
        onKeyDown={(e) => { if (e.key === 'Enter') onSubmit.confirm(); }}
      />
    </>
  );
}

// Promise-based dialogs: `await confirm({...})`, `await prompt({...})`, `await open(({close}) => <Modal/>)`.
export function DialogProvider({ children }) {
  const [stack, setStack] = useState([]);
  const resolvers = useRef(new Map());
  const uid = useRef(0);

  const close = useCallback((id, value) => {
    const resolve = resolvers.current.get(id);
    resolvers.current.delete(id);
    setStack((s) => s.filter((d) => d.id !== id));
    if (resolve) resolve(value);
  }, []);

  const open = useCallback((render) => new Promise((resolve) => {
    const id = ++uid.current;
    resolvers.current.set(id, resolve);
    setStack((s) => [...s, { id, render }]);
  }), []);

  const confirm = useCallback(({ title, body, confirmText = 'Confirm', danger = false, cancelText = 'Cancel' }) =>
    open(({ close: done }) => (
      <Modal
        title={title}
        onClose={() => done(false)}
        footer={(
          <>
            <button type="button" className="btn" onClick={() => done(false)}>{cancelText}</button>
            <button type="button" className={`btn ${danger ? 'danger solid' : 'primary'}`} autoFocus onClick={() => done(true)}>{confirmText}</button>
          </>
        )}
      >
        {typeof body === 'string' ? <p>{body}</p> : body}
      </Modal>
    )), [open]);

  const prompt = useCallback(({ title, label, initial = '', placeholder = '', confirmText = 'Save' }) => {
    const holder = { current: initial, confirm: () => {} };  // survives re-renders of the dialog
    return open(({ close: done }) => {
      holder.confirm = () => done(holder.current);
      return (
        <Modal
          title={title}
          onClose={() => done(null)}
          footer={(
            <>
              <button type="button" className="btn" onClick={() => done(null)}>Cancel</button>
              <button type="button" className="btn primary" onClick={() => holder.confirm()}>{confirmText}</button>
            </>
          )}
        >
          <PromptBody label={label} initial={initial} placeholder={placeholder} onSubmit={holder} />
        </Modal>
      );
    });
  }, [open]);

  return (
    <Ctx.Provider value={{ open, confirm, prompt }}>
      {children}
      {stack.map((d) => <div key={d.id}>{d.render({ close: (v) => close(d.id, v) })}</div>)}
    </Ctx.Provider>
  );
}
