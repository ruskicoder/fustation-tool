import React from 'react';
import { Question } from '../types';
import { CheckIcon } from './Icons';
import { MathText } from './MathText';
import { normalizeImageUrl } from '../utils/images';

interface QuestionCardProps {
  question: Question;
  searchQuery: string;
  isMatch: boolean;
  onImageClick: (url: string) => void;
}

/**
 * Individual question card component.
 * - Section anchor: id="q-{index}" — targeted by ScrollspyRail & search navigation.
 * - LaTeX math typesetting via KaTeX (<MathText />).
 * - Relative image path normalization via normalizeImageUrl().
 * - Event propagation lock on thumbnail click to prevent host SPA unmounting.
 * - Fallback label "[ Question Illustration ]" for questions with empty text.
 */
export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  searchQuery,
  isMatch,
  onImageClick
}) => {
  const normalizedImg = normalizeImageUrl(question.imageUrl);
  const isTextEmpty = !question.text || !question.text.trim();

  const handleThumbClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (normalizedImg) {
      onImageClick(normalizedImg);
    }
  };

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
        {isTextEmpty ? (
          <span className="fus-q-text fus-q-text-fallback">
            [ Question Illustration ]
          </span>
        ) : (
          <MathText
            text={question.text}
            searchQuery={searchQuery}
            className="fus-q-text"
          />
        )}
      </div>

      {/* Optional image thumbnail */}
      {normalizedImg && (
        <button
          type="button"
          className="fus-q-img-thumb"
          onClick={handleThumbClick}
          onPointerDown={(e) => e.stopPropagation()}
          title="Click to view full size"
          aria-label="View question image in full size"
        >
          <img
            src={normalizedImg}
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
          return (
            <li
              key={opt.id}
              className={`fus-q-option${isCorrect ? ' correct' : ''}`}
              aria-label={`Option ${opt.id}${isCorrect ? ' — correct answer' : ''}`}
            >
              <span className="fus-q-opt-id">{opt.id}</span>
              <MathText
                text={opt.text}
                searchQuery={searchQuery}
                className="fus-q-opt-text"
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
