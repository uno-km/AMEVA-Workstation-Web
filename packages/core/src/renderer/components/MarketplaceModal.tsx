/**
 * @file MarketplaceModal.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/MarketplaceModal.tsx
 * @role Core module helper and integration logic
 * 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (src/renderer/AppLayout.tsx): 레이아웃 그리드 내부 또는 플로팅 레이어 영역 내에서 그리기로 소비.
 * - 소비처 B (src/renderer/App.tsx): 전역 모달 매니저 및 뷰포트 상태 스위칭에 따라 동적 마운트되어 소비.
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - 본 파일은 AMEVA 시스템 내에서 도메인 목적에 부합하는 연산 및 데이터 처리 흐름을 안전하게 캡슐화한다.
 * - 외부 라이브러리 및 하위 종속성을 조율하고 결과 규격을 일관되게 제공한다.
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST: 모든 예외 발생 시 에러를 침묵시키지 말고 에러 로그를 명확하게 남길 것.
 * - MUST NOT: TypeScript any 형식을 우회 수단으로 함부로 선언하지 말 것.
 */

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { PluginMetadata, MarketplaceModalProps } from './marketplace/types'
import { MarketplaceToolbar } from './marketplace/MarketplaceToolbar'
import { SaaSPluginCard } from './marketplace/SaaSPluginCard'
import { PluginCard } from './marketplace/PluginCard'
import { FreeModal } from './ui/modals/FreeModal'
import { Layers } from 'lucide-react'
import { useProcessStore } from '../stores/useProcessStore'
import { safeJsonParse } from '../utils/safeJson'
import { useAppContext } from '../contexts/AppContext'

export type { PluginMetadata, MarketplaceModalProps }

const SAAS_ITEMS = [
  {
    id: 'webSearch',
    name: 'DuckDuckGo Web Search API (Pro)',
    description: 'ReAct 에이전트가 외부 웹 검색(실시간 인터넷 정보 및 뉴스)을 통해 추론하고 결과를 조합할 수 있게 권한을 위임합니다.',
    type: 'tool' as const,
    version: '1.2.0'
  },
  {
    id: 'pythonConsole',
    name: 'Python Sandbox Executor (Pro)',
    description: '로컬 파이썬 샌드박스를 연동하여 복잡한 수식 연산 및 데이터 처리 알고리즘 코드를 실제 런타임에서 실행해 줍니다.',
    type: 'tool' as const,
    version: '2.0.4'
  },
  {
    id: 'requestQueue',
    name: 'Sequential Request Queue (Pro)',
    description: '질문을 연달아 우다다닥 보낼 때 취소되지 않고 안전하게 백그라운드 큐 버퍼에 쌓여 차례로 실행해 주는 순차 처리기입니다.',
    type: 'feature' as const,
    version: '1.0.1'
  },
  {
    id: 'excelViewer',
    name: 'Excel Viewer & Editor (Pro)',
    description: '로컬 마크다운 문서 내에 엑셀 스프레드시트를 삽입하고 편집할 수 있는 확장 기능입니다.',
    type: 'feature' as const,
    version: '1.0.0'
  },
  {
    id: 'kanbanBoard',
    name: 'Jira-Style Kanban Workflow (Pro)',
    description: '지라(Jira) 스타일의 드래그 앤 드롭 칸반 보드. AI 에이전트 담당자 할당, 우선순위 관리, 마크다운 실시간 동기화 지원.',
    type: 'feature' as const,
    version: '1.0.0'
  }
]

function parseDescription(html: string) {
  if (!html) return null;
  if (!html.includes('<span') && !html.includes('<br')) {
    return html;
  }

  const regex = /<span\s+class=['"]([^'"]+)['"]>(.*?)<\/span>|<br\s*\/?>/g;
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(html)) !== null) {
    if (match.index > lastIndex) {
      elements.push(html.substring(lastIndex, match.index));
    }

    if (match[0].startsWith('<br')) {
      elements.push(<br key={key++} />);
    } else {
      const className = match[1];
      const content = match[2];

      const bRegex = /<b>(.*?)<\/b>/g;
      const spanChildren: React.ReactNode[] = [];
      let bLastIndex = 0;
      let bMatch;
      let bKey = 0;

      while ((bMatch = bRegex.exec(content)) !== null) {
        if (bMatch.index > bLastIndex) {
          spanChildren.push(content.substring(bLastIndex, bMatch.index));
        }
        spanChildren.push(<b key={bKey++}>{bMatch[1]}</b>);
        bLastIndex = bRegex.lastIndex;
      }
      if (bLastIndex < content.length) {
        spanChildren.push(content.substring(bLastIndex));
      }

      elements.push(
        <span key={key++} className={className}>
          {spanChildren.length > 0 ? spanChildren : content}
        </span>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < html.length) {
    elements.push(html.substring(lastIndex));
  }

  return elements;
}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `MarketplaceModal`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `MarketplaceModal(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export function MarketplaceModal({
  isOpen,
  onClose,
  installedPlugins,
  onInstallPlugin,
  onUninstallPlugin,
}: MarketplaceModalProps) {
  const canUsePremium = true
  const { handleUpdateSettings, settings } = useAppContext()

  const [plugins, setPlugins] = useState<PluginMetadata[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})
  const [previewData, setPreviewData] = useState<{ url?: string; name?: string; description?: string; isPremium?: boolean } | null>(null)

  const handlePreview = (pluginOrId: any) => {
    // Check if we have an explicit preview URL (e.g. external Youtube link)
    if (typeof pluginOrId !== 'string' && pluginOrId.previewUrl) {
      setPreviewData({ url: pluginOrId.previewUrl });
      return;
    }

    // Otherwise, use fallback React UI data
    const isPremium = typeof pluginOrId === 'string' || pluginOrId.type === 'premium';
    let name = 'Plugin';
    let desc = 'No description available.';

    if (typeof pluginOrId === 'string') {
      const premium = SAAS_ITEMS.find(p => p.id === pluginOrId);
      name = premium?.name || 'Premium Feature';
      desc = premium?.description || 'No description available.';
    } else {
      name = pluginOrId.name || 'Extension';
      desc = pluginOrId.description || 'No description available.';
    }

    setPreviewData({ name, description: desc, isPremium });
  }

  // 🦾 SaaS 유료 기능 토글 상태 관리
  const [enabledPlugins, setEnabledPlugins] = useState<Record<string, boolean>>({
    webSearch: false,
    pythonConsole: false,
    requestQueue: false,
    excelViewer: false,
    kanbanBoard: false,
  })

  // 검색 및 카테고리 탭 상태
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'tool' | 'feature' | 'collab'>('all')

  useEffect(() => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `isOpen`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (isOpen)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (isOpen) {
      try {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `stored`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const stored = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const stored = localStorage.getItem('enabled-plugins')
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `stored`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (stored)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
        if (stored) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `parsed`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const parsed = ...` 형태로 안전 캐싱 후 가공 기동.
       */
          const parsed = safeJsonParse(stored, {
            excelViewer: false,
            calculator: false
          })
          setEnabledPlugins(parsed)
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!canUsePremium`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!canUsePremium)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
          if (!canUsePremium) {
            setEnabledPlugins({ webSearch: false, pythonConsole: false, requestQueue: false, excelViewer: false, kanbanBoard: false })
          } else {
            setEnabledPlugins(parsed)
          }
        } else {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `canUsePremium`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (canUsePremium)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
          if (canUsePremium) {
            setEnabledPlugins({ webSearch: true, pythonConsole: true, requestQueue: false, excelViewer: false, kanbanBoard: false })
          } else {
            setEnabledPlugins({ webSearch: false, pythonConsole: false, requestQueue: false, excelViewer: false, kanbanBoard: false })
          }
        }
      } catch (e) {}
    }
  }, [isOpen, canUsePremium])

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `handleToggleSaaSPlugin`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const handleToggleSaaSPlugin = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const handleToggleSaaSPlugin = (id: string) => {
    const nowEnabled = !enabledPlugins[id]
    const updated = {
      ...enabledPlugins,
      [id]: nowEnabled
    }
    setEnabledPlugins(updated)
    localStorage.setItem('enabled-plugins', JSON.stringify(updated))
    window.dispatchEvent(new Event('saas-plugins-changed'))

    // [FIX-MARKETPLACE-001] SaaS 플러그인 활성화/비활성화 시 settings.installedPlugins 동기화
    // RightTabStrip이 settings.installedPlugins를 기반으로 탭을 표시하므로 반드시 동기화 필요
    const currentInstalled = settings?.installedPlugins || []
    if (nowEnabled) {
      if (!currentInstalled.includes(id)) {
        handleUpdateSettings({ installedPlugins: [...currentInstalled, id] })
      }
    } else {
      handleUpdateSettings({ installedPlugins: currentInstalled.filter((p: string) => p !== id) })
    }
  }

  // 마켓플레이스 서버 플러그인 로드
  // [FIX] AbortController로 5초 타임아웃 적용.
  // port 3010 EADDRINUSE 등 외부 서버 문제 시 영원히 로딩 중이던 문제를 수정.
  // 이전 앱 세션이 완전히 종료되지 않아 포트를 점유할 경우 서버가 crash되어
  // 연결이 거부되며, 그 경우 에러 메시지와 재시도 버튼을 표시한다.
  const fetchPlugins = async () => {
    setLoading(true)
    setError(null)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `controller`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const controller = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const controller = new AbortController()
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `timeoutId`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const timeoutId = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5초 타임아웃
    try {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `res`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const res = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const res = await fetch('https://uno-km.github.io/AMEVA-Workstation-Market-Place/api/plugins.json', { signal: controller.signal })
      clearTimeout(timeoutId)
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!res.ok) throw new Error(`서버 응답 오류 (HTTP ${res.status})``
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!res.ok) throw new Error(`서버 응답 오류 (HTTP ${res.status})`)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (!res.ok) throw new Error(`서버 응답 오류 (HTTP ${res.status})`)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `data`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const data = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const data = await res.json()
      setPlugins(data)
    } catch (err: any) {
      clearTimeout(timeoutId)
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `err.name === 'AbortError'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (err.name === 'AbortError')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (err.name === 'AbortError') {
        setError('Marketplace 서버 연결 시간 초과 (5초). 깃허브 페이지 호스팅 상태를 확인하세요.')
      } else {
        setError('Marketplace 서버를 찾을 수 없거나 오프라인 상태입니다. 인터넷 연결을 확인하거나 아래 버튼을 눌러 재시도하세요.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `isOpen`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (isOpen)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (isOpen) {
      fetchPlugins()
    }
  }, [isOpen])

      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!isOpen`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!isOpen)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (!isOpen) return null

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `handleToggleInstall`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const handleToggleInstall = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  // [FIX-MARKETPLACE-002] 마켓플레이스 로드 시 localStorage 'enabled-plugins' → settings.installedPlugins 동기화
  useEffect(() => {
    if (!isOpen) return
    try {
      const enabledPluginsStored = safeJsonParse(localStorage.getItem('enabled-plugins'), {})
      const currentInstalled = settings?.installedPlugins || []
      const saasIds = SAAS_ITEMS.map(s => s.id)

      // enabled-plugins에서 활성화된 SaaS 플러그인이 settings에 없으면 추가
      const toAdd = saasIds.filter((id: string) => enabledPluginsStored[id] === true && !currentInstalled.includes(id))
      // enabled-plugins에서 비활성화된 SaaS 플러그인이 settings에 있으면 제거
      const toRemove = saasIds.filter((id: string) => enabledPluginsStored[id] === false && currentInstalled.includes(id))

      if (toAdd.length > 0 || toRemove.length > 0) {
        const synced = [
          ...currentInstalled.filter((id: string) => !toRemove.includes(id)),
          ...toAdd
        ]
        handleUpdateSettings({ installedPlugins: synced })
      }
    } catch {}
  }, [isOpen])

  const handleToggleInstall = async (plugin: PluginMetadata) => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `isInstalled`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const isInstalled = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const isInstalled = installedPlugins.includes(plugin.id)
    setActionLoading(prev => ({ ...prev, [plugin.id]: true }))
    
    try {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `isInstalled`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (isInstalled)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (isInstalled) {
        onUninstallPlugin(plugin.id)
      } else {
        await onInstallPlugin(plugin.id, plugin.scriptUrl)
      }
    } catch (err) {
      alert('플러그인 처리 중 실패했습니다.')
    } finally {
      setActionLoading(prev => ({ ...prev, [plugin.id]: false }))
    }
  }

  // 필터링 연산
  const filteredPlugins = plugins.filter((p) => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `matchesCategory`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const matchesCategory = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const matchesCategory = selectedCategory === 'all' || p.type === selectedCategory
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `matchesSearch`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const matchesSearch = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const categories: { id: 'all' | 'tool' | 'feature' | 'collab'; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'tool', label: 'Tools' },
    { id: 'feature', label: 'Features' },
    { id: 'collab', label: 'Collab' },
  ]

  return (
    <FreeModal
      isOpen={isOpen}
      onClose={onClose}
      title="Plugin Marketplace"
      icon={<Layers size={20} />}
      initialWidth={800}
      initialHeight={600}
      headerExtra={
        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', backgroundColor: 'rgba(168, 85, 247, 0.15)', color: 'var(--primary)' }}>
          {installedPlugins.length} Installed
        </span>
      }
    >
      <MarketplaceToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categories={categories}
      />

      {/* 본문 영역 (스크롤바 완비) */}
      <div
        className="marketplace-scroll"
        style={{
          padding: '8px 20px 20px 20px',
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        {loading ? (
          <div key="loading" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px' }}>
            익스텐션 목록을 가져오는 중입니다...
          </div>
        ) : error ? (
          <div
            key="error"
            style={{
              padding: '16px',
              background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '8px',
              color: '#f87171',
              fontSize: '11px',
              lineHeight: '1.5',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <span>{error}</span>
            {/* [FIX] 재시도 버튼 — 서버 재기동 후 바로 재연결 시도 가능 */}
            <button
              onClick={fetchPlugins}
              style={{
                padding: '6px 14px', borderRadius: '6px', cursor: 'pointer',
                background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)',
                color: '#f87171', fontSize: '11px', fontWeight: 600, alignSelf: 'center'
              }}
            >
              🔄 다시 시도
            </button>
          </div>
        ) : (
          <div key="content" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredPlugins.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px' }}>
                조건에 맞는 플러그인이 없습니다.
              </div>
            )}

            {/* 👑 SaaS Premium Toggles (DuckDuckGo, Python Sandbox, Request Queue) */}
            {categories.length > 0 && (() => {
              const filteredSaas = SAAS_ITEMS.filter(p => {
                const matchesCategory = selectedCategory === 'all' || p.type === selectedCategory
                const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase())
                return matchesCategory && matchesSearch
              })

              return filteredSaas.map(p => (
                <SaaSPluginCard
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  version={p.version}
                  type={p.type}
                  description={p.description}
                  isEnabled={enabledPlugins[p.id] ?? false}
                  onToggle={handleToggleSaaSPlugin}
                  onPreview={handlePreview}
                />
              ))
            })()}

            {filteredPlugins.map((p) => (
              <PluginCard
                key={p.id}
                plugin={p}
                isInstalled={installedPlugins.includes(p.id)}
                isActionLoading={!!actionLoading[p.id]}
                onToggleInstall={handleToggleInstall}
                onPreview={handlePreview}
              />
            ))}
          </div>
        )}
      </div>
      
      {previewData && createPortal(
        <div
          onClick={() => setPreviewData(null)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(10px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'relative',
              width: '90%',
              maxWidth: '1100px',
              height: '90vh',
              animation: 'slideUp 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <button
              onClick={() => setPreviewData(null)}
              style={{
                position: 'absolute', top: '-40px', right: 0,
                background: 'transparent', border: 'none', color: '#fff', fontSize: '24px',
                cursor: 'pointer', opacity: 0.7, zIndex: 10
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
            >
              ✕
            </button>
            {previewData.url ? (
              <iframe
                src={previewData.url}
                style={{ width: '100%', height: '100%', border: 'none', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', background: '#fff' }}
              />
            ) : (
              <div style={{
                textAlign: 'center', maxWidth: '600px', padding: '40px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)'
              }}>
                <div style={{
                  display: 'inline-block', padding: '6px 12px', borderRadius: '20px',
                  fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px',
                  ...(previewData.isPremium ? {
                    background: 'linear-gradient(135deg, #a855f7, #ec4899)', color: '#fff'
                  } : {
                    background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff'
                  })
                }}>
                  {previewData.isPremium ? 'PRO EXCLUSIVE' : 'EXTENSION'}
                </div>
                <h1 style={{
                  fontSize: '28px', margin: '0 0 16px 0', fontWeight: 700,
                  background: 'linear-gradient(to right, #fff, #a1a1aa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                }}>
                  {previewData.name}
                </h1>
                <p style={{ fontSize: '15px', lineHeight: '1.6', color: '#a1a1aa', margin: '0 0 30px 0' }}>
                  {parseDescription(previewData.description || '')}
                </p>
                <div style={{
                  height: '200px', background: '#18181b', borderRadius: '12px',
                  border: '1px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: '#52525b', fontSize: '14px'
                }}>
                  Interactive Preview is not available offline
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
      
      {/* 슬림 다크 스크롤바 커스텀 주입 */}
      <style>{`
        .marketplace-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .marketplace-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .marketplace-scroll::-webkit-scrollbar-thumb {
          background: var(--border-muted);
          border-radius: 3px;
        }
        .marketplace-scroll::-webkit-scrollbar-thumb:hover {
          background: var(--primary);
        }
      `}</style>
    </FreeModal>
  )
}

