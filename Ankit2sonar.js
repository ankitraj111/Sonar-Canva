const canvas = document.getElementById("sonar");
const ctx = canvas.getContext("2d");

const W = canvas.width;
const H = canvas.height;
const CX = W / 2;
const CY = H;
const R = H - 10;

let angle = 0;
let direction = 1;
const sweepSpeed = 1.5;
const targets = [];

for (let i = 0; i < 12; i++) {
  const a = Math.random() * Math.PI;
  const r = Math.random() * (R - 40);
  targets.push({ a, r, alpha: 1 });
}

function drawGrid() {
  ctx.strokeStyle = "rgba(0,255,255,0.1)";
  ctx.lineWidth = 1;

  for (let i = 1; i <= 5; i++) {
    ctx.beginPath();
    ctx.arc(CX, CY, (R / 5) * i, Math.PI, 0);
    ctx.stroke();
  }

  for (let i = -90; i <= 90; i += 15) {
    const rad = (i * Math.PI) / 180;
    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.lineTo(CX + R * Math.cos(rad), CY - R * Math.sin(rad));
    ctx.stroke();
  }
}

function drawBeam() {
  const rad = (angle * Math.PI) / 180;
  const grad = ctx.createRadialGradient(CX, CY, 0, CX, CY, R);
  grad.addColorStop(0, "rgba(0,255,255,0.1)");
  grad.addColorStop(1, "rgba(0,255,255,0)");

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(CX, CY);
  ctx.arc(CX, CY, R, Math.PI, rad, false);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(0,255,255,0.8)";
  ctx.beginPath();
  ctx.moveTo(CX, CY);
  ctx.lineTo(CX + R * Math.cos(rad), CY - R * Math.sin(rad));
  ctx.stroke();
}

function drawTargets() {
  targets.forEach((t) => {
    const x = CX + t.r * Math.cos(t.a);
    const y = CY - t.r * Math.sin(t.a);

    const beamRad = (angle * Math.PI) / 180;
    const diff = Math.abs(beamRad - t.a);

    if (diff < 0.05) t.alpha = 1;
    else t.alpha *= 0.98;

    if (t.alpha > 0.05) {
      ctx.beginPath();
      ctx.fillStyle = `rgba(0,255,255,${t.alpha})`;
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function animate() {
  ctx.clearRect(0, 0, W, H);
  drawGrid();
  drawTargets();
  drawBeam();

  angle += sweepSpeed * direction;

  if (angle >= 180) direction = -1;
  if (angle <= 0) direction = 1;

  requestAnimationFrame(animate);
}

animate();
