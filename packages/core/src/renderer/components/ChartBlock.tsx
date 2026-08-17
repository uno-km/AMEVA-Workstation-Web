/**
 * ============================================================================
 * @file ChartBlock.tsx
 * @description ChartBlock.tsx 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './ChartBlock';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

// [외부 패키지 및 라이브러리 임포트: react]
import React, { useState } from 'react';
// [외부 패키지 및 라이브러리 임포트: @blocknote/react]
import { createReactBlockSpec } from '@blocknote/react';
// [내부 프로젝트 의존성 모듈 임포트: ../utils/docxChartInjector]
import type { ChartData } from '../utils/docxChartInjector';
import { AsyncBlockWrapper } from './AsyncBlockWrapper';

const ChartRenderer = React.lazy(() => import('./ChartRenderer').then(m => ({ default: m.ChartRenderer })));

/**
 * ChartBlockSpec 상태, 변수 또는 상수 선언부입니다.
 * @type {any} - Typescript 컴파일러에 의한 타입 추론(Inferred)
 */
export const ChartBlockSpec = createReactBlockSpec(
  {
    type: 'chart',
    propSchema: {
      data: {
        default: '{}'
      }
    },
    content: 'none'
  },
  {
    render: (props) => {
      let chartData: ChartData | null = null;
      try {
        chartData = JSON.parse(props.block.props.data);
      } catch (e) {
        console.error('Invalid chart data', e);
      }

      if (!chartData || !chartData.series) {
        return <div style={{ padding: 20, background: '#f1f5f9', borderRadius: 8, color: '#64748b' }}>📊 유효하지 않은 차트 데이터입니다.</div>;
      }

      return (
        <div style={{
          padding: '24px 16px',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          background: '#ffffff',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          margin: '16px 0',
          userSelect: 'none'
        }} contentEditable={false}>
          <h4 style={{ margin: '0 0 16px 0', textAlign: 'center', color: '#334155', fontWeight: 600 }}>{chartData.title || 'Chart'}</h4>
          <AsyncBlockWrapper name="차트">
            <ChartRenderer chartData={chartData} />
          </AsyncBlockWrapper>
        </div>
      );
    }
  }
);
/**
 * ChartBlock 상태, 변수 또는 상수 선언부입니다.
 * @type {any} - Typescript 컴파일러에 의한 타입 추론(Inferred)
 */
export const ChartBlock = ChartBlockSpec();
