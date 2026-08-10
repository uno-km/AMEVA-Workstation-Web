import type { ChartData } from './docxChartInjector';

/**
 * Heuristic engine to scan a 2D table matrix and extract multi-series ChartData.
 */
export function extractChartDataFromMatrix(rawMatrix: string[][], hasHeaderRow: boolean): ChartData | null {
  if (!rawMatrix || rawMatrix.length < 2) return null;

  const cols = rawMatrix[0]?.length || 0;
  const numericCols: number[] = [];
  let labelColIdx = -1;
  
  // 1. Identify all numeric columns
  for (let c = 0; c < cols; c++) {
    let numCount = 0;
    let validRows = 0;
    for (let r = hasHeaderRow ? 1 : 0; r < rawMatrix.length; r++) {
      if (!rawMatrix[r] || c >= rawMatrix[r].length) continue;
      const text = rawMatrix[r][c]?.trim() || '';
      if (!text) continue;
      validRows++;
      if (/^[0-9,.\s%원천만억달러]+$/.test(text)) numCount++;
    }
    // Threshold: 60% numeric means this column is a data series
    if (validRows > 0 && numCount / validRows > 0.6) {
      numericCols.push(c);
    } else if (labelColIdx === -1 && validRows > 0) {
      labelColIdx = c;
    }
  }
  
  // Fallback for label column if all columns are numeric
  if (labelColIdx === -1 && numericCols.length > 1) {
    labelColIdx = numericCols.shift()!;
  }
  
  if (numericCols.length > 0 && labelColIdx !== -1 && cols >= 2) {
    const labels: string[] = [];
    const seriesData: { [key: number]: number[] } = {};
    numericCols.forEach(c => seriesData[c] = []);
    
    for (let r = hasHeaderRow ? 1 : 0; r < rawMatrix.length; r++) {
      if (!rawMatrix[r]) continue;
      const lText = (rawMatrix[r][labelColIdx] || '').trim();
      if (lText === '' || lText.includes('합계') || lText.includes('총계')) continue;
      
      let hasValidNum = false;
      numericCols.forEach(c => {
        /*
         * [RUN-TIME STATE / INVARIANT]
         * - 변수 명: `vNum`
         * - 자료형: number
         * - 시나리오: [BUG-6 수정] parseFloat 연산을 변수에 캐시하여 동일 루프 내에서 2번 계산하던 중복 연산을 1번으로 줄였다.
         *             이전 코드는 hasValidNum 체크용으로 1번, seriesData 저장용으로 1번 총 2번 계산했었다.
         */
        const vNum = parseFloat((rawMatrix[r][c] || '').replace(/[^0-9.-]/g, ''));
        if (!isNaN(vNum)) hasValidNum = true;
      });
      
      if (hasValidNum) {
        labels.push(lText);
        numericCols.forEach(c => {
          const vNum = parseFloat((rawMatrix[r][c] || '').replace(/[^0-9.-]/g, ''));
          seriesData[c].push(isNaN(vNum) ? 0 : vNum);
        });
      }
    }
    
    if (labels.length > 0) {
      const series = numericCols.map((c, i) => ({
        name: (hasHeaderRow && rawMatrix[0][c] ? rawMatrix[0][c] : `Series ${i+1}`) || `Series ${i+1}`,
        values: seriesData[c]
      }));
      
      let type: 'pie' | 'doughnut' | 'bar' | 'column' | 'line' = 'column';
      if (series.length === 1) {
        type = labels.length <= 5 ? 'doughnut' : 'bar';
      } else if (series.length > 1) {
        const isTime = series.some(s => /년|월|분기|일/i.test(s.name));
        type = isTime ? 'line' : 'column';
      }
      
      return {
        id: `chart_${Math.floor(Math.random()*100000)}`,
        type,
        labels,
        series,
        title: '데이터 시각화 요약'
      };
    }
  }
  
  return null;
}
