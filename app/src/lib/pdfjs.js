// pdf.js is large, so it is only loaded when a PDF is first needed.
let pdfjsPromise = null;
export function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = Promise.all([import('pdfjs-dist/build/pdf.min.mjs'), import('pdfjs-dist/build/pdf.worker.min.mjs?url')])
      .then(([lib, worker]) => { lib.GlobalWorkerOptions.workerSrc = worker.default; return lib; });
  }
  return pdfjsPromise;
}
