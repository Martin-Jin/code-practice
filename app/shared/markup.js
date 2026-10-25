// Question text: a small Markdown subset with maths between $...$ (inline) and $$...$$ (display),
// rendered with KaTeX. Everything else is escaped, so text from a manifest cannot inject markup.
// Supported: paragraphs (blank line), line breaks, **bold**, *italic*, `code`, \$ for a dollar sign.
import katex from 'katex';

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const DOLLAR = '\u0000';

function math(tex, display) {
  try { return katex.renderToString(tex.replace(new RegExp(DOLLAR, 'g'), '\\$'), { displayMode: display, throwOnError: false, strict: 'ignore', output: 'htmlAndMathml' }); } catch { return `<code>${escapeHtml(tex)}</code>`; }
}

function plain(text) {
  return escapeHtml(text.replace(new RegExp(DOLLAR, 'g'), '$'))
    .replace(/`([^`\n]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')
    .replace(/\n/g, '<br>');
}

export function renderMarkup(text) {
  const source = String(text || '').replace(/\r\n/g, '\n').replace(/\\\$/g, DOLLAR).trim();
  if (!source) return '';
  return source.split(/\n{2,}/).map((paragraph) => {
    const html = paragraph.split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/).map((piece, i) => {
      if (i % 2 === 0) return plain(piece);
      return piece.startsWith('$$') ? math(piece.slice(2, -2), true) : math(piece.slice(1, -1), false);
    }).join('');
    return `<p>${html}</p>`;
  }).join('');
}

// Plain text of a question's wording for searching: the maths and markup characters are kept
// out of the way, so a search for "slender rod" finds it.
export const searchText = (text) => String(text || '').replace(/\$\$?([^$]*)\$\$?/g, ' $1 ').replace(/[*`\\{}^_]/g, ' ').replace(/\s+/g, ' ').trim();
