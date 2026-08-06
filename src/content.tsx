import React from 'react';
import ReactDOM from 'react-dom/client';
import { Overlay } from './components/Overlay';
import 'katex/dist/katex.min.css';
import './styles/overlay.css';

console.log('[fustation-tool] Content Script Loaded');

let rootInstance: ReactDOM.Root | null = null;

function mountApp() {
  if (!document.body) {
    setTimeout(mountApp, 50);
    return;
  }

  let container = document.getElementById('fustation-tool-root');
  if (!container) {
    container = document.createElement('div');
    container.id = 'fustation-tool-root';
    document.body.appendChild(container);
  }

  if (!rootInstance) {
    rootInstance = ReactDOM.createRoot(container);
    rootInstance.render(
      <React.StrictMode>
        <Overlay />
      </React.StrictMode>
    );
  } else if (!document.body.contains(container)) {
    document.body.appendChild(container);
  }
}

// Keep-alive observer for Next.js SPA transitions
const observer = new MutationObserver(() => {
  if (document.body && !document.getElementById('fustation-tool-root')) {
    mountApp();
  }
});

function init() {
  mountApp();
  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: false });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
