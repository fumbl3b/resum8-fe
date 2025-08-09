'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { OptimizationSuggestion } from '@/lib/types';
import { useAppStore } from '@/stores/app-store';

interface SuggestionCardProps {
  suggestion: OptimizationSuggestion;
}

export function SuggestionCard({ suggestion }: SuggestionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { selectedSuggestions, toggleSuggestion } = useAppStore();
  const isAccepted = selectedSuggestions.includes(suggestion.id);

  const getPriorityColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-destructive/20 text-destructive';
      case 'medium': return 'bg-warning/20 text-warning';
      case 'low': return 'bg-success/20 text-success';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'keywords': return 'bg-info/20 text-info';
      case 'formatting': return 'bg-primary/20 text-primary';
      case 'content': return 'bg-warning/20 text-warning';
      case 'skills': return 'bg-success/20 text-success';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className={`transition-all duration-200 ${
      isAccepted ? 'ring-2 ring-success bg-success/10' : 'hover:shadow-md hover:shadow-primary/20'
    }`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={getPriorityColor(suggestion.impact)}>
                {suggestion.impact} impact
              </Badge>
              <Badge className={getCategoryColor(suggestion.category)}>
                {suggestion.category}
              </Badge>
            </div>
            <CardTitle className="text-lg">
              {suggestion.title}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {/* Optional metrics could go here */}
            <Button
              variant={isAccepted ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleSuggestion(suggestion.id)}
            >
              {isAccepted ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Accepted
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-1" />
                  Accept
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {suggestion.description && (
            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm">{suggestion.description}</p>
              </div>
            </div>
          )}

          <div>
            <h4 className="font-medium mb-2">Suggested Content</h4>
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm">{suggestion.suggestedText || '—'}</p>
            </div>
          </div>

          {suggestion.originalText && (
            <div>
              <h4 className="font-medium mb-2">Current Content</h4>
              <div className="bg-warning/10 p-3 rounded-lg border-l-4 border-warning">
                <p className="text-sm text-warning">{suggestion.originalText}</p>
              </div>
            </div>
          )}

          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-0 h-auto font-normal text-sm"
            >
              <span className="mr-1">
                {isExpanded ? 'Hide' : 'Show'} reasoning
              </span>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>

          {isExpanded && (
            <div className="bg-info/10 p-3 rounded-lg border-l-4 border-info">
              <h4 className="font-medium mb-2 text-info">Why this suggestion?</h4>
              <p className="text-sm text-info/80">{suggestion.description || 'No additional reasoning provided.'}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}