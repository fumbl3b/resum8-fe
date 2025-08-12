'use client'

import { DiffResult } from '@/lib/diff-utils'
import { clsx } from 'clsx'

interface DiffViewerProps {
  diffResults: DiffResult[]
  isLoading?: boolean
  title?: string
}

export function DiffViewer({ diffResults, isLoading = false, title = "Resume Changes" }: DiffViewerProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-card rounded-lg border">
        <div className="flex items-center space-x-2 text-muted-foreground">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-muted border-t-primary" />
          <span>Loading diff...</span>
        </div>
      </div>
    )
  }

  if (diffResults.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border">
        No differences found or files not loaded yet.
      </div>
    )
  }

  return (
    <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
      <div className="bg-accent/50 border-b px-4 py-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded-sm" />
            <span>Added</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-sm" />
            <span>Removed</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-gray-400 rounded-sm" />
            <span>Unchanged</span>
          </div>
        </div>
      </div>
      
      <div className="font-mono text-sm overflow-x-auto">
        {diffResults.map((result, index) => {
          // Check if this is part of a modification (deletion followed by addition)
          const isModification = result.type === 'deletion' && 
            index + 1 < diffResults.length && 
            diffResults[index + 1].type === 'addition'
          
          const isModificationAddition = result.type === 'addition' && 
            index > 0 && 
            diffResults[index - 1].type === 'deletion'
          
          return (
            <div
              key={index}
              className={clsx(
                'diff-line flex',
                {
                  'diff-line-addition': result.type === 'addition',
                  'diff-line-deletion': result.type === 'deletion',
                  'diff-line-unchanged': result.type === 'unchanged',
                  'border-l-4 border-red-500 bg-red-50 dark:bg-red-950/20': isModification,
                  'border-l-4 border-green-500 bg-green-50 dark:bg-green-950/20': isModificationAddition,
                }
              )}
            >
              <div className="diff-line-number flex-shrink-0 w-16 text-center">
                <span className="text-muted-foreground">
                  {result.lineNumber.before || ' '}
                </span>
                <span className="text-muted-foreground/50 mx-1">|</span>
                <span className="text-muted-foreground">
                  {result.lineNumber.after || ' '}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <span className={clsx(
                  'inline-block mr-2 w-4 text-center font-bold',
                  {
                    'text-green-600': result.type === 'addition',
                    'text-red-600': result.type === 'deletion',
                    'text-muted-foreground/50': result.type === 'unchanged',
                  }
                )}>
                  {result.type === 'addition' ? '+' : result.type === 'deletion' ? '-' : ' '}
                </span>
                <span className={clsx(
                  'whitespace-pre-wrap break-words',
                  {
                    'text-green-700 dark:text-green-300': result.type === 'addition',
                    'text-red-700 dark:text-red-300': result.type === 'deletion',
                    'text-foreground': result.type === 'unchanged',
                  }
                )}>
                  {result.content}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}