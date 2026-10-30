import { useState } from 'react';
import { saveEdit } from '../lib/practice.js';
import { canSync, replaceInPdf } from '../lib/pdfsync.js';
import { Modal } from './Dialogs.jsx';
import { ImagePicker } from './AddQuestion.jsx';
import { toast, validationError } from './Toasts.jsx';

// Edit mode: change a question's title, wording or image, or its solution's text or image. The change is kept as
// the user's own correction (and is part of a backup). For a question in a PDF the app indexed, it can also be
// written into the PDF itself.
export default function EditContent({ set, question, what, close }) {
  const stem = what === 'stem';
  const [title, setTitle] = useState(question.title);
  const [text, setText] = useState((stem ? question.stem.text : question.solution && question.solution.text) || '');
  const [image, setImage] = useState(null);
  const [toPdf, setToPdf] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  // For a question cut from a PDF page: which strip of the page is shown (points from the page top, 72 to an inch).
  const pdfBox = stem && question.stem.pdf ? question.stem.pdf.box : null;
  const [box, setBox] = useState(pdfBox);
  const boxChanged = !!pdfBox && (box[1] !== pdfBox[1] || box[3] !== pdfBox[3]);
  const inPdf = canSync(set) && (stem ? !!question.stem.pdf : !!(question.solution && question.solution.pdf));

  const save = async () => {
    setError('');
    setBusy(true);
    try {
      const before = (stem ? question.stem.text : question.solution && question.solution.text) || '';
      const wordingChanged = text !== before;
      if (!image && !wordingChanged && !boxChanged && !(stem && title.trim() !== question.title)) {
        validationError('Nothing has changed.');
        setBusy(false);
        return;
      }
      if (toPdf && !image && !wordingChanged) {
        validationError('Nothing to write into the PDF: change the wording or choose an image.');
        setBusy(false);
        return;
      }
      const edit = stem ? { ...(wordingChanged ? { stemText: text } : {}), ...(image ? { stemImage: image } : {}), ...(boxChanged ? { stemBox: box } : {}), ...(title.trim() && title.trim() !== question.title ? { title: title.trim() } : {}) } : { ...(wordingChanged ? { solutionText: text } : {}), ...(image ? { solutionImage: image } : {}) };
      if (toPdf) {
        const { written } = await replaceInPdf(set.id, question, what, image ? { image } : { text });
        toast(written ? 'Saved, and written into the PDF.' : 'Saved. The updated PDF was downloaded: replace your original with it.');
        // the PDF now holds it, so only the title and the crop (which the PDF cannot take) are kept as an overlay
        if (stem && (edit.title || edit.stemBox)) saveEdit(set.id, question.uid, { ...(edit.title ? { title: edit.title } : {}), ...(edit.stemBox ? { stemBox: edit.stemBox } : {}) });
      } else saveEdit(set.id, question.uid, edit);
      close(true);
    } catch (e) {
      setError(`Not saved. ${e.message}`);
      setBusy(false);
    }
  };

  return (
    <Modal wide title={stem ? 'Edit the question' : 'Edit the solution'} onClose={() => !busy && close(false)}
      footer={<><button type="button" className="btn" disabled={busy} onClick={() => close(false)}>Cancel</button><button type="button" className="btn primary" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save'}</button></>}>
      {stem && <label className="stack">Title <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} /></label>}
      <label className="stack">{stem ? 'Typed wording' : 'Solution text'} (maths between $ signs)
        <textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} />
      </label>
      <ImagePicker label={stem ? 'Replace the question image' : 'Replace the solution image'} hint="Paste (Ctrl+V), drop or choose an image. Leave empty to keep what is there." value={image} onChange={setImage} />
      {box && (
        <div className="fields" title="Moves the edges of the part of the PDF page that is shown, in points (72 to an inch)">
          <label className="field">Crop top <input type="number" className="line" step="5" value={box[1]} style={{ width: 80 }} onChange={(e) => setBox([box[0], Number(e.target.value), box[2], box[3]])} /></label>
          <label className="field">Crop bottom <input type="number" className="line" step="5" value={box[3]} style={{ width: 80 }} onChange={(e) => setBox([box[0], box[1], box[2], Number(e.target.value)])} /></label>
        </div>
      )}
      {inPdf && (
        <label className="check"><input type="checkbox" checked={toPdf} onChange={(e) => setToPdf(e.target.checked)} /> Also change it in the PDF (a new image or the wording is drawn over this question's part of the page)</label>
      )}
      {error && <div className="notice" role="alert">{error}</div>}
    </Modal>
  );
}
