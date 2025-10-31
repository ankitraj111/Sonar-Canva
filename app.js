// ===========================
// GLOBAL CONFIGURATION OBJECT
// ===========================
const CONFIG = {
  range: {
    min: 200,
    max: 800
  },
  scan: {
    fov: 120,
    beamSpeed: 0.35,
    beamWidth: 8
  },
  targets: {
    count: 6,
    size: 9,
    driftSpeed: 0.5
  },
  canvas: {
    width: 960,
    height: 520
  },
  visual: {
    bgOpacity: 0.94,
    glowEffect: true,
    showGrid: true
  },
  circles: {
    count: 4,
    opacity: 0.6,
    showLabels: true
  },
  scoring: {
    baseClose: 90,
    baseFar: 45,
    noise: 6
  },
  colors: {
    veryLow: '#ff4d4d',
    low: '#ff944d',
    medium: '#ffd24d',
    high: '#9cff4d',
    veryHigh: '#2bff88'
  },
  animation: {
    isPlaying: true
  }
};

// ===========================
// CANVAS AND CONTEXT
// ===========================
const canvas = document.getElementById('sonar');
const ctx = canvas.getContext('2d');

// ===========================
// SONAR STATE
// ===========================
let beamAngle = -CONFIG.scan.fov / 2;
let targets = [];
let detectedCount = 0;

// FPS Calculation
let frameCount = 0;
let lastTime = performance.now();
let fps = 60;

// ===========================
// UTILITY FUNCTIONS
// ===========================
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const toRad = deg => (deg - 90) * Math.PI / 180;

function polar(angDeg, dist) {
  const cx = canvas.width / 2;
  const cy = canvas.height - 28;
  const maxRadius = Math.min(canvas.width * 0.48, canvas.height - 80);
  const r = (dist / CONFIG.range.max) * maxRadius;
  const a = toRad(angDeg);
  return { 
    x: cx + r * Math.cos(a), 
    y: cy + r * Math.sin(a) 
  };
}

function opticalScore(distance) {
  const t = (distance - CONFIG.range.min) / (CONFIG.range.max - CONFIG.range.min);
  const base = CONFIG.scoring.baseClose - t * (CONFIG.scoring.baseClose - CONFIG.scoring.baseFar);
  const noise = (Math.random() - 0.5) * CONFIG.scoring.noise;
  return clamp(Math.round(base + noise), 10, 99);
}

function levelFromScore(score) {
  if (score >= 88) return { name: 'Very High', color: CONFIG.colors.veryHigh, seg: 5 };
  if (score >= 74) return { name: 'High', color: CONFIG.colors.high, seg: 4 };
  if (score >= 60) return { name: 'Medium', color: CONFIG.colors.medium, seg: 3 };
  if (score >= 46) return { name: 'Low', color: CONFIG.colors.low, seg: 2 };
  return { name: 'Very Low', color: CONFIG.colors.veryLow, seg: 1 };
}

// ===========================
// TARGET MANAGEMENT
// ===========================
function newTarget(id) {
  return {
    id,
    angle: (Math.random() * (CONFIG.scan.fov - 16)) - (CONFIG.scan.fov / 2 - 8),
    distance: CONFIG.range.min + Math.random() * (CONFIG.range.max - CONFIG.range.min),
    size: CONFIG.targets.size + Math.random() * 3,
    driftA: (Math.random() - 0.5) * 0.06 * CONFIG.targets.driftSpeed,
    driftD: (Math.random() - 0.5) * 0.4 * CONFIG.targets.driftSpeed
  };
}

function initTargets() {
  targets = [];
  const n = CONFIG.targets.count;
  for (let i = 0; i < n; i++) {
    targets.push(newTarget(100 + i));
  }
}

// ===========================
// DRAWING FUNCTIONS
// ===========================
function drawBackgroundWedge() {
  const cx = canvas.width / 2;
  const cy = canvas.height - 28;
  const maxRadius = Math.min(canvas.width * 0.48, canvas.height - 80);
  const a1 = toRad(-CONFIG.scan.fov / 2);
  const a2 = toRad(+CONFIG.scan.fov / 2);
  
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, maxRadius, a1, a2, false);
  ctx.closePath();
  
  const g = ctx.createRadialGradient(cx, cy, maxRadius * 0.15, cx, cy, maxRadius);
  g.addColorStop(0.00, `rgba(0,70,140,${CONFIG.visual.bgOpacity})`);
  g.addColorStop(0.60, `rgba(0,55,110,${CONFIG.visual.bgOpacity})`);
  g.addColorStop(1.00, `rgba(0,35,75,${CONFIG.visual.bgOpacity})`);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();
}

function drawRangeArcs() {
  const cx = canvas.width / 2;
  const cy = canvas.height - 28;
  const maxRadius = Math.min(canvas.width * 0.48, canvas.height - 80);
  const a1 = toRad(-CONFIG.scan.fov / 2);
  const a2 = toRad(+CONFIG.scan.fov / 2);
  
  if (!CONFIG.visual.showGrid) return;
  
  ctx.strokeStyle = `rgba(255,255,255,${CONFIG.circles.opacity})`;
  ctx.lineWidth = 1.4;
  
  const rangeStep = (CONFIG.range.max - CONFIG.range.min) / CONFIG.circles.count;
  
  for (let i = 1; i <= CONFIG.circles.count; i++) {
    const m = CONFIG.range.min + rangeStep * i;
    const r = (m / CONFIG.range.max) * maxRadius;
    
    ctx.beginPath();
    ctx.arc(cx, cy, r, a1, a2, false);
    ctx.stroke();
    
    if (CONFIG.circles.showLabels) {
      ctx.fillStyle = '#ffe066';
      ctx.font = '12px Arial';
      const pL = { x: cx + r * Math.cos(a1), y: cy + r * Math.sin(a1) };
      const pR = { x: cx + r * Math.cos(a2), y: cy + r * Math.sin(a2) };
      ctx.fillText(`${Math.round(m)} m`, pL.x - 35, pL.y - 6);
      ctx.fillText(`${Math.round(m)} m`, pR.x + 6, pR.y - 6);
    }
  }
  
  // Centerline
  ctx.beginPath();
  const pTop = polar(0, CONFIG.range.max);
  ctx.moveTo(cx, cy);
  ctx.lineTo(pTop.x, pTop.y);
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
  
  ctx.fillStyle = '#ffffff';
  ctx.font = '12px Arial';
  ctx.fillText('0°', pTop.x - 8, pTop.y - 8);
}

function drawScanBeam() {
  const cx = canvas.width / 2;
  const cy = canvas.height - 28;
  const maxRadius = Math.min(canvas.width * 0.48, canvas.height - 80);
  const start = beamAngle - CONFIG.scan.beamWidth / 2;
  const end = beamAngle + CONFIG.scan.beamWidth / 2;
  
  // Soft sector
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, maxRadius, toRad(start), toRad(end), false);
  ctx.closePath();
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxRadius);
  grad.addColorStop(0, 'rgba(0,255,255,0.09)');
  grad.addColorStop(1, 'rgba(0,255,255,0.0)');
  ctx.fillStyle = grad;
  ctx.fill();
  
  // Center scan line
  ctx.beginPath();
  const mid = toRad(beamAngle);
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + maxRadius * Math.cos(mid), cy + maxRadius * Math.sin(mid));
  ctx.strokeStyle = '#9ff';
  ctx.lineWidth = 2;
  
  if (CONFIG.visual.glowEffect) {
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#9ff';
  }
  
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.restore();
  
  if (CONFIG.animation.isPlaying) {
    beamAngle += CONFIG.scan.beamSpeed;
    if (beamAngle > CONFIG.scan.fov / 2) {
      beamAngle = -CONFIG.scan.fov / 2;
    }
  }
}

function drawOpticalBar(x, y, level) {
  const segW = 6, segH = 10, gap = 2;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.rect(x + i * (segW + gap), y, segW, segH);
    ctx.fillStyle = i < level.seg ? level.color : 'rgba(255,255,255,0.16)';
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 0.6;
    ctx.fill();
    ctx.stroke();
  }
}

function drawTargets() {
  const cx = canvas.width / 2;
  const cy = canvas.height - 28;
  const maxRadius = Math.min(canvas.width * 0.48, canvas.height - 80);
  
  // Clip to wedge
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, maxRadius, toRad(-CONFIG.scan.fov / 2), toRad(+CONFIG.scan.fov / 2), false);
  ctx.closePath();
  ctx.clip();
  
  detectedCount = 0;
  
  targets.forEach(t => {
    // Drift
    t.angle += t.driftA;
    t.distance += t.driftD;
    if (Math.random() < 0.02) t.driftA *= -1;
    if (Math.random() < 0.02) t.driftD *= -1;
    t.angle = clamp(t.angle, -CONFIG.scan.fov / 2 + 5, CONFIG.scan.fov / 2 - 5);
    t.distance = clamp(t.distance, CONFIG.range.min, CONFIG.range.max);
    
    const p = polar(t.angle, t.distance);
    const detected = Math.abs(beamAngle - t.angle) < CONFIG.scan.beamWidth / 2;
    
    if (detected) detectedCount++;
    
    const score = opticalScore(t.distance);
    const level = levelFromScore(score);
    
    // Base dot
    ctx.beginPath();
    ctx.arc(p.x, p.y, t.size * (detected ? 1.15 : 0.9), 0, Math.PI * 2);
    ctx.fillStyle = detected ? level.color : 'rgba(180,220,255,0.30)';
    ctx.fill();
    
    if (detected) {
      // Glow ring
      ctx.beginPath();
      ctx.arc(p.x, p.y, t.size + 4, 0, Math.PI * 2);
      ctx.strokeStyle = level.color + '99';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      
      // Labels
      ctx.fillStyle = '#ffffff';
      ctx.font = '11px Arial';
      ctx.fillText(`${Math.round(t.distance)} m`, p.x + 12, p.y - 4);
      
      ctx.fillStyle = level.color;
      ctx.fillText(`Optical ${score}% (${level.name})`, p.x + 12, p.y + 10);
      
      drawOpticalBar(p.x + 12, p.y + 16, level);
    }
  });
  
  ctx.restore();
}

function drawSonarHead() {
  const cx = canvas.width / 2;
  const cy = canvas.height - 28;
  
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx - 10, cy - 14);
  ctx.lineTo(cx + 10, cy - 14);
  ctx.closePath();
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = '#555';
  ctx.stroke();
}

// ===========================
// MAIN DRAW LOOP
// ===========================
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackgroundWedge();
  drawRangeArcs();
  drawTargets();
  drawScanBeam();
  drawSonarHead();
}

function loop() {
  draw();
  updateStatusBar();
  calculateFPS();
  requestAnimationFrame(loop);
}

function calculateFPS() {
  frameCount++;
  const currentTime = performance.now();
  if (currentTime >= lastTime + 1000) {
    fps = Math.round(frameCount * 1000 / (currentTime - lastTime));
    frameCount = 0;
    lastTime = currentTime;
  }
}

// ===========================
// STATUS BAR UPDATES
// ===========================
function updateStatusBar() {
  document.getElementById('status-beam-angle').textContent = beamAngle.toFixed(1) + '°';
  document.getElementById('status-targets').textContent = detectedCount;
  document.getElementById('status-fps').textContent = fps;
  document.getElementById('status-range').textContent = `${CONFIG.range.min}-${CONFIG.range.max}m`;
  document.getElementById('status-fov').textContent = CONFIG.scan.fov + '°';
}

// ===========================
// UI CONTROL HANDLERS
// ===========================
function setupControls() {
  // Range Settings
  setupSlider('min-range', 'min-range-value', (val) => {
    CONFIG.range.min = parseInt(val);
    if (CONFIG.range.min >= CONFIG.range.max - 100) {
      CONFIG.range.min = CONFIG.range.max - 100;
      document.getElementById('min-range').value = CONFIG.range.min;
      document.getElementById('min-range-value').textContent = CONFIG.range.min;
    }
    updateRangeInfo();
  });
  
  setupSlider('max-range', 'max-range-value', (val) => {
    CONFIG.range.max = parseInt(val);
    if (CONFIG.range.max <= CONFIG.range.min + 100) {
      CONFIG.range.max = CONFIG.range.min + 100;
      document.getElementById('max-range').value = CONFIG.range.max;
      document.getElementById('max-range-value').textContent = CONFIG.range.max;
    }
    updateRangeInfo();
  });
  
  // Scan Parameters
  setupSlider('fov', 'fov-value', (val) => {
    CONFIG.scan.fov = parseInt(val);
    beamAngle = -CONFIG.scan.fov / 2;
  });
  
  setupSlider('beam-speed', 'beam-speed-value', (val) => {
    CONFIG.scan.beamSpeed = parseFloat(val);
  });
  
  setupSlider('beam-width', 'beam-width-value', (val) => {
    CONFIG.scan.beamWidth = parseInt(val);
  });
  
  // Target Configuration
  setupSlider('target-count', 'target-count-value', (val) => {
    CONFIG.targets.count = parseInt(val);
    initTargets();
  });
  
  setupSlider('target-size', 'target-size-value', (val) => {
    CONFIG.targets.size = parseInt(val);
    targets.forEach(t => t.size = CONFIG.targets.size + Math.random() * 3);
  });
  
  setupSlider('drift-speed', 'drift-speed-value', (val) => {
    CONFIG.targets.driftSpeed = parseFloat(val);
    targets.forEach(t => {
      t.driftA = (Math.random() - 0.5) * 0.06 * CONFIG.targets.driftSpeed;
      t.driftD = (Math.random() - 0.5) * 0.4 * CONFIG.targets.driftSpeed;
    });
  });
  
  document.getElementById('regenerate-targets').addEventListener('click', initTargets);
  
  // Visual Settings
  setupSlider('canvas-width', 'canvas-width-value', (val) => {
    CONFIG.canvas.width = parseInt(val);
    canvas.width = CONFIG.canvas.width;
  });
  
  setupSlider('canvas-height', 'canvas-height-value', (val) => {
    CONFIG.canvas.height = parseInt(val);
    canvas.height = CONFIG.canvas.height;
  });
  
  setupSlider('bg-opacity', 'bg-opacity-value', (val) => {
    CONFIG.visual.bgOpacity = parseFloat(val);
  });
  
  document.getElementById('glow-effect').addEventListener('change', (e) => {
    CONFIG.visual.glowEffect = e.target.checked;
  });
  
  document.getElementById('show-grid').addEventListener('change', (e) => {
    CONFIG.visual.showGrid = e.target.checked;
  });
  
  // Range Circles
  setupSlider('circle-count', 'circle-count-value', (val) => {
    CONFIG.circles.count = parseInt(val);
  });
  
  setupSlider('circle-opacity', 'circle-opacity-value', (val) => {
    CONFIG.circles.opacity = parseFloat(val);
  });
  
  document.getElementById('show-range-labels').addEventListener('change', (e) => {
    CONFIG.circles.showLabels = e.target.checked;
  });
  
  // Detection & Scoring
  setupSlider('score-close', 'score-close-value', (val) => {
    CONFIG.scoring.baseClose = parseInt(val);
  });
  
  setupSlider('score-far', 'score-far-value', (val) => {
    CONFIG.scoring.baseFar = parseInt(val);
  });
  
  setupSlider('score-noise', 'score-noise-value', (val) => {
    CONFIG.scoring.noise = parseInt(val);
  });
  
  // Color Customization
  setupColorPicker('color-very-low', (val) => CONFIG.colors.veryLow = val);
  setupColorPicker('color-low', (val) => CONFIG.colors.low = val);
  setupColorPicker('color-medium', (val) => CONFIG.colors.medium = val);
  setupColorPicker('color-high', (val) => CONFIG.colors.high = val);
  setupColorPicker('color-very-high', (val) => CONFIG.colors.veryHigh = val);
  
  // Animation Controls
  document.getElementById('play-pause-btn').addEventListener('click', togglePlayPause);
  document.getElementById('reset-btn').addEventListener('click', resetToDefaults);
  document.getElementById('export-btn').addEventListener('click', exportConfig);
  document.getElementById('import-btn').addEventListener('click', () => {
    document.getElementById('import-file').click();
  });
  document.getElementById('import-file').addEventListener('change', importConfig);
  
  // Section Collapsing
  setupSectionToggling();
}

function setupSlider(id, valueId, callback) {
  const slider = document.getElementById(id);
  const valueSpan = document.getElementById(valueId);
  
  slider.addEventListener('input', (e) => {
    const val = e.target.value;
    valueSpan.textContent = val;
    callback(val);
  });
}

function setupColorPicker(id, callback) {
  const picker = document.getElementById(id);
  picker.addEventListener('input', (e) => {
    callback(e.target.value);
  });
}

function updateRangeInfo() {
  document.getElementById('range-info').textContent = `Range: ${CONFIG.range.min}–${CONFIG.range.max} m`;
}

function togglePlayPause() {
  CONFIG.animation.isPlaying = !CONFIG.animation.isPlaying;
  const btn = document.getElementById('play-pause-btn');
  btn.textContent = CONFIG.animation.isPlaying ? '⏸️ Pause' : '▶️ Play';
}

// --canvas-js-code

function resetToDefaults() {
  // Reset all values
  CONFIG.range.min = 200;
  CONFIG.range.max = 800;
  CONFIG.scan.fov = 120;
  CONFIG.scan.beamSpeed = 0.35;
  CONFIG.scan.beamWidth = 8;
  CONFIG.targets.count = 6;
  CONFIG.targets.size = 9;
  CONFIG.targets.driftSpeed = 0.5;
  CONFIG.canvas.width = 960;
  CONFIG.canvas.height = 520;
  CONFIG.visual.bgOpacity = 0.94;
  CONFIG.visual.glowEffect = true;
  CONFIG.visual.showGrid = true;
  CONFIG.circles.count = 4;
  CONFIG.circles.opacity = 0.6;
  CONFIG.circles.showLabels = true;
  CONFIG.scoring.baseClose = 90;
  CONFIG.scoring.baseFar = 45;
  CONFIG.scoring.noise = 6;
  CONFIG.colors.veryLow = '#ff4d4d';
  CONFIG.colors.low = '#ff944d';
  CONFIG.colors.medium = '#ffd24d';
  CONFIG.colors.high = '#9cff4d';
  CONFIG.colors.veryHigh = '#2bff88';
  CONFIG.animation.isPlaying = true;
  
  // Update UI
  document.getElementById('min-range').value = 200;
  document.getElementById('min-range-value').textContent = 200;
  document.getElementById('max-range').value = 800;
  document.getElementById('max-range-value').textContent = 800;
  document.getElementById('fov').value = 120;
  document.getElementById('fov-value').textContent = 120;
  document.getElementById('beam-speed').value = 0.35;
  document.getElementById('beam-speed-value').textContent = 0.35;
  document.getElementById('beam-width').value = 8;
  document.getElementById('beam-width-value').textContent = 8;
  document.getElementById('target-count').value = 6;
  document.getElementById('target-count-value').textContent = 6;
  document.getElementById('target-size').value = 9;
  document.getElementById('target-size-value').textContent = 9;
  document.getElementById('drift-speed').value = 0.5;
  document.getElementById('drift-speed-value').textContent = 0.5;
  document.getElementById('canvas-width').value = 960;
  document.getElementById('canvas-width-value').textContent = 960;
  document.getElementById('canvas-height').value = 520;
  document.getElementById('canvas-height-value').textContent = 520;
  document.getElementById('bg-opacity').value = 0.94;
  document.getElementById('bg-opacity-value').textContent = 0.94;
  document.getElementById('glow-effect').checked = true;
  document.getElementById('show-grid').checked = true;
  document.getElementById('circle-count').value = 4;
  document.getElementById('circle-count-value').textContent = 4;
  document.getElementById('circle-opacity').value = 0.6;
  document.getElementById('circle-opacity-value').textContent = 0.6;
  document.getElementById('show-range-labels').checked = true;
  document.getElementById('score-close').value = 90;
  document.getElementById('score-close-value').textContent = 90;
  document.getElementById('score-far').value = 45;
  document.getElementById('score-far-value').textContent = 45;
  document.getElementById('score-noise').value = 6;
  document.getElementById('score-noise-value').textContent = 6;
  document.getElementById('color-very-low').value = '#ff4d4d';
  document.getElementById('color-low').value = '#ff944d';
  document.getElementById('color-medium').value = '#ffd24d';
  document.getElementById('color-high').value = '#9cff4d';
  document.getElementById('color-very-high').value = '#2bff88';
  document.getElementById('play-pause-btn').textContent = '⏸️ Pause';
  
  canvas.width = 960;
  canvas.height = 520;
  beamAngle = -60;
  initTargets();
  updateRangeInfo();
}
// --end-canvas-js-code
function exportConfig() {
  const configJSON = JSON.stringify(CONFIG, null, 2);
  const blob = new Blob([configJSON], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sonar-config.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importConfig(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const imported = JSON.parse(event.target.result);
      Object.assign(CONFIG, imported);
      
      // Update all UI elements
      document.getElementById('min-range').value = CONFIG.range.min;
      document.getElementById('min-range-value').textContent = CONFIG.range.min;
      document.getElementById('max-range').value = CONFIG.range.max;
      document.getElementById('max-range-value').textContent = CONFIG.range.max;
      document.getElementById('fov').value = CONFIG.scan.fov;
      document.getElementById('fov-value').textContent = CONFIG.scan.fov;
      document.getElementById('beam-speed').value = CONFIG.scan.beamSpeed;
      document.getElementById('beam-speed-value').textContent = CONFIG.scan.beamSpeed;
      document.getElementById('beam-width').value = CONFIG.scan.beamWidth;
      document.getElementById('beam-width-value').textContent = CONFIG.scan.beamWidth;
      document.getElementById('target-count').value = CONFIG.targets.count;
      document.getElementById('target-count-value').textContent = CONFIG.targets.count;
      document.getElementById('target-size').value = CONFIG.targets.size;
      document.getElementById('target-size-value').textContent = CONFIG.targets.size;
      document.getElementById('drift-speed').value = CONFIG.targets.driftSpeed;
      document.getElementById('drift-speed-value').textContent = CONFIG.targets.driftSpeed;
      document.getElementById('canvas-width').value = CONFIG.canvas.width;
      document.getElementById('canvas-width-value').textContent = CONFIG.canvas.width;
      document.getElementById('canvas-height').value = CONFIG.canvas.height;
      document.getElementById('canvas-height-value').textContent = CONFIG.canvas.height;
      document.getElementById('bg-opacity').value = CONFIG.visual.bgOpacity;
      document.getElementById('bg-opacity-value').textContent = CONFIG.visual.bgOpacity;
      document.getElementById('glow-effect').checked = CONFIG.visual.glowEffect;
      document.getElementById('show-grid').checked = CONFIG.visual.showGrid;
      document.getElementById('circle-count').value = CONFIG.circles.count;
      document.getElementById('circle-count-value').textContent = CONFIG.circles.count;
      document.getElementById('circle-opacity').value = CONFIG.circles.opacity;
      document.getElementById('circle-opacity-value').textContent = CONFIG.circles.opacity;
      document.getElementById('show-range-labels').checked = CONFIG.circles.showLabels;
      document.getElementById('score-close').value = CONFIG.scoring.baseClose;
      document.getElementById('score-close-value').textContent = CONFIG.scoring.baseClose;
      document.getElementById('score-far').value = CONFIG.scoring.baseFar;
      document.getElementById('score-far-value').textContent = CONFIG.scoring.baseFar;
      document.getElementById('score-noise').value = CONFIG.scoring.noise;
      document.getElementById('score-noise-value').textContent = CONFIG.scoring.noise;
      document.getElementById('color-very-low').value = CONFIG.colors.veryLow;
      document.getElementById('color-low').value = CONFIG.colors.low;
      document.getElementById('color-medium').value = CONFIG.colors.medium;
      document.getElementById('color-high').value = CONFIG.colors.high;
      document.getElementById('color-very-high').value = CONFIG.colors.veryHigh;
      
      canvas.width = CONFIG.canvas.width;
      canvas.height = CONFIG.canvas.height;
      beamAngle = -CONFIG.scan.fov / 2;
      initTargets();
      updateRangeInfo();
      
      alert('Configuration imported successfully!');
    } catch (err) {
      alert('Error importing configuration: ' + err.message);
    }
  };
  reader.readAsText(file);
}

function setupSectionToggling() {
  const headers = document.querySelectorAll('.section-header');
  headers.forEach(header => {
    header.addEventListener('click', () => {
      const content = header.nextElementSibling;
      const isCollapsed = content.classList.contains('collapsed');
      
      if (isCollapsed) {
        content.classList.remove('collapsed');
        header.classList.remove('collapsed');
      } else {
        content.classList.add('collapsed');
        header.classList.add('collapsed');
      }
    });
  });
}

// ===========================
// INITIALIZATION
// ===========================
function init() {
  initTargets();
  setupControls();
  updateRangeInfo();
  loop();
}

// Start the application
init();