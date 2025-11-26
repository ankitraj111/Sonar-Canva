<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Front Sonar Radar</title>

  <style>
    body {
      margin: 0;
      background: #000;
      color: #0ff;
      font-family: 'Consolas', monospace;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
    }

    canvas {
      border-top: 2px solid #0ff;
      border-left: 2px solid #0ff;
      border-right: 2px solid #0ff;
      border-radius: 0 0 300px 300px;
      box-shadow: 0 0 20px #0ff;
      background: radial-gradient(circle at center, #001a1a 0%, #000 80%);
    }

    h1 {
      color: #0ff;
      font-weight: 400;
      margin-bottom: 10px;
      letter-spacing: 2px;
      text-shadow: 0 0 8px #0ff;
    }
  </style>

</head>

<body>

  <h1>🔵 Front Sonar Radar Simulation</h1>

  <canvas id="sonar" width="700" height="350"></canvas>

  <!-- External JS File -->
  <script src="sonar.js"></script>

</body>
</html>
