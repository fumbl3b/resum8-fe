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
    // This is a simplified rendering logic. A more robust implementation
    // would handle nested tokens and more complex diff structures.
    return tokens.map((token, index) => {
      const explanation = filteredExplanations.find(e => e.range[0] >= token.range[0] && e.range[1] <= token.range[1]);
      const style = {
        backgroundColor: token.op === 'add' ? '#ddf4ff' : token.op === 'del' ? '#ffebe9' : 'transparent',
        textDecoration: token.op === 'del' ? 'line-through' : 'none',
      };

      if (explanation) {
        return (
          <Popover key={index}>
            <PopoverTrigger asChild>
              <span style={style} className="cursor-pointer">{token.value}</span>
            </PopoverTrigger>
            <PopoverContent>
              <p className="font-bold">{explanation.category}</p>
              <p>{explanation.note}</p>
            </PopoverContent>
          </Popover>
        );
      }

      return <span key={index} style={style}>{token.value}</span>;
    });
  };

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
      {/* Rendering logic needs to be updated to handle the diffJson structure */}
    </div>
  );
}
