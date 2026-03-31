/* ============================================
   ANTIGRAVITY SPHERE PARTICLES
   ============================================ */

const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d', { alpha: true });

let width, height;

// Microsoft Colors + White/Gray for depth and match the theme
const colors = ['#F25022', '#7FBA00', '#00A4EF', '#FFB900', '#f5f5f7', '#86868b'];

let particles = [];
// More particles on desktop, fewer on mobile to preserve performance
const isMobile = window.innerWidth <= 768;
const PARTICLE_COUNT = isMobile ? 300 : 800;
let time = 0;

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}

window.addEventListener('resize', resize);
resize();

class Particle {
    constructor() {
        // Random placement inside a spherical shell
        this.r = Math.random() * 350 + 150; 
        this.theta = Math.random() * Math.PI * 2;
        this.phi = Math.acos((Math.random() * 2) - 1);
        
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.length = Math.random() * 20 + 8; // Dash length
        // Unique orbital speed
        this.speed = (Math.random() - 0.5) * 0.003;
        this.thickness = Math.random() * 1.5 + 1;
    }

    update() {
        this.theta += this.speed;
        this.phi += this.speed * 0.5;
    }

    draw() {
        // Spherical coordinates to 3D Cartesian
        const x3d = this.r * Math.sin(this.phi) * Math.cos(this.theta);
        const y3d = this.r * Math.sin(this.phi) * Math.sin(this.theta);
        const z3d = this.r * Math.cos(this.phi);

        // Find tail position by subtracting orbital deltas
        const pastTheta = this.theta - this.speed * this.length;
        const pastPhi = this.phi - (this.speed * 0.5) * this.length;
        const tailX = this.r * Math.sin(pastPhi) * Math.cos(pastTheta);
        const tailY = this.r * Math.sin(pastPhi) * Math.sin(pastTheta);
        const tailZ = this.r * Math.cos(pastPhi);

        // Global slow rotation of the entire sphere
        const rotY = time * 0.0015;
        const rotX = time * 0.0008;

        // Apply 3D rotation around X and Y axes
        const rotate3D = (x, y, z) => {
            // Rotate around X
            let y1 = y * Math.cos(rotX) - z * Math.sin(rotX);
            let z1 = y * Math.sin(rotX) + z * Math.cos(rotX);
            // Rotate around Y
            let x2 = x * Math.cos(rotY) + z1 * Math.sin(rotY);
            let z2 = -x * Math.sin(rotY) + z1 * Math.cos(rotY);
            return { x: x2, y: y1, z: z2 };
        };

        const pos = rotate3D(x3d, y3d, z3d);
        const tailPos = rotate3D(tailX, tailY, tailZ);

        // 3D Perspective Projection
        const focalLength = 1100;
        // Move the sphere away from camera
        const zShift = pos.z + 800; 
        const tailZShift = tailPos.z + 800;

        if (zShift < 10) return; // Behind camera

        const scale = focalLength / zShift;
        const tailScale = focalLength / tailZShift;

        const cx = width / 2;
        const cy = height / 2;

        const x2d = pos.x * scale + cx;
        const y2d = pos.y * scale + cy;
        const tx2d = tailPos.x * tailScale + cx;
        const ty2d = tailPos.y * tailScale + cy;

        // Fog/Perspective alpha: Fade objects in the back of the sphere
        // z values generally range from -500 to 500
        const alpha = Math.max(0.02, Math.min(0.85, (pos.z + 500) / 1000));

        ctx.beginPath();
        ctx.moveTo(tx2d, ty2d);
        ctx.lineTo(x2d, y2d);
        ctx.strokeStyle = this.color;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = this.thickness * scale;
        ctx.lineCap = 'round';
        ctx.stroke();
    }
}

// Generate the initial burst of particles
for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(new Particle());
}

function animate() {
    ctx.clearRect(0, 0, width, height);
    
    particles.forEach(p => {
        p.update();
        p.draw();
    });
    
    time++;
    requestAnimationFrame(animate);
}

// Start animation
animate();
