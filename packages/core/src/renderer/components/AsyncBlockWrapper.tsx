import React, { Suspense, Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackName: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class BlockErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[Block Load Error - ${this.props.fallbackName}]`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-main)',
          gap: '12px'
        }}>
          <AlertTriangle color="#ef4444" size={32} />
          <div style={{ textAlign: 'center' }}>
            <strong>{this.props.fallbackName} 모듈 로드 실패</strong>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              네트워크 문제이거나 모듈을 불러오지 못했습니다.
            </p>
          </div>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} /> 다시 시도
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

interface AsyncBlockWrapperProps {
  children: ReactNode;
  name: string;
}

export function AsyncBlockWrapper({ children, name }: AsyncBlockWrapperProps) {
  return (
    <BlockErrorBoundary fallbackName={name}>
      <Suspense fallback={
        <div style={{
          padding: '40px 20px',
          background: 'var(--bg-surface)',
          border: '1px dashed var(--border-muted)',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          gap: '12px',
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
        }}>
          <div className="spinner" style={{
            width: '24px', height: '24px',
            border: '3px solid rgba(59, 130, 246, 0.3)',
            borderTopColor: '#2563eb',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <span style={{ fontSize: '12px', fontWeight: 600 }}>{name} 컴포넌트 로딩 중...</span>
          <style>{`
            @keyframes spin { to { transform: rotate(360deg); } }
            @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
          `}</style>
        </div>
      }>
        {children}
      </Suspense>
    </BlockErrorBoundary>
  );
}
