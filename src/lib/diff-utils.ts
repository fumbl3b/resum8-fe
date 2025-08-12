import { diffLines, Change } from 'diff'

export interface DiffResult {
  type: 'addition' | 'deletion' | 'unchanged'
  content: string
  lineNumber: {
    before: number | null
    after: number | null
  }
}

export function generateDiff(before: string, after: string): DiffResult[] {
  const changes: Change[] = diffLines(before, after)
  const results: DiffResult[] = []
  
  let beforeLineNum = 1
  let afterLineNum = 1
  
  // Process changes to create a more traditional unified diff
  for (let i = 0; i < changes.length; i++) {
    const change = changes[i]
    const lines = change.value.split('\n').filter((line, index, array) => 
      index < array.length - 1 || line !== ''
    )
    
    if (change.added) {
      // This is an addition - add all lines as additions
      lines.forEach((line) => {
        results.push({
          type: 'addition',
          content: line,
          lineNumber: {
            before: null,
            after: afterLineNum++
          }
        })
      })
    } else if (change.removed) {
      // This is a deletion - check if next change is an addition
      const nextChange = changes[i + 1]
      
      if (nextChange && nextChange.added && !nextChange.removed) {
        // Next change is an addition - this is a modification
        // Show deletions and additions side by side
        const nextLines = nextChange.value.split('\n').filter((line, index, array) => 
          index < array.length - 1 || line !== ''
        )
        
        // Find the maximum number of lines to show
        const maxLines = Math.max(lines.length, nextLines.length)
        
        for (let j = 0; j < maxLines; j++) {
          // Show deletion first (if exists)
          if (j < lines.length) {
            results.push({
              type: 'deletion',
              content: lines[j],
              lineNumber: {
                before: beforeLineNum++,
                after: null
              }
            })
          }
          
          // Show addition next (if exists)
          if (j < nextLines.length) {
            results.push({
              type: 'addition',
              content: nextLines[j],
              lineNumber: {
                before: null,
                after: afterLineNum++
              }
            })
          }
        }
        
        // Skip the next change since we've already processed it
        i++
      } else {
        // This is just a deletion - add all lines as deletions
        lines.forEach((line) => {
          results.push({
            type: 'deletion',
            content: line,
            lineNumber: {
              before: beforeLineNum++,
              after: null
            }
          })
        })
      }
    } else {
      // This is unchanged - add all lines as unchanged
      lines.forEach((line) => {
        results.push({
          type: 'unchanged',
          content: line,
          lineNumber: {
            before: beforeLineNum++,
            after: afterLineNum++
          }
        })
      })
    }
  }
  
  return results
}