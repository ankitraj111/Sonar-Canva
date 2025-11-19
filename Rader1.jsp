<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <title>Sonar GPS Target Radar - JSP</title>

    <!-- CSS correct path -->
    <link rel="stylesheet" href="<%= request.getContextPath() %>/static/styles/radar.css">
</head>

<body>

<div class="my-sonar-container">
    <canvas id="sonarRadar" width="950" height="480" class="main-sonar-canvas"></canvas>
</div>

<!-- ----------------------------
     BACKEND VALUES → FRONTEND JS
     ---------------------------- -->
<%
    double latitude = 19.987;
    double longitude = 109.000;

    double[][] gpsTargets = {
        {19.990, 109.003},
        {19.992, 109.008}
    };
%>

<script>
    // Reference Position
    var referencePosition = [<%= latitude %>, <%= longitude %>];

    // Target Positions
    var gpsTargets = [
        <% for (int i = 0; i < gpsTargets.length; i++) { %>
            [<%= gpsTargets[i][0] %>, <%= gpsTargets[i][1] %>]<%= (i < gpsTargets.length - 1) ? "," : "" %>
        <% } %>
    ];
</script>

<!-- JS File (Radar Engine) -->
<script src="<%= request.getContextPath() %>/static/js/flsmodels1.js"></script>

</body>
</html>






body {
    margin: 0;
    background-color: #00172e;
    font-family: 'Arial', sans-serif;
    color: #a8d8ff;
}

.my-sonar-container {
    width: 950px;
    max-width: 100%;
    margin: 20px auto;
    background: #002855;
    border-radius: 12px;
    box-shadow: 0 0 15px rgba(0, 200, 150, 0.7);
    padding: 10px;
    position: relative;
}

.main-sonar-canvas {
    display: block;
    background-color: transparent;
    border-radius: 10px;
}
