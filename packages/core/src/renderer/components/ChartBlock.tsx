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
import { useState } from 'react';
// [외부 패키지 및 라이브러리 임포트: @blocknote/react]
import { createReactBlockSpec } from '@blocknote/react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  LineChart, Line
} from 'recharts';
// [내부 프로젝트 의존성 모듈 임포트: ../utils/docxChartInjector]
import type { ChartData } from '../utils/docxChartInjector';

// McKinsey-style palette
const COLORS = ['#4F81BD', '#C0504D', '#9BBB59', '#8064A2', '#4BACC6', '#F79646', '#2C4D75', '#772C2A'];

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

      // Convert format: recharts expects an array of objects like { name: 'Q1', Series1: 400, Series2: 2400 }
      const rechartData = chartData.labels.map((label, idx) => {
        const item: any = { name: label };
        chartData!.series.forEach(s => {
          item[s.name] = s.values[idx];
        });
        return item;
      });

      const renderChart = () => {
        if (chartData!.type === 'pie' || chartData!.type === 'doughnut') {
          const sName = chartData!.series[0].name;
          const pieData = chartData!.labels.map((label, idx) => ({
            name: label,
            value: chartData!.series[0].values[idx]
          }));
          return (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={chartData!.type === 'doughnut' ? 60 : 0}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          );
        } else if (chartData!.type === 'line') {
          return (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={rechartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Legend />
                {chartData!.series.map((s, idx) => (
                  <Line key={s.name} type="monotone" dataKey={s.name} stroke={COLORS[idx % COLORS.length]} strokeWidth={3} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          );
        } else {
          // bar or column
          const layout = chartData!.type === 'bar' ? 'vertical' : 'horizontal';
          return (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={rechartData} layout={layout}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                {layout === 'horizontal' ? (
                  <>
                    <XAxis dataKey="name" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                  </>
                ) : (
                  <>
                    <XAxis type="number" stroke="#64748b" />
                    <YAxis type="category" dataKey="name" stroke="#64748b" />
                  </>
                )}
                <Tooltip />
                <Legend />
                {chartData!.series.map((s, idx) => (
                  <Bar key={s.name} dataKey={s.name} fill={COLORS[idx % COLORS.length]} radius={[4, 4, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          );
        }
      };

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
          {renderChart()}
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
