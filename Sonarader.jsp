<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Sonar Control Dashboard</title>

<style>
  /* ===== Global Layout ===== */
  body {
    margin: 0;
    font-family: "Segoe UI", Arial, sans-serif;
    background-color: #001020;
    color: #e6f7ff;
    display: flex;
    height: 100vh;
    overflow: hidden;
  }

  /* ===== Sidebar ===== */
  .sidebar {
    width: 220px;
    background-color: #001a33;
    box-shadow: 2px 0 10px #002b55;
    padding: 20px 0;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .sidebar h2 {
    color: #00aaff;
    margin-bottom: 30px;
  }

  .sidebar a {
    display: block;
    color: #e6f7ff;
    padding: 10px 20px;
    text-decoration: none;
    width: 100%;
    text-align: center;
    transition: 0.3s;
  }

  .sidebar a:hover {
    background-color: #003366;
    color: #00aaff;
  }

  /* ===== Main Content ===== */
  .main {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  /* ===== Header ===== */
  .header {
    background-color: #002244;
    padding: 15px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 2px 10px #001a33;
  }

  .header h1 {
    margin: 0;
    color: #00aaff;
    font-size: 22px;
  }

  .header span {
    font-size: 14px;
    color: #80dfff;
  }

  /* ===== Content Area ===== */
  .content {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
  }

  /* ===== Radar Container ===== */
  .radar-container {
    width: 300px;
    height: 300px;
    background: radial-gradient(circle at center, #001f33 0%, #000814 100%);
    border-radius: 50%;
    box-shadow: 0 0 20px #00aaff;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  #sonarRadar {
    border-radius: 50%;
  }

  /* ===== Footer ===== */
  .footer {
    text-align: center;
    background-color: #002244;
    color: #80dfff;
    padding: 10px;
    font-size: 13px;
    box-shadow: 0 -2px 10px #001a33;
  }
</style>
</head>

<body>

  <!-- ===== Sidebar ===== -->
  <div class="sidebar">
    <h2>CONTROL PANEL</h2>
    <a href="#">Home</a>
    <a href="#">Sonar</a>
    <a href="#">Radar</a>
    <a href="#">Logs</a>
    <a href="#">Settings</a>
  </div>

  <!-- ===== Main Area ===== -->
  <div class="main">

    <!-- ===== Header ===== -->
    <div class="header">
      <h1>Blue Sonar Radar Dashboard</h1>
      <span>Active System: <b>Sonar Simulation</b></span>
    </div>

    <!-- ===== Content ===== -->
    <div class="content">
      <div class="radar-container">
        <canvas id="sonarRadar" width="300" height="300"></canvas>
      </div>
    </div>

    <!-- ===== Footer ===== -->
    <div class="footer">
      © 2025 Sonar Control System | Developed by Ankit Raj
    </div>
  </div>

  <!-- ===== JavaScript (Radar Animation) ===== -->
  <script>
    const canvas = document.getElementById("sonarRadar");
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    const center = w / 2;
    let angle = 0;

    function drawRadar() {
      ctx.clearRect(0, 0, w, h);

      // Background
      ctx.beginPath();
      ctx.arc(center, center, center, 0, 2 * Math.PI);
      const gradient = ctx.createRadialGradient(center, center, 10, center, center, 150);
      gradient.addColorStop(0, "#002b55");
      gradient.addColorStop(1, "#000814");
      ctx.fillStyle = gradient;
      ctx.fill();

      // Grid Circles
      ctx.strokeStyle = "#005577";
      ctx.lineWidth = 1;
      for (let r = 50; r < center; r += 50) {
        ctx.beginPath();
        ctx.arc(center, center, r, 0, 2 * Math.PI);
        ctx.stroke();
      }

      // Cross Lines
      ctx.beginPath();
      ctx.moveTo(center, 0);
      ctx.lineTo(center, h);
      ctx.moveTo(0, center);
      ctx.lineTo(w, center);
      ctx.stroke();

      // Sweep light
      const sweepGradient = ctx.createRadialGradient(center, center, 0, center, center, center);
      sweepGradient.addColorStop(0, "rgba(0, 255, 255, 0.3)");
      sweepGradient.addColorStop(1, "rgba(0, 255, 255, 0)");
      ctx.fillStyle = sweepGradient;
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, center, angle, angle + Math.PI / 8);
      ctx.fill();

      // Random Dots (Targets)
      for (let i = 0; i < 4; i++) {
        const r = Math.random() * center;
        const a = Math.random() * 2 * Math.PI;
        const x = center + r * Math.cos(a);
        const y = center + r * Math.sin(a);
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(0, 255, 255, 0.8)";
        ctx.fill();
      }

      angle += 0.03;
      requestAnimationFrame(drawRadar);
    }

    drawRadar();
  </script>

</body>
</html>
