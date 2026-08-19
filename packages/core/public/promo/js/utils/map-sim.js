/**
 * @file map-sim.js
 * @system AMEVA Interactive Showcase Simulator
 * @role Interactive Geo-Mapping, Pin Drops & OSRM Route Simulation
 */

(function () {
  let pins = [
    { name: '출발지: 테헤란로 AI 센터', x: 20, y: 70 },
    { name: '경유지: 판교 테크노밸리', x: 55, y: 40 },
    { name: '도착지: 과천 정부종합청사', x: 80, y: 60 }
  ];

  window.renderMapCanvas = function () {
    const canvas = document.getElementById('map-interactive-canvas');
    const mdOut = document.getElementById('map-md-output');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.parentElement.clientWidth || 500;
    const h = canvas.height = 240;

    // Draw Dark Grid Map Background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, w, h);

    // Draw Grid Lines
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 30) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 30) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Draw Route Polyline
    if (pins.length > 1) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      pins.forEach((p, idx) => {
        const px = (p.x / 100) * w;
        const py = (p.y / 100) * h;
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw Pins
    pins.forEach((p, idx) => {
      const px = (p.x / 100) * w;
      const py = (p.y / 100) * h;

      // Pulse glow
      ctx.fillStyle = 'rgba(14, 165, 233, 0.3)';
      ctx.beginPath();
      ctx.arc(px, py, 14, 0, Math.PI * 2);
      ctx.fill();

      // Core Pin
      ctx.fillStyle = idx === 0 ? '#10b981' : (idx === pins.length - 1 ? '#ef4444' : '#0ea5e9');
      ctx.beginPath();
      ctx.arc(px, py, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText(p.name, px + 12, py + 4);
    });

    // Update Markdown Output
    if (mdOut) {
      mdOut.textContent = `:::map[provider="osm" zoom=14 routing="osrm"]\n${pins.map(p => `- Pin: [${p.x.toFixed(2)}, ${p.y.toFixed(2)}] "${p.name}"`).join('\n')}\n:::`;
    }
  };

  window.addMapPinClick = function (e) {
    const canvas = document.getElementById('map-interactive-canvas');
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    pins.push({
      name: `경유지 #${pins.length}`,
      x: Math.max(5, Math.min(95, x)),
      y: Math.max(5, Math.min(95, y))
    });

    window.renderMapCanvas();
  };

  window.resetMapPins = function () {
    pins = [
      { name: '출발지: 테헤란로 AI 센터', x: 20, y: 70 },
      { name: '경유지: 판교 테크노밸리', x: 55, y: 40 },
      { name: '도착지: 과천 정부종합청사', x: 80, y: 60 }
    ];
    window.renderMapCanvas();
  };

  window.addEventListener('DOMContentLoaded', () => {
    window.renderMapCanvas();
  });
})();
