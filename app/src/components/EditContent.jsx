import { useState } from 'react';
import { saveEdit } from '../lib/practice.js';
import { canSync, replaceInPdf } from '../lib/pdfsync.js';
import { Modal } from './Dialogs.jsx';
import { ImagePicker, ImageList } from './AddQuestion.jsx';
import { toast, validationError } from './Toasts.jsx';

// Edit mode: change a question's title, wording or image, or its solution's text or image. The change is kept as
// the user's own correction (and is part of a backup). For a question in a PDF the app indexed, it can also be
// written into the PDF itself.
export default function EditContent({ set, question, what, close }) {
  const stem = what === 'stem';
  const [title, setTitle] = useState(question.title);
  const [text, setText] = useState((stem ? question.stem.text : question.solution && question.solution.text) || '');
  const [image, setImage] = useState(null);
  const [pages, setPages] = useState([]);          // a solution's new images, one per page
  const [append, setAppend] = useState(false);     // keep the solution's existing pages and add these after them
  const [toPdf, setToPdf] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  // For a question cut from a PDF page: which strip of the page is shown (points from the page top, 72 to an inch).
  const pdfBox = stem && question.stem.pdf ? question.stem.pdf.box : null;
  const [box, setBox] = useState(pdfBox);
  const boxChanged = !!pdfBox && (box[1] !== pdfBox[1] || box[3] !== pdfBox[3]);
  const inPdf = canSync(set) && (stem ? !!question.stem.pdf : !!(question.solution && question.solution.pdf));
  const hasPages = !stem && !!question.solution && ((question.solution.pdf || []).length + (question.solution.images || []).length + (question.solution.imagesData || []).length) > 0;
  const anyImage = stem ? !!image : pages.length > 0;

  const save = async () => {
    setError('');
    setBusy(true);
    try {
      const before = (stem ? question.stem.text : question.solution && question.solution.text) || '';
      const wordingChanged = text !== before;
      if (!anyImage && !wordingChanged && !boxChanged && !(stem && title.trim() !== question.title)) {
        validationError('Nothing has changed.');
        setBusy(false);
        return;
      }
      if (toPdf && !anyImage && !wordingChanged) {
        validationError('Nothing to write into the PDF: change the wording or choose an image.');
        setBusy(false);
        return;
      }
      const edit = stem ? { ...(wordingChanged ? { stemText: text } : {}), ...(image ? { stemImage: image } : {}), ...(boxChanged ? { stemBox: box } : {}), ...(title.trim() && title.trim() !== question.title ? { title: title.trim() } : {}) } : { ...(wordingChanged ? { solutionText: text } : {}), ...(pages.length ? { solutionImages: pages, ...(append ? { solutionAppend: true } : {}) } : {}) };
      if (toPdf) {
        if (append) throw new Error('Pages added after the existing ones cannot be written into the PDF. Untick the PDF box, or replace the pages instead.');
        const { written } = await replaceInPdf(set.id, question, what, stem ? (image ? { image } : { text }) : (pages.length ? { images: pages } : { text }));
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
      {stem
        ? <ImagePicker label="Replace the question image" hint="Paste (Ctrl+V), drop or choose an image. Leave empty to keep what is there." value={image} onChange={setImage} />
        : (
          <>
            <ImageList label="Solution image" hint="Paste (Ctrl+V), drop or choose an image. Each image is one page; add as many as the solution needs. Leave empty to keep what is there." values={pages} onChange={setPages} />
            {pages.length > 0 && hasPages && (
              <label className="check"><input type="checkbox" checked={append} onChange={(e) => setAppend(e.target.checked)} /> Keep the existing pages and add these after them (otherwise these replace all the existing pages)</label>
            )}
          </>
        )}
      {box && (
        <div className="fields" title="Moves the edges of the part of the PDF page that is shown, in points (72 to an inch)">
          <label className="field">Crop top <input type="number" className="line" step="5" value={box[1]} style={{ width: 80 }} onChange={(e) => setBox([box[0], Number(e.target.value), box[2], box[3]])} /></label>
          <label className="field">Crop bottom <input type="number" className="line" step="5" value={box[3]} style={{ width: 80 }} onChange={(e) => setBox([box[0], box[1], box[2], Number(e.target.value)])} /></label>
        </div>
      )}
      {inPdf && (
        <label className="check"><input type="checkbox" checked={toPdf} onChange={(e) => setToPdf(e.target.checked)} /> Also change it in the PDF (new images or the wording are drawn over this question's part of the page; one image goes on each solution page)</label>
      )}
      {error && <div className="notice" role="alert">{error}</div>}
    </Modal>
  );
}
