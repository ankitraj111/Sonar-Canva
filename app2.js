const canvas = document.getElementById('sonar');
const ctx = canvas.getContext('2d');

const cx = canvas.width / 2;
const cy = canvas.height - 28;
const maxR = Math.min(canvas.width * 0.48, canvas.height - 80);

const minR = 0, maxRVal = 1000;
const fov = 100;
const beamWidth = 8;
const numCircles = 4;
const detectionThreshold = beamWidth / 2;
let beamAngle = -fov / 2;
const beamRotationSpeed = 0.15;

const targets = [
  { id: 1, name: "A", range: 180, angle: -30, angleInc: 0.2, rangeInc: 1, trail: [] },
  { id: 2, name: "B", range: 120, angle: 40, angleInc: 0.02, rangeInc: 0.03, trail: [] },
  { id: 3, name: "C", range: 300, angle: 15, angleInc: 0.16, rangeInc: -0.6, trail: [] },
  { id: 4, name: "D", range: 250, angle: -45, angleInc: -0.1, rangeInc: 0.4, trail: [] },
  { id: 5, name: "E", range: 400, angle: -15, angleInc: 0.24, rangeInc: -0.8, trail: [] },
  { id: 6, name: "F", range: 350, angle: 35, angleInc: -0.06, rangeInc: 0.3, trail: [] }
];

const detectedCountEl = document.getElementById('detected-count');
const targetListEl = document.getElementById('target-list');
const beamAngleEl = document.getElementById('beam-angle');

function toRad(deg) {
  return (deg - 90) * Math.PI / 180;
}
function polar(angle, dist) {
  const r = (dist / maxRVal) * maxR;
  const a = toRad(angle);
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function updateTrail(target) {
  target.trail.push({ range: target.range, angle: target.angle });
  if (target.trail.length > 30) target.trail.shift();
}

function moveTargets() {
  targets.forEach(t => {
    t.angle += t.angleInc;
    t.range += t.rangeInc;
    if (t.range > maxRVal) t.range = minR;
    if (t.range < minR) t.range = maxRVal;
    updateTrail(t);
  });
}

function drawBackground() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const a1 = toRad(-fov / 2), a2 = toRad(fov / 2);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, maxR, a1, a2, false);
  ctx.closePath();
  const grad = ctx.createRadialGradient(cx, cy, maxR * 0.15, cx, cy, maxR);
  grad.addColorStop(0, "rgba(0,70,140,0.94)");
  grad.addColorStop(0.6, "rgba(0,55,110,0.94)");
  grad.addColorStop(1, "rgba(0,35,75,0.94)");
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = 1.35;
  const step = (maxRVal - minR) / numCircles;
  ctx.fillStyle = "#ffe066";
  ctx.font = '13px Arial';
  for (let i = 1; i <= numCircles; i++) {
    const rangeR = minR + step * i;
    const r = (rangeR / maxRVal) * maxR;
    ctx.beginPath();
    ctx.arc(cx, cy, r, a1, a2);
    ctx.stroke();

    let pL = { x: cx + r * Math.cos(a1), y: cy + r * Math.sin(a1) };
    let pR = { x: cx + r * Math.cos(a2), y: cy + r * Math.sin(a2) };
    ctx.fillText(`${Math.round(rangeR)} m`, pL.x - 30, pL.y - 8);
    ctx.fillText(`${Math.round(rangeR)} m`, pR.x + 3, pR.y - 8);
  }

  ctx.beginPath();
  let pTop = polar(0, maxRVal);
  ctx.moveTo(cx, cy);
  ctx.lineTo(pTop.x, pTop.y);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#fff";
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.font = '13px Arial';
  ctx.fillText("0°", pTop.x - 8, pTop.y - 9);
}

function drawBeam() {
  const a1 = beamAngle - beamWidth / 2;
  const a2 = beamAngle + beamWidth / 2;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, maxR, toRad(a1), toRad(a2));
  ctx.closePath();
  const grad2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
  grad2.addColorStop(0, "rgba(0,255,255,0.09)");
  grad2.addColorStop(1, "rgba(0,255,255,0.0)");
  ctx.fillStyle = grad2;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + maxR * Math.cos(toRad(beamAngle)), cy + maxR * Math.sin(toRad(beamAngle)));
  ctx.strokeStyle = "#9ff";
  ctx.lineWidth = 2;
  ctx.shadowBlur = 10;
  ctx.shadowColor = "#9ff";
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawSonarHead() {
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx - 10, cy - 14);
  ctx.lineTo(cx + 10, cy - 14);
  ctx.closePath();
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.strokeStyle = "#555";
  ctx.stroke();
}

function drawTargets() {
  let detectedCount = 0;
  const a1 = toRad(-fov / 2), a2 = toRad(fov / 2);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, maxR, a1, a2);
  ctx.closePath();
  ctx.clip();

  targets.forEach(t => {
    t.trail.forEach((pos, i) => {
      let p = polar(pos.angle, pos.range);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5 + i / 6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,255,128,${0.1 + i * 0.025})`;
      ctx.fill();
    });

    const angleDiff = Math.abs(((beamAngle - t.angle + 180) % 360) - 180);
    let detected = angleDiff < detectionThreshold;

    let p = polar(t.angle, t.range);
    ctx.beginPath();
    ctx.arc(p.x, p.y, detected ? 16 : 11, 0, Math.PI * 2);
    ctx.fillStyle = detected ? "#00ffaacc" : "rgba(180,220,255,0.29)";
    ctx.fill();
    ctx.strokeStyle = detected ? "#00ff00" : "rgba(180,220,255,0.5)";
    ctx.lineWidth = 1;
    ctx.stroke();

    const labelText = `${t.name} ${Math.round(t.range)}m ${t.angle.toFixed(1)}°`;
    ctx.font = "12px monospace";
    const textWidth = ctx.measureText(labelText).width;
    const textHeight = 14;
    const labelX = p.x + 15;
    const labelY = p.y + 12;

    ctx.fillStyle = detected ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.4)";
    ctx.fillRect(labelX - 6, labelY - 12, textWidth + 12, textHeight);

    ctx.fillStyle = detected ? "#00ff00" : "rgba(180,220,255,0.7)";
    ctx.fillText(labelText, labelX, labelY);

    if (detected) detectedCount++;
  });

  ctx.restore();

  detectedCountEl.textContent = `DETECTED: ${detectedCount}/6`;
  detectedCountEl.className = detectedCount ? 'detected' : '';

  targetListEl.innerHTML = "";
  targets.forEach(t => {
    const angleDiff = Math.abs(((beamAngle - t.angle + 180) % 360) - 180);
    const detected = angleDiff < detectionThreshold;

    const item = document.createElement('div');
    item.className = 'target-item';

    const nameSpan = document.createElement('div');
    nameSpan.className = 'target-name';
    nameSpan.textContent = t.name;

    const rangeSpan = document.createElement('div');
    rangeSpan.className = 'target-range';
    rangeSpan.textContent = `${Math.round(t.range)} m`;

    const angleSpan = document.createElement('div');
    angleSpan.className = 'target-angle';
    angleSpan.textContent = `${t.angle.toFixed(1)}°`;

    const statusSpan = document.createElement('div');
    statusSpan.className = detected ? 'status-det' : 'status-undet';
    statusSpan.textContent = detected ? '🟢 DETECTED' : '⚪ UNDETECTED';

    item.appendChild(nameSpan);
    item.appendChild(rangeSpan);
    item.appendChild(angleSpan);
    item.appendChild(statusSpan);

    targetListEl.appendChild(item);
  });
}

function animate() {
  moveTargets();
  drawBackground();
  drawBeam();
  drawTargets();
  drawSonarHead();

  beamAngleEl.textContent = `${beamAngle.toFixed(1)}°`;

  beamAngle += beamRotationSpeed;
  if (beamAngle > fov / 2) beamAngle = -fov / 2;

  requestAnimationFrame(animate);
}

animate();
