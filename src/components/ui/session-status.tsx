import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Loader2,
  FileText,
  Search,
  Lightbulb,
  Edit,
  GitCompare,
  FileType,
  Download
} from 'lucide-react';

interface SessionStatusProps {
  sessionData: any;
  className?: string;
}

const stepIcons = {
  parse_base: FileText,
  analyze: Search,
  suggest: Lightbulb,
  rewrite: Edit,
  diff: GitCompare,
  latex: FileType,
  pdf: Download
};

const stepLabels = {
  parse_base: 'Parsing Resume',
  analyze: 'Analyzing Job Match',
  suggest: 'Generating Suggestions',
  rewrite: 'Rewriting Content',
  diff: 'Creating Diff',
  latex: 'Generating LaTeX',
  pdf: 'Creating PDF'
};

const getStepStatus = (step: any) => {
  if (!step) return 'PENDING';
  return step.state || 'PENDING';
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'DONE':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'RUNNING':
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    case 'ERROR':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-400" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'DONE':
      return 'bg-green-500';
    case 'RUNNING':
      return 'bg-blue-500';
    case 'ERROR':
      return 'bg-red-500';
    default:
      return 'bg-gray-300';
  }
};

export function SessionStatus({ sessionData, className = '' }: SessionStatusProps) {
  if (!sessionData) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Initializing session...
          </div>
        </CardContent>
      </Card>
    );
  }

  const steps = sessionData.steps || {};
  const stepKeys = Object.keys(steps);
  const completedSteps = stepKeys.filter(key => steps[key]?.state === 'DONE').length;
  const totalSteps = stepKeys.length;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  const overallStatus = sessionData.status || 'PENDING';
  const isComplete = overallStatus === 'DONE';
  const hasError = overallStatus === 'ERROR';

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Session Progress</CardTitle>
          <div className="flex items-center gap-2">
            {getStatusIcon(overallStatus)}
            <Badge variant={isComplete ? 'default' : hasError ? 'destructive' : 'secondary'}>
              {overallStatus}
            </Badge>
          </div>
        </div>
        {totalSteps > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{completedSteps} of {totalSteps} steps completed</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </CardHeader>
      
      {totalSteps > 0 && (
        <CardContent className="pt-0">
          <div className="space-y-2">
            {stepKeys.map((stepKey) => {
              const step = steps[stepKey];
              const status = getStepStatus(step);
              const Icon = stepIcons[stepKey as keyof typeof stepIcons] || Clock;
              const label = stepLabels[stepKey as keyof typeof stepLabels] || stepKey;
              
              return (
                <div key={stepKey} className="flex items-center gap-3 py-1">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`} />
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm flex-1">{label}</span>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(status)}
                    {step?.started_at && status === 'RUNNING' && (
                      <span className="text-xs text-muted-foreground">
                        {Math.round((Date.now() - new Date(step.started_at).getTime()) / 1000)}s
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {sessionData.pdf_ready && (
            <div className="mt-3 pt-3 border-t">
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>PDF is ready for download</span>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}