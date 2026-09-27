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
