'use client';

import * as Diff from 'diff';

interface DiffViewProps {
  baseText: string;
  improvedText: string;
  // diffJson and explanations will be used later
}

export function DiffView({ baseText, improvedText }: DiffViewProps) {
  const differences = Diff.diffChars(baseText, improvedText);

  return (
    <div className="prose max-w-none font-mono text-sm">
      {differences.map((part, index) => {
        const style = {
          backgroundColor: part.added ? '#ddf4ff' : part.removed ? '#ffebe9' : 'transparent',
          textDecoration: part.removed ? 'line-through' : 'none',
        };
        return (
          <span key={index} style={style}>
            {part.value}
          </span>
        );
      })}
    </div>
  );
}
