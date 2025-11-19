// sonar-fixed.js  — Robust, DOM-ready radar engine
(function () {
  'use strict';

  // Wait for DOM to be ready
  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  onReady(function () {

    // ==== CONFIGURATION ====
    const CONFIG = {
      RADAR_WIDTH: 950,
      RADAR_HEIGHT: 480,
      FOV: 100,           // change to 360 for full view during testing
      MAX_RANGE: 800,
      MIN_RANGE: 0,
      NUM_CIRCLES: 4,
      TRAIL_LENGTH: 20
    };

    // Canvas (id must match your HTML: <canvas id="sonar">)
    const canvas = document.getElementById('sonarRadar');
    if (!canvas) {
      console.error("Canvas element with id 'sonar' not found. Make sure <canvas id='sonar'> exists.");
      return;
    }

    // Optional: force canvas size to CONFIG (uncomment if you want)
    // canvas.width = CONFIG.RADAR_WIDTH;
    // canvas.height = CONFIG.RADAR_HEIGHT;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error("2D context unavailable on canvas.");
      return;
    }

    // Geometry (derived after canvas exists)
    let cx = canvas.width / 2;
    let cy = canvas.height - 28;
    let maxR = Math.min(canvas.width * 0.48, canvas.height - 80);

    // Use global referencePosition / gpsTargets if provided by JSP or backend.
    // Otherwise use defaults / empty array.
    let referencePosition = (window.referencePosition && Array.isArray(window.referencePosition) && window.referencePosition.length >= 2)
      ? window.referencePosition.slice()
      : [19.987, 109.000]; // default; you can override from JSP or other scripts

    // If window.gpsTargets exists, use it; else start empty
    let gpsTargets = (window.gpsTargets && Array.isArray(window.gpsTargets))
      ? window.gpsTargets
      : [];

    // Local targets used for drawing (populated via initializeGPSTargets)
    let nextTargetId = 1;
    let targets = [];

    // ====== Helpers ======
    function deg2rad(d){ return d * Math.PI / 180; }
    function rad2deg(r){ return r * 180 / Math.PI; }
    function normalizeAngle(a){ a = a % 360; if(a > 180) a -= 360; else if(a < -180) a += 360; return a; }
    function toRad(deg){ return (deg - 90) * Math.PI / 180; }

    function polar(angle, dist){
      // clamp range
      const r = (dist / Math.max(CONFIG.MAX_RANGE, 1)) * maxR;
      const a = toRad(angle);
      return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
    }

    function calculateBearing(from, to){
      const lat1 = deg2rad(from[0]), lat2 = deg2rad(to[0]);
      const dLon = deg2rad(to[1] - from[1]);
      const y = Math.sin(dLon) * Math.cos(lat2);
      const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
      return (rad2deg(Math.atan2(y, x)) + 360) % 360;
    }

    function calculateDistance(from, to){
      const R = 6371000;
      const lat1 = deg2rad(from[0]), lat2 = deg2rad(to[0]);
      const dLat = deg2rad(to[0] - from[0]), dLon = deg2rad(to[1] - from[1]);
      const a = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    }

    // Recompute geometry (call if canvas resized)
    function updateGeometry() {
      cx = canvas.width / 2;
      cy = canvas.height - 28;
      maxR = Math.min(canvas.width * 0.48, canvas.height - 80);
    }

    // ====== Initialize targets from gpsTargets array ======
    function initializeGPSTargets() {
      targets = [];
      nextTargetId = 1;
      if (!Array.isArray(gpsTargets) || gpsTargets.length === 0) {
        // nothing to show — keep blank (ok)
        console.info('Radar: gpsTargets empty — radar will be blank until targets added.');
        return;
      }

      for (let i = 0; i < gpsTargets.length; i++) {
        const coord = gpsTargets[i];
        if (!Array.isArray(coord) || coord.length < 2) continue;
        const bearing = calculateBearing(referencePosition, coord);
        const distance = calculateDistance(referencePosition, coord);
        targets.push({
          id: nextTargetId++,
          name: String.fromCharCode(65 + (i % 26)),
          angle: (bearing <= 180 ? bearing : bearing - 360),
          range: Math.min(distance, CONFIG.MAX_RANGE),
          trail: []
        });
      }
      console.info(`Radar: initialized ${targets.length} target(s).`);
    }

    function updateTrail(t){
      t.trail.push({ range: t.range, angle: t.angle });
      if (t.trail.length > CONFIG.TRAIL_LENGTH) t.trail.shift();
    }
    function moveTargets() { targets.forEach(updateTrail); }

    // ====== Drawing ======
    function drawBackground(){
      ctx.clearRect(0,0,canvas.width,canvas.height);
      const a1 = toRad(-CONFIG.FOV/2), a2 = toRad(CONFIG.FOV/2);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, maxR, a1, a2, false);
      ctx.closePath();

      const grad = ctx.createRadialGradient(cx, cy, maxR*0.15, cx, cy, maxR);
      grad.addColorStop(0,"rgba(0,70,140,0.94)");
      grad.addColorStop(0.6,"rgba(0,55,110,0.94)");
      grad.addColorStop(1,"rgba(0,35,75,0.94)");
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();

      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.lineWidth = 1.35;
      const step = (CONFIG.MAX_RANGE - CONFIG.MIN_RANGE) / Math.max(CONFIG.NUM_CIRCLES, 1);

      ctx.fillStyle = "#ffe066";
      ctx.font = "13px Arial";
      for (let i = 1; i <= CONFIG.NUM_CIRCLES; i++) {
        const rangeR = CONFIG.MIN_RANGE + step * i;
        const r = (rangeR / CONFIG.MAX_RANGE) * maxR;
        ctx.beginPath();
        ctx.arc(cx, cy, r, a1, a2);
        ctx.stroke();

        let pL = { x: cx + r * Math.cos(a1), y: cy + r * Math.sin(a1) };
        let pR = { x: cx + r * Math.cos(a2), y: cy + r * Math.sin(a2) };
        ctx.fillText(`${Math.round(rangeR)} m`, pL.x - 30, pL.y - 8);
        ctx.fillText(`${Math.round(rangeR)} m`, pR.x + 3, pR.y - 8);
      }

      // center to top line
      ctx.beginPath();
      let pTop = polar(0, CONFIG.MAX_RANGE);
      ctx.moveTo(cx, cy);
      ctx.lineTo(pTop.x, pTop.y);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#fff";
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.font = "13px Arial";
      ctx.fillText("0°", pTop.x - 8, pTop.y - 9);
    }

    function drawSonarHead(){
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

    function drawTargets(){
      if (!targets || targets.length === 0) return;
      targets.forEach(t => {
        // trail glow
        t.trail.forEach((pos, i) => {
          const p = polar(pos.angle, pos.range);
          ctx.beginPath();
          ctx.shadowColor = "rgba(0,255,128,0.7)";
          ctx.shadowBlur = 15;
          ctx.arc(p.x, p.y, 6 + i / 5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0,255,128,${0.05 + i * 0.02})`;
          ctx.fill();
          ctx.shadowBlur = 0;
        });

        // main dot
        const p = polar(t.angle, t.range);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 11, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(180,220,255,0.29)";
        ctx.fill();
        ctx.strokeStyle = "rgba(180,220,255,0.5)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // label
        const labelText = `${t.name}`;
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
    }

    function drawInfoPanel(){
      const visibleTargets = targets.filter(t => {
        const a = normalizeAngle(t.angle);
        return a >= -CONFIG.FOV / 2 && a <= CONFIG.FOV / 2;
      });

      const padding = 8;
      const lineHeight = 22;
      const boxWidth = 200;
      const boxHeight = 38 + visibleTargets.length * lineHeight;
      const x = canvas.width - boxWidth - 22;
      const y = 24;

      ctx.fillStyle = 'rgba(20,45,75,0.92)';
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
          const txt = `${t.name}   ${Math.round(t.range)}m   ${t.angle.toFixed(1)}°`;
          ctx.fillText(txt, x + padding, lineY);
          lineY += lineHeight;
        });
      }
    }

    function animate(){
      moveTargets();
      drawBackground();
      drawSonarHead();
      drawTargets();
      drawInfoPanel();
      requestAnimationFrame(animate);
    }

    // Public helpers for runtime updates
    function addGPSTarget(lat, lon) {
      if (!Array.isArray(gpsTargets)) gpsTargets = [];
      gpsTargets.push([lat, lon]);
      initializeGPSTargets();
    }

    function clearTargets() {
      gpsTargets.length = 0;
      initializeGPSTargets();
    }

    // Expose controls for console debugging
    window.sonarRadarAPI = {
      addGPSTarget: addGPSTarget,
      clearTargets: clearTargets,
      reinit: function () { initializeGPSTargets(); },
      getTargets: function () { return targets; },
      setReference: function (lat, lon) { referencePosition = [lat, lon]; initializeGPSTargets(); }
    };

    // initial setup & start
    updateGeometry();
    initializeGPSTargets();
    requestAnimationFrame(animate);

    // optional: handle window resize (recompute geometry)
    window.addEventListener('resize', function () {
      updateGeometry();
      // re-run target projection if necessary
      initializeGPSTargets();
    });

  }); // onReady

})();
