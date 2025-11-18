<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <title>Sonar GPS Target Radar - JSP</title>
    <!-- Aap class ya id ka naam yaha change kar sakte hain -->
    <link rel="stylesheet" href="<%= request.getContextPath() %>/static/styles/radar.css" />
</head>
<body>
    <div class="my-sonar-container"> <!-- Class name changed -->
        <canvas id="sonarRadar" width="950" height="480" class="main-sonar-canvas"></canvas> <!-- Both id and class changed -->
    </div>
    <%
        double latitude = 19.987;
        double longitude = 109.000;
        double[][] gpsTargets = {
            {19.990, 109.003},
            {19.992, 109.008}
        };
    %>
    <script>
        var referencePosition = [<%= latitude %>, <%= longitude %>];
        var gpsTargets = [
            <% for(int i=0; i<gpsTargets.length; i++) { %>
                [<%= gpsTargets[i][0] %>, <%= gpsTargets[i][1] %>]<% if(i<gpsTargets.length-1){ %>,<% } %>
            <% } %>
        ];
    </script>
    <script src="<%= request.getContextPath() %>/static/js/radar.js"></script>
</body>
</html>





// radar.js

const CONFIG = {
    RADAR_WIDTH: 950,
    RADAR_HEIGHT: 480,
    FOV: 100,
    MAX_RANGE: 800,
    MIN_RANGE: 0,
    NUM_CIRCLES: 4,
    TRAIL_LENGTH: 20
};

// Yahan canvas id, class name aapne change kiye hon to woh use karein
const canvas = document.getElementById('sonarRadar'); // Updated ID
const ctx = canvas.getContext('2d');
const cx = canvas.width / 2;
const cy = canvas.height - 28;
const maxR = Math.min(canvas.width * 0.48, canvas.height - 80);

let targets = [];

function deg2rad(d){ return d * Math.PI / 180; }
function rad2deg(r){ return r * 180 / Math.PI; }
function normalizeAngle(a){ a = a % 360; if(a > 180) a -= 360; else if(a < -180) a += 360; return a;}
function toRad(deg){ return (deg - 90) * Math.PI / 180; }

function polar(angle, dist){
    const r = (dist / CONFIG.MAX_RANGE) * maxR;
    const a = toRad(angle);
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function calculateBearing(from, to){
    let lat1 = deg2rad(from[0]), lat2 = deg2rad(to[0]),
        dLon = deg2rad(to[1] - from[1]),
        y = Math.sin(dLon) * Math.cos(lat2),
        x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    return (rad2deg(Math.atan2(y, x)) + 360) % 360;
}

function calculateDistance(from, to){
    const R = 6371000;
    let lat1 = deg2rad(from[0]), lat2 = deg2rad(to[0]),
        dLat = deg2rad(to[0] - from[0]), dLon = deg2rad(to[1] - from[1]),
        a = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function initializeGPSTargets(){
    targets = [];
    gpsTargets.forEach((coord, i) => {
        const bearing = calculateBearing(referencePosition, coord);
        const distance = calculateDistance(referencePosition, coord);
        targets.push({
            id: i + 1,
            name: String.fromCharCode(65 + i),
            angle: bearing <= 180 ? bearing : bearing - 360,
            range: Math.min(distance, CONFIG.MAX_RANGE),
            trail: []
        });
    });
}

function updateTrail(t){
    t.trail.push({ range: t.range, angle: t.angle });
    if(t.trail.length > CONFIG.TRAIL_LENGTH) t.trail.shift();
}

function moveTargets(){ targets.forEach(updateTrail); }
function drawBackground(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const a1 = toRad(-CONFIG.FOV/2), a2 = toRad(CONFIG.FOV/2);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx,cy);
    ctx.arc(cx,cy,maxR,a1,a2,false);
    ctx.closePath();

    const grad = ctx.createRadialGradient(cx,cy,maxR*0.15,cx,cy,maxR);
    grad.addColorStop(0,"rgba(0,70,140,0.94)");
    grad.addColorStop(0.6,"rgba(0,55,110,0.94)");
    grad.addColorStop(1,"rgba(0,35,75,0.94)");

    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle="rgba(255,255,255,0.6)";
    ctx.lineWidth=1.35;
    const step = (CONFIG.MAX_RANGE)/CONFIG.NUM_CIRCLES;

    ctx.fillStyle="#ffe066";
    ctx.font="13px Arial";
    for(let i=1;i<=CONFIG.NUM_CIRCLES;i++){
        const rangeR = step*i;
        const r = (rangeR/CONFIG.MAX_RANGE)*maxR;
        ctx.beginPath();
        ctx.arc(cx,cy,r,a1,a2);
        ctx.stroke();

        let pL = polar(-CONFIG.FOV/2, rangeR);
        let pR = polar(CONFIG.FOV/2, rangeR);
        ctx.fillText(`${Math.round(rangeR)} m`, pL.x-30, pL.y-8);
        ctx.fillText(`${Math.round(rangeR)} m`, pR.x+3, pR.y-8);
    }
}
function drawSonarHead(){
    ctx.beginPath();
    ctx.moveTo(cx,cy);
    ctx.lineTo(cx-10,cy-14);
    ctx.lineTo(cx+10,cy-14);
    ctx.closePath();
    ctx.fillStyle="#fff";
    ctx.fill();
}
function drawTargets(){
    targets.forEach(t=>{
        t.trail.forEach((pos, i)=>{
            let p=polar(pos.angle,pos.range);
            ctx.beginPath();
            ctx.shadowColor="rgba(0,255,128,0.7)";
            ctx.shadowBlur=15;
            ctx.arc(p.x,p.y,6+i/5,0,2*Math.PI);
            ctx.fillStyle=`rgba(0,255,128,${0.05+i*0.02})`;
            ctx.fill();
            ctx.shadowBlur=0;
        });

        let p=polar(t.angle,t.range);
        ctx.beginPath();
        ctx.arc(p.x,p.y,11,0,2*Math.PI);
        ctx.fillStyle="rgba(180,220,255,0.29)";
        ctx.fill();
        ctx.strokeStyle="rgba(180,220,255,0.5)";
        ctx.stroke();

        ctx.font="12px monospace";
        ctx.fillStyle="rgba(180,220,255,0.7)";
        ctx.fillText(t.name, p.x+15, p.y+12);
    });
}
function drawInfoPanel(){
    const visible = targets.filter(t=>{
        const a = normalizeAngle(t.angle);
        return a >= -CONFIG.FOV/2 && a <= CONFIG.FOV/2;
    });
    ctx.fillStyle="rgba(20,45,75,0.92)";
    ctx.fillRect(canvas.width-222,24,200,60+visible.length*22);
    ctx.fillStyle="#ffec88";
    ctx.font="16px Arial";
    ctx.fillText("SONAR INFO", canvas.width-214, 50);

    ctx.font="14px monospace";
    ctx.fillStyle="#a8d8ff";
    let y=70;
    if(visible.length===0){
        ctx.fillText("No targets visible", canvas.width-214, y);
    } else {
        visible.forEach(t=>{
            ctx.fillText(`${t.name}  ${Math.round(t.range)}m  ${t.angle.toFixed(1)}°`,
                canvas.width-214, y);
            y+=22;
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

// JavaScript ka entrypoint
initializeGPSTargets();
animate();




















<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Head contents -->
</head>
<body>
    <!-- HTML/JSP/JavaScript contents -->
</body>
</html>
