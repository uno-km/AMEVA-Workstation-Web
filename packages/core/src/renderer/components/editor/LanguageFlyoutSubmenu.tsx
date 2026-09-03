/**
 * ============================================================================
 * @file LanguageFlyoutSubmenu.tsx
 * @description Ultra-clean minimalist native flyout submenu aligned with BlockNote design system.
 * ============================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useUIStore } from '../../stores/useUIStore';
import { Code2 } from 'lucide-react';

interface LanguageItem {
  id: string;
  name: string;
  slashCmd: string;
  color?: string;
}

const LANGUAGES: LanguageItem[] = [
  { id: 'typescript', name: 'TypeScript', slashCmd: '/ts', color: '#60a5fa' },
  { id: 'javascript', name: 'JavaScript', slashCmd: '/js', color: '#f59e0b' },
  { id: 'python', name: 'Python', slashCmd: '/py', color: '#3b82f6' },
  { id: 'rust', name: 'Rust', slashCmd: '/rust', color: '#dea584' },
  { id: 'go', name: 'Go (Golang)', slashCmd: '/go', color: '#00add8' },
  { id: 'solidity', name: 'Solidity (EVM)', slashCmd: '/solidity', color: '#aa6746' },
  { id: 'c', name: 'C', slashCmd: '/c', color: '#64748b' },
  { id: 'cpp', name: 'C++', slashCmd: '/cpp', color: '#10b981' },
  { id: 'sql', name: 'SQL (SQLite)', slashCmd: '/sql', color: '#e879f9' },
  { id: 'java', name: 'Java', slashCmd: '/java', color: '#f43f5e' },
  { id: 'csharp', name: 'C# (.NET)', slashCmd: '/csharp', color: '#a855f7' },
  { id: 'kotlin', name: 'Kotlin', slashCmd: '/kotlin', color: '#fb923c' },
  { id: 'swift', name: 'Swift', slashCmd: '/swift', color: '#f87171' },
  { id: 'zig', name: 'Zig', slashCmd: '/zig', color: '#f59e0b' },
  { id: 'lua', name: 'Lua', slashCmd: '/lua', color: '#38bdf8' },
  { id: 'bash', name: 'Bash / Shell', slashCmd: '/bash', color: '#4ade80' },
  { id: 'php', name: 'PHP', slashCmd: '/php', color: '#818cf8' },
  { id: 'ruby', name: 'Ruby', slashCmd: '/ruby', color: '#ef4444' },
  { id: 'r', name: 'R', slashCmd: '/r', color: '#2563eb' },
  { id: 'html', name: 'HTML & CSS', slashCmd: '/html', color: '#f97316' },
  { id: 'mermaid', name: 'Mermaid Diagram', slashCmd: '/mermaid', color: '#06b6d4' },
  { id: 'json', name: 'JSON Data', slashCmd: '/json', color: '#a3e635' },
  { id: 'plaintext', name: 'Plain Text', slashCmd: '/text', color: '#94a3b8' },
];

export function LanguageFlyoutSubmenu() {
  const { languageSubmenuState, closeLanguageSubmenu } = useUIStore();
  const { isOpen, anchorRect, onSelect } = languageSubmenuState;

  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // 1. 슬래시 메뉴 호버 감지 및 자동 도킹
  useEffect(() => {
    let lastActiveItem: HTMLElement | null = null;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      
      const slashMenu = target.closest('.bn-suggestion-menu, [role="listbox"]') as HTMLElement | null;
      const menuItem = target.closest('.bn-suggestion-menu-item, [role="option"], [data-index]') as HTMLElement | null;
      
      if (menuItem && (menuItem.innerText.includes('More Code Languages') || menuItem.innerText.includes('25+ 언어'))) {
        const itemRect = menuItem.getBoundingClientRect();
        const parentMenuRect = slashMenu ? slashMenu.getBoundingClientRect() : itemRect;
        
        lastActiveItem = menuItem;
        menuItem.style.background = 'var(--bg-glass-active, rgba(255, 255, 255, 0.08))';

        useUIStore.getState().setLanguageSubmenuState({
          isOpen: true,
          anchorRect: {
            top: itemRect.top,
            left: parentMenuRect.left,
            right: parentMenuRect.right,
            bottom: itemRect.bottom
          },
          onSelect: (langId: string) => {
            const activeEditor = (window as any).__ameva_active_editor;
            if (activeEditor) {
              const currentPos = activeEditor.getTextCursorPosition();
              if (currentPos) {
                activeEditor.updateBlock(currentPos.block.id, {
                  type: 'jupyter',
                  props: {
                    language: langId,
                    code: (window as any).__ameva_get_default_code ? (window as any).__ameva_get_default_code(langId) : '',
                    runState: JSON.stringify({ hasRun: false, success: null, outputLines: [] })
                  }
                });
                activeEditor.setTextCursorPosition(currentPos.block.id, 'start');
                activeEditor.focus();
              }
            }
          }
        });
      } else if (slashMenu && !target.closest('#ameva-language-flyout-dock')) {
        if (menuItem && !menuItem.innerText.includes('More Code Languages') && !menuItem.innerText.includes('25+ 언어')) {
          if (lastActiveItem) {
            lastActiveItem.style.background = '';
            lastActiveItem = null;
          }
          closeLanguageSubmenu();
        }
      }
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, [closeLanguageSubmenu]);

  // 2. 키보드 네비게이션 및 바깥 클릭 닫기
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeLanguageSubmenu();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % LANGUAGES.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + LANGUAGES.length) % LANGUAGES.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (LANGUAGES[selectedIndex]) {
          handleSelectLang(LANGUAGES[selectedIndex].id);
        }
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const insideSubmenu = containerRef.current && containerRef.current.contains(target);
      const insideSlashMenu = target.closest('.bn-suggestion-menu, [role="listbox"]');
      if (!insideSubmenu && !insideSlashMenu) {
        closeLanguageSubmenu();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, [isOpen, selectedIndex, closeLanguageSubmenu]);

  if (!isOpen || !anchorRect) return null;

  const handleSelectLang = (langId: string) => {
    if (onSelect) {
      onSelect(langId);
    }
    closeLanguageSubmenu();
  };

  // BlockNote 기본 슬래시 메뉴와 완전히 일치하는 크기 및 위치 계산
  const menuWidth = 220;
  const menuHeight = 310;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let left = anchorRect.right + 2;
  if (left + menuWidth > viewportWidth - 8) {
    left = Math.max(8, anchorRect.left - menuWidth - 2);
  }

  let top = anchorRect.top - 4;
  if (top + menuHeight > viewportHeight - 10) {
    top = Math.max(10, viewportHeight - menuHeight - 10);
  }

  return createPortal(
    <div
      id="ameva-language-flyout-dock"
      ref={containerRef}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        width: `${menuWidth}px`,
        maxHeight: `${menuHeight}px`,
        background: 'var(--bg-card, #1e1e24)',
        border: '1px solid var(--border-muted, rgba(255, 255, 255, 0.12))',
        borderRadius: '6px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        padding: '4px',
        color: 'var(--text-main, #e2e8f0)',
        fontFamily: 'inherit',
        fontSize: '12px',
      }}
    >
      {LANGUAGES.map((item, index) => {
        const isHovered = selectedIndex === index;
        return (
          <div
            key={item.id}
            onMouseEnter={() => setSelectedIndex(index)}
            onClick={() => handleSelectLang(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 8px',
              borderRadius: '4px',
              background: isHovered ? 'var(--bg-glass-active, rgba(255, 255, 255, 0.08))' : 'transparent',
              color: isHovered ? 'var(--text-main, #fff)' : 'var(--text-muted, #94a3b8)',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'background 0.05s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Code2 size={14} color={item.color || '#94a3b8'} />
              <span style={{ fontWeight: 500, fontSize: '12px' }}>{item.name}</span>
            </div>
            <span style={{ fontSize: '10px', opacity: 0.6 }}>{item.slashCmd}</span>
          </div>
        );
      })}
    </div>,
    document.body
  );
}
