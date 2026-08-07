import { ExamDataset, Question } from '../types';

const FUSTATION_ORIGIN = 'https://www.fustation.net';

/**
 * Normalizes relative image paths (e.g. `exams/fe/mae101/...` or `/exams/...`)
 * into absolute `https://www.fustation.net/...` URLs.
 */
export function normalizeImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

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
 * Asynchronously fetches an image and converts it into a Base64 Data URI (`data:image/png;base64,...`).
 * Returns null if the fetch fails or encounters CORS/network issues.
 */
export async function fetchImageAsBase64(url: string | null | undefined): Promise<string | null> {
  const fullUrl = normalizeImageUrl(url);
  if (!fullUrl) return null;

  try {
    const response = await fetch(fullUrl, { mode: 'cors' });
    if (!response.ok) return null;

    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          resolve(null);
        }
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn(`[fustation-tool] Failed to convert image to Base64 for ${fullUrl}:`, err);
    return null;
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
