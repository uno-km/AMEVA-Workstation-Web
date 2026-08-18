/**
 * ============================================================================
 * @file diffUtils.ts
 * @system AMEVA OS Desktop Workstation - Diff Engine
 * @location packages/core/src/renderer/utils/diffUtils.ts
 * @role Centralized, High-Accuracy LCS (Longest Common Subsequence) Line Diff Engine
 * ============================================================================
 */

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  value: string;
  oldLineNum?: number;
  newLineNum?: number;
}

/**
 * Computes an exact line-by-line diff between two strings using dynamic programming LCS.
 * Produces optimal, minimal diff chunks for code viewers, history rollback, and AI suggestions.
 */
export function computeLineDiff(oldStr: string, newStr: string): DiffLine[] {
  const oldLines = (oldStr || '').split('\n');
  const newLines = (newStr || '').split('\n');
  const n = oldLines.length;
  const m = newLines.length;
  
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      if (oldLines[i] === newLines[j]) {
        dp[i + 1][j + 1] = dp[i][j] + 1;
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }
  
  let i = n;
  let j = m;
  const trace: DiffLine[] = [];
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      trace.unshift({ type: 'unchanged', value: oldLines[i - 1], oldLineNum: i, newLineNum: j });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      trace.unshift({ type: 'added', value: newLines[j - 1], newLineNum: j });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      trace.unshift({ type: 'removed', value: oldLines[i - 1], oldLineNum: i });
      i--;
    }
  }
  
  return trace;
}
