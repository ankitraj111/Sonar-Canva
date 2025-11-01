// const canvas = document.getElementById('sonar');
// const ctx = canvas.getContext('2d');

// // Config
// const minR = 200, maxR = 800;
// const fov = 120, circles = 4;
// const gridColor = "#ffe066";
// let beamAngle = -fov/2;

// function toRad(deg) { return (deg - 90) * Math.PI / 180; }
// function polar(angle, dist) {
//   const cx = canvas.width/2, cy = canvas.height-28, rMax = Math.min(canvas.width*0.48, canvas.height-80);
//   const r = (dist/maxR)*rMax; const a = toRad(angle);
//   return { x: cx + r*Math.cos(a), y: cy + r*Math.sin(a) };
// }

// function drawScene() {
//   ctx.clearRect(0, 0, canvas.width, canvas.height);
//   // Wedge
//   const cx = canvas.width/2, cy = canvas.height-28, rMax = Math.min(canvas.width*0.48, canvas.height-80);
//   const a1 = toRad(-fov/2), a2 = toRad(fov/2);
//   ctx.save();
//   ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, rMax, a1, a2, false); ctx.closePath();
//   const grad = ctx.createRadialGradient(cx, cy, rMax*0.15, cx, cy, rMax);
//   grad.addColorStop(0, "rgba(0,70,140,0.94)");
//   grad.addColorStop(0.6, "rgba(0,55,110,0.94)");
//   grad.addColorStop(1, "rgba(0,35,75,0.94)");
//   ctx.fillStyle = grad; ctx.fill();
//   ctx.restore();

//   // Grid arcs and range labels
//   ctx.strokeStyle = "rgba(255,255,255,0.59)";
//   ctx.lineWidth = 1.35;
//   const step = (maxR-minR)/circles;
//   for(let i=1;i<=circles;i++){
//     let m = minR + step * i;
//     let r = (m/maxR)*rMax;
//     ctx.beginPath(); ctx.arc(cx, cy, r, a1, a2, false); ctx.stroke();
//     ctx.fillStyle = gridColor; ctx.font = '13px Arial';
//     let pL = {x: cx + r*Math.cos(a1), y: cy + r*Math.sin(a1)};
//     let pR = {x: cx + r*Math.cos(a2), y: cy + r*Math.sin(a2)};
//     ctx.fillText(`${Math.round(m)} m`, pL.x-30, pL.y-8);
//     ctx.fillText(`${Math.round(m)} m`, pR.x+3, pR.y-8);
//   }
//   // Centerline
//   ctx.beginPath();
//   let pTop = polar(0,maxR);
//   ctx.moveTo(cx, cy); ctx.lineTo(pTop.x,pTop.y); ctx.lineWidth=2; ctx.strokeStyle="#fff"; ctx.stroke();
//   ctx.fillStyle="#fff"; ctx.font='13px Arial'; ctx.fillText("0°",pTop.x-8,pTop.y-9);

//   // Scanning beam
//   ctx.save();
//   const start = beamAngle-8/2, end = beamAngle+8/2;
//   ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, rMax, toRad(start), toRad(end), false); ctx.closePath();
//   const grad2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, rMax);
//   grad2.addColorStop(0,"rgba(0,255,255,0.09)");
//   grad2.addColorStop(1,"rgba(0,255,255,0.0)");
//   ctx.fillStyle = grad2; ctx.fill();
//   ctx.beginPath();
//   ctx.moveTo(cx, cy);
//   ctx.lineTo(cx+rMax*Math.cos(toRad(beamAngle)), cy+rMax*Math.sin(toRad(beamAngle)));
//   ctx.strokeStyle="#9ff"; ctx.lineWidth=2; ctx.shadowBlur=10; ctx.shadowColor="#9ff"; ctx.stroke();
//   ctx.shadowBlur=0; ctx.restore();

//   // Sonar head triangle
//   ctx.beginPath();
//   ctx.moveTo(cx,cy); ctx.lineTo(cx-10,cy-14); ctx.lineTo(cx+10,cy-14); ctx.closePath();
//   ctx.fillStyle="#fff"; ctx.fill(); ctx.strokeStyle="#555"; ctx.stroke();

//   // Dots for detected objects (Demo targets, static)
//   const demoTargets = [
//     {angle: -42, dist: 340},{angle: -14, dist: 570},{angle: 18, dist: 690},
//     {angle: 25, dist: 600},{angle: 10, dist: 520},{angle: -6, dist: 390}
//   ];
//   ctx.save();
//   ctx.beginPath(); ctx.moveTo(cx,cy);
//   ctx.arc(cx,cy,rMax,toRad(-fov/2),toRad(fov/2),false);
//   ctx.closePath(); ctx.clip();
//   for(let t of demoTargets){
//     let p = polar(t.angle,t.dist);
//     ctx.beginPath();
//     ctx.arc(p.x,p.y,11,0,Math.PI*2);
//     ctx.fillStyle="rgba(180,220,255,0.29)";
//     ctx.fill();
//   }
//   ctx.restore();
// }

// function animate(){
//   drawScene();
//   beamAngle += 0.35;
//   if(beamAngle > fov/2) beamAngle= -fov/2;
//   requestAnimationFrame(animate);
// }
// animate();






const canvas = document.getElementById('sonar');
const ctx = canvas.getContext('2d');

// Configurations
const minR =0, maxR = 800;
const fov = 100, numCircles = 4;
const gridColor = "#ffe066";
const beamWidth = 8;
let beamAngle = -fov / 2;

// Some demo static targets (angle, distance)
const demoTargets = [
  {angle: -42, dist: 340},
  {angle: -14, dist: 570},
  {angle: 18, dist: 690},
  {angle: 25, dist: 600},
  {angle: 10, dist: 520},
  {angle: -6, dist: 390}
];

function toRad(deg) {
  return (deg - 90) * Math.PI / 180;
}
function polar(angle, dist) {
  const cx = canvas.width/2, cy = canvas.height-28, rMax = Math.min(canvas.width*0.48, canvas.height-80);
  const r = (dist/maxR)*rMax;
  const a = toRad(angle);
  return {x: cx + r * Math.cos(a), y: cy + r * Math.sin(a)};
}

function drawScene() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background wedge
  const cx = canvas.width/2, cy = canvas.height-28, rMax = Math.min(canvas.width*0.48, canvas.height-80);
  const a1 = toRad(-fov/2), a2 = toRad(fov/2);
  ctx.save();
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, rMax, a1, a2, false); ctx.closePath();
  const grad = ctx.createRadialGradient(cx, cy, rMax*0.15, cx, cy, rMax);
  grad.addColorStop(0, "rgba(0,70,140,0.94)");
  grad.addColorStop(0.6, "rgba(0,55,110,0.94)");
  grad.addColorStop(1, "rgba(0,35,75,0.94)");
  ctx.fillStyle = grad; ctx.fill();
  ctx.restore();

  // Range arcs & labels
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = 1.35;
  const step = (maxR-minR)/numCircles;
  for(let i=1;i<=numCircles;i++){
    let m = minR + step * i;
    let r = (m/maxR)*rMax;
    ctx.beginPath(); ctx.arc(cx, cy, r, a1, a2, false); ctx.stroke();
    ctx.fillStyle = gridColor; ctx.font = '13px Arial';
    let pL = {x: cx + r*Math.cos(a1), y: cy + r*Math.sin(a1)};
    let pR = {x: cx + r*Math.cos(a2), y: cy + r*Math.sin(a2)};
    ctx.fillText(`${Math.round(m)} m`, pL.x-30, pL.y-8);
    ctx.fillText(`${Math.round(m)} m`, pR.x+3, pR.y-8);
  }
  // Centerline
  ctx.beginPath();
  let pTop = polar(0,maxR);
  ctx.moveTo(cx, cy); ctx.lineTo(pTop.x,pTop.y); ctx.lineWidth=2; ctx.strokeStyle="#fff"; ctx.stroke();
  ctx.fillStyle="#fff"; ctx.font='13px Arial'; ctx.fillText("0°",pTop.x-8,pTop.y-9);

  // Scanning beam
  ctx.save();
  const start = beamAngle-beamWidth/2, end = beamAngle+beamWidth/2;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, rMax, toRad(start), toRad(end), false); ctx.closePath();
  const grad2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, rMax);
  grad2.addColorStop(0,"rgba(0,255,255,0.09)");
  grad2.addColorStop(1,"rgba(0,255,255,0.0)");
  ctx.fillStyle = grad2; ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx+rMax*Math.cos(toRad(beamAngle)), cy+rMax*Math.sin(toRad(beamAngle)));
  ctx.strokeStyle="#9ff"; ctx.lineWidth=2; ctx.shadowBlur=10; ctx.shadowColor="#9ff"; ctx.stroke();
  ctx.shadowBlur=0; ctx.restore();

  // Sonar head triangle
  ctx.beginPath();
  ctx.moveTo(cx,cy); ctx.lineTo(cx-10,cy-14); ctx.lineTo(cx+10,cy-14); ctx.closePath();
  ctx.fillStyle="#fff"; ctx.fill(); ctx.strokeStyle="#555"; ctx.stroke();

  // Targets + detection
  let detectedCount = 0;
  ctx.save();
  ctx.beginPath(); ctx.moveTo(cx,cy);
  ctx.arc(cx,cy,rMax,toRad(-fov/2),toRad(fov/2),false);
  ctx.closePath(); ctx.clip();

  for(let t of demoTargets){
    let p = polar(t.angle,t.dist);
    let detected = Math.abs(beamAngle - t.angle) < (beamWidth/2);

    ctx.beginPath();
    ctx.arc(p.x,p.y, detected ? 14 : 11, 0, Math.PI*2);
    ctx.fillStyle = detected ? "#00ffaacc" : "rgba(180,220,255,0.29)";
    ctx.fill();

    // Highlight + Detected label
    if(detected) {
      detectedCount++;
      ctx.fillStyle = "#fff";
      ctx.font = "14px Arial";
      ctx.fillText("Detected", p.x+16, p.y-8);
    }
  }
  ctx.restore();

  // Update target counter
  document.getElementById('detected-count').textContent = detectedCount;
}

// Animation loop
function animate() {
  drawScene();
  beamAngle += 0.35;
  if(beamAngle > fov/2) beamAngle = -fov/2;
  requestAnimationFrame(animate);
}
animate();
