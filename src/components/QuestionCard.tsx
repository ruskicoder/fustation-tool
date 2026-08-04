import React from 'react';
import { Question } from '../types';
import { CheckIcon } from './Icons';
import { highlightText } from '../utils/highlight';

interface QuestionCardProps {
  question: Question;
  searchQuery: string;
  isMatch: boolean;
  onImageClick: (url: string) => void;
}

/**
 * Individual question card.
 * - Section anchor: id="q-{index}" — targeted by ScrollspyRail & search nav.
 * - Correct answers are always highlighted (green accent) without any toggle.
 * - Keyword matches in question text and option text are wrapped in
 *   <mark class="fus-highlight"> via dangerouslySetInnerHTML.
 *   highlightText() HTML-escapes the source before inserting marks (XSS-safe).
 * - Images render as clickable thumbnails that open in ImageLightbox.
 */
export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  searchQuery,
  isMatch,
  onImageClick
}) => {
  const questionHtml = highlightText(question.text, searchQuery);

  return (
    <section
      id={`q-${question.index}`}
      className={`fus-q-card${isMatch ? ' is-match' : ''}`}
    >
      {/* Header: question number + question text */}
      <div className="fus-q-card-header">
        <span className="fus-q-index" aria-label={`Question ${question.index}`}>
          {question.index}
        </span>
        <p
          className="fus-q-text"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: questionHtml }}
        />
      </div>

      {/* Optional image thumbnail */}
      {question.imageUrl && (
        <button
          type="button"
          className="fus-q-img-thumb"
          onClick={() => onImageClick(question.imageUrl!)}
          title="Click to view full size"
          aria-label="View question image in full size"
        >
          <img
            src={question.imageUrl}
            alt={`Question ${question.index} illustration`}
            loading="lazy"
          />
          <span className="fus-q-img-zoom-hint" aria-hidden="true">⤢</span>
        </button>
      )}

      {/* Answer options */}
      <ol className="fus-q-options" aria-label="Answer options">
        {question.options.map((opt) => {
          const isCorrect = question.correctAnswers.includes(opt.id);
          const optHtml = highlightText(opt.text, searchQuery);
          return (
            <li
              key={opt.id}
              className={`fus-q-option${isCorrect ? ' correct' : ''}`}
              aria-label={`Option ${opt.id}${isCorrect ? ' — correct answer' : ''}`}
            >
              <span className="fus-q-opt-id">{opt.id}</span>
              <span
                className="fus-q-opt-text"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: optHtml }}
              />
              {isCorrect && (
                <CheckIcon size={12} className="fus-q-check" aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
};
