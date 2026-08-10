import React from 'react';
import { defaultProps } from '@blocknote/core';
import { createReactBlockSpec } from '@blocknote/react';
import { Paper, Table } from '@mantine/core';

// HWP 표 스타일과 레이아웃 설정 저장을 위한 BlockNote Custom Schema Props
export const smartDocsTableProps = {
  ...defaultProps,
  borderStyle: {
    default: 'hwp-standard' as const,
    values: ['hwp-standard', 'hwp-bold', 'hwp-none'],
  },
  textAlign: {
    default: 'center' as const,
    values: ['left', 'center', 'right'],
  },
  colWidths: {
    default: 'auto',
  },
  rows: {
    default: 3,
  },
  cols: {
    default: 3,
  }
};

export const SmartDocsTableBlockSpec = createReactBlockSpec(
  {
    type: 'smartDocsTable',
    propSchema: smartDocsTableProps,
    content: 'none', // 내부 블록을 자식으로 두지 않는 단일 리액트 뷰 기반 테이블 (향후 Yjs 호환성을 위해 리팩토링 가능)
  },
  {
    render: (props) => {
      const { borderStyle, textAlign, rows, cols } = props.block.props;
      
      // hwp-standard: 위아래 굵은 2px 실선, 양옆 테두리 없음
      const borderTopBottom = borderStyle === 'hwp-standard' || borderStyle === 'hwp-bold' ? '2px solid var(--text-main)' : '1px solid var(--border-muted)';
      const borderSides = 'none';

      // 예시용 더미 그리드 렌더링 (실제 사용 시에는 내부 셀 수정을 지원하는 DataGrid 컴포넌트로 확장)
      const mockRows = Array.from({ length: rows }).map((_, i) => (
        <Table.Tr key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <Table.Td 
              key={j} 
              style={{ 
                borderLeft: borderSides, 
                borderRight: borderSides,
                textAlign: textAlign as any,
                borderBottom: '1px solid var(--border-muted)',
                padding: '12px'
              }}
            >
              셀 {i+1}-{j+1}
            </Table.Td>
          ))}
        </Table.Tr>
      ));

      return (
        <Paper withBorder={borderStyle !== 'hwp-none'} style={{ borderTop: borderTopBottom, borderBottom: borderTopBottom, borderLeft: borderSides, borderRight: borderSides, margin: '16px 0', overflowX: 'auto' }}>
          <Table verticalSpacing="sm" highlightOnHover>
            <Table.Tbody>
              {mockRows}
            </Table.Tbody>
          </Table>
        </Paper>
      );
    },
  }
);
export const SmartDocsTableBlock = SmartDocsTableBlockSpec();
