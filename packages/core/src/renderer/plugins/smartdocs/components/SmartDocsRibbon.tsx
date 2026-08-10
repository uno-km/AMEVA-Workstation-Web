import React, { useState } from 'react';
import { Tabs, Group, ActionIcon, Text, Divider, Tooltip, Collapse, Button, Paper } from '@mantine/core';
import { Settings, Baseline, FileText, Calculator, Table, Type, LayoutTemplate, AlignCenter, AlignLeft, Bold, Eraser, CheckSquare, Download } from 'lucide-react';
import { BlockNoteEditor } from '@blocknote/core';
import { smartDocsUtils } from '../core/smartDocsUtils';
import { exportToWord } from '../../../utils/exporters';

interface SmartDocsRibbonProps {
  editor: any;
  isSmartDocsMode: boolean;
  onToggleMode: (mode: boolean) => void;
}

export function SmartDocsRibbon({ editor, isSmartDocsMode, onToggleMode }: SmartDocsRibbonProps) {
  const [activeTab, setActiveTab] = useState<string | null>('format');

  if (!editor) return null;

  const handleCurrencyConvert = () => {
    const block = editor.getTextCursorPosition().block;
    if (block && block.content && Array.isArray(block.content)) {
      const newContent = block.content.map(c => {
        if (c.type === 'text') {
          const text = c.text.replace(/[0-9,]+/g, match => {
            return smartDocsUtils.convertNumberToKoreanCurrency(match);
          });
          return { ...c, text };
        }
        return c;
      });
      editor.updateBlock(block, { content: newContent as any });
    }
  };

  const handleInsertHwpTable = () => {
    editor.insertBlocks([
      {
        type: 'smartDocsTable',
        props: {
          borderStyle: 'hwp-standard', // 위아래 굵은선
          textAlign: 'center',
          colWidths: 'auto',
          rows: 3,
          cols: 3
        },
        // BlockNote에서 커스텀 블록 렌더러에 의해 그려짐
      } as any
    ], editor.getTextCursorPosition().block, 'after');
  };

  const handleInsertOfficialHeading = () => {
    editor.insertBlocks([
      {
        type: 'heading',
        props: { level: 1 },
        content: [{ type: 'text', text: '공 문 서  제 목', styles: { bold: true } as any }]
      } as any
    ], editor.getTextCursorPosition().block, 'after');
  };

  return (
    <Collapse in={isSmartDocsMode} transitionDuration={300}>
      <Paper 
        shadow="xl" 
        radius={0} 
        style={{ 
          backgroundColor: 'rgba(24, 24, 27, 0.75)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
          position: 'relative',
          zIndex: 90
        }}
      >
        <Tabs value={activeTab} onChange={setActiveTab} variant="pills" radius="xl" color="indigo"
          styles={{
            root: { padding: '12px 16px' },
            list: { gap: '8px', borderBottom: 'none' },
            tab: { fontWeight: 600, fontSize: '13px', transition: 'all 0.2s ease' }
          }}
        >
          <Tabs.List>
            <Tabs.Tab value="format" leftSection={<Baseline size={14} />}>
              서식/정렬
            </Tabs.Tab>
            <Tabs.Tab value="table" leftSection={<Table size={14} />}>
              표(테이블)
            </Tabs.Tab>
            <Tabs.Tab value="macros" leftSection={<Calculator size={14} />}>
              매크로/교정
            </Tabs.Tab>
            <Tabs.Tab value="export" leftSection={<Download size={14} />} color="teal">
              공문서 내보내기
            </Tabs.Tab>
            <Tabs.Tab value="settings" ml="auto" rightSection={<Settings size={14} />} color="gray">
              모드 종료
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="format" pt="md" pb="xs" pl="xs">
            <Group gap="sm">
              <Tooltip label="중앙 정렬 공문서 대제목" position="bottom" withArrow>
                <Button variant="light" size="sm" radius="md" leftSection={<Type size={16} />} onClick={handleInsertOfficialHeading}>
                  대제목 삽입
                </Button>
              </Tooltip>
              <Divider orientation="vertical" color="rgba(255,255,255,0.1)" />
              <ActionIcon variant="transparent" size="lg" radius="md" color="gray"><AlignLeft size={18} /></ActionIcon>
              <ActionIcon variant="transparent" size="lg" radius="md" color="gray"><AlignCenter size={18} /></ActionIcon>
              <ActionIcon variant="transparent" size="lg" radius="md" color="gray"><Bold size={18} /></ActionIcon>
              <Divider orientation="vertical" color="rgba(255,255,255,0.1)" />
              <Button variant="subtle" size="sm" radius="md" leftSection={<Eraser size={16} />} color="red">
                서식 지우기
              </Button>
            </Group>
          </Tabs.Panel>

          <Tabs.Panel value="table" pt="md" pb="xs" pl="xs">
            <Group gap="sm">
              <Button variant="light" size="sm" radius="md" color="blue" leftSection={<LayoutTemplate size={16} />} onClick={handleInsertHwpTable}>
                공문서 표준 표 (HWP형) 삽입
              </Button>
              <Divider orientation="vertical" color="rgba(255,255,255,0.1)" />
              <Button variant="subtle" size="sm" radius="md" color="gray">
                셀 병합
              </Button>
              <Button variant="subtle" size="sm" radius="md" color="gray">
                테두리 설정
              </Button>
            </Group>
          </Tabs.Panel>

          <Tabs.Panel value="macros" pt="md" pb="xs" pl="xs">
            <Group gap="sm">
              <Button variant="light" size="sm" radius="md" leftSection={<Calculator size={16} />} color="green" onClick={handleCurrencyConvert}>
                금액 한글화 (숫자 ➔ 일십만 원)
              </Button>
              <Divider orientation="vertical" color="rgba(255,255,255,0.1)" />
              <Button variant="subtle" size="sm" radius="md" leftSection={<CheckSquare size={16} />} color="violet">
                만나이 계산
              </Button>
              <Button variant="subtle" size="sm" radius="md" leftSection={<FileText size={16} />} color="violet">
                행정 순화어 교정
              </Button>
            </Group>
          </Tabs.Panel>

          <Tabs.Panel value="export" pt="md" pb="xs" pl="xs">
            <Group gap="md">
              <Button 
                variant="gradient" 
                gradient={{ from: 'teal', to: 'lime', deg: 105 }}
                radius="md"
                size="sm" 
                leftSection={<Download size={16} />} 
                onClick={async () => {
                  try {
                    const blob = await exportToWord(editor.document, isSmartDocsMode);
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = '결재용_공문서.docx';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                  } catch (e) {
                    console.error('DOCX Export Failed', e);
                  }
                }}
              >
                현재 문서를 DOCX(워드/한글 호환)로 다운로드
              </Button>
              <Text size="xs" color="dimmed" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckSquare size={14} color="teal" /> 상하 굵은 선, 중앙 정렬 등 공문서 휴리스틱 서식이 자동 적용됩니다.
              </Text>
            </Group>
          </Tabs.Panel>

          <Tabs.Panel value="settings" pt="md" pb="xs" pl="xs">
            <Button variant="light" color="red" radius="md" size="sm" onClick={() => onToggleMode(false)}>
              SmartDocs 모드 끄기 (일반 마크다운 복귀)
            </Button>
          </Tabs.Panel>
        </Tabs>
      </Paper>
    </Collapse>
  );
}
