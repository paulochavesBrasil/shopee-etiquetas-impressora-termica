/*
 * splitter.js
 *
 * Core, UI-agnostic logic: render a PDF with pdf.js, split every page into 4
 * quadrants (top-left, top-right, bottom-left, bottom-right), drop blank
 * quadrants, and return one PNG data URL per remaining quadrant.
 *
 * Exposes `window.ShopeeSplitter.renderPdfToLabels`.
 */
(function (global) {
  // A quadrant is considered blank if fewer than this fraction of its pixels
  // are non-white. Content quadrants are typically ~0.35; blank ones are ~0.
  const DEFAULT_BLANK_THRESHOLD = 0.004;
  // Render resolution. Higher = sharper barcodes/QR codes but more memory.
  const DEFAULT_SCALE = 3.5;

  function quadrantIsBlank(ctx, sx, sy, sw, sh, threshold) {
    const step = 4; // inspect every 4th pixel in each direction
    const data = ctx.getImageData(sx, sy, sw, sh).data;
    let nonWhite = 0;
    let sampled = 0;
    const rowBytes = sw * 4;
    for (let y = 0; y < sh; y += step) {
      for (let x = 0; x < sw; x += step) {
        const i = y * rowBytes + x * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        sampled++;
        if (a > 10 && (r < 245 || g < 245 || b < 245)) nonWhite++;
      }
    }
    if (sampled === 0) return true;
    return nonWhite / sampled < threshold;
  }

  /**
   * @param {Uint8Array} bytes - the source PDF bytes
   * @param {object} [opts]
   * @param {number} [opts.scale] - render scale
   * @param {number} [opts.blankThreshold] - blank-detection threshold
   * @param {(msg:string)=>void} [opts.onProgress] - progress callback
   * @returns {Promise<string[]>} array of PNG data URLs, one per label
   */
  async function renderPdfToLabels(bytes, opts) {
    opts = opts || {};
    const scale = opts.scale || DEFAULT_SCALE;
    const blankThreshold =
      typeof opts.blankThreshold === "number"
        ? opts.blankThreshold
        : DEFAULT_BLANK_THRESHOLD;
    const onProgress = opts.onProgress || function () {};

    const pdfjs = global.pdfjsLib;
    if (!pdfjs) throw new Error("pdf.js (pdfjsLib) não está carregado.");

    const pdf = await pdfjs.getDocument({ data: bytes }).promise;
    const labels = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      onProgress(`Processando página ${pageNum} de ${pdf.numPages}...`);
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({ canvasContext: ctx, viewport }).promise;

      const W = canvas.width;
      const H = canvas.height;
      const hw = Math.floor(W / 2);
      const hh = Math.floor(H / 2);

      // Order: top-left, top-right, bottom-left, bottom-right.
      const quadrants = [
        { sx: 0, sy: 0, sw: hw, sh: hh },
        { sx: hw, sy: 0, sw: W - hw, sh: hh },
        { sx: 0, sy: hh, sw: hw, sh: H - hh },
        { sx: hw, sy: hh, sw: W - hw, sh: H - hh },
      ];

      for (const q of quadrants) {
        if (quadrantIsBlank(ctx, q.sx, q.sy, q.sw, q.sh, blankThreshold)) {
          continue;
        }
        const qCanvas = document.createElement("canvas");
        qCanvas.width = q.sw;
        qCanvas.height = q.sh;
        const qCtx = qCanvas.getContext("2d");
        qCtx.drawImage(canvas, q.sx, q.sy, q.sw, q.sh, 0, 0, q.sw, q.sh);
        labels.push(qCanvas.toDataURL("image/png"));
      }

      canvas.width = 0;
      canvas.height = 0;
    }

    return labels;
  }

  global.ShopeeSplitter = { renderPdfToLabels };
})(typeof window !== "undefined" ? window : this);
