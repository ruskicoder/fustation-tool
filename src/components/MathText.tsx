import React from 'react';
import { renderMathInText } from '../utils/math';

interface MathTextProps {
  text: string;
  searchQuery?: string;
  className?: string;
}

/**
 * Renders LaTeX math expressions via KaTeX and highlights matching search terms
 * in non-math segments. XSS-safe HTML output.
 */
export const MathText: React.FC<MathTextProps> = ({ text, searchQuery, className }) => {
  const html = renderMathInText(text, searchQuery);
  return (
    <span
      className={className}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
