'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExplanationItem, DiffToken } from '@/lib/types';

interface DiffViewProps {
  diffJson: DiffToken[] | { ops: Array<{ op: string; text?: string; new?: string; old?: string }> };
  explanations: ExplanationItem[];
}

export function DiffView({ diffJson, explanations }: DiffViewProps) {
  const [viewMode, setViewMode] = useState('unified');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const categories = useMemo(() => {
    const allCategories = explanations.map(e => e.category);
    return [...new Set(allCategories)];
  }, [explanations]);

  const filteredExplanations = useMemo(() => {
    if (selectedCategories.length === 0) {
      return explanations;
    }
    return explanations.filter(e => selectedCategories.includes(e.category));
  }, [explanations, selectedCategories]);

  const processedTokens = useMemo(() => {
    // Handle new API format with ops array
    if (diffJson && typeof diffJson === 'object' && 'ops' in diffJson) {
      return diffJson.ops.map((op, index: number) => ({
        op: op.op,
        content: op.text || op.new || op.old || '',
        range: [index, index + 1] as [number, number]
      }));
    }
    // Handle legacy format
    return Array.isArray(diffJson) ? diffJson : [];
  }, [diffJson]);

  const renderTokens = (tokens: DiffToken[], view: 'base' | 'improved') => {
    return tokens.map((token, index) => {
      // Filter tokens based on view mode
      if (view === 'base' && token.op === 'add') return null;
      if (view === 'improved' && token.op === 'del') return null;

      // Filter tokens based on selected categories
      const relevantExplanations = filteredExplanations.filter(e => {
        if (!token.range || !e.range) return false;
        return token.range[0] < e.range[1] && token.range[1] > e.range[0];
      });

      const getTokenClassName = () => {
        if (token.op === 'add') return 'bg-green-100 text-green-800';
        if (token.op === 'del') return 'bg-red-100 text-red-800 line-through';
        return '';
      };

      if (relevantExplanations.length > 0) {
        return (
          <span 
            key={index} 
            className={`cursor-pointer ${getTokenClassName()}`}
            title={relevantExplanations.map(e => `${e.category}: ${e.note}`).join('\n')}
          >
            {token.content}
          </span>
        );
      }

      return (
        <span key={index} className={getTokenClassName()}>
          {token.content}
        </span>
      );
    });
  };

  const renderUnifiedView = () => (
    <div className="prose max-w-none font-mono text-sm whitespace-pre-wrap">
      {renderTokens(processedTokens, 'improved')}
    </div>
  );

  const renderSplitView = () => (
    <div className="grid grid-cols-2 gap-4 font-mono text-sm whitespace-pre-wrap">
      <div>
        <h4 className="font-bold mb-2">Original</h4>
        {renderTokens(processedTokens, 'base')}
      </div>
      <div>
        <h4 className="font-bold mb-2">Improved</h4>
        {renderTokens(processedTokens, 'improved')}
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          {categories.map(category => (
            <Badge
              key={category}
              variant={selectedCategories.includes(category) ? 'default' : 'secondary'}
              onClick={() => {
                setSelectedCategories(prev => 
                  prev.includes(category) 
                    ? prev.filter(c => c !== category) 
                    : [...prev, category]
                );
              }}
              className="cursor-pointer mr-2"
            >
              {category}
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'unified' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('unified')}
          >
            Unified
          </Button>
          <Button
            variant={viewMode === 'split' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('split')}
          >
            Split
          </Button>
        </div>
      </div>
      {viewMode === 'unified' ? renderUnifiedView() : renderSplitView()}
    </div>
  );
}
