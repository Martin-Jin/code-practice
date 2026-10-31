// toast('Saved'), toast('Something broke', 'bad') or toast('Moved it', 'info', { action: 'Undo', onClick }).
// A toast with an action is a button: clicking it runs onClick. The notifications are drawn by components/Toasts.jsx.
let push = () => {};

export function toast(message, kind = 'info', options = {}) { push(message, kind, options); }

// Called by the notification host; returns the function that disconnects it.
export function connect(fn) {
  push = fn;
  return () => { push = () => {}; };
}
