import { ExamDataset, Question } from '../types';

const FUSTATION_ORIGIN = 'https://www.fustation.net';

/**
 * Normalizes relative image paths (e.g. `exams/fe/mae101/...` or `/exams/...`)
 * into absolute `https://www.fustation.net/...` URLs.
 */
export function normalizeImageUrl(url: string | null | undefined): string | null {
  if (!url || url === '$undefined') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Rewrite direct AWS S3 URLs to authenticated proxy endpoint to prevent 403 presigned expiration errors
  if (trimmed.includes('fustation.s3') || trimmed.includes('amazonaws.com')) {
    const keyMatch = trimmed.match(/(?:exams\/[^\?#]+)/i);
    if (keyMatch && keyMatch[0]) {
      return `${FUSTATION_ORIGIN}/api/exams/question-image?key=${encodeURIComponent(keyMatch[0])}`;
    }
  }

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  if (trimmed.startsWith('/exams/') || trimmed.startsWith('exams/')) {
    const cleanKey = trimmed.replace(/^\/+/, '');
    return `${FUSTATION_ORIGIN}/api/exams/question-image?key=${encodeURIComponent(cleanKey)}`;
  }

  if (trimmed.startsWith('/')) {
    return `${FUSTATION_ORIGIN}${trimmed}`;
  }

  return `${FUSTATION_ORIGIN}/${trimmed}`;
}

/**
 * Attempts to extract Base64 data from an already-rendered DOM <img> element matching the URL.
 * Prevents unnecessary network failures when images are already visible in the document.
 */
export function extractBase64FromDomImage(url: string | null | undefined): string | null {
  if (!url || typeof document === 'undefined') return null;
  const fullUrl = normalizeImageUrl(url);
  const imgs = Array.from(document.querySelectorAll('img'));
  const matchingImg = imgs.find(
    (img) =>
      img.src === fullUrl ||
      img.src === url ||
      img.getAttribute('src') === url ||
      img.getAttribute('src') === fullUrl
  );

  if (matchingImg && matchingImg.complete && matchingImg.naturalWidth > 0) {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = matchingImg.naturalWidth;
      canvas.height = matchingImg.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(matchingImg, 0, 0);
        return canvas.toDataURL('image/png');
      }
    } catch (e) {
      console.warn('[fustation-tool] DOM canvas image extraction failed:', e);
    }
  }
  return null;
}

/**
 * Asynchronously fetches an image and converts it into a Base64 Data URI (`data:image/png;base64,...`).
 * Includes browser session credentials and falls back to DOM canvas extraction if network fetch fails.
 */
export async function fetchImageAsBase64(url: string | null | undefined): Promise<string | null> {
  const fullUrl = normalizeImageUrl(url);
  if (!fullUrl) return null;

  try {
    const response = await fetch(fullUrl, { mode: 'cors', credentials: 'include' });
    if (!response.ok) {
      return extractBase64FromDomImage(url);
    }

    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          resolve(extractBase64FromDomImage(url));
        }
      };
      reader.onerror = () => resolve(extractBase64FromDomImage(url));
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn(`[fustation-tool] Network fetch for image Base64 failed (${fullUrl}), trying DOM canvas fallback:`, err);
    return extractBase64FromDomImage(url);
  }
}

/**
 * Clones an ExamDataset and populates `imageBase64` for all questions containing an `imageUrl`.
 */
export async function embedBase64ImagesInDataset(dataset: ExamDataset): Promise<ExamDataset> {
  if (!dataset || !dataset.questions || dataset.examCategory === 'PE' || (dataset.examType || '').toUpperCase().includes('PE')) {
    return dataset;
  }

  const updatedQuestions: Question[] = await Promise.all(
    dataset.questions.map(async (q) => {
      if (q.imageUrl) {
        const base64 = await fetchImageAsBase64(q.imageUrl);
        return {
          ...q,
          imageUrl: normalizeImageUrl(q.imageUrl),
          imageBase64: base64
        };
      }
      return q;
    })
  );

  return {
    ...dataset,
    questions: updatedQuestions
  };
}
