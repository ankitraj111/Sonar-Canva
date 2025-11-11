<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Sonar GPS Target Radar - JSP Version</title>
  <style>
    html,body {
      height: 100%;
      margin: 0;
      background: #000814;
      font-family: Arial, monospace;
      color: #a8d8ff;
      user-select: none;
      overflow: hidden;
    }
    .radar-container {
      width: 100vw;
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      background: rgba(0, 10, 20, 0.8);
    }
    canvas#sonar {
      background: none;
      border-radius: 8px;
      display: block;
      box-shadow: 0 0 30px rgba(17,49,68,0.6);
    }
  </style>
</head>
<body>
  <div class="radar-container">
    <canvas id="sonar" width="950" height="480"></canvas>
  </div>
  <script>
    // ==== CONFIGURATION ====
    const CONFIG = {
      RADAR_WIDTH: 950,
      RADAR_HEIGHT: 480,
      FOV: 100,
      MAX_RANGE: 800,
      MIN_RANGE: 0,
      NUM_CIRCLES: 4,
      TRAIL_LENGTH: 20
    };

    const canvas = document.getElementById('sonar');
    const ctx = canvas.getContext('2d');
    const cx = canvas.width / 2;
    const cy = canvas.height - 28;
    const maxR = Math.min(canvas.width * 0.48, canvas.height - 80);

    // ---- GPS reference position ----
    const referencePosition = [19.987, 109.000];

    // Initialize gpsTargets from server-side if needed using JSP scripting
    // For example, a server-side variable containing GPS positions in JSON
    // This example has no server data integration; you can replace with your own
    let gpsTargets = [];

    // On page load, you can integrate JSP EL or scriptlet to inject server GPS data like:
    // <%
    //   String gpsTargetsJson = request.getAttribute("gpsTargetsJson");
    // %>
    // let gpsTargets = <%= gpsTargetsJson %>;

    let nextTargetId = 1;
    let targets = [];

    function deg2rad(degrees) { return degrees * (Math.PI / 180); }
    function rad2deg(radians) { return radians * (180 / Math.PI); }
    function normalizeAngle(angle) {
      let a = angle % 360;
      if (a > 180) a -= 360;
      else if (a < -180) a += 360;
      return a;
    }
    function toRad(deg) { return (deg - 90) * Math.PI / 180; }
    function polar(angle, dist) {
      const r = (dist / CONFIG.MAX_RANGE) * maxR;
      const a = toRad(angle);
      return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
    }
    function calculateBearing(from, to) {
      let lat1 = deg2rad(from[0]);
      let lat2 = deg2rad(to[0]);
      let dLon = deg2rad(to[1] - from[1]);
      let y = Math.sin(dLon) * Math.cos(lat2);
      let x = Math.cos(lat1) * Math.sin(lat2) -
              Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
      let brng = rad2deg(Math.atan2(y, x));
      return (brng + 360) % 360;
    }
    function calculateDistance(from, to) {
      const R = 6371000;
      let lat1 = deg2rad(from[0]);
      let lat2 = deg2rad(to[0]);
      let dLat = deg2rad(to[0] - from[0]);
      let dLon = deg2rad(to[1] - from[1]);
      let a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
      let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    }

    function initializeGPSTargets() {
      targets = [];
      for (let i = 0; i < gpsTargets.length; i++) {
        const coord = gpsTargets[i];
        const bearing = calculateBearing(referencePosition, coord);
        const distance = calculateDistance(referencePosition, coord);
        targets.push({
          id: nextTargetId++,
          name: String.fromCharCode(65 + i),
          angle: bearing <= 180 ? bearing : bearing - 360,
          range: Math.min(distance, CONFIG.MAX_RANGE),
          angleInc: 0,
          rangeInc: 0,
          trail: []
        });
      }
    }

    function updateTrail(target) {
      target.trail.push({ range: target.range, angle: target.angle });
      if (target.trail.length > CONFIG.TRAIL_LENGTH) target.trail.shift();
    }
    function moveTargets() {
      targets.forEach(t => updateTrail(t));
    }
    function drawBackground() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const a1 = toRad(-CONFIG.FOV/2), a2 = toRad(CONFIG.FOV/2);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, maxR, a1, a2, false);
      ctx.closePath();
      const grad = ctx.createRadialGradient(cx, cy, maxR*0.15, cx, cy, maxR);
      grad.addColorStop(0, "rgba(0,70,140,0.94)");
      grad.addColorStop(0.6, "rgba(0,55,110,0.94)");
      grad.addColorStop(1, "rgba(0,35,75,0.94)");
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.lineWidth = 1.35;
      const step = (CONFIG.MAX_RANGE-CONFIG.MIN_RANGE)/CONFIG.NUM_CIRCLES;
      ctx.fillStyle = "#ffe066";
      ctx.font = '13px Arial';
      for (let i = 1; i <= CONFIG.NUM_CIRCLES; i++) {
        const rangeR = CONFIG.MIN_RANGE + step * i;
        const r = (rangeR / CONFIG.MAX_RANGE) * maxR;
        ctx.beginPath();
        ctx.arc(cx, cy, r, a1, a2);
        ctx.stroke();
        let pL = { x: cx + r * Math.cos(a1), y: cy + r * Math.sin(a1) };
        let pR = { x: cx + r * Math.cos(a2), y: cy + r * Math.sin(a2) };
        ctx.fillText(`${Math.round(rangeR)} m`, pL.x-30, pL.y-8);
        ctx.fillText(`${Math.round(rangeR)} m`, pR.x+3, pR.y-8);
      }
      ctx.beginPath();
      let pTop = polar(0, CONFIG.MAX_RANGE);
      ctx.moveTo(cx, cy);
      ctx.lineTo(pTop.x, pTop.y);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#fff";
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.font = '13px Arial';
      ctx.fillText("0°", pTop.x-8, pTop.y-9);
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
      if (!targets || targets.length === 0) return;
      targets.forEach(t => {
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
        let p = polar(t.angle, t.range);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 11, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(180,220,255,0.29)";
        ctx.fill();
        ctx.strokeStyle = "rgba(180,220,255,0.5)";
        ctx.lineWidth = 1;
        ctx.stroke();
        const labelText = `${t.name}`;
        ctx.font = "12px monospace";
        const textWidth = ctx.measureText(labelText).width;
        const textHeight = 14;
        const labelX = p.x + 15;
        const labelY = p.y + 12;
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.fillRect(labelX-6, labelY-12, textWidth+12, textHeight);
        ctx.fillStyle = "rgba(180,220,255,0.7)";
        ctx.fillText(labelText, labelX, labelY);
      });
    }

    function drawInfoPanel() {
      const visibleTargets = targets.filter(t => {
        const angleNorm = normalizeAngle(t.angle);
        return angleNorm >= -CONFIG.FOV / 2 && angleNorm <= CONFIG.FOV / 2;
      });
      const padding = 8;
      const lineHeight = 22;
      const boxWidth = 200;
      const boxHeight = 38 + visibleTargets.length * lineHeight;
      const x = canvas.width - boxWidth - 22;
      const y = 24;
      ctx.fillStyle = 'rgba(20, 45, 75, 0.92)';
      ctx.fillRect(x, y, boxWidth, boxHeight);
      ctx.fillStyle = '#ffec88';
      ctx.font = '16px Arial';
      ctx.fillText("SONAR INFO", x + padding, y + 26);
      ctx.font = '14px monospace';
      ctx.fillStyle = '#a8d8ff';
      let lineY = y + 46;
      if (visibleTargets.length === 0) {
        ctx.fillText("No targets visible", x + padding, lineY);
      } else {
        visibleTargets.forEach(t => {
          const text = `${t.name}   ${Math.round(t.range)}m   ${t.angle.toFixed(1)}°`;
          ctx.fillText(text, x + padding, lineY);
          lineY += lineHeight;
        });
      }
    }

    function animate() {
      moveTargets();
      drawBackground();
      drawSonarHead();
      drawTargets();
      drawInfoPanel();
      requestAnimationFrame(animate);
    }

    initializeGPSTargets();
    animate();

  </script>
</body>
</html>
