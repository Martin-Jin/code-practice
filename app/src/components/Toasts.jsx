import { useEffect, useState } from 'react';

let push = () => {};

// toast('Saved') or toast('Something broke', 'bad')
export function toast(message, kind = 'info') { push(message, kind); }

export default function ToastHost() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    let id = 0;
    push = (message, kind) => {
      const item = { id: ++id, message, kind };
      setItems((l) => [...l, item]);
      setTimeout(() => setItems((l) => l.filter((x) => x !== item)), kind === 'bad' ? 7000 : 3500);
    };
    return () => { push = () => {}; };
  }, []);
  return (
    <div id="toasts" role="status" aria-live="polite">
      {items.map((t) => <div key={t.id} className={`toast ${t.kind}`}>{t.message}</div>)}
    </div>
  );
}
