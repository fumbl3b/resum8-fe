'use client';

import { useState } from 'react';
import * as Diff from 'diff';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface DiffViewProps {
  baseText: string;
  improvedText: string;
  // diffJson and explanations will be used later
}

export function DiffView({ baseText, improvedText }: DiffViewProps) {
  const [viewMode, setViewMode] = useState('unified');
  const differences = Diff.diffLines(baseText, improvedText);

  const renderUnifiedView = () => (
    <div className="prose max-w-none font-mono text-sm whitespace-pre-wrap">
      {differences.map((part, index) => {
        const style = {
          backgroundColor: part.added ? '#ddf4ff' : part.removed ? '#ffebe9' : 'transparent',
          textDecoration: part.removed ? 'line-through' : 'none',
          display: 'block',
        };
        return (
          <span key={index} style={style}>
            {part.value}
          </span>
        );
      })}
    </div>
  );

  const renderSplitView = () => (
    <div className="grid grid-cols-2 gap-4 font-mono text-sm whitespace-pre-wrap">
      <div>
        <h4 className="font-bold mb-2">Original</h4>
        {differences.map((part, index) => (
          <span key={index} style={{ backgroundColor: part.removed ? '#ffebe9' : 'transparent', display: 'block' }}>
            {part.removed || !part.added ? part.value : '\n'}
          </span>
        ))}
      </div>
      <div>
        <h4 className="font-bold mb-2">Improved</h4>
        {differences.map((part, index) => (
          <span key={index} style={{ backgroundColor: part.added ? '#ddf4ff' : 'transparent', display: 'block' }}>
            {part.added || !part.removed ? part.value : '\n'}
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex justify-end mb-4">
        <ToggleGroup type="single" value={viewMode} onValueChange={setViewMode} aria-label="Diff view mode">
          <ToggleGroupItem value="unified" aria-label="Unified view">
            Unified
          </ToggleGroupItem>
          <ToggleGroupItem value="split" aria-label="Split view">
            Split
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      {viewMode === 'unified' ? renderUnifiedView() : renderSplitView()}
    </div>
  );
}
