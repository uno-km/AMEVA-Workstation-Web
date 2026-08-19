/**
 * @file map-sim.js
 * @system AMEVA Interactive Showcase Simulator
 * @role 15s Interactive Geo-Mapping, Animated Waypoint Navigation & OSRM Route Simulation
 */

(function () {
  let pins = [
    { name: '출발지: 테헤란로 AI 센터', x: 18, y: 72 },
    { name: '경유지: 판교 테크노밸리', x: 52, y: 38 },
    { name: '도착지: 과천 정부종합청사', x: 82, y: 62 }
  ];

  let vehicleProgress = 0;

  window.renderMapCanvas = function () {
    const canvas = document.getElementById('map-interactive-canvas');
    const mdOut = document.getElementById('map-md-output');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.parentElement.clientWidth || 400;
    const h = canvas.height = 200;

    // Draw Dark Grid Map Background
    ctx.fillStyle = '#060911';
    ctx.fillRect(0, 0, w, h);

    // Draw Grid Lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 28) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 28) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Draw Route Polyline
    if (pins.length > 1) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
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

    // Calculate Animated GPS Marker Position
    if (pins.length > 1) {
      const segIndex = Math.floor(vehicleProgress) % (pins.length - 1);
      const segT = vehicleProgress - Math.floor(vehicleProgress);
      const pA = pins[segIndex];
      const pB = pins[segIndex + 1];
      const vx = ((pA.x + (pB.x - pA.x) * segT) / 100) * w;
      const vy = ((pA.y + (pB.y - pA.y) * segT) / 100) * h;

      // Glow Pulse
      ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.beginPath();
      ctx.arc(vx, vy, 12, 0, Math.PI * 2);
      ctx.fill();

      // GPS Vehicle Dot
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(vx, vy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Draw Pins
    pins.forEach((p, idx) => {
      const px = (p.x / 100) * w;
      const py = (p.y / 100) * h;

      // Core Pin
      ctx.fillStyle = idx === 0 ? '#10b981' : (idx === pins.length - 1 ? '#ef4444' : '#0ea5e9');
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Label
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 10.5px Inter, sans-serif';
      ctx.fillText(p.name, px + 10, py + 4);
    });

    // Update Markdown Output
    if (mdOut) {
      mdOut.textContent = `:::map[provider="osm" zoom=14 routing="osrm"]\n${pins.map(p => `- Pin: [${p.x.toFixed(1)}, ${p.y.toFixed(1)}] "${p.name}"`).join('\n')}\n:::`;
    }
  };

  // Continuous animation loop for GPS vehicle traversal
  setInterval(() => {
    if (pins.length > 1) {
      vehicleProgress = (vehicleProgress + 0.02) % (pins.length - 1);
      window.renderMapCanvas();
    }
  }, 50);

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

    vehicleProgress = 0;
    window.renderMapCanvas();
  };

  window.resetMapPins = function () {
    pins = [
      { name: '출발지: 테헤란로 AI 센터', x: 18, y: 72 },
      { name: '경유지: 판교 테크노밸리', x: 52, y: 38 },
      { name: '도착지: 과천 정부종합청사', x: 82, y: 62 }
    ];
    vehicleProgress = 0;
    window.renderMapCanvas();
  };

  window.addEventListener('DOMContentLoaded', () => {
    window.renderMapCanvas();
  });
})();
