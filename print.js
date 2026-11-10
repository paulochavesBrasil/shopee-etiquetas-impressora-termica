/*
 * print.js
 *
 * Receives the captured PDF bytes from the background script, uses the shared
 * splitter to produce one image per label, lays each out as its own print page
 * sized for a thermal label, and opens the print dialog.
 */

const api = typeof browser !== "undefined" ? browser : chrome;

// pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = api.runtime.getURL(
  "lib/pdf.worker.min.js"
);

const statusEl = document.getElementById("status");
const pagesEl = document.getElementById("pages");
const printBtn = document.getElementById("print-btn");
const sizeSelect = document.getElementById("page-size");

const PAGE_SIZES = {
  "100x150": { w: 100, h: 150 },
  "105x148": { w: 105, h: 148 },
};

let pageStyleEl = null;

function applyPageSize() {
  const value = sizeSelect.value;
  if (!pageStyleEl) {
    pageStyleEl = document.createElement("style");
    document.head.appendChild(pageStyleEl);
  }

  if (value === "quadrant") {
    pageStyleEl.textContent = `@media print { @page { margin: 0; } }`;
    document.querySelectorAll(".label-page").forEach((el) => {
      el.style.width = "100mm";
    });
    return;
  }

  const size = PAGE_SIZES[value] || PAGE_SIZES["100x150"];
  pageStyleEl.textContent = `@media print { @page { size: ${size.w}mm ${size.h}mm; margin: 0; } }`;
  document.querySelectorAll(".label-page").forEach((el) => {
    el.style.width = `${size.w}mm`;
  });
}

function setStatus(text) {
  statusEl.textContent = text;
}

function addLabelImage(dataUrl) {
  const page = document.createElement("div");
  page.className = "label-page";
  const img = document.createElement("img");
  img.src = dataUrl;
  img.alt = "Etiqueta";
  page.appendChild(img);
  pagesEl.appendChild(page);
}

function base64ToBytes(b64) {
  const bin = atob(b64);
  const len = bin.length;
  const out = new Uint8Array(len);
  for (let i = 0; i < len; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function normalizeBytes(resp) {
  if (resp.base64) return base64ToBytes(resp.base64);
  const b = resp.bytes;
  if (b instanceof Uint8Array) return b;
  if (Array.isArray(b)) return new Uint8Array(b);
  if (b) return new Uint8Array(Object.values(b));
  return null;
}

function getPdfBytes() {
  const token = new URLSearchParams(location.search).get("token");
  return new Promise((resolve, reject) => {
    // Callback form works in both Chrome/Brave (MV3) and Firefox.
    api.runtime.sendMessage({ type: "GET_PDF_FOR_PRINT", token }, (resp) => {
      const err = api.runtime.lastError;
      if (err) {
        reject(new Error(err.message));
        return;
      }
      if (resp && resp.ok) {
        const bytes = normalizeBytes(resp);
        if (bytes) {
          resolve(bytes);
          return;
        }
      }
      reject(new Error("Nenhum PDF disponível."));
    });
  });
}

async function main() {
  try {
    const bytes = await getPdfBytes();
    const labels = await window.ShopeeSplitter.renderPdfToLabels(bytes, {
      onProgress: setStatus,
    });

    labels.forEach(addLabelImage);
    applyPageSize();

    if (labels.length === 0) {
      setStatus("Nenhuma etiqueta encontrada no PDF.");
      return;
    }

    setStatus(`${labels.length} etiqueta(s) pronta(s) para impressão.`);
    printBtn.disabled = false;
    printBtn.addEventListener("click", () => window.print());
    sizeSelect.addEventListener("change", applyPageSize);

    // Open the print dialog automatically once everything is rendered.
    setTimeout(() => window.print(), 400);
  } catch (e) {
    console.error(e);
    setStatus("Erro: " + e.message);
  }
}

main();
