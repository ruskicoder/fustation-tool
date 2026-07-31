// fustation-tool Service Worker (TypeScript)

console.log('[fustation-tool] Service Worker Initialized (TypeScript)');

if (typeof chrome !== 'undefined' && chrome.tabs) {
  chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && tab.url.includes('/marketplace/exam/')) {
      const match = tab.url.match(/\/marketplace\/exam\/([a-zA-Z0-9]+)/);
      if (match && match[1]) {
        const examId = match[1];
        addDiscoveredExamId(examId);
      }
    }
  });
}

function addDiscoveredExamId(examId: string): void {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) return;

  chrome.storage.local.get(['fustation_catalog'], (res) => {
    const catalog: string[] = res.fustation_catalog || [];
    if (!catalog.includes(examId)) {
      catalog.push(examId);
      chrome.storage.local.set({ fustation_catalog: catalog });
    }
  });
}
