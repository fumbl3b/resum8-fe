'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  const { acceptedSuggestions, toggleSuggestion } = useAppStore();
  const isAccepted = acceptedSuggestions.includes(suggestion.id);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive/20 text-destructive';
      case 'medium': return 'bg-warning/20 text-warning';
      case 'low': return 'bg-success/20 text-success';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'addition': return 'bg-info/20 text-info';
      case 'modification': return 'bg-primary/20 text-primary';
      case 'removal': return 'bg-warning/20 text-warning';
      case 'keyword': return 'bg-success/20 text-success';
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
              <Badge className={getPriorityColor(suggestion.priority)}>
                {suggestion.priority} priority
              </Badge>
              <Badge className={getTypeColor(suggestion.type)}>
                {suggestion.type}
              </Badge>
              <Badge variant="outline">
                {suggestion.section}
              </Badge>
            </div>
            <CardTitle className="text-lg">
              {suggestion.type === 'addition' && 'Add Content'}
              {suggestion.type === 'modification' && 'Modify Content'}
              {suggestion.type === 'removal' && 'Remove Content'}
              {suggestion.type === 'keyword' && 'Add Keywords'}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground">
              {Math.round(suggestion.confidence * 100)}% confidence
            </div>
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
          <div>
            <h4 className="font-medium mb-2">Suggested Content</h4>
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm">{suggestion.suggested_text}</p>
            </div>
          </div>

          {suggestion.current_text && (
            <div>
              <h4 className="font-medium mb-2">Current Content</h4>
              <div className="bg-warning/10 p-3 rounded-lg border-l-4 border-warning">
                <p className="text-sm text-warning">{suggestion.current_text}</p>
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
              <p className="text-sm text-info/80">{suggestion.reasoning}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}