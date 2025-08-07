'use client'

import { useRef, useCallback } from 'react'
import { DiffResult } from '@/lib/diff-utils'
import { clsx } from 'clsx'

interface SideBySideViewerProps {
  beforeContent: string
  afterContent: string
  diffResults: DiffResult[]
  isLoading?: boolean
  beforeTitle?: string
  afterTitle?: string
}

export function SideBySideViewer({ 
  beforeContent, 
  afterContent, 
  diffResults, 
  isLoading = false,
  beforeTitle = "Original",
  afterTitle = "Optimized"
}: SideBySideViewerProps) {
  const beforeScrollRef = useRef<HTMLDivElement>(null)
  const afterScrollRef = useRef<HTMLDivElement>(null)
  const isScrollingRef = useRef(false)

  const handleScroll = useCallback((source: 'before' | 'after') => {
    return (e: React.UIEvent<HTMLDivElement>) => {
      if (isScrollingRef.current) return
      
      const sourceElement = e.target as HTMLDivElement
      const targetElement = source === 'before' ? afterScrollRef.current : beforeScrollRef.current
      
      if (targetElement) {
        isScrollingRef.current = true
        targetElement.scrollTop = sourceElement.scrollTop
        targetElement.scrollLeft = sourceElement.scrollLeft
        
        // Reset the flag after a short delay to allow for smooth scrolling
        setTimeout(() => {
          isScrollingRef.current = false
        }, 10)
      }
    }
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-card rounded-lg border">
        <div className="flex items-center space-x-2 text-muted-foreground">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-muted border-t-primary" />
          <span>Loading files...</span>
        </div>
      </div>
    )
  }

  if (!beforeContent && !afterContent) {
    return (
      <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border">
        No files loaded yet.
      </div>
    )
  }

  const beforeLines = beforeContent.split('\n')
  const afterLines = afterContent.split('\n')
  const maxLines = Math.max(beforeLines.length, afterLines.length)

  // Create a map of line numbers to diff results for highlighting
  const beforeDiffMap = new Map<number, DiffResult>()
  const afterDiffMap = new Map<number, DiffResult>()
  
  diffResults.forEach((result) => {
    if (result.lineNumber.before !== null) {
      beforeDiffMap.set(result.lineNumber.before, result)
    }
    if (result.lineNumber.after !== null) {
      afterDiffMap.set(result.lineNumber.after, result)
    }
  })

  return (
    <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
      <div className="grid grid-cols-2 gap-0">
        {/* Before column */}
        <div className="border-r border-border">
          <div className="bg-accent/50 border-b px-4 py-2 text-sm font-semibold text-foreground flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-sm mr-2" />
            {beforeTitle}
          </div>
          <div 
            ref={beforeScrollRef}
            className="font-mono text-sm overflow-x-auto max-h-96 overflow-y-auto"
            onScroll={handleScroll('before')}
          >
            {Array.from({ length: maxLines }, (_, index) => {
              const lineNum = index + 1
              const line = beforeLines[index] || ''
              const diffResult = beforeDiffMap.get(lineNum)
              const isDeletion = diffResult?.type === 'deletion'
              
              return (
                <div
                  key={`before-${lineNum}`}
                  className={clsx(
                    'flex px-4 py-1 border-l-4',
                    isDeletion 
                      ? 'border-red-500 bg-red-50 dark:bg-red-950/20' 
                      : 'border-border bg-background hover:bg-accent/20'
                  )}
                >
                  <span className="diff-line-number text-muted-foreground w-8 text-right mr-4 select-none">
                    {line ? lineNum : ''}
                  </span>
                  <span className={clsx(
                    'whitespace-pre-wrap break-words flex-1',
                    isDeletion ? 'text-red-700 dark:text-red-400' : 'text-foreground'
                  )}>
                    {line}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* After column */}
        <div>
          <div className="bg-accent/50 border-b px-4 py-2 text-sm font-semibold text-foreground flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-sm mr-2" />
            {afterTitle}
          </div>
          <div 
            ref={afterScrollRef}
            className="font-mono text-sm overflow-x-auto max-h-96 overflow-y-auto"
            onScroll={handleScroll('after')}
          >
            {Array.from({ length: maxLines }, (_, index) => {
              const lineNum = index + 1
              const line = afterLines[index] || ''
              const diffResult = afterDiffMap.get(lineNum)
              const isAddition = diffResult?.type === 'addition'
              
              return (
                <div
                  key={`after-${lineNum}`}
                  className={clsx(
                    'flex px-4 py-1 border-l-4',
                    isAddition 
                      ? 'border-green-500 bg-green-50 dark:bg-green-950/20' 
                      : 'border-border bg-background hover:bg-accent/20'
                  )}
                >
                  <span className="diff-line-number text-muted-foreground w-8 text-right mr-4 select-none">
                    {line ? lineNum : ''}
                  </span>
                  <span className={clsx(
                    'whitespace-pre-wrap break-words flex-1',
                    isAddition ? 'text-green-700 dark:text-green-400' : 'text-foreground'
                  )}>
                    {line}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}