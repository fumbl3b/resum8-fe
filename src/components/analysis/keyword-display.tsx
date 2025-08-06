'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface KeywordDisplayProps {
  keywords: string[];
  title: string;
  description: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

export function KeywordDisplay({ 
  keywords, 
  title, 
  description, 
  variant = 'default' 
}: KeywordDisplayProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {keywords.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {keywords.map((keyword, index) => (
              <Badge key={index} variant={variant}>
                {keyword}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No {title.toLowerCase()} found
          </p>
        )}
      </CardContent>
    </Card>
  );
}