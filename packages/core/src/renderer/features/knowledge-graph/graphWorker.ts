/**
 * ============================================================================
 * @file graphWorker.ts
 * @description Force-Directed Physics Worker
 * ============================================================================
 */
self.onmessage = (e) => {
  if (e.data.type === 'TICK') {
    const nodes = JSON.parse(JSON.stringify(e.data.nodes))
    const edges = e.data.edges
    const k = 0.01
    const L = 100
    const damping = 0.85
    const width = 800
    const height = 400

    // Repulsion
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x
        const dy = nodes[i].y - nodes[j].y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const force = 2000 / (dist * dist)
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force
        nodes[i].vx += fx
        nodes[i].vy += fy
        nodes[j].vx -= fx
        nodes[j].vy -= fy
      }
    }

    // Spring
    edges.forEach((edge: any) => {
      const source = nodes.find((n: any) => n.id === edge.source)
      const target = nodes.find((n: any) => n.id === edge.target)
      if (source && target) {
        const dx = target.x - source.x
        const dy = target.y - source.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const force = k * (dist - L)
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force
        source.vx += fx
        source.vy += fy
        target.vx -= fx
        target.vy -= fy
      }
    })

    // Update and boundary
    nodes.forEach((node: any) => {
      node.vx *= damping
      node.vy *= damping
      node.x += node.vx
      node.y += node.vy
      
      // 울타리
      if (node.x < 20) { node.x = 20; node.vx *= -1 }
      if (node.x > width - 20) { node.x = width - 20; node.vx *= -1 }
      if (node.y < 20) { node.y = 20; node.vy *= -1 }
      if (node.y > height - 20) { node.y = height - 20; node.vy *= -1 }
    })

    self.postMessage({ type: 'TICK_DONE', nodes })
  }
}
