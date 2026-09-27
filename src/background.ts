// fustation-tool Service Worker (TypeScript)
console.log('[fustation-tool] Service Worker Initialized (TypeScript)');

// Next.js route changes use history.pushState, which never reloads the content script.
// Forward them so the overlay can re-classify the route and re-run extraction.
if (typeof chrome !== 'undefined' && chrome.webNavigation) {
  chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
    if (details.frameId === 0 && details.url && details.url.includes('fustation.net')) {
      chrome.tabs.sendMessage(details.tabId, {
        type: 'FUSTATION_URL_CHANGED',
        url: details.url
      }).catch(() => {
        // Tab listener not ready yet, safe to ignore
      });
    }
  });
}

// Presigned S3 assets (PE answer keys) are blocked by CORS from the fustation.net page, so the
// content script asks the service worker, which holds the S3 host permission (ISSUE-107).
// No cookies: the presigned query string is the credential. Bytes go back as base64 because
// runtime messages are JSON-serialized; they are never written to chrome.storage.
const ASSET_HOSTS = /^https:\/\/fustation\.s3(\.[a-z0-9-]+)?\.amazonaws\.com\//i;

if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type !== 'FUSTATION_FETCH_ASSET') return false;
    if (typeof msg.url !== 'string' || !ASSET_HOSTS.test(msg.url)) {
      sendResponse({ ok: false, status: 0 });
      return false;
    }
    fetch(msg.url, { credentials: 'omit' })
      .then(async (res) => {
        if (!res.ok) return sendResponse({ ok: false, status: res.status });
        const bytes = new Uint8Array(await res.arrayBuffer());
        let bin = '';
        for (let i = 0; i < bytes.length; i += 0x8000) {
          bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
        }
        sendResponse({ ok: true, status: res.status, base64: btoa(bin) });
      })
      .catch(() => sendResponse({ ok: false, status: 0 }));
    return true; // keep the channel open for the async response
  });
}
