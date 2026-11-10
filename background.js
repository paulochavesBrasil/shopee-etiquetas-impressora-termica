/*
 * Service worker (Manifest V3) for Brave/Chrome.
 *
 * The awbprint page is an HTML page that embeds the label PDF in an iframe via
 * a blob: URL. The content script grabs those PDF bytes and sends them here;
 * we stash them in session storage and open the print page, which reads them
 * back and renders the split labels.
 */

// ---- base64 helpers (chunked, to avoid call-stack limits) -------------------

function bytesToBase64(bytes) {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(
      null,
      bytes.subarray(i, i + chunk)
    );
  }
  return btoa(binary);
}

function makeToken() {
  return (
    Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10)
  );
}

async function openPrintWithBytes(bytes) {
  const token = makeToken();
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  await chrome.storage.session.set({ ["pdf_" + token]: bytesToBase64(u8) });
  await chrome.tabs.create({
    url: chrome.runtime.getURL("print.html") + "?token=" + token,
  });
}

function notify(message) {
  if (chrome.notifications) {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon-48.png",
      title: "Shopee Etiqueta Splitter",
      message,
    });
  } else {
    console.warn("Shopee Etiqueta Splitter:", message);
  }
}

// ---- Messages from content script / print page ------------------------------

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || !msg.type) return;

  if (msg.type === "SPLIT_PDF") {
    const bytes = msg.bytes; // Uint8Array (structured-cloned)
    if (!bytes || bytes.length === 0) {
      notify("Não consegui ler o PDF da etiqueta. Recarregue a página.");
      sendResponse({ ok: false });
      return;
    }
    openPrintWithBytes(bytes)
      .then(() => sendResponse({ ok: true }))
      .catch((e) => {
        console.error(e);
        sendResponse({ ok: false, error: String(e) });
      });
    return true; // async response
  }

  if (msg.type === "GRAB_AND_SPLIT") {
    const tabId = sender.tab && sender.tab.id;
    if (!tabId) {
      sendResponse({ ok: false, error: "no tab" });
      return;
    }
    grabPdfFromTab(tabId)
      .then((bytes) => {
        if (!bytes) {
          notify("Não encontrei o PDF na página. Recarregue e tente de novo.");
          sendResponse({ ok: false, error: "pdf not found" });
          return;
        }
        return openPrintWithBytes(bytes).then(() =>
          sendResponse({ ok: true })
        );
      })
      .catch((e) => {
        console.error(e);
        sendResponse({ ok: false, error: String(e) });
      });
    return true; // async response
  }

  if (msg.type === "GET_PDF_FOR_PRINT") {
    const key = "pdf_" + msg.token;
    chrome.storage.session.get(key).then((data) => {
      const b64 = data[key];
      if (b64) {
        chrome.storage.session.remove(key);
        sendResponse({ ok: true, base64: b64 });
      } else {
        sendResponse({ ok: false });
      }
    });
    return true; // async response
  }
});

// ---- Toolbar button: grab the PDF straight from the page (fallback) ----------

async function grabPdfFromTab(tabId) {
  // Runs in the page (MAIN world) to read the embedded blob: PDF and return it
  // as a regular number array (structured clone across worlds is limited).
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    world: "MAIN",
    func: async () => {
      const iframe = document.querySelector(
        'iframe[type="application/pdf"], iframe[src^="blob:"], embed[type="application/pdf"]'
      );
      if (!iframe) return null;
      const raw = iframe.src || iframe.getAttribute("src");
      if (!raw) return null;
      const url = raw.split("#")[0];
      const resp = await fetch(url);
      const buf = await resp.arrayBuffer();
      return Array.from(new Uint8Array(buf));
    },
  });
  const arr = results && results[0] && results[0].result;
  return arr ? new Uint8Array(arr) : null;
}

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab || !tab.id) return;
  if (!/:\/\/seller\.shopee\.com\.br\/awbprint/i.test(tab.url || "")) {
    notify("Abra a página de impressão de etiqueta da Shopee (awbprint).");
    return;
  }
  try {
    const bytes = await grabPdfFromTab(tab.id);
    if (!bytes) {
      notify("Não encontrei o PDF na página. Recarregue e tente novamente.");
      return;
    }
    await openPrintWithBytes(bytes);
  } catch (e) {
    console.error(e);
    notify("Erro ao processar o PDF: " + e.message);
  }
});
