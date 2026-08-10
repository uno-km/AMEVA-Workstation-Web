/**
 * ============================================================================
 * @file SecurityModal.tsx
 * @description SecurityModal.tsx 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './SecurityModal';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

// [외부 패키지 및 라이브러리 임포트: react]
import React, { useState } from 'react'
// [외부 패키지 및 라이브러리 임포트: lucide-react]
import { Shield, ShieldAlert, ShieldCheck, X } from 'lucide-react'
// [내부 프로젝트 의존성 모듈 임포트: ../stores/useWorkspaceStore]
import { useWorkspaceStore } from '../stores/useWorkspaceStore'

/**
 * SecurityModalProps 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
interface SecurityModalProps {
  onClose: () => void
}

/**
 * SecurityModal 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export function SecurityModal({ onClose }: SecurityModalProps) {
  const { activeTabId, tabs, updateActiveTab } = useWorkspaceStore()
  const activeTab = tabs.find(t => t.id === activeTabId)
  const currentPassword = activeTab?.documentPassword

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSave = () => {
    if (!password) {
      updateActiveTab({ documentPassword: null })
      setSuccess('문서 보안이 해제되었습니다. 저장 시 암호화가 풀립니다.')
      setTimeout(onClose, 1500)
      return
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    if (password.length < 4) {
      setError('비밀번호는 최소 4자 이상이어야 합니다.')
      return
    }

    updateActiveTab({ documentPassword: password })
    setSuccess('문서 보안이 설정되었습니다! 문서를 저장하시면 암호화되어 바이너리로 묶입니다.')
    setTimeout(onClose, 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-[#1e1e1e] border border-white/10 rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
        
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-3 rounded-lg ${currentPassword ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-slate-300'}`}>
              {currentPassword ? <ShieldCheck size={28} /> : <Shield size={28} />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">문서 보안 설정</h2>
              <p className="text-sm text-slate-400">
                {currentPassword ? '현재 문서가 보안 모드입니다.' : '이 문서에 비밀번호를 설정하세요.'}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">새 비밀번호 (비우면 해제)</label>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); setSuccess('') }}
                className="w-full bg-[#121212] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[var(--primary)] transition-colors"
                placeholder="비밀번호 입력"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">비밀번호 확인</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => { setConfirmPassword(e.target.value); setError(''); setSuccess('') }}
                className="w-full bg-[#121212] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[var(--primary)] transition-colors"
                placeholder="비밀번호 다시 입력"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-rose-400 text-sm bg-rose-500/10 p-3 rounded-lg">
                <ShieldAlert size={16} />
                {error}
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-500/10 p-3 rounded-lg">
                <ShieldCheck size={16} />
                {success}
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#181818] px-6 py-4 border-t border-white/10 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-sm font-medium bg-[var(--primary)] text-[var(--text-on-primary)] rounded-lg shadow-[0_4px_14px_var(--primary-glow)] hover:opacity-90 transition-opacity"
          >
            {currentPassword ? '보안 설정 변경' : '보안 잠금 켜기'}
          </button>
        </div>
      </div>
    </div>
  )
}
