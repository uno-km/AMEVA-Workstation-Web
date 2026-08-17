/**
 * ============================================================================
 * @file KnowledgeGraphBlock.tsx
 * @system AMEVA OS Desktop Workstation
 * @location packages/core/src/renderer/features/knowledge-graph/KnowledgeGraphBlock.tsx
 * @role BlockNote Custom Block for GraphRAG Knowledge Graph Visualization
 * ============================================================================
 */

import React, { useState, useCallback } from 'react';
import { createReactBlockSpec } from '@blocknote/react';
import { AsyncBlockWrapper } from '../../components/AsyncBlockWrapper';
import { graphStore } from './graphStore';
import { loadAllChunks } from '../rag-embedding/vectorStore';
import type { GraphNode } from './types';

const KnowledgeGraphViewer = React.lazy(() => import('./KnowledgeGraphViewer').then(m => ({ default: m.KnowledgeGraphViewer })));

export const KnowledgeGraphBlock = createReactBlockSpec(
  {
    type: 'knowledge-graph',
    propSchema: {
      nodes: { default: '[]' },
      edges: { default: '[]' },
      title: { default: '문서 지식 그래프 (GraphRAG)' }
    },
    content: 'none'
  },
  {
    render: (props) => {
      const title = props.block.props.title;
      
      const nodes: GraphNode[] = (() => {
        try { return JSON.parse(props.block.props.nodes); } catch { return []; }
      })();
      const edges = (() => {
        try { return JSON.parse(props.block.props.edges); } catch { return []; }
      })();

      const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
      const [isGenerating, setIsGenerating] = useState(false);

      // AI RAG 청크 기반 그래프 자동 생성 핸들러
      const handleAutoGenerate = useCallback(async () => {
        setIsGenerating(true);
        try {
          const chunks = await loadAllChunks();
          if (chunks.length === 0) {
            alert('임베딩된 RAG 청크가 없습니다. 하단 상태바의 임베딩 버튼을 먼저 실행해주세요.');
            setIsGenerating(false);
            return;
          }

          graphStore.buildGraphFromChunks(chunks);
          const updatedState = graphStore.getState();

          props.editor.updateBlock(props.block, {
            type: 'knowledge-graph',
            props: {
              ...props.block.props,
              nodes: JSON.stringify(updatedState.nodes),
              edges: JSON.stringify(updatedState.edges)
            }
          });
        } catch (err) {
          console.error('[KnowledgeGraphBlock] Auto generate failed:', err);
        } finally {
          setIsGenerating(false);
        }
      }, [props.editor, props.block]);

      // 노드 클릭 시 에디터 해당 블록으로 스크롤 점프
      const handleNodeClick = useCallback((node: GraphNode) => {
        setSelectedNode(node);
        if (node.blockId) {
          const el = document.querySelector(`[data-id="${node.blockId}"], [data-block-id="${node.blockId}"]`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const outer = el.closest('.bn-block-outer') || el;
            if (outer) {
              outer.setAttribute('data-highlighted-temp', 'true');
              setTimeout(() => outer.removeAttribute('data-highlighted-temp'), 1500);
            }
          }
        }
      }, []);

      const addNode = () => {
        const id = `node-${Date.now()}`;
        const newNodes: GraphNode[] = [...nodes, { id, label: `노드 ${nodes.length + 1}`, x: 400, y: 200, vx: 0, vy: 0, size: 14, color: '#10b981' }];
        props.editor.updateBlock(props.block, {
          type: 'knowledge-graph',
          props: { ...props.block.props, nodes: JSON.stringify(newNodes) }
        });
      };

      const addEdge = () => {
        if (nodes.length < 2) return;
        const source = nodes[Math.floor(Math.random() * nodes.length)].id;
        let target = nodes[Math.floor(Math.random() * nodes.length)].id;
        while(source === target) target = nodes[Math.floor(Math.random() * nodes.length)].id;
        const newEdges = [...edges, { id: `edge-${Date.now()}`, source, target, weight: 1 }];
        props.editor.updateBlock(props.block, {
          type: 'knowledge-graph',
          props: { ...props.block.props, edges: JSON.stringify(newEdges) }
        });
      };

      return (
        <div style={{ background: 'var(--bg-deep, #18181c)', padding: '16px', borderRadius: '8px', color: '#fff', border: '1px solid var(--border-muted, #333)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text-main, #f1f5f9)' }}>
              ⚡ {title}
            </h3>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              노드: {nodes.length}개 | 엣지: {edges.length}개
            </span>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <button
              onClick={handleAutoGenerate}
              disabled={isGenerating}
              style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                color: '#fff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)'
              }}
            >
              {isGenerating ? '그래프 분석 중...' : '✨ AI 문서 GraphRAG 자동 생성'}
            </button>
            <button onClick={addNode} style={{ background: '#334155', color: '#e2e8f0', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>+ 수동 노드</button>
            <button onClick={addEdge} style={{ background: '#334155', color: '#e2e8f0', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>+ 수동 엣지</button>
          </div>

          <AsyncBlockWrapper name="지식 그래프">
            <KnowledgeGraphViewer
              nodes={nodes}
              edges={edges}
              width={700}
              height={380}
              onNodeClick={handleNodeClick}
              selectedNodeId={selectedNode?.id}
            />
          </AsyncBlockWrapper>

          {selectedNode && (
            <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(30, 41, 59, 0.7)', borderRadius: '6px', border: '1px solid rgba(139, 92, 246, 0.4)', fontSize: '12px' }}>
              <div style={{ fontWeight: 600, color: selectedNode.color || '#a78bfa', marginBottom: '4px' }}>
                선택된 노드: {selectedNode.heading || selectedNode.label}
              </div>
              {selectedNode.summary && (
                <div style={{ color: '#cbd5e1', fontSize: '11px', lineHeight: '1.5' }}>
                  {selectedNode.summary}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }
  }
)();
