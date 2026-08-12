import { ExamDataset, BatchState, BatchFetchStatus, BatchItemTask } from '../types';
import { unescapeNextFChunk, formatExamDataset } from './parser';
import { saveExamToStorage, getBatchStateFromStorage, setBatchStateInStorage } from './storage';

function unescapeChunk(rawChunk: string): string {
  return rawChunk.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
}

export function extractProductTasksFromHtml(html: string): BatchItemTask[] {
  const tasks: BatchItemTask[] = [];
  const seenIds = new Set<string>();

  // Pass 1: Parse initialProducts array from Next.js RSC script pushes
  const scriptRegex = /<script>self\.__next_f\.push\(([\s\S]*?)\)<\/script>/g;
  let match: RegExpExecArray | null;

  while ((match = scriptRegex.exec(html)) !== null) {
    const unescaped = unescapeChunk(match[1]);
    const idx = unescaped.indexOf('{"initialProducts":');
    if (idx !== -1) {
      const sub = unescaped.substring(idx);
      const arrStart = sub.indexOf('[');
      let arrEnd = -1;
      let depth = 0;
      for (let i = arrStart; i < sub.length; i++) {
        if (sub[i] === '[') depth++;
        else if (sub[i] === ']') {
          depth--;
          if (depth === 0) {
            arrEnd = i;
            break;
          }
        }
      }
      if (arrEnd !== -1) {
        try {
          const products = JSON.parse(sub.substring(arrStart, arrEnd + 1));
          if (Array.isArray(products)) {
            for (const p of products) {
              if (p && p.id && !seenIds.has(p.id)) {
                seenIds.add(p.id);
                tasks.push({
                  id: p.id,
                  title: p.title || `Exam ${p.id}`,
                  subjectCode: p.subjectCode || p.subject?.code,
                  examUrl: `https://www.fustation.net/marketplace/exam/${p.id}`,
                  rscUrl: `https://www.fustation.net/marketplace/exam/${p.id}?_rsc=1`
                });
              }
            }
          }
        } catch (e) {
          console.warn('[fustation-tool] Error parsing initialProducts RSC JSON:', e);
        }
      }
    }
  }

  // Pass 2: Unconditional Multi-Pattern Regex Discovery (DOM Hrefs + RSC Payload Streams)
  const linkPatterns = [
    /\/marketplace\/exam\/([a-zA-Z0-9_-]+)/g,
    /\/marketplace\/exams\/([a-zA-Z0-9_-]+)/g,
    /\/marketplace\/(cm[a-z0-9]{22,28})/g
  ];

  for (const pattern of linkPatterns) {
    let linkMatch: RegExpExecArray | null;
    while ((linkMatch = pattern.exec(html)) !== null) {
      const id = linkMatch[1];
      if (id && id !== 'exam' && id !== 'exams' && !seenIds.has(id)) {
        seenIds.add(id);
        tasks.push({
          id,
          title: `Exam ${id}`,
          examUrl: `https://www.fustation.net/marketplace/exam/${id}`,
          rscUrl: `https://www.fustation.net/marketplace/exam/${id}?_rsc=1`
        });
      }
    }
  }

  return tasks;
}

export async function fetchExamDatasetDirect(task: BatchItemTask, maxRetries = 2): Promise<ExamDataset | null> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, 400 * attempt));
      }

      // First try RSC parameter query
      let res = await fetch(task.rscUrl, { credentials: 'same-origin' });
      if (!res.ok) {
        // Fallback to standard html fetch
        res = await fetch(task.examUrl, { credentials: 'same-origin' });
      }

      if (res.ok) {
        const text = await res.text();
        const parsed = unescapeNextFChunk(text, task.id);
        if (parsed && parsed.initialData) {
          return formatExamDataset(parsed.initialData, text);
        }
      }
    } catch (e) {
      console.warn(`[fustation-tool] Batch fetch error for ${task.id} (attempt ${attempt}):`, e);
    }
  }
  return null;
}

export class BatchFetchManager {
  private static instance: BatchFetchManager | null = null;

  private state: BatchState = {
    status: 'idle',
    isPreviewEnabled: true,
    previewCount: 3,
    totalDiscovered: 0,
    completedCount: 0,
    logs: [],
    previewDatasets: [],
    previewIndex: 0
  };

  private queue: BatchItemTask[] = [];
  private completedIds: Set<string> = new Set();
  private listeners: Array<(state: BatchState) => void> = [];
  private stopFlag = false;
  private pauseFlag = false;

  private constructor() {
    this.restoreState();
  }

  public static getInstance(): BatchFetchManager {
    if (!BatchFetchManager.instance) {
      BatchFetchManager.instance = new BatchFetchManager();
    }
    return BatchFetchManager.instance;
  }

  public subscribe(listener: (state: BatchState) => void): () => void {
    this.listeners.push(listener);
    listener(this.getState());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public getState(): BatchState {
    return { ...this.state };
  }

  private updateState(patch: Partial<BatchState>) {
    this.state = { ...this.state, ...patch };
    setBatchStateInStorage(this.state);
    this.listeners.forEach((l) => l(this.state));
  }

  private log(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    const logs = [...this.state.logs.slice(-99), logEntry];
    this.updateState({ logs });
  }

  private restoreState() {
    getBatchStateFromStorage((saved) => {
      if (saved) {
        this.state = {
          ...saved,
          // Reset interrupted active states to idle/paused on boot
          status: saved.status === 'batch_fetching' || saved.status === 'preview_fetching' || saved.status === 'discovering'
            ? 'paused'
            : saved.status
        };
        this.listeners.forEach((l) => l(this.state));
      }
    });
  }

  public setPreviewConfig(enabled: boolean, count: number) {
    if (this.state.status !== 'idle' && this.state.status !== 'completed' && this.state.status !== 'cancelled') return;
    this.updateState({
      isPreviewEnabled: enabled,
      previewCount: Math.max(1, Math.min(10, count))
    });
  }

  public async start() {
    if (this.state.status !== 'idle' && this.state.status !== 'completed' && this.state.status !== 'cancelled' && this.state.status !== 'error') {
      return;
    }

    this.stopFlag = false;
    this.pauseFlag = false;

    this.updateState({
      status: 'discovering',
      totalDiscovered: 0,
      completedCount: 0,
      logs: [],
      previewDatasets: [],
      previewIndex: 0
    });

    this.log('Discovering exam catalog...');

    let html = typeof document !== 'undefined' ? document.documentElement.innerHTML : '';
    let tasks = extractProductTasksFromHtml(html);

    // If current DOM didn't yield products, attempt fetching /home
    if (tasks.length === 0) {
      try {
        const homeRes = await fetch('https://www.fustation.net/home', { credentials: 'same-origin' });
        if (homeRes.ok) {
          const homeHtml = await homeRes.text();
          tasks = extractProductTasksFromHtml(homeHtml);
        }
      } catch (e) {
        console.warn('[fustation-tool] Catalog discovery /home fetch error:', e);
      }
    }

    if (tasks.length === 0) {
      this.log('No exam sets found in catalog.');
      this.updateState({ status: 'error' });
      return;
    }

    this.queue = tasks;
    this.completedIds = new Set();

    this.log(`Discovered ${tasks.length} exam sets.`);
    this.updateState({ totalDiscovered: tasks.length });

    if (this.state.isPreviewEnabled) {
      await this.runPreviewFetch();
    } else {
      await this.runFullBatchFetch();
    }
  }

  private async runPreviewFetch() {
    this.updateState({ status: 'preview_fetching' });
    const previewTargetCount = Math.min(this.state.previewCount, this.queue.length);
    this.log(`Fetching first ${previewTargetCount} examsets for preview...`);

    const previewDatasets: ExamDataset[] = [];

    for (let i = 0; i < previewTargetCount; i++) {
      if (this.stopFlag) break;
      const task = this.queue[i];
      this.log(`Previewing [${i + 1}/${previewTargetCount}]: ${task.title}...`);

      const dataset = await fetchExamDatasetDirect(task);
      if (dataset) {
        previewDatasets.push(dataset);
        // Save to cache
        saveExamToStorage(dataset);
        this.completedIds.add(task.id);
        this.log(`Successfully fetched preview ${dataset.subjectCode} (${dataset.questions.length} Q)`);
      } else {
        this.log(`Failed to fetch preview task: ${task.id}`);
      }
    }

    if (this.stopFlag) {
      this.updateState({ status: 'cancelled' });
      return;
    }

    if (previewDatasets.length > 0) {
      this.updateState({
        status: 'preview_paused',
        previewDatasets,
        previewIndex: 0,
        completedCount: previewDatasets.length
      });
      this.log(`Preview ready (${previewDatasets.length} items). Please verify and click Proceed.`);
    } else {
      this.log('Failed to fetch preview examsets.');
      this.updateState({ status: 'error' });
    }
  }

  public setPreviewIndex(idx: number) {
    if (this.state.previewDatasets.length === 0) return;
    const bounded = Math.max(0, Math.min(this.state.previewDatasets.length - 1, idx));
    this.updateState({ previewIndex: bounded });
  }

  public async proceedFromPreview() {
    if (this.state.status !== 'preview_paused') return;
    this.log('Preview confirmed by user. Proceeding with full batch fetch...');
    await this.runFullBatchFetch();
  }

  public cancelPreview() {
    if (this.state.status !== 'preview_paused') return;
    this.stopFlag = true;
    this.log('Batch fetch cancelled during preview verification.');
    this.updateState({ status: 'cancelled' });
  }

  private async runFullBatchFetch() {
    this.updateState({ status: 'batch_fetching' });
    this.log('Starting full batch fetch operation...');

    for (let i = 0; i < this.queue.length; i++) {
      if (this.stopFlag) {
        this.log('Batch operation stopped by user.');
        this.updateState({ status: 'cancelled' });
        return;
      }

      const task = this.queue[i];
      if (this.completedIds.has(task.id)) {
        continue; // Skip already completed preview items
      }

      // Handle pause state mid-fetch
      while (this.pauseFlag && !this.stopFlag) {
        await new Promise((r) => setTimeout(r, 200));
      }

      if (this.stopFlag) {
        this.log('Batch operation stopped by user.');
        this.updateState({ status: 'cancelled' });
        return;
      }

      this.log(`Fetching [${i + 1}/${this.queue.length}] ${task.title}...`);

      const dataset = await fetchExamDatasetDirect(task);
      if (dataset) {
        saveExamToStorage(dataset);
        this.completedIds.add(task.id);
        const completedCount = this.completedIds.size;
        this.updateState({ completedCount });
        this.log(`Saved ${dataset.subjectCode} (${dataset.questions.length} Q) to cache.`);
      } else {
        this.log(`Failed to fetch exam: ${task.id}`);
      }

      // Respectful delay between items
      await new Promise((r) => setTimeout(r, 500));
    }

    this.log(`Batch operation completed! Total exams saved: ${this.completedIds.size}`);
    this.updateState({ status: 'completed' });
  }

  public togglePause() {
    if (this.state.status === 'batch_fetching') {
      this.pauseFlag = true;
      this.updateState({ status: 'paused' });
      this.log('Batch operation paused.');
    } else if (this.state.status === 'paused') {
      this.pauseFlag = false;
      this.updateState({ status: 'batch_fetching' });
      this.log('Resuming batch operation...');
    }
  }

  public stop() {
    this.stopFlag = true;
    this.pauseFlag = false;
    this.updateState({ status: 'cancelled' });
    this.log('Batch operation cancelled.');
  }
}

export const batchFetchManager = BatchFetchManager.getInstance();
