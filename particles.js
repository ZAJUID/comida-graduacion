/* ============================================
   ANTIGRAVITY PARTICLES (PERFECT REPLICA)
   ============================================ */

const canvas = document.getElementById('particle-canvas');
if (canvas) {
const ctx = canvas.getContext('2d', { alpha: true });

let width, height;
// Colores de Google/Microsoft originales de Antigravity
let colors = ['#F25022', '#7FBA00', '#00A4EF', '#FFB900', '#BF5AF2'];

// Si estamos en la página de Ubicación (Tema Oaxaqueño), usamos colores cálidos vibrantes
if (document.body.classList.contains('theme-oaxaca')) {
    colors = ['#E83E8C', '#FFAA00', '#FFD700', '#E23D75', '#FF7F50']; 
}

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}
window.addEventListener('resize', resize);
resize();

let particles = [];
const isMobile = window.innerWidth <= 768;
const numParticles = isMobile ? 350 : 800;
const sphereRadius = isMobile ? 200 : 380; // Adaptive size

// Fibonacci Sphere distribution
for (let i = 0; i < numParticles; i++) {
    const phi = Math.acos(1 - 2 * (i + 0.5) / numParticles);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    
    // Normal vector pointing straight out
    const nx = Math.sin(phi) * Math.cos(theta);
    const ny = Math.sin(phi) * Math.sin(theta);
    const nz = Math.cos(phi);
    
    particles.push({
        nx: nx,
        ny: ny,
        nz: nz,
        color: colors[Math.floor(Math.random() * colors.length)],
        dashLength: Math.random() * 10 + 6, // Longitud de la gotita
        thickness: Math.random() * 2 + 1.5
    });
}

let time = 0;

function animate() {
    ctx.clearRect(0, 0, width, height);

    // Rotación lenta, continua y tridimensional
    const rotY = time * 0.0015;
    const rotX = time * 0.0008;
    const rotZ = time * 0.0004;

    const cx = width / 2;
    const cy = height / 2;
    // Perspective offset
    const focalLength = 1000;

    const rotate3D = (x, y, z) => {
        let x1 = x * Math.cos(rotZ) - y * Math.sin(rotZ);
        let y1 = x * Math.sin(rotZ) + y * Math.cos(rotZ);
        let z1 = z;
        
        let y2 = y1 * Math.cos(rotX) - z1 * Math.sin(rotX);
        let z2 = y1 * Math.sin(rotX) + z1 * Math.cos(rotX);
        
        let x3 = x1 * Math.cos(rotY) + z2 * Math.sin(rotY);
        let z3 = -x1 * Math.sin(rotY) + z2 * Math.cos(rotY);
        return { x: x3, y: y2, z: z3 };
    };

    particles.forEach(p => {
        // Rotar el vector normal (dirección del punto)
        const n = rotate3D(p.nx, p.ny, p.nz);
        
        const surfaceX = n.x * sphereRadius;
        const surfaceY = n.y * sphereRadius;
        const surfaceZ = n.z * sphereRadius;
        
        // Puntos apuntando directamente afuera de la superficie
        const endX = n.x * (sphereRadius + p.dashLength);
        const endY = n.y * (sphereRadius + p.dashLength);
        const endZ = n.z * (sphereRadius + p.dashLength);

        const zShift1 = surfaceZ + 800;
        if (zShift1 < 10) return;
        const scale1 = focalLength / zShift1;
        
        const zShift2 = endZ + 800;
        if (zShift2 < 10) return;
        const scale2 = focalLength / zShift2;

        const x2d1 = surfaceX * scale1 + cx;
        const y2d1 = surfaceY * scale1 + cy;
        const x2d2 = endX * scale2 + cx;
        const y2d2 = endY * scale2 + cy;

        // Efecto de profundidad: Más transparente si está en la parte trasera de la esfera
        let alpha = (n.z + 1) / 2;
        alpha = Math.max(0.08, Math.min(1, Math.pow(alpha, 1.5) * 1.5));

        ctx.beginPath();
        ctx.moveTo(x2d1, y2d1);
        ctx.lineTo(x2d2, y2d2);
        ctx.strokeStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = p.thickness * scale1;
        ctx.lineCap = 'round';
        ctx.stroke();
    });

    time++;
    requestAnimationFrame(animate);
}

animate();
}
