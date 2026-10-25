import { useEffect, useRef, useState } from 'react';
import { useStore } from '../lib/store.js';
import { addMineQuestion } from '../lib/mine.js';
import { Modal } from './Dialogs.jsx';
import { PartsEditor, blankDrafts, partsOf } from './Parts.jsx';
import { toast } from './Toasts.jsx';

const MAX_WIDTH = 1400;   // stored images are scaled down to this width
const VIEW_WIDTH = 540;   // the cropping canvas

function encode(canvas) {
  const webp = canvas.toDataURL('image/webp', 0.92);
  return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/png');
}
const extensionOf = (dataUrl) => (dataUrl.startsWith('data:image/webp') ? 'webp' : 'png');

// Takes an image (pasted, dropped or chosen), lets the user drag a box over the part to keep, and
// hands back the result as a data URL. `file` is an image the parent received from a paste.
function ImagePicker({ label, hint, value, onChange, file }) {
  const [img, setImg] = useState(null);       // the picture being cropped
  const [box, setBox] = useState(null);       // the selection, in picture pixels: { x, y, w, h }
  const canvas = useRef(null);
  const drag = useRef(null);

  const load = (f) => {
    if (!f || !f.type.startsWith('image/')) { toast('That is not an image.', 'bad'); return; }
    const url = URL.createObjectURL(f);
    const image = new Image();
    image.onload = () => { setImg(image); setBox(null); URL.revokeObjectURL(url); };
    image.onerror = () => { toast('That image could not be read.', 'bad'); URL.revokeObjectURL(url); };
    image.src = url;
  };
  useEffect(() => { if (file) load(file); }, [file]);

  const width = img ? Math.min(VIEW_WIDTH, img.naturalWidth) : 0;
  const scale = img ? width / img.naturalWidth : 1;
  useEffect(() => {
    if (!img) return;
    const c = canvas.current;
    c.width = width;
    c.height = Math.round(img.naturalHeight * scale);
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0, c.width, c.height);
    if (box && box.w > 1 && box.h > 1) {
      g.fillStyle = 'rgba(0,0,0,.5)';
      g.fillRect(0, 0, c.width, c.height);
      g.drawImage(img, box.x, box.y, box.w, box.h, box.x * scale, box.y * scale, box.w * scale, box.h * scale);
      g.strokeStyle = '#4c9aff';
      g.lineWidth = 2;
      g.strokeRect(box.x * scale, box.y * scale, box.w * scale, box.h * scale);
    }
  }, [img, box, width, scale]);

  const at = (e) => {
    const r = canvas.current.getBoundingClientRect();
    const clamp = (v, hi) => Math.min(hi, Math.max(0, v));
    return { x: clamp(((e.clientX - r.left) / r.width) * img.naturalWidth, img.naturalWidth), y: clamp(((e.clientY - r.top) / r.height) * img.naturalHeight, img.naturalHeight) };
  };
  const onDown = (e) => { drag.current = at(e); canvas.current.setPointerCapture(e.pointerId); setBox(null); };
  const onMove = (e) => {
    if (!drag.current) return;
    const p = at(e);
    setBox({ x: Math.min(drag.current.x, p.x), y: Math.min(drag.current.y, p.y), w: Math.abs(p.x - drag.current.x), h: Math.abs(p.y - drag.current.y) });
  };
  const onUp = () => { drag.current = null; };

  const keep = (region) => {
    const out = document.createElement('canvas');
    const k = Math.min(1, MAX_WIDTH / region.w);
    out.width = Math.max(1, Math.round(region.w * k));
    out.height = Math.max(1, Math.round(region.h * k));
    out.getContext('2d').drawImage(img, region.x, region.y, region.w, region.h, 0, 0, out.width, out.height);
    onChange(encode(out));
    setImg(null);
    setBox(null);
  };

  return (
    <div className="stack">
      <b>{label}</b>
      {value && !img && (
        <div className="stack">
          <img src={value} alt={`${label}, as it will be saved`} className="lib-image" style={{ maxHeight: 260, objectFit: 'contain', justifySelf: 'start' }} />
          <div className="row"><button type="button" className="btn sm" onClick={() => onChange(null)}>Remove the image</button></div>
        </div>
      )}
      {img && (
        <div className="stack">
          <span className="muted">Drag a box over the part to keep. Leave it out to keep the whole image.</span>
          <canvas ref={canvas} style={{ maxWidth: '100%', cursor: 'crosshair', touchAction: 'none', border: '1px solid var(--border)', borderRadius: 8 }}
            onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} aria-label={`${label}: drag to choose the part to keep`} />
          <div className="row">
            <button type="button" className="btn sm primary" disabled={!box || box.w < 4 || box.h < 4} onClick={() => keep(box)}>Keep the selection</button>
            <button type="button" className="btn sm" onClick={() => keep({ x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight })}>Keep the whole image</button>
            <button type="button" className="btn sm ghost" onClick={() => { setImg(null); setBox(null); }}>Cancel</button>
          </div>
        </div>
      )}
      {!value && !img && (
        <div
          className="dropzone" tabIndex={0}
          onPaste={(e) => { const f = [...e.clipboardData.files].find((x) => x.type.startsWith('image/')); if (f) { e.preventDefault(); load(f); } }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); load(e.dataTransfer.files[0]); }}
        >
          <span>{hint}</span>
          <label className="btn sm">Choose an image<input type="file" accept="image/*" hidden onChange={(e) => { load(e.target.files[0]); e.target.value = ''; }} /></label>
        </div>
      )}
    </div>
  );
}

// Make a question of your own: a pasted screenshot or typed wording, the parts to answer, and
// optionally a solution. It is saved in "My questions".
export default function AddQuestionDialog({ close }) {
  const st = useStore();
  const [title, setTitle] = useState('');
  const [section, setSection] = useState('');
  const [source, setSource] = useState('');
  const [marks, setMarks] = useState('');
  const [tags, setTags] = useState('');
  const [wording, setWording] = useState('');
  const [stemImage, setStemImage] = useState(null);
  const [solImage, setSolImage] = useState(null);
  const [solText, setSolText] = useState('');
  const [parts, setParts] = useState(blankDrafts);
  const [pasted, setPasted] = useState({ stem: null, sol: null });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const sections = [...new Set(Object.values(st.library.sets).flatMap((s) => s.manifest.questions.map((q) => q.section)))];

  // Ctrl+V anywhere in the dialog fills the question's image first, then the solution's.
  useEffect(() => {
    const onPaste = (e) => {
      if (e.target.closest && e.target.closest('.dropzone')) return;   // a zone takes its own paste
      const f = [...(e.clipboardData ? e.clipboardData.files : [])].find((x) => x.type.startsWith('image/'));
      if (!f) return;
      e.preventDefault();
      setPasted(stemImage ? { stem: null, sol: f } : { stem: f, sol: null });
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [stemImage]);

  const save = async () => {
    setError('');
    if (!title.trim()) return setError('Give the question a title, like "Rigid body kinetics - mass of a slender-rod assembly".');
    if (!section.trim()) return setError('Choose or type a section.');
    if (!wording.trim() && !stemImage) return setError('Add the question as an image or as typed wording.');
    let list;
    try { list = partsOf(parts); } catch (e) { return setError(e.message); }
    const images = {};
    const stem = {};
    if (wording.trim()) stem.text = wording.trim();
    if (stemImage) { stem.image = `images/{uid}.${extensionOf(stemImage)}`; images[stem.image] = stemImage; }
    let solution = null;
    if (solImage || solText.trim()) {
      solution = {};
      if (solText.trim()) solution.text = solText.trim();
      if (solImage) { const path = `images/{uid}-solution.${extensionOf(solImage)}`; solution.images = [path]; images[path] = solImage; }
    }
    const question = {
      title: title.trim(), section: section.trim(), source: source.trim(), marks: marks.trim() === '' ? null : Number(marks),
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean), stem, parts: list, solution, flags: [],
    };
    setBusy(true);
    try {
      const uid = await addMineQuestion(question, images);
      close(true);
      toast('Question saved in My questions.');
      window.location.hash = `#/q/mine/${encodeURIComponent(uid)}`;
    } catch (e) {
      setError(`Not saved. ${e.message}`);
      setBusy(false);
    }
  };

  return (
    <Modal
      wide title="Add a question" onClose={() => !busy && close(false)}
      footer={(
        <>
          <button type="button" className="btn" disabled={busy} onClick={() => close(false)}>Cancel</button>
          <button type="button" className="btn primary" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save question'}</button>
        </>
      )}
    >
      <p className="muted">Paste a screenshot with Ctrl+V (or drop or choose an image), drag a box over the question, and say what is to be answered. It is saved in this browser under My questions, and is part of a backup.</p>
      <ImagePicker label="The question (image)" hint="Click here and press Ctrl+V to paste a screenshot, or drop an image." value={stemImage} onChange={setStemImage} file={pasted.stem} />
      <label className="stack">Typed wording (optional; maths between $ signs)
        <textarea rows={3} value={wording} onChange={(e) => setWording(e.target.value)} />
      </label>
      <label className="stack">Title (this is what search finds)
        <input type="text" value={title} placeholder="Topic - what is asked" onChange={(e) => setTitle(e.target.value)} />
      </label>
      <div className="row">
        <label className="grow">Section <input type="text" list="section-choices" value={section} style={{ width: '100%' }} onChange={(e) => setSection(e.target.value)} /></label>
        <datalist id="section-choices">{sections.map((s) => <option key={s} value={s} />)}</datalist>
        <label className="grow">Source <input type="text" value={source} placeholder="MECHENG222 Quiz 1, Q3" style={{ width: '100%' }} onChange={(e) => setSource(e.target.value)} /></label>
        <label>Marks <input type="number" min="0" step="any" value={marks} style={{ width: 70 }} onChange={(e) => setMarks(e.target.value)} /></label>
      </div>
      <label className="stack">Tags (comma separated search words)
        <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} />
      </label>
      <h3>Answers</h3>
      <PartsEditor drafts={parts} onChange={setParts} />
      <h3>Solution (optional)</h3>
      <ImagePicker label="Solution image" hint="Paste or drop a screenshot of the worked solution." value={solImage} onChange={setSolImage} file={pasted.sol} />
      <label className="stack">Solution text
        <textarea rows={2} value={solText} onChange={(e) => setSolText(e.target.value)} />
      </label>
      {error && <div className="notice" role="alert">{error}</div>}
    </Modal>
  );
}
