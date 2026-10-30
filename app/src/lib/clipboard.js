// Puts text on the clipboard. The async API needs a secure page and a click; the fallback uses a hidden textarea.
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const box = document.createElement('textarea');
    box.value = text;
    box.setAttribute('readonly', '');
    box.style.cssText = 'position:fixed;top:-100px;opacity:0';
    document.body.appendChild(box);
    box.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { /* not allowed */ }
    box.remove();
    return ok;
  }
}
