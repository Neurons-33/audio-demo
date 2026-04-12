import { dom } from './dom.js';

let particles = [];
let ctx = null;

class Particle {
    constructor(canvas) {
        this.canvas = canvas;
        this.reset();
    }

    reset() {
        this.x = Math.random() * this.canvas.width;
        this.y = Math.random() * this.canvas.height;
        this.size = Math.random() * 3.5 + 0.8;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() - 0.5) * 0.4 - 0.15;
        this.opacity = Math.random() * 0.7 + 0.2;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.y < -10 || this.x < -10 || this.x > this.canvas.width + 10) {
            this.reset();
            this.y = this.canvas.height + 10;
        }
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(240, 255, 250, ${this.opacity})`;
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        ctx.fill();
    }
}

function initCanvas() {
    dom.canvas.width = window.innerWidth;
    dom.canvas.height = window.innerHeight;
}

function animateBg() {
    ctx.clearRect(0, 0, dom.canvas.width, dom.canvas.height);
    particles.forEach((p) => {
        p.update();
        p.draw(ctx);
    });
    requestAnimationFrame(animateBg);
}

export function initBackground() {
    ctx = dom.canvas.getContext('2d');
    initCanvas();

    particles = [];
    for (let i = 0; i < 50; i++) {
        particles.push(new Particle(dom.canvas));
    }

    animateBg();

    window.addEventListener('resize', initCanvas);

    window.addEventListener('mousemove', (e) => {
        const x = (e.clientX - window.innerWidth / 2) / 60;
        const y = (e.clientY - window.innerHeight / 2) / 60;
        document.documentElement.style.setProperty('--parallax-x', `${-x}px`);
        document.documentElement.style.setProperty('--parallax-y', `${-y}px`);
    });
}