. Setup: Canvas and Constants
js
const canvas = document.getElementById('sonar');
const ctx = canvas.getContext('2d');

const cx = canvas.width / 2; // Radar center X
const cy = canvas.height - 28; // Radar center Y (bottom offset)
const maxR = Math.min(canvas.width * 0.48, canvas.height - 80); // Max radar radius

const minR = 0, maxRVal = 800; // Range limits in meters
const fov = 100; // Field of View in degrees (+/-50)
const numCircles = 4; // Number of concentric range circles

// Beam parameters (for optional beam)
const beamWidth = 8; // beam angular width in degrees
let beamAngle = -fov / 2; // initial beam angle start
const beamRotationSpeed = 0.15; // beam rotation speed (degrees/frame)
2. Targets Data Structure
js
const targets = [
  // Each target has position, speed (angular & range), and trail to store historic positions
  { id: 1, name: "A", range: 180, angle: -30, angleInc: 0.2, rangeInc: 1, trail: [] },
  { id: 2, name: "B", range: 120, angle: 40, angleInc: 0.02, rangeInc: 0.03, trail: [] },
  { id: 3, name: "C", range: 300, angle: 15, angleInc: 0.16, rangeInc: -0.6, trail: [] },
  { id: 4, name: "D", range: 250, angle: -45, angleInc: -0.1, rangeInc: 0.4, trail: [] },
  { id: 5, name: "E", range: 400, angle: -15, angleInc: 0.24, rangeInc: -0.8, trail: [] },
  { id: 6, name: "F", range: 350, angle: 35, angleInc: -0.06, rangeInc: 0.3, trail: [] }
];
3. Helper Functions
Normalize angle into range 
[
−
180
∘
,
180
∘
]
[−180 
∘
 ,180 
∘
 ]:

js
function normalizeAngle(angle) {
  let a = angle % 360;
  if (a > 180) a -= 360;
  else if (a < -180) a += 360;
  return a;
}
Convert degrees to radians (adjusted for radar orientation):

js
function toRad(deg) {
  return (deg - 90) * Math.PI / 180;
}
Convert polar coordinates (angle, distance) to canvas coordinates:

js
function polar(angle, dist) {
  const r = (dist / maxRVal) * maxR;
  const a = toRad(angle);
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}
4. Target Movement and Trail Updates
Move targets incrementally by angle and range, reset at bounds, and update trail history for lightlong effect.

js
function updateTrail(target) {
  target.trail.push({ range: target.range, angle: target.angle });
  if (target.trail.length > 20) target.trail.shift(); // Limit trail length
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
5. Drawing Radar Background and Grid
Draw radar arcs, range circles, and labels with gradient background.

js
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

  // Draw range circles with labels
  const step = (maxRVal - minR) / numCircles;
  ctx.fillStyle = "#ffe066";
  ctx.font = '13px Arial';
  for (let i = 1; i <= numCircles; i++) {
    const rangeR = minR + i * step;
    const r = (rangeR / maxRVal) * maxR;
    ctx.beginPath();
    ctx.arc(cx, cy, r, a1, a2);
    ctx.stroke();

    let pL = { x: cx + r * Math.cos(a1), y: cy + r * Math.sin(a1) };
    let pR = { x: cx + r * Math.cos(a2), y: cy + r * Math.sin(a2) };
    ctx.fillText(`${Math.round(rangeR)} m`, pL.x - 30, pL.y - 8);
    ctx.fillText(`${Math.round(rangeR)} m`, pR.x + 3, pR.y - 8);
  }

  // Draw the radar front line at 0°
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
6. Draw Sonar Head
Small triangle at radar base:

js
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
7. Draw Targets and Lightlong Trails
Draw each target along with glowing light trails representing past positions.

js
function drawTargets() {
  const a1 = toRad(-fov / 2), a2 = toRad(fov / 2);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, maxR, a1, a2);
  ctx.closePath();
  ctx.clip();

  targets.forEach(t => {
    // Draw glowing trails (lightlong effect)
    t.trail.forEach((pos, i) => {
      let p = polar(pos.angle, pos.range);
      ctx.beginPath();
      ctx.shadowColor = "rgba(0,255,128,0.7)";
      ctx.shadowBlur = 15;
      ctx.arc(p.x, p.y, 6 + i / 5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,255,128,${0.05 + i * 0.02})`;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Draw target marker and label
    let p = polar(t.angle, t.range);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 11, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(180,220,255,0.29)";
    ctx.fill();
    ctx.strokeStyle = "rgba(180,220,255,0.5)";
    ctx.lineWidth = 1;
    ctx.stroke();

    const labelText = `${t.name} ${t.angle.toFixed(1)}° ${Math.round(t.range)}m`;
    ctx.font = "12px monospace";
    const textWidth = ctx.measureText(labelText).width;
    const textHeight = 14;
    const labelX = p.x + 15;
    const labelY = p.y + 12;

    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(labelX - 6, labelY - 12, textWidth + 12, textHeight);

    ctx.fillStyle = "rgba(180,220,255,0.7)";
    ctx.fillText(labelText, labelX, labelY);
  });

  ctx.restore();
}
8. Draw Optional Scanning Beam
(Commented out by default.)

js
function drawBeam() {
  const a1 = beamAngle - beamWidth / 2;
  const a2 = beamAngle + beamWidth / 2;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, maxR, toRad(a1), toRad(a2));
  ctx.closePath();

  const grad2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
  grad2.addColorStop(0, "rgba(0,255,255,0.15)");
  grad2.addColorStop(1, "rgba(0,255,255,0.0)");

  ctx.fillStyle = grad2;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + maxR * Math.cos(toRad(beamAngle)), cy + maxR * Math.sin(toRad(beamAngle)));
  ctx.strokeStyle = "#00ffff";
  ctx.lineWidth = 3;
  ctx.shadowBlur = 20;
  ctx.shadowColor = "#00ffff";
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.restore();
}
9. Draw Info Panel
Shows list of targets visible inside radar FOV:

js
function drawInfoPanelOnCanvas() {
  const visibleTargets = targets.filter(t => {
    const angleNorm = normalizeAngle(t.angle);
    return angleNorm >= -fov / 2 && angleNorm <= fov / 2;
  });

  const padding = 8;
  const lineHeight = 20;
  const boxWidth = 200;
  const boxHeight = 40 + visibleTargets.length * lineHeight;

  const x = canvas.width - boxWidth - 20;
  const y = 20;

  ctx.fillStyle = 'rgba(20, 45, 75, 0.9)';
  ctx.fillRect(x, y, boxWidth, boxHeight);

  ctx.fillStyle = '#ffec88';
  ctx.font = '18px Arial';
  ctx.fillText("SONAR INFO", x + padding, y + 30);

  ctx.font = '14px monospace';
  ctx.fillStyle = '#a8d8ff';

  let lineY = y + 55;
  if (visibleTargets.length === 0) {
    ctx.fillText("No targets visible", x + padding, lineY);
  } else {
    visibleTargets.forEach(t => {
      const text = `${t.name}   ${t.angle.toFixed(1)}°   ${Math.round(t.range)}m`;
      ctx.fillText(text, x + padding, lineY);
      lineY += lineHeight;
    });
  }
}
10. Main Animation Loop
js
function animate() {
  moveTargets();
  drawBackground();
  drawSonarHead();
  drawTargets();

  // Uncomment below lines to enable rotating scanning beam
  // beamAngle += beamRotationSpeed;
  // if (beamAngle > fov / 2) beamAngle = -fov / 2;
  // drawBeam();

  drawInfoPanelOnCanvas();
  requestAnimationFrame(animate);
}

animate();