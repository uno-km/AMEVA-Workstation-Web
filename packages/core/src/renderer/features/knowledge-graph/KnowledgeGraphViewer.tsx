/**
 * ============================================================================
 * @file KnowledgeGraphViewer.tsx
 * @system AMEVA OS Desktop Workstation
 * @location packages/core/src/renderer/features/knowledge-graph/KnowledgeGraphViewer.tsx
 * @role Interactive Canvas Physics Renderer for Knowledge Graph (GraphRAG)
 * ============================================================================
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { GraphNode, GraphEdge } from './types';

export interface KnowledgeGraphViewerProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  width?: number;
  height?: number;
  onNodeClick?: (node: GraphNode) => void;
  selectedNodeId?: string | null;
}

export const KnowledgeGraphViewer: React.FC<KnowledgeGraphViewerProps> = ({
  nodes: initialNodes,
  edges,
  width = 800,
  height = 400,
  onNodeClick,
  selectedNodeId
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const [nodes, setNodes] = useState<GraphNode[]>(initialNodes);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  
  // Transform for pan/zoom
  const transformRef = useRef({ x: 0, y: 0, scale: 1 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const pointerStartPosRef = useRef({ x: 0, y: 0 });

  // Sync initialNodes when props change
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes]);

  useEffect(() => {
    workerRef.current = new Worker(new URL('./graphWorker.ts', import.meta.url), { type: 'module' });
    
    workerRef.current.onmessage = (e) => {
      if (e.data.type === 'TICK_DONE') {
        setNodes(e.data.nodes);
        requestAnimationFrame(tick);
      }
    };

    tick();

    return () => {
      workerRef.current?.terminate();
    };
  }, [edges]);

  const tick = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({
        type: 'TICK',
        nodes,
        edges
      });
    }
  }, [nodes, edges]);

  // Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      ctx.save();
      const t = transformRef.current;
      ctx.translate(t.x, t.y);
      ctx.scale(t.scale, t.scale);

      // 1. Draw edges
      edges.forEach(edge => {
        const source = nodes.find(n => n.id === edge.source);
        const target = nodes.find(n => n.id === edge.target);
        if (source && target) {
          ctx.beginPath();
          ctx.moveTo(source.x, source.y);
          ctx.lineTo(target.x, target.y);

          if (edge.relationType === 'semantic-similarity') {
            ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)'; // Amber dash
            ctx.setLineDash([4, 4]);
            ctx.lineWidth = 1.2;
          } else {
            ctx.strokeStyle = 'rgba(100, 116, 139, 0.35)';
            ctx.setLineDash([]);
            ctx.lineWidth = 1.5;
          }

          ctx.stroke();
          ctx.setLineDash([]);
          
          // Arrow for parent-child
          if (edge.relationType !== 'semantic-similarity') {
            const angle = Math.atan2(target.y - source.y, target.x - source.x);
            ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
            ctx.beginPath();
            ctx.moveTo(target.x - 8 * Math.cos(angle - Math.PI / 6), target.y - 8 * Math.sin(angle - Math.PI / 6));
            ctx.lineTo(target.x, target.y);
            ctx.lineTo(target.x - 8 * Math.cos(angle + Math.PI / 6), target.y - 8 * Math.sin(angle + Math.PI / 6));
            ctx.stroke();
          }
        }
      });

      // 2. Draw nodes
      nodes.forEach(node => {
        const isSelected = selectedNodeId === node.id;
        const isHovered = hoveredNode?.id === node.id;
        const nodeSize = (node.size || 14) * (isSelected || isHovered ? 1.25 : 1.0);

        // Halo / Glow
        if (isSelected || isHovered) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, nodeSize + 6, 0, Math.PI * 2);
          ctx.fillStyle = isSelected ? 'rgba(139, 92, 246, 0.35)' : 'rgba(59, 130, 246, 0.25)';
          ctx.fill();
        }

        // Node Circle
        ctx.fillStyle = node.color || '#3b82f6';
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#1e1e24';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Label
        ctx.fillStyle = isSelected ? '#a78bfa' : '#e2e8f0';
        ctx.font = isSelected ? 'bold 12px sans-serif' : '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(node.label || '', node.x, node.y + nodeSize + 13);
      });
      
      ctx.restore();
      requestAnimationFrame(render);
    };
    
    const af = requestAnimationFrame(render);
    return () => {
      isRunning = false;
      cancelAnimationFrame(af);
    };
  }, [nodes, edges, selectedNodeId, hoveredNode]);

  // Coordinate helper: Screen -> World
  const screenToWorld = (screenX: number, screenY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const t = transformRef.current;
    const clientX = screenX - rect.left;
    const clientY = screenY - rect.top;
    return {
      x: (clientX - t.x) / t.scale,
      y: (clientY - t.y) / t.scale,
    };
  };

  // Find node under pointer
  const findNodeAt = (screenX: number, screenY: number): GraphNode | null => {
    const { x, y } = screenToWorld(screenX, screenY);
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      const radius = (node.size || 14) + 6;
      const dx = node.x - x;
      const dy = node.y - y;
      if (dx * dx + dy * dy <= radius * radius) {
        return node;
      }
    }
    return null;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomIntensity = 0.08;
    const delta = e.deltaY > 0 ? -zoomIntensity : zoomIntensity;
    transformRef.current.scale = Math.max(0.2, Math.min(3.0, transformRef.current.scale + delta));
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX - transformRef.current.x, y: e.clientY - transformRef.current.y };
    pointerStartPosRef.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      transformRef.current.x = e.clientX - dragStartRef.current.x;
      transformRef.current.y = e.clientY - dragStartRef.current.y;
    } else {
      const hitNode = findNodeAt(e.clientX, e.clientY);
      setHoveredNode(hitNode);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);

    // Click Detection (distance moved < 5px)
    const distSq = (e.clientX - pointerStartPosRef.current.x) ** 2 + (e.clientY - pointerStartPosRef.current.y) ** 2;
    if (distSq < 25) {
      const clickedNode = findNodeAt(e.clientX, e.clientY);
      if (clickedNode && onNodeClick) {
        onNodeClick(clickedNode);
      }
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <canvas 
        ref={canvasRef} 
        width={width} 
        height={height}
        style={{
          width: '100%',
          height: '100%',
          border: '1px solid var(--border-muted, #333)',
          background: 'var(--bg-deep, #121216)',
          borderRadius: '6px',
          display: 'block',
          touchAction: 'none',
          cursor: hoveredNode ? 'pointer' : 'grab'
        }} 
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
      {hoveredNode && (
        <div style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          background: 'rgba(15, 23, 42, 0.92)',
          border: '1px solid var(--border-glow, #3b82f6)',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '11px',
          color: '#e2e8f0',
          pointerEvents: 'none',
          maxWidth: '300px',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
        }}>
          <div style={{ fontWeight: 600, color: hoveredNode.color || '#38bdf8', marginBottom: '2px' }}>
            {hoveredNode.heading || hoveredNode.label}
          </div>
          {hoveredNode.summary && (
            <div style={{ opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {hoveredNode.summary}
            </div>
          )}
          <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '4px' }}>
            클릭하여 에디터 해당 위치로 이동
          </div>
        </div>
      )}
    </div>
  );
};
