import React from 'react';
import { Question, ReadingPassage } from '../types';
import { MathText } from './MathText';
import { QuestionCard } from './QuestionCard';

interface QuestionListProps {
  questions: Question[];
  passages?: ReadingPassage[];
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
  passages,
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
      {questions.map((q, i) => (
        <React.Fragment key={q.id || q.index}>
          {(passages || []).filter((p) => p.fromQuestion === i + 1).map((p) => (
            <section key={p.id} className="fus-passage" aria-label={`Reading passage for questions ${p.fromQuestion} to ${p.toQuestion}`}>
              <p className="fus-passage-label">
                Reading · Questions {p.fromQuestion}{p.toQuestion !== p.fromQuestion ? `-${p.toQuestion}` : ''}
              </p>
              <MathText text={p.text} searchQuery={searchQuery} className="fus-passage-text" />
            </section>
          ))}
          <QuestionCard
            question={q}
            searchQuery={searchQuery}
            isMatch={matchIndices.has(q.index)}
            onImageClick={onImageClick}
          />
        </React.Fragment>
      ))}
    </div>
  );
};
