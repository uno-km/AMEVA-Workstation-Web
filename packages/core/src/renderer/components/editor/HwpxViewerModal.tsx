/**
 * ============================================================================
 * @file HwpxViewerModal.tsx
 * @description HwpxViewerModal.tsx 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './HwpxViewerModal';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

// [외부 패키지 및 라이브러리 임포트: react]
import React from 'react';
// [외부 패키지 및 라이브러리 임포트: @mantine/core]
import { Modal, Button, Text, ScrollArea, Group, Paper, Badge } from '@mantine/core';
// [외부 패키지 및 라이브러리 임포트: lucide-react]
import { FileText, Download } from 'lucide-react';
// [내부 프로젝트 의존성 모듈 임포트: ../../features/smartdocs/hwpxParser]
import type { ParsedHwpx } from '../../features/smartdocs/hwpxParser';

/**
 * HwpxViewerModalProps 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
interface HwpxViewerModalProps {
  opened: boolean;
  onClose: () => void;
  parsedData: ParsedHwpx | null;
  onInsertToEditor: (paragraphs: string[]) => void;
}

/**
 * HwpxViewerModal 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export function HwpxViewerModal({ opened, onClose, parsedData, onInsertToEditor }: HwpxViewerModalProps) {
  if (!parsedData) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <FileText size={20} color="#3b82f6" />
          <Text fw={600}>HWPX 문서 미리보기</Text>
          <Badge color="blue" variant="light">파싱 완료</Badge>
        </Group>
      }
      size="xl"
      centered
      overlayProps={{ blur: 3, backgroundOpacity: 0.5 }}
    >
      <Text size="sm" c="dimmed" mb="md">
        파일 원본을 훼손하지 않고 내용을 추출했습니다. 에디터에 바로 삽입하거나 내용만 확인할 수 있습니다.
      </Text>

      <Paper withBorder p="md" bg="var(--mantine-color-body)" radius="md">
        <Text fw={700} mb="xs" size="lg">{parsedData.title}</Text>
        <ScrollArea h={400} type="auto" offsetScrollbars>
          <div style={{ padding: '0 10px' }}>
            {parsedData.paragraphs.map((p, idx) => (
              <p 
                key={idx} 
                style={{ 
                  margin: '8px 0', 
                  minHeight: p.trim() === '' ? '1.5em' : 'auto',
                  lineHeight: '1.6'
                }}
              >
                {p}
              </p>
            ))}
          </div>
        </ScrollArea>
      </Paper>

      <Group justify="flex-end" mt="xl">
        <Button variant="default" onClick={onClose}>닫기</Button>
        <Button 
          leftSection={<Download size={16} />} 
          color="blue"
          onClick={() => {
            onInsertToEditor(parsedData.paragraphs);
            onClose();
          }}
        >
          이 내용을 에디터에 텍스트로 삽입
        </Button>
      </Group>
    </Modal>
  );
}
