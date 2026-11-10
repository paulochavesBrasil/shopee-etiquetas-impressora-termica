/*
 * Content script for the Shopee awbprint page (Brave/Chrome).
 *
 * Adds a floating button. On click it asks the service worker to grab the PDF
 * embedded in the page and open the split/print view. The actual PDF fetch is
 * done by the service worker in the page's MAIN world, which reliably reaches
 * the blob: URL that Shopee uses for the embedded PDF.
 */
(function () {
  if (window.__shopeeEtiquetaSplitterInjected) return;
  window.__shopeeEtiquetaSplitterInjected = true;

  function createButton() {
    if (document.getElementById("shopee-etiqueta-splitter-btn")) return;

    const btn = document.createElement("button");
    btn.id = "shopee-etiqueta-splitter-btn";
    btn.type = "button";
    btn.textContent = "Dividir etiquetas (térmica)";
    btn.title =
      "Divide cada etiqueta em uma página separada para impressora térmica";

    btn.addEventListener("click", function () {
      btn.disabled = true;
      const original = btn.textContent;
      btn.textContent = "Processando...";
      chrome.runtime.sendMessage({ type: "GRAB_AND_SPLIT" }, function (resp) {
        if (chrome.runtime.lastError || !resp || !resp.ok) {
          btn.textContent = "Erro - tente de novo";
          console.error(
            "Shopee Etiqueta Splitter:",
            chrome.runtime.lastError || (resp && resp.error)
          );
        } else {
          btn.textContent = "Aba de impressão aberta";
        }
        setTimeout(function () {
          btn.disabled = false;
          btn.textContent = original;
        }, 2000);
      });
    });

    document.body.appendChild(btn);
  }

  if (document.body) {
    createButton();
  } else {
    document.addEventListener("DOMContentLoaded", createButton);
  }
})();
