/**
 * ============================================================================
 * @file docxChartInjector.ts
 * @description docxChartInjector.ts 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './docxChartInjector';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

// [외부 패키지 및 라이브러리 임포트: jszip]
import JSZip from 'jszip';

/**
 * [INTERNAL TYPE]
 * - 타입 명: `ChartSeries`
 * - 역할: 단일 차트 시리즈(데이터 계열)의 이름과 값 배열을 표현한다.
 * - [WARN-9 수정] export 제거: 이 타입은 이 파일 내부(ChartData.series)에서만 사용되므로 public API에서 제외한다.
 *               외부에서 ChartData만 import해도 충분하다.
 */
interface ChartSeries {
  name: string;
  values: number[];
}

/**
 * ChartData 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface ChartData {
  id: string;
  type: 'pie' | 'doughnut' | 'bar' | 'column' | 'line';
  labels: string[];
  series: ChartSeries[];
  title?: string;
}

// McKinsey-style muted pastel palette
const COLORS = ['4F81BD', 'C0504D', '9BBB59', '8064A2', '4BACC6', 'F79646', '2C4D75', '772C2A'];

/**
 * generateSeriesXml 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
function generateSeriesXml(chart: ChartData, isLine: boolean = false): string {
  let xml = '';
  
  chart.series.forEach((s, sIdx) => {
    const color = COLORS[sIdx % COLORS.length];
    
    let catCache = '';
    let valCache = '';
    let colorPoints = '';
    
    const ptCount = chart.labels.length;
    for (let i = 0; i < ptCount; i++) {
      catCache += `<c:pt idx="${i}"><c:v>${chart.labels[i]}</c:v></c:pt>`;
      valCache += `<c:pt idx="${i}"><c:v>${s.values[i]}</c:v></c:pt>`;
      
      // Data point coloring for Pie/Doughnut (they color individual points, Bar/Column/Line color the whole series)
      if (chart.type === 'pie' || chart.type === 'doughnut') {
        const ptColor = COLORS[i % COLORS.length];
        colorPoints += `
          <c:dPt>
            <c:idx val="${i}"/>
            <c:spPr>
              <a:solidFill><a:srgbClr val="${ptColor}"/></a:solidFill>
              <a:ln><a:noFill/></a:ln>
            </c:spPr>
          </c:dPt>
        `;
      }
    }

    const seriesName = `<c:tx><c:strRef><c:strCache><c:ptCount val="1"/><c:pt idx="0"><c:v>${s.name}</c:v></c:pt></c:strCache></c:strRef></c:tx>`;
    
    let spPr = '';
    if (isLine) {
      spPr = `
        <c:spPr>
          <a:ln w="28575">
            <a:solidFill><a:srgbClr val="${color}"/></a:solidFill>
            <a:round/>
          </a:ln>
        </c:spPr>
        <c:marker>
          <c:symbol val="circle"/>
          <c:size val="5"/>
          <c:spPr>
            <a:solidFill><a:srgbClr val="${color}"/></a:solidFill>
            <a:ln><a:noFill/></a:ln>
          </c:spPr>
        </c:marker>
      `;
    } else if (chart.type === 'bar' || chart.type === 'column') {
      spPr = `
        <c:spPr>
          <a:solidFill><a:srgbClr val="${color}"/></a:solidFill>
          <a:ln><a:noFill/></a:ln>
        </c:spPr>
      `;
    }
    
    // For pie/doughnut, show percent or value. For bar/line, maybe show values if single series.
    const showVal = (chart.series.length === 1 && chart.type !== 'pie' && chart.type !== 'doughnut') ? '1' : '0';

    xml += `
      <c:ser>
        <c:idx val="${sIdx}"/><c:order val="${sIdx}"/>
        ${seriesName}
        ${spPr}
        ${colorPoints}
        <c:dLbls>
          <c:showLegendKey val="0"/><c:showVal val="${showVal}"/><c:showCatName val="0"/><c:showSerName val="0"/><c:showPercent val="${(chart.type === 'pie' || chart.type === 'doughnut') ? '1' : '0'}"/><c:showBubbleSize val="0"/>
        </c:dLbls>
        <c:cat><c:strRef><c:strCache><c:ptCount val="${ptCount}"/>${catCache}</c:strCache></c:strRef></c:cat>
        <c:val><c:numRef><c:numCache><c:formatCode>General</c:formatCode><c:ptCount val="${ptCount}"/>${valCache}</c:numCache></c:numRef></c:val>
      </c:ser>
    `;
  });
  
  return xml;
}

/**
 * [FUNCTION CONTRACT] (내부 헬퍼)
 * - 함수 명: `generateAxisXml`
 * - 역할: [BUG-7 수정] bar/column 차트와 line 차트에서 거의 동일하게 복붙되던 catAx/valAx XML 구조를 공통 함수로 추출했다.
 *         catPos(카테고리 축 위치)와 valPos(값 축 위치)를 파라미터로 받아 동적으로 OpenXML Axis 요소를 생성한다.
 * @param catPos - 카테고리 축 위치 ('b' = 하단, 'l' = 좌측)
 * @param valPos - 값 축 위치 ('l' = 좌측, 'b' = 하단)
 * @returns catAx + valAx OpenXML 문자열
 */
function generateAxisXml(catPos: 'b' | 'l', valPos: 'l' | 'b'): string {
  /*
   * [RETURN VALUE]
   * - 설명: catAx(카테고리 X축)와 valAx(값 Y축) OpenXML 요소를 생성한다.
   *         catPos/valPos가 서로 교차하여 bar 차트는 가로 방향, column/line 차트는 세로 방향을 구성한다.
   */
  return `
    <c:catAx>
      <c:axId val="111"/>
      <c:scaling><c:orientation val="minMax"/></c:scaling>
      <c:axPos val="${catPos}"/>
      <c:crossAx val="222"/>
      <c:tickLblPos val="nextTo"/>
      <c:majorTickMark val="none"/>
      <c:minorTickMark val="none"/>
      <c:spPr>
        <a:ln w="9525"><a:solidFill><a:srgbClr val="888888"/></a:solidFill></a:ln>
      </c:spPr>
    </c:catAx>
    <c:valAx>
      <c:axId val="222"/>
      <c:scaling><c:orientation val="minMax"/></c:scaling>
      <c:axPos val="${valPos}"/>
      <c:crossAx val="111"/>
      <c:tickLblPos val="nextTo"/>
      <c:majorGridlines>
        <c:spPr>
          <a:ln w="9525"><a:solidFill><a:srgbClr val="D9D9D9"/></a:solidFill></a:ln>
        </c:spPr>
      </c:majorGridlines>
      <c:spPr><a:ln><a:noFill/></a:ln></c:spPr>
    </c:valAx>
  `;
}

/**
 * [FUNCTION CONTRACT] (내부 함수)
 * - 함수 명: `generateChartXml`
 * - 역할: ChartData 객체를 OpenXML 차트 XML 문자열로 변환한다.
 *         차트 타입(pie/doughnut/bar/column/line)에 따라 적절한 plotArea XML을 구성하고,
 *         [BUG-7 수정] generateAxisXml 헬퍼를 재사용하여 중복 코드를 제거했다.
 * @param chart - 변환할 ChartData 객체
 * @returns 완성된 OpenXML chart.xml 문자열
 */
function generateChartXml(chart: ChartData): string {
  /*
   * [RUN-TIME STATE / INVARIANT]
   * - 변수 명: `plotArea`
   * - 자료형: string
   * - 시나리오: 차트 타입별로 다른 plotArea XML 구조를 생성한다.
   *             pie/doughnut, bar/column, line 세 가지 경로로 분기한다.
   */
  let plotArea = '';
  
  if (chart.type === 'pie' || chart.type === 'doughnut') {
    const chartTypeTag = chart.type === 'doughnut' ? 'c:doughnutChart' : 'c:pieChart';
    const holeSize = chart.type === 'doughnut' ? '<c:holeSize val="60"/>' : '';
    plotArea = `
      <${chartTypeTag}>
        <c:varyColors val="1"/>
        ${generateSeriesXml(chart, false)}
        ${holeSize}
      </${chartTypeTag}>
    `;
  } else if (chart.type === 'bar' || chart.type === 'column') {
    /*
     * [ALGORITHM BRANCH / DECISION]
     * - 조건 식: `chart.type === 'bar'`
     * - 만족 시: 가로 막대(barDir='bar'). 카테고리 축이 왼쪽('l'), 값 축이 하단('b').
     * - 불만족 시: 세로 막대(barDir='col'). 카테고리 축이 하단('b'), 값 축이 왼쪽('l').
     */
    const barDir = chart.type === 'bar' ? 'bar' : 'col';
    const catPos = chart.type === 'bar' ? 'l' : 'b';
    const valPos = chart.type === 'bar' ? 'b' : 'l';
    plotArea = `
      <c:barChart>
        <c:barDir val="${barDir}"/>
        <c:grouping val="clustered"/>
        <c:varyColors val="0"/>
        ${generateSeriesXml(chart, false)}
        <c:axId val="111"/><c:axId val="222"/>
      </c:barChart>
      ${generateAxisXml(catPos, valPos)}
    `;
  } else if (chart.type === 'line') {
    /*
     * [ALGORITHM BRANCH / DECISION]
     * - 조건 식: `chart.type === 'line'`
     * - 만족 시: 꺾은선 차트. 카테고리 축이 하단('b'), 값 축이 왼쪽('l').
     *           [BUG-7 수정] generateAxisXml('b', 'l') 재사용으로 중복 코드 제거.
     */
    plotArea = `
      <c:lineChart>
        <c:grouping val="standard"/>
        <c:varyColors val="0"/>
        ${generateSeriesXml(chart, true)}
        <c:axId val="111"/><c:axId val="222"/>
      </c:lineChart>
      ${generateAxisXml('b', 'l')}
    `;
  }

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <c:chart>
    ${chart.title ? `<c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="1400" b="1"><a:solidFill><a:srgbClr val="333333"/></a:solidFill></a:defRPr></a:pPr><a:r><a:t>${chart.title}</a:t></a:r></a:p></c:rich></c:tx></c:title>` : '<c:autoTitleDeleted val="1"/>'}
    <c:plotArea>
      ${plotArea}
    </c:plotArea>
    <c:legend>
      <c:legendPos val="b"/>
      <c:txPr>
        <a:bodyPr/><a:lstStyle/>
        <a:p><a:pPr><a:defRPr sz="1000"><a:solidFill><a:srgbClr val="555555"/></a:solidFill></a:defRPr></a:pPr>
      </c:txPr>
    </c:legend>
    <c:plotVisOnly val="1"/>
    <c:dispBlanksAs val="gap"/>
  </c:chart>
</c:chartSpace>`;
}

/**
 * generateDrawingXml 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
function generateDrawingXml(rId: string, chartId: string): string {
  return `<w:drawing>
    <wp:inline distT="0" distB="0" distL="0" distR="0">
      <wp:extent cx="5486400" cy="3200400"/>
      <wp:effectExtent l="0" t="0" r="0" b="0"/>
      <wp:docPr id="${Math.floor(Math.random()*10000)}" name="Chart ${chartId}"/>
      <wp:cNvGraphicFramePr/>
      <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
        <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart">
          <c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="${rId}"/>
        </a:graphicData>
      </a:graphic>
    </wp:inline>
  </w:drawing>`;
}

/**
 * injectNativeCharts 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export async function injectNativeCharts(docxBlob: Blob, charts: ChartData[]): Promise<Blob> {
  if (!charts || charts.length === 0) return docxBlob;

  const zip = await JSZip.loadAsync(await docxBlob.arrayBuffer());
  
  let contentTypes = await zip.file('[Content_Types].xml')?.async('string');
  if (contentTypes) {
    let overrides = '';
    charts.forEach((_, i) => {
      const pName = 'PartName="/word/charts/chart' + (i+1) + '.xml"';
      if (!contentTypes!.includes(pName)) {
        overrides += '<Override ' + pName + ' ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>';
      }
    });
    if (overrides) {
      contentTypes = contentTypes.replace('</Types>', overrides + '</Types>');
      zip.file('[Content_Types].xml', contentTypes);
    }
  }

  let docRels = await zip.file('word/_rels/document.xml.rels')?.async('string');
  let nextRId = 1000;
  
  const chartRIds: Record<string, string> = {};

  charts.forEach((chart, index) => {
    const chartFileName = 'chart' + (index + 1) + '.xml';
    const chartXml = generateChartXml(chart);
    zip.file('word/charts/' + chartFileName, chartXml);

    if (docRels) {
      const rId = 'rIdChart' + (nextRId++);
      chartRIds[chart.id] = rId;
      docRels = docRels.replace(
        '</Relationships>',
        '<Relationship Id="' + rId + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="charts/' + chartFileName + '"/></Relationships>'
      );
    }
  });

  if (docRels) {
    zip.file('word/_rels/document.xml.rels', docRels);
  }

  let documentXml = await zip.file('word/document.xml')?.async('string');
  if (documentXml) {
    charts.forEach(chart => {
      const placeholder = '[[CHART_INJECT_' + chart.id + ']]';
      const safePlaceholder = placeholder.replace(/\[/g, '\\[').replace(/\]/g, '\\]');
      const regex = new RegExp('<w:p[^>]*>.*?<w:t[^>]*>' + safePlaceholder + '</w:t>.*?</w:p>', 'g');
      
      const rId = chartRIds[chart.id];
      if (rId) {
        const drawingXml = generateDrawingXml(rId, chart.id);
        documentXml = documentXml!.replace(regex, '<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r>' + drawingXml + '</w:r></w:p>');
      }
    });
    zip.file('word/document.xml', documentXml);
  }

  return await zip.generateAsync({ type: 'blob' });
}
