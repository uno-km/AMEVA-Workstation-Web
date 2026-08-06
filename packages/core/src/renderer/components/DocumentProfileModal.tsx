import React, { useState } from 'react';
import { X, FileText, CheckCircle2, TrendingUp, Tags, AlertTriangle, Fingerprint } from 'lucide-react';
import type { DocumentProfileResult } from '../document-intelligence/types';
import { documentFeedbackStore } from '../document-intelligence/feedback/documentFeedbackStore';
import { userRuleGenerator } from '../document-intelligence/rules/user/userRuleGenerator';

interface Props {
  fileId: string;
  profile: DocumentProfileResult;
  onClose: () => void;
}

export function DocumentProfileModal({ fileId, profile, onClose }: Props) {
  const { source, profile: classProfile, keywords, entities, importantPages } = profile;
  const [showFeedback, setShowFeedback] = useState(false);
  
  // Feedback States
  const [selectedDomain, setSelectedDomain] = useState(classProfile.documentDomain?.primary || 'academic');
  const [selectedShape, setSelectedShape] = useState(classProfile.documentShape?.primary || 'guide');
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const toggleKeyword = (kw: string) => {
    setSelectedKeywords(prev => prev.includes(kw) ? prev.filter(k => k !== kw) : [...prev, kw]);
  };

  const handleSaveFeedback = async () => {
    setFeedbackStatus('saving');
    try {
      const feedbackId = `feedback_${fileId}_${Date.now()}`;
      await documentFeedbackStore.saveDocumentFeedback({
        feedbackId,
        fileId,
        fileName: source.fileName,
        createdAt: new Date().toISOString(),
        originalPrediction: {
          shape: classProfile.documentShape?.primary || 'unknown',
          domain: classProfile.documentDomain?.primary || 'unknown',
          primaryType: classProfile.primaryType,
          confidence: classProfile.confidence
        },
        corrected: {
          shape: selectedShape,
          domain: selectedDomain,
          primaryType: `${selectedDomain}_${selectedShape}`,
          displayLabel: `사용자 피드백 (${selectedDomain} / ${selectedShape})`,
          selectedKeywords,
          selectedSections: [], // TODO: Section hints
          notes
        }
      });
      
      await userRuleGenerator.generateRuleCandidates();
      
      setFeedbackStatus('success');
      setFeedbackMsg('피드백이 로컬에 저장되었습니다. 비슷한 문서 분석 개선에 사용됩니다.');
      setShowFeedback(false);
    } catch (err) {
      console.error('Feedback save error:', err);
      setFeedbackStatus('error');
      setFeedbackMsg('피드백 저장 중 오류가 발생했습니다.');
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }}>
      <div style={{
        width: '640px', maxHeight: '85vh', background: '#111827',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
        display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--border-muted)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(255,255,255,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Fingerprint size={20} style={{ color: '#a78bfa' }} />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#f9fafb' }}>AMEVA 문서 DNA 프로필</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {feedbackStatus === 'success' && (
            <div style={{ padding: '10px', background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', borderRadius: '6px', fontSize: '13px', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
              {feedbackMsg}
            </div>
          )}
          {feedbackStatus === 'error' && (
            <div style={{ padding: '10px', background: 'rgba(248, 113, 113, 0.15)', color: '#f87171', borderRadius: '6px', fontSize: '13px', border: '1px solid rgba(248, 113, 113, 0.3)' }}>
              {feedbackMsg}
            </div>
          )}

          {/* 1. 요약 카드 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', fontWeight: 500 }}>
                  추정 문서 유형 
                  <span style={{ color: classProfile.classificationStatus === 'unknown' ? '#f87171' : '#34d399' }}>
                    {classProfile.classificationStatus}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '20px', fontWeight: 700, color: '#60a5fa' }}>{classProfile.displayLabel}</span>
                  <span style={{ fontSize: '13px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                    <CheckCircle2 size={14} /> {classProfile.confidence}%
                  </span>
                </div>
                {classProfile.documentDomain && (
                  <div style={{ marginTop: '10px', fontSize: '13px', color: '#9ca3af', lineHeight: '1.5' }}>
                    {classProfile.primaryTopic && (
                      <>
                        Topic: <span style={{ color: '#34d399' }}>{classProfile.primaryTopic.label}</span> ({classProfile.primaryTopic.confidence}%)
                        <br />
                      </>
                    )}
                    Domain: <span style={{ color: '#a78bfa' }}>{classProfile.documentDomain.primary}</span> ({classProfile.documentDomain.confidence}%)
                    {classProfile.documentSubDomain?.primary !== 'unknown' && classProfile.documentSubDomain && (
                      <>
                        <br />
                        SubDomain: <span style={{ color: '#818cf8' }}>{classProfile.documentSubDomain.label}</span> ({classProfile.documentSubDomain.confidence}%)
                      </>
                    )}
                    {classProfile.intent?.primary !== 'unknown' && classProfile.intent && (
                      <>
                        <br />
                        Intent: <span style={{ color: '#fb923c' }}>{classProfile.intent.label}</span> ({classProfile.intent.confidence}%)
                      </>
                    )}
                    <br />
                    Shape: <span style={{ color: '#f472b6' }}>{classProfile.documentShape.primary}</span> ({classProfile.documentShape.confidence}%)
                  </div>
                )}
              </div>
              <button 
                onClick={() => setShowFeedback(!showFeedback)}
                style={{ 
                  marginTop: '16px', padding: '8px 14px', background: 'rgba(59, 130, 246, 0.15)', 
                  border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: '6px', 
                  color: '#60a5fa', cursor: 'pointer', fontSize: '13px', fontWeight: 600, alignSelf: 'flex-start',
                  transition: 'background 0.2s'
                }}>
                분류 수정 (Feedback)
              </button>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.04)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '6px', fontWeight: 500 }}>기본 메타데이터</div>
              <div style={{ fontSize: '14px', color: '#f3f4f6', fontWeight: 500 }}>
                {source.fileName} ({source.pageCount} Pages)
              </div>
              <div style={{ marginTop: '14px', fontSize: '12px', color: '#9ca3af', marginBottom: '6px', fontWeight: 500 }}>분석 근거 (Evidence)</div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#fbbf24', display: 'flex', flexDirection: 'column', gap: '6px', lineHeight: '1.4' }}>
                {classProfile.evidence?.map((ev, i) => <li key={i}>{ev}</li>)}
              </ul>
            </div>
          </div>

          {/* 피드백 UI (토글) */}
          {showFeedback && (
            <div style={{ background: 'rgba(96, 165, 250, 0.05)', padding: '16px', borderRadius: '8px', border: '1px dashed rgba(96, 165, 250, 0.3)' }}>
              <h5 style={{ margin: '0 0 10px 0', color: '#60a5fa', fontSize: '13px' }}>문서 분류 교정하기</h5>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                이 피드백은 로컬에 저장되며, 반복 시 새로운 자동 분류 룰을 생성하여 다음 분석 정확도를 높이는 데 사용됩니다.
              </div>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Domain (업무 영역)</label>
                  <select value={selectedDomain} onChange={e => setSelectedDomain(e.target.value)} style={{ width: '100%', padding: '6px', background: 'var(--bg-panel)', color: 'var(--text-main)', border: '1px solid var(--border-muted)', borderRadius: '4px' }}>
                    <option value="academic">academic (학사/교육)</option>
                    <option value="civil_engineering">civil_engineering (토목/건설)</option>
                    <option value="legal">legal (법무)</option>
                    <option value="software">software (IT/SW)</option>
                    <option value="medical">medical (의료/보건)</option>
                    <option value="welfare">welfare (복지)</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Shape (문서 형식)</label>
                  <select value={selectedShape} onChange={e => setSelectedShape(e.target.value)} style={{ width: '100%', padding: '6px', background: 'var(--bg-panel)', color: 'var(--text-main)', border: '1px solid var(--border-muted)', borderRadius: '4px' }}>
                    <option value="guide">guide (안내문/가이드)</option>
                    <option value="report">report (보고서)</option>
                    <option value="specification">specification (시방서)</option>
                    <option value="manual">manual (매뉴얼)</option>
                    <option value="contract">contract (계약서)</option>
                    <option value="technical_document">technical_document (기술문서)</option>
                  </select>
                </div>
              </div>
              
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>핵심 키워드 선택 (분류의 기준이 되는 단어)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {keywords.slice(0, 10).map((kw, i) => (
                    <label key={i} style={{ 
                      display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#e5e7eb',
                      background: selectedKeywords.includes(kw.term) ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255,255,255,0.05)',
                      padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', border: '1px solid',
                      borderColor: selectedKeywords.includes(kw.term) ? 'rgba(59, 130, 246, 0.5)' : 'transparent'
                    }}>
                      <input type="checkbox" checked={selectedKeywords.includes(kw.term)} onChange={() => toggleKeyword(kw.term)} style={{ margin: 0 }} />
                      {kw.term}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>추가 메모 (옵션)</label>
                <textarea 
                  value={notes} onChange={e => setNotes(e.target.value)}
                  style={{ width: '100%', padding: '6px', background: 'var(--bg-panel)', color: 'var(--text-main)', border: '1px solid var(--border-muted)', borderRadius: '4px', minHeight: '60px', resize: 'vertical' }}
                  placeholder="예: 이 문서는 특정 부서 전용 매뉴얼입니다."
                />
              </div>

              <button 
                onClick={handleSaveFeedback}
                disabled={feedbackStatus === 'saving'}
                style={{ padding: '6px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', opacity: feedbackStatus === 'saving' ? 0.6 : 1 }}>
                {feedbackStatus === 'saving' ? '저장 중...' : '피드백 저장'}
              </button>
            </div>
          )}

          {/* 2. 주요 키워드 */}
          <div style={{ marginTop: '4px' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#f9fafb', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Tags size={16} style={{ color: '#f59e0b' }} /> 핵심 키워드
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {keywords.slice(0, 10).map((kw, i) => (
                <div key={i} style={{ 
                  padding: '6px 10px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.4)',
                  borderRadius: '6px', fontSize: '13px', color: '#fcd34d', fontWeight: 500, display: 'flex', alignItems: 'center'
                }}>
                  {kw.term} <span style={{ opacity: 0.7, fontSize: '11px', marginLeft: '6px', background: 'rgba(0,0,0,0.2)', padding: '2px 4px', borderRadius: '4px' }}>{kw.count}회</span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. 추출된 엔티티 */}
          <div>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#f9fafb', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TrendingUp size={16} style={{ color: '#10b981' }} /> 식별된 개체 (Entities)
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={{ background: 'rgba(255,255,255,0.06)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px', fontWeight: 500 }}>금액 / 가치</div>
                <div style={{ fontSize: '13px', color: '#34d399', display: 'flex', flexDirection: 'column', gap: '6px', fontWeight: 500 }}>
                  {entities.money.length > 0 ? entities.money.slice(0, 5).map((m, i) => <div key={i}>{m}</div>) : '- 없음 -'}
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.06)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px', fontWeight: 500 }}>조직명</div>
                <div style={{ fontSize: '13px', color: '#a78bfa', display: 'flex', flexDirection: 'column', gap: '6px', fontWeight: 500 }}>
                  {entities.organizations.length > 0 ? entities.organizations.slice(0, 5).map((m, i) => <div key={i}>{m}</div>) : '- 없음 -'}
                </div>
              </div>
            </div>
          </div>

          {/* 4. 중요 페이지 분석 */}
          <div>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#f9fafb', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={16} style={{ color: '#ec4899' }} /> 중요 페이지 추정
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {importantPages.map((ip, i) => (
                <div key={i} style={{ 
                  display: 'flex', alignItems: 'center', gap: '14px', padding: '10px 14px',
                  background: 'rgba(255,255,255,0.06)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)'
                }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '14px', fontWeight: 'bold', boxShadow: '0 2px 8px rgba(236,72,153,0.3)' }}>
                    {ip.page}
                  </div>
                  <div style={{ flex: 1, fontSize: '13px', color: '#f3f4f6', lineHeight: '1.4' }}>
                    {ip.reasons.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
