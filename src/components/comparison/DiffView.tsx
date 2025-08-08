'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Explanation, DiffToken } from '@/lib/types';

interface DiffViewProps {
  diffJson: DiffToken[];
  explanations: Explanation[];
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

  const renderTokens = (tokens: DiffToken[], view: 'base' | 'improved') => {
    return tokens.map((token, index) => {
      // Filter tokens based on view mode
      if (view === 'base' && token.op === 'add') return null;
      if (view === 'improved' && token.op === 'del') return null;

      // Filter tokens based on selected categories
      const relevantExplanations = filteredExplanations.filter(e => 
        (token.range[0] < e.range[1] && token.range[1] > e.range[0])
      );

      const style = {
        backgroundColor: token.op === 'add' ? '#ddf4ff' : token.op === 'del' ? '#ffebe9' : 'transparent',
        textDecoration: token.op === 'del' ? 'line-through' : 'none',
      };

      if (relevantExplanations.length > 0) {
        return (
          <Popover key={index}>
            <PopoverTrigger asChild>
              <span style={style} className="cursor-pointer">
                {token.value}
              </span>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              {relevantExplanations.map((exp, expIndex) => (
                <div key={expIndex} className="mb-2 last:mb-0">
                  <p className="font-bold text-sm">{exp.category}</p>
                  <p className="text-xs text-muted-foreground">{exp.note}</p>
                </div>
              ))}
            </PopoverContent>
          </Popover>
        );
      }

      return <span key={index} style={style}>{token.value}</span>;
    });
  };

  const renderUnifiedView = () => (
    <div className="prose max-w-none font-mono text-sm whitespace-pre-wrap">
      {renderTokens(diffJson, 'improved')}
    </div>
  );

  const renderSplitView = () => (
    <div className="grid grid-cols-2 gap-4 font-mono text-sm whitespace-pre-wrap">
      <div>
        <h4 className="font-bold mb-2">Original</h4>
        {renderTokens(diffJson, 'base')}
      </div>
      <div>
        <h4 className="font-bold mb-2">Improved</h4>
        {renderTokens(diffJson, 'improved')}
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
