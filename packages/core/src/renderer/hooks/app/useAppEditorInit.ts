/**
 * @file useAppEditorInit.ts
 * @system AMEVA OS Desktop Workstation - Client Renderer
 * @location src/renderer/hooks/app/useAppEditorInit.ts
 * @role Editor instance lifecycle factory & Welcome document injector Hook
 */

import { useEffect, useRef } from 'react'
import { Code, PenTool, Link, Video, Map, Presentation, Table, Kanban, FileText } from 'lucide-react'
import type { AmevaEditor as AppEditor } from '../../editor/amevaBlockSchema'
import * as ipc from '../../services/ipc/electronApiAdapter'
import { resolveLocalMediaUrl } from '../../utils/markdownUtils'
import { useI18nStore } from '../../i18n/useTranslation'
import { WELCOME_MARKDOWN_KO, WELCOME_MARKDOWN_EN } from '../../config/welcomeDocs'

/**
 * 웰컴 카드 뷰 포화 시 출력할 기본 프론트 페이지 헤더 마크다운 리터럴.
 */
const DEFAULT_WELCOME_TEXT = `# 🚀 AMEVA Workstation

(AMEVA-OS WebAssembly Kernel & AI Hub)

이곳에서 문서 작성, 코드 실행, 파일 시스템 탐색을 할 수 있습니다.`

/**
 * @hook useAppEditorInit
 * @description 에디터 빌드 팩토리 및 협업 세션 바인딩, 웰컴 가이드 문서 이식을 총 조율하는 훅.
 */
export function useAppEditorInit({
  ydoc,
  provider,
  isActive,
  username,
  userColor,
  setEditor,
  setCurrentContent,
}: {
  ydoc: any
  provider: any
  isActive: boolean
  username: string
  userColor: string
  setEditor: (editor: AppEditor | null) => void
  setCurrentContent: (content: string) => void
}): { DEFAULT_WELCOME_TEXT: string } {
  const isInitialLoad = useRef(true)

  useEffect(() => {
    let activeEditor: AppEditor

    const uploadFileHandler = async (file: File): Promise<string> => {
      if (file && (file as any).path && (file.name.toLowerCase().endsWith('.pptx') || file.name.toLowerCase().endsWith('.ppt'))) {
        const pptxPath = (file as any).path

        if (typeof window !== 'undefined' && window.electronAPI?.processPptx) {
          window.electronAPI.processPptx(pptxPath).then((res) => {
            if (res.success && activeEditor) {
              const currentBlock = activeEditor.getTextCursorPosition()
              activeEditor.insertBlocks(
                [
                  {
                    type: 'presentation',
                    props: {
                      pptxPath: pptxPath.replace(/\\/g, '/'),
                      slides: res.slides.map((s: string) => `media://${s}`).join(','),
                      fallback: res.fallback,
                      slidesText: JSON.stringify(res.slides_text || [])
                    }
                  } as any
                ],
                currentBlock as any,
                'after'
              )
            } else if (!res.success) {
              console.error('[PPTX 컴파일 실패]:', res.error)
              if (window.electronAPI?.showMessageBox) {
                window.electronAPI.showMessageBox({
                  type: 'error',
                  title: 'PPTX 변환 실패',
                  message: `프레젠테이션 컴파일 중 오류가 발생했습니다.\n${res.error}`
                })
              }
            }
          }).catch(e => {
            console.error('[PPTX 컴파일 오류]:', e)
          })
        }

        return 'media://presentation-placeholder'
      }

      if (file && (file as any).path) {
        const resolved = resolveLocalMediaUrl((file as any).path)
        return resolved
      }

      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          if (typeof reader.result === 'string') resolve(reader.result)
          else reject(new Error('파일 읽기 실패'))
        }
        reader.onerror = () => reject(reader.error)
        reader.readAsDataURL(file)
      })
    }

    const initEditorAsync = async () => {
      const { BlockNoteEditor } = await import('@blocknote/core')
      const { en: localeEn } = await import('@blocknote/core/locales')
      const { amevaSchema: schema } = await import('../../editor/amevaBlockSchema')

      const customDictionary = {
        ...localeEn,
        slash_menu: {
          ...localeEn.slash_menu,
          jupyter: { title: 'Jupyter Code', subtext: 'Interactive code block', aliases: ['jupyter', 'code'], group: 'AMEVA', icon: Code },
          drawing: { title: 'Drawing Canvas', subtext: 'Excalidraw canvas', aliases: ['drawing', 'canvas'], group: 'AMEVA', icon: PenTool },
          linkPreview: { title: 'Link Preview', subtext: 'URL preview card', aliases: ['link', 'url'], group: 'AMEVA', icon: Link },
          youtube: { title: 'YouTube Video', subtext: 'Embed YouTube video', aliases: ['youtube', 'video'], group: 'AMEVA', icon: Video },
          map: { title: 'Interactive Map', subtext: 'OpenStreetMap embed', aliases: ['map', 'location'], group: 'AMEVA', icon: Map },
          presentation: { title: 'Presentation', subtext: 'Slide deck', aliases: ['pptx', 'slides'], group: 'AMEVA', icon: Presentation },
          excel: { title: 'Excel Table', subtext: 'Spreadsheet', aliases: ['excel', 'table'], group: 'AMEVA', icon: Table },
          kanban: { title: 'Kanban Board', subtext: 'Task board', aliases: ['kanban', 'board'], group: 'AMEVA', icon: Kanban },
          inlineDocument: { title: 'Inline Document', subtext: 'PDF/Word viewer', aliases: ['pdf', 'document'], group: 'AMEVA', icon: FileText },
        }
      } as any

      if (ydoc && provider && isActive) {
        activeEditor = BlockNoteEditor.create({
          schema,
          dictionary: customDictionary,
          collaboration: {
            provider,
            fragment: ydoc.getXmlFragment('document-store'),
            user: { name: username, color: userColor },
          },
          uploadFile: uploadFileHandler,
        }) as AppEditor
      } else {
        activeEditor = BlockNoteEditor.create({
          schema,
          dictionary: customDictionary,
          uploadFile: uploadFileHandler,
        }) as AppEditor
      }

      setEditor(activeEditor)
      import('../../stores/useWorkspaceStore').then(({ useWorkspaceStore }) => {
        useWorkspaceStore.getState().setActiveEditorInstance(activeEditor)
      })
      import('../../features/ai-agent/adapters/EditorToolAdapter').then(({ editorToolAdapter }) => {
        editorToolAdapter.setEditor(activeEditor)
      })
    }

    initEditorAsync().catch(console.error)

    if (isInitialLoad.current && (!isActive || !provider)) {
      isInitialLoad.current = false
      const isGoogleDriveOpen = typeof window !== 'undefined' && (
        window.location.search.includes('state=') ||
        window.location.search.includes('fileId=') ||
        window.location.search.includes('driveFileId=') ||
        window.location.search.includes('openDriveFile=') ||
        window.location.hash.includes('state=') ||
        window.location.hash.includes('fileId=')
      )

      if (!isGoogleDriveOpen) {
        const currentLang = useI18nStore.getState().language
        const welcomeMD = currentLang === 'en' ? WELCOME_MARKDOWN_EN : WELCOME_MARKDOWN_KO
        setCurrentContent(welcomeMD)
      }

      if (ipc.isElectronEnv()) {
        ipc.appReady()
      }
    } else {
      if (ipc.isElectronEnv()) {
        ipc.appReady()
      }
    }
  }, [ydoc, provider, isActive, username, userColor, setCurrentContent, setEditor])

  // 언어 전환 시 웰컴 가이드 자동 동기화
  useEffect(() => {
    const unsub = useI18nStore.subscribe((state) => {
      import('../../stores/useWorkspaceStore').then(({ useWorkspaceStore }) => {
        const filePath = useWorkspaceStore.getState().filePath
        if (!filePath) {
          const nextMD = state.language === 'en' ? WELCOME_MARKDOWN_EN : WELCOME_MARKDOWN_KO
          setCurrentContent(nextMD)
        }
      })
    })
    return () => unsub()
  }, [setCurrentContent])

  return { DEFAULT_WELCOME_TEXT }
}
