// Simplified Diff Engine for AMEVA Web Simulator
export function calculateSimpleDiff(original, proposed) {
  const origLines = original.split('\n');
  const propLines = proposed.split('\n');
  let result = [];

  const maxLen = Math.max(origLines.length, propLines.length);
  for (let i = 0; i < maxLen; i++) {
    const o = origLines[i] || '';
    const p = propLines[i] || '';

    if (o === p) {
      result.push({ type: 'normal', text: o });
    } else {
      if (o) result.push({ type: 'removed', text: o });
      if (p) result.push({ type: 'added', text: p });
    }
  }
  return result;
}
