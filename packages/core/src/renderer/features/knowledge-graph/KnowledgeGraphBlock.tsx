/**
 * ============================================================================
 * @file KnowledgeGraphBlock.tsx
 * @description KnowledgeGraphBlock
 * ============================================================================
 */
import React, { useState } from 'react'
import { createReactBlockSpec } from '@blocknote/react'
import { KnowledgeGraphViewer } from './KnowledgeGraphViewer'

export const KnowledgeGraphBlock = createReactBlockSpec(
  {
    type: 'knowledge-graph',
    propSchema: {
      nodes: { default: '[]' },
      edges: { default: '[]' },
      title: { default: '지식 그래프' }
    },
    content: 'none'
  },
  {
    render: (props) => {
      const title = props.block.props.title
      
      const nodes = (() => {
        try { return JSON.parse(props.block.props.nodes) } catch { return [] }
      })()
      const edges = (() => {
        try { return JSON.parse(props.block.props.edges) } catch { return [] }
      })()

      const [selectedNode, setSelectedNode] = useState<any>(null)

      const addNode = () => {
        const id = `node-${Date.now()}`
        const newNodes = [...nodes, { id, label: `New Node ${nodes.length + 1}`, x: 400, y: 200, vx: 0, vy: 0, size: 15, color: '#10b981' }]
        props.editor.updateBlock(props.block, {
          type: 'knowledge-graph',
          props: { ...props.block.props, nodes: JSON.stringify(newNodes) }
        })
      }

      const addEdge = () => {
        if (nodes.length < 2) return
        const source = nodes[Math.floor(Math.random() * nodes.length)].id
        let target = nodes[Math.floor(Math.random() * nodes.length)].id
        while(source === target) target = nodes[Math.floor(Math.random() * nodes.length)].id
        const newEdges = [...edges, { id: `edge-${Date.now()}`, source, target }]
        props.editor.updateBlock(props.block, {
          type: 'knowledge-graph',
          props: { ...props.block.props, edges: JSON.stringify(newEdges) }
        })
      }

      return (
        <div style={{ background: '#18181c', padding: '16px', borderRadius: '8px', color: '#fff', border: '1px solid #333' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>{title}</h3>
          
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button onClick={addNode} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>+ 노드 추가</button>
            <button onClick={addEdge} style={{ background: '#8b5cf6', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>+ 엣지 추가</button>
          </div>

          <KnowledgeGraphViewer nodes={nodes} edges={edges} width={600} height={400} />

          {selectedNode && (
            <div style={{ marginTop: '16px', padding: '8px', background: '#222', borderRadius: '4px' }}>
              선택된 노드 정보 패널 (클릭 시 구현)
            </div>
          )}
        </div>
      )
    }
  }
)
