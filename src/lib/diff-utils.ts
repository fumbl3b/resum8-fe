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
  
  changes.forEach((change) => {
    const lines = change.value.split('\n').filter((line, index, array) => 
      index < array.length - 1 || line !== ''
    )
    
    lines.forEach((line) => {
      if (change.added) {
        results.push({
          type: 'addition',
          content: line,
          lineNumber: {
            before: null,
            after: afterLineNum++
          }
        })
      } else if (change.removed) {
        results.push({
          type: 'deletion',
          content: line,
          lineNumber: {
            before: beforeLineNum++,
            after: null
          }
        })
      } else {
        results.push({
          type: 'unchanged',
          content: line,
          lineNumber: {
            before: beforeLineNum++,
            after: afterLineNum++
          }
        })
      }
    })
  })
  
  return results
}