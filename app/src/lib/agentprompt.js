// The one prompt a user copies into an AI agent to have it interview them, build the practice PDF in the layout the app reads and
// walk them through importing it. It is the file docs/practice-pdf-agent-prompt.md, bundled as text (a test checks that it carries
// the layout in docs/practice-pdf-prompt.md).
import prompt from '../../../docs/practice-pdf-agent-prompt.md?raw';

export default prompt.trim();

// Puts text on the clipboard. The async API needs a secure page and a click; the fallback uses a hidden textarea. Returns whether it worked.
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
