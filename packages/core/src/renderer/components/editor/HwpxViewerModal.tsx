import React from 'react';
import { Modal, Button, Text, ScrollArea, Group, Paper, Badge } from '@mantine/core';
import { FileText, Download } from 'lucide-react';
import type { ParsedHwpx } from '../../features/smartdocs/hwpxParser';

interface HwpxViewerModalProps {
  opened: boolean;
  onClose: () => void;
  parsedData: ParsedHwpx | null;
  onInsertToEditor: (paragraphs: string[]) => void;
}

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
