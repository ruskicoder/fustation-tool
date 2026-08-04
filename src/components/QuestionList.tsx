import React from 'react';
import { Question } from '../types';
import { QuestionCard } from './QuestionCard';

interface QuestionListProps {
  questions: Question[];
  searchQuery: string;
  matchIndices: Set<number>;
  scrollRef: React.RefObject<HTMLDivElement>;
  onImageClick: (url: string) => void;
}

/**
 * Scrollable container of QuestionCard items.
 * The div ref is shared with ScrollspyRail (IntersectionObserver root)
 * and used for programmatic scrollTo inside the scrollspy.
 */
export const QuestionList: React.FC<QuestionListProps> = ({
  questions,
  searchQuery,
  matchIndices,
  scrollRef,
  onImageClick
}) => {
  if (questions.length === 0) {
    return (
      <div ref={scrollRef} className="fus-question-list fus-question-list-empty">
        <div className="fus-empty">
          <p className="fus-empty-title">No questions</p>
          <p className="fus-empty-sub">This dataset contains no question data.</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="fus-question-list" role="feed" aria-label="Exam questions">
      {questions.map((q) => (
        <QuestionCard
          key={q.id || q.index}
          question={q}
          searchQuery={searchQuery}
          isMatch={matchIndices.has(q.index)}
          onImageClick={onImageClick}
        />
      ))}
    </div>
  );
};
