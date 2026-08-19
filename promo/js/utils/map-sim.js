/**
 * @file map-sim.js
 * @system AMEVA Interactive Showcase Simulator
 * @role 15s Interactive Geo-Mapping, Animated Waypoint Navigation & OSRM Route Simulation
 */

(function () {
  let pins = [
    { name: '출발: 테헤란로 AI 센터', x: 18, y: 72 },
    { name: '경유: 판교 테크노밸리', x: 52, y: 38 },
    { name: '도착: 과천 정부청사', x: 82, y: 62 }
  ];

  let vehicleProgress = 0;

  window.renderMapCanvas = function () {
    const canvas = document.getElementById('map-interactive-canvas');
    const mdOut = document.getElementById('map-md-output');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.parentElement.clientWidth || 500;
    const h = canvas.height = 250;

    // Draw Dark Grid Map Background
    ctx.fillStyle = '#050811';
    ctx.fillRect(0, 0, w, h);

    // Draw Grid Lines
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 32) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 32) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Top HUD Bar
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(10, 10, w - 20, 26);
    ctx.strokeStyle = 'rgba(56,189,248,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, w - 20, 26);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`OSRM ROUTE: ${pins.length} PINS | 34.2km | ETA: 28min | GPS RTK: ACTIVE`, 18, 27);

    // Draw Route Polyline
    if (pins.length > 1) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3.5;
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

    // Calculate Animated GPS Marker Position
    if (pins.length > 1) {
      const segIndex = Math.floor(vehicleProgress) % (pins.length - 1);
      const segT = vehicleProgress - Math.floor(vehicleProgress);
      const pA = pins[segIndex];
      const pB = pins[segIndex + 1];
      const vx = ((pA.x + (pB.x - pA.x) * segT) / 100) * w;
      const vy = ((pA.y + (pB.y - pA.y) * segT) / 100) * h;

      // Glow Pulse Ring
      ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.beginPath();
      ctx.arc(vx, vy, 14, 0, Math.PI * 2);
      ctx.fill();

      // GPS Vehicle Beacon
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(vx, vy, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    // Draw Waypoint Pins
    pins.forEach((p, idx) => {
      const px = (p.x / 100) * w;
      const py = (p.y / 100) * h;

      // Pin Color
      ctx.fillStyle = idx === 0 ? '#10b981' : (idx === pins.length - 1 ? '#ef4444' : '#0ea5e9');
      ctx.beginPath();
      ctx.arc(px, py, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Pin Text Tag with pill background
      ctx.font = 'bold 11px Inter, sans-serif';
      const textWidth = ctx.measureText(p.name).width;
      
      ctx.fillStyle = 'rgba(15,23,42,0.85)';
      ctx.fillRect(px + 10, py - 11, textWidth + 12, 20);
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 10, py - 11, textWidth + 12, 20);

      ctx.fillStyle = '#f8fafc';
      ctx.fillText(p.name, px + 16, py + 3);
    });

    // Update Markdown Output
    if (mdOut) {
      const pinLines = pins.map(p => `  - Pin: [${p.x.toFixed(1)}, ${p.y.toFixed(1)}] "${p.name}"`).join('\n');
      mdOut.textContent = `:::map[provider="osm" zoom=14 routing="osrm"]\n${pinLines}\n:::`;
    }
  };

  // 15s Continuous Animation Loop
  setInterval(() => {
    vehicleProgress += 0.015;
    if (vehicleProgress >= (pins.length - 1)) {
      vehicleProgress = 0;
    }
    renderMapCanvas();
  }, 40);

  window.addMapPinClick = function (e) {
    const canvas = document.getElementById('map-interactive-canvas');
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const xPct = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(15, Math.min(85, ((e.clientY - rect.top) / rect.height) * 100));

    pins.push({
      name: `경유지 #${pins.length}`,
      x: xPct,
      y: yPct
    });

    renderMapCanvas();
  };

  window.resetMapPins = function () {
    pins = [
      { name: '출발: 테헤란로 AI 센터', x: 18, y: 72 },
      { name: '경유: 판교 테크노밸리', x: 52, y: 38 },
      { name: '도착: 과천 정부청사', x: 82, y: 62 }
    ];
    vehicleProgress = 0;
    renderMapCanvas();
  };

  window.addEventListener('DOMContentLoaded', () => {
    renderMapCanvas();
  });
})();
