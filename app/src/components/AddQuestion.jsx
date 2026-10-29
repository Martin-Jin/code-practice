import { useEffect, useRef, useState } from 'react';
import { useStore } from '../lib/store.js';
import { addMineQuestion, idFromTitle } from '../lib/mine.js';
import { addToImportedSet } from '../lib/library.js';
import { canSync, addQuestionToPdf } from '../lib/pdfsync.js';
import { Modal } from './Dialogs.jsx';
import { PartsEditor, blankDrafts, partsOf } from './Parts.jsx';
import { toast } from './Toasts.jsx';
import TagInput, { knownTags } from './TagInput.jsx';

const MAX_WIDTH = 1400;   // stored images are scaled down to this width
const VIEW_WIDTH = 540;   // the cropping canvas

function encode(canvas) {
  const webp = canvas.toDataURL('image/webp', 0.92);
  return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/png');
}
const extensionOf = (dataUrl) => (dataUrl.startsWith('data:image/webp') ? 'webp' : 'png');

// Takes an image (pasted, dropped or chosen), lets the user drag a box over the part to keep, and
// hands back the result as a data URL. `file` is an image the parent received from a paste.
export function ImagePicker({ label, hint, value, onChange, file }) {
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

const sameName = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();
const lastOf = (set) => set.manifest.questions[set.manifest.questions.length - 1];

// Make a question of your own: say which set it belongs to, then a pasted screenshot or typed wording, the parts
// to answer, and optionally a solution. Naming a set that exists fills in its usual section, source and tags; a
// new name makes a new set. `setId` starts the dialog on that set.
export default function AddQuestionDialog({ close, setId }) {
  const st = useStore();
  const all = Object.values(st.library.sets).sort((a, b) => a.title.localeCompare(b.title));
  const [setName, setSetName] = useState(() => (setId && st.library.sets[setId] ? st.library.sets[setId].title : ''));
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
  const [toPdf, setToPdf] = useState(true);
  const touched = useRef(new Set());   // fields the user has typed in, which autofill leaves alone

  const target = all.find((x) => sameName(x.title, setName)) || null;
  const named = setName.trim() !== '';
  const known = target ? target.manifest.questions : all.flatMap((x) => x.manifest.questions);
  const sections = [...new Set(known.map((q) => q.section))];
  const tagChoices = knownTags(st, target && target.id);

  // Naming an existing set fills what its latest question had, unless the field has been typed in already.
  useEffect(() => {
    if (!target || !target.manifest.questions.length) return;
    const last = lastOf(target);
    const fill = (field, value, set) => { if (value && !touched.current.has(field)) set(value); };
    fill('section', last.section, setSection);
    fill('source', last.source, setSource);
    fill('tags', last.tags.join(', '), setTags);
  }, [target && target.id]);

  const typed = (field, set) => (value) => { touched.current.add(field); set(value); };
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
    if (!named) return setError('Say which set the question belongs to. A name that is not in the list makes a new set.');
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
      let into = target;
      let uid;
      if (target && !target.userOwned) {
        uid = await addToImportedSet(target.id, question, images);
        if (toPdf && canSync(target)) {
          // the paths still say {uid}; the PDF only needs the pictures
          const named = { ...question, stem: { ...question.stem }, solution: question.solution && { ...question.solution } };
          try {
            const { written } = await addQuestionToPdf(target.id, named, images);
            toast(written ? 'Also added to the end of the PDF.' : 'Also added to the PDF: the updated copy was downloaded, replace your original with it.');
          } catch (e) { toast(`Saved in the app, but not added to the PDF: ${e.message}`, 'bad'); }
        }
      }
      else {
        if (!into) {
          let id = idFromTitle(setName);
          for (let n = 2; st.library.sets[id] || st.libMine[id]; n++) id = `${idFromTitle(setName)}-${n}`;
          into = { id, title: setName.trim() };
        }
        uid = await addMineQuestion(question, images, { id: into.id, title: into.title });
      }
      close(true);
      toast(`Question saved in ${into.title}.`);
      window.location.hash = `#/q/${encodeURIComponent(into.id)}/${encodeURIComponent(uid)}`;
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
          <button type="button" className="btn primary" disabled={busy || !named} onClick={save}>{busy ? 'Saving…' : 'Save question'}</button>
        </>
      )}
    >
      <label className="stack">Which set is it for?
        <input type="text" list="set-choices" value={setName} autoFocus placeholder="Pick a set, or type a new name" onChange={(e) => setSetName(e.target.value)} />
        <datalist id="set-choices">{all.map((x) => <option key={x.id} value={x.title} />)}</datalist>
      </label>
      {target && !target.userOwned && canSync(target) && (
        <label className="check"><input type="checkbox" checked={toPdf} onChange={(e) => setToPdf(e.target.checked)} /> Also add it to the end of the PDF</label>
      )}
      {named && <p className="muted">{target ? `Adding to ${target.title}, which has ${target.manifest.questions.length} questions. Its usual section, source and tags are filled in below.` : 'This makes a new set.'}</p>}
      {named && (
        <>
          <p className="muted">Paste a screenshot with Ctrl+V (or drop or choose an image), then drag a box over the question.</p>
          <ImagePicker label="The question (image)" hint="Click here and press Ctrl+V to paste a screenshot, or drop an image." value={stemImage} onChange={setStemImage} file={pasted.stem} />
          <label className="stack">Typed wording (optional; maths between $ signs)
            <textarea rows={3} value={wording} onChange={(e) => setWording(e.target.value)} />
          </label>
          <div className="title-row">
            <label className="stack">Title (this is what search finds)
              <input type="text" value={title} placeholder="Topic - what is asked" onChange={(e) => setTitle(e.target.value)} />
            </label>
            <label className="stack">Section
              <input type="text" list="section-choices" value={section} placeholder="Pick or type" onChange={(e) => typed('section', setSection)(e.target.value)} />
              <datalist id="section-choices">{sections.map((x) => <option key={x} value={x} />)}</datalist>
            </label>
          </div>
          <h3>Answers</h3>
          <PartsEditor drafts={parts} onChange={setParts} />
          <details>
            <summary>More: source, marks, tags, solution</summary>
            <div className="stack" style={{ marginTop: 10 }}>
              <div className="row">
                <label className="grow">Source <input type="text" value={source} placeholder="COURSE101 Quiz 1, Q3" style={{ width: '100%' }} onChange={(e) => typed('source', setSource)(e.target.value)} /></label>
                <label>Marks <input type="number" min="0" step="any" value={marks} style={{ width: 70 }} onChange={(e) => setMarks(e.target.value)} /></label>
              </div>
              <label className="stack">Tags (comma separated search words)
                <TagInput value={tags} tags={tagChoices} onChange={typed('tags', setTags)} />
              </label>
              <ImagePicker label="Solution image" hint="Paste or drop a screenshot of the worked solution." value={solImage} onChange={setSolImage} file={pasted.sol} />
              <label className="stack">Solution text
                <textarea rows={2} value={solText} onChange={(e) => setSolText(e.target.value)} />
              </label>
            </div>
          </details>
        </>
      )}
      {error && <div className="notice" role="alert">{error}</div>}
    </Modal>
  );
}
