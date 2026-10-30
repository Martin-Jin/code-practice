import { useEffect, useState } from 'react';

let push = () => {};

// toast('Saved') or toast('Something broke', 'bad')
export function toast(message, kind = 'info') { push(message, kind); }

export function validationError(message) { toast(message, 'bad'); }

export default function ToastHost() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    let id = 0;
    push = (message, kind) => {
      const item = { id: ++id, message, kind };
      setItems((l) => [...l, item]);
      setTimeout(() => setItems((l) => l.filter((x) => x !== item)), kind === 'bad' ? 5200 : 3500);
    };
    return () => { push = () => {}; };
  }, []);
  return (
    <div id="toasts">
      {items.map((t) => <div key={t.id} className={`toast ${t.kind}`} role={t.kind === 'bad' ? 'alert' : 'status'}>{t.message}</div>)}
    </div>
  );
}
