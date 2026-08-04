import React, { useEffect, useRef, useState } from 'react';
import { Question } from '../types';

interface ScrollspyRailProps {
  questions: Question[];
  scrollRef: React.RefObject<HTMLDivElement>;
  matchIndices: Set<number>;
}

/**
 * "On this page" sticky navigation rail.
 *
 * Uses IntersectionObserver with root = the question list scroll container
 * (not the viewport) so it works correctly inside a fixed overlay panel.
 * rootMargin offsets the activation zone below the sticky viewer header (≈48px)
 * and cuts off 40% from the bottom to prevent deep cards triggering too early.
 *
 * Exactly one link carries aria-current="location" at a time.
 * The active link is determined by whichever intersecting entry has the
 * highest intersectionRatio; ties are broken by lowest boundingClientRect.top.
 */
export const ScrollspyRail: React.FC<ScrollspyRailProps> = ({
  questions,
  scrollRef,
  matchIndices
}) => {
  const [activeIndex, setActiveIndex] = useState<number>(
    questions.length > 0 ? questions[0].index : 0
  );

  // Keep a stable ref to current activeIndex for the observer callback.
  const activeRef = useRef(activeIndex);
  activeRef.current = activeIndex;

  useEffect(() => {
    const root = scrollRef.current;
    if (!root || questions.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const intersecting = entries.filter((e) => e.isIntersecting);
        if (intersecting.length === 0) return;

        // Pick the entry closest to the top of the scroll container.
        const winning = intersecting.reduce((best, curr) =>
          curr.boundingClientRect.top < best.boundingClientRect.top ? curr : best
        );

        const idxStr = winning.target.id.replace('q-', '');
        const idx = parseInt(idxStr, 10);
        if (!isNaN(idx) && idx !== activeRef.current) {
          setActiveIndex(idx);
        }
      },
      {
        root,
        // 48px top offset for the sticky viewer header; 30% bottom margin
        // creates a band that avoids activating cards that are barely visible.
        rootMargin: '-48px 0px -30% 0px',
        threshold: [0, 0.1, 0.25, 0.5]
      }
    );

    // Observe all section anchors: elements with id="q-{index}"
    questions.forEach((q) => {
      const el = root.querySelector(`#q-${q.index}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [questions, scrollRef]);

  const scrollToQuestion = (index: number) => {
    const root = scrollRef.current;
    if (!root) return;
    const target = root.querySelector(`#q-${index}`) as HTMLElement | null;
    if (target) {
      // scrollIntoView inside the scroll container
      const topOffset = target.offsetTop - 52; // 52px = viewer header height
      root.scrollTo({ top: topOffset, behavior: 'smooth' });
    }
  };

  return (
    <nav aria-label="On this page" className="fus-scrollspy">
      {questions.map((q) => {
        const isActive = activeIndex === q.index;
        const hasMatch = matchIndices.has(q.index);
        return (
          <a
            key={q.index}
            href={`#q-${q.index}`}
            aria-current={isActive ? 'location' : undefined}
            className={[
              'fus-spy-link',
              isActive ? 'active' : '',
              hasMatch ? 'has-match' : ''
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={(e) => {
              e.preventDefault();
              scrollToQuestion(q.index);
            }}
            title={`Question ${q.index}`}
          >
            {q.index}
          </a>
        );
      })}
    </nav>
  );
};
