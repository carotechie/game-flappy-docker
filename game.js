'use strict';

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
const W = canvas.width;   // 480
const H = canvas.height;  // 640

// ─── Audio ───────────────────────────────────────────────────────────────────
let audioCtx = null;
function audio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
}
function tone(freq, dur, type = 'sine', vol = 0.25) {
    try {
        const ac = audio(), osc = ac.createOscillator(), g = ac.createGain();
        osc.connect(g); g.connect(ac.destination);
        osc.type = type; osc.frequency.value = freq;
        g.gain.setValueAtTime(vol, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
        osc.start(ac.currentTime); osc.stop(ac.currentTime + dur);
    } catch (_) {}
}
const sfxJump  = () => { tone(380, 0.08, 'square', 0.12); tone(560, 0.07, 'square', 0.08); };
const sfxScore = () => { tone(840, 0.09, 'sine', 0.18);   tone(1080, 0.13, 'sine', 0.13); };
const sfxDeath = () => { tone(220, 0.09, 'sawtooth', 0.28); tone(110, 0.28, 'sawtooth', 0.28); };

// ─── Constants ────────────────────────────────────────────────────────────────
const GRAVITY       = 0.22;
const JUMP_FORCE    = -7.2;
const PIPE_BASE_SPD = 2.8;
const PIPE_INTERVAL = 108;
const GAP_SIZE      = 240;
const PIPE_W        = 74;
const GROUND_H      = 68;
const CONTAINER_H   = 46;
const C_COLORS = ['#E74C3C','#27AE60','#2980B9','#E67E22','#8E44AD','#1ABC9C','#E91E63','#F39C12'];

// ─── State ────────────────────────────────────────────────────────────────────
let state      = 'start';   // 'start' | 'playing' | 'gameover'
let score      = 0;
let bestScore  = parseInt(localStorage.getItem('flappyDockerBest') || '0');
let frame      = 0;
let pipes      = [];
let particles  = [];
let bubbles    = [];
let bgBubbles  = [];
let demoPipes  = [];
let shake        = 0;
let scoreFlash   = 0;
let startOverBtn = { x: 0, y: 0, w: 0, h: 0 };
let mouseX = 0, mouseY = 0;

// ─── Rounded rectangle helper ────────────────────────────────────────────────
function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function shadeColor(hex, pct) {
    const n = parseInt(hex.replace('#',''), 16);
    const clamp = v => Math.max(0, Math.min(255, v));
    const r = clamp((n >> 16) + pct);
    const g = clamp(((n >> 8) & 0xff) + pct);
    const b = clamp((n & 0xff) + pct);
    return '#' + ((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);
}

// ─── Whale ────────────────────────────────────────────────────────────────────
const whale = {
    x: 88, y: H/2 - 26, vy: 0,
    w: 74,  h: 54,
    rot: 0,

    reset() { this.y = H/2 - 26; this.vy = 0; this.rot = 0; },

    jump() {
        this.vy = JUMP_FORCE;
        spawnBubbles(this.x + this.w/2, this.y + this.h/2, 6);
        sfxJump();
    },

    hitbox() {
        const m = 10;
        return { x: this.x+m, y: this.y+m, w: this.w-m*2, h: this.h-m*2 };
    },

    update() {
        this.vy += GRAVITY;
        this.y  += this.vy;
        this.rot = Math.max(-0.48, Math.min(1.15, this.vy * 0.079));

        if (state === 'start') {
            // Auto-pilot: jump whenever the whale dips below 60% of the play area
            if (this.y + this.h > H * 0.62) {
                this.vy = JUMP_FORCE;
                spawnBubbles(this.x + this.w/2, this.y + this.h/2, 3);
            }
            if (this.y < 20) { this.y = 20; this.vy = 1; }
            return;
        }
        if (this.y + this.h >= H - GROUND_H) { this.y = H - GROUND_H - this.h; endGame(); }
        if (this.y <= 0)                     { this.y = 0; this.vy = 1.5; }
    },

    draw() {
        ctx.save();
        ctx.translate(this.x + this.w/2, this.y + this.h/2);
        ctx.rotate(this.rot);
        const hw = this.w/2, hh = this.h/2;

        // ── Shadow ──
        ctx.save();
        ctx.fillStyle = 'rgba(0,15,40,0.28)';
        ctx.beginPath();
        ctx.ellipse(2, hh + 4, hw * 0.85, 7, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();

        // ── Tail ──
        ctx.fillStyle = '#C4D7E8';
        ctx.beginPath();
        ctx.moveTo(-hw + 8, -2);
        ctx.bezierCurveTo(-hw - 4, -22, -hw - 24, -14, -hw - 18, 0);
        ctx.bezierCurveTo(-hw - 24, 14, -hw - 4, 22, -hw + 8, 5);
        ctx.closePath();
        ctx.fill();

        // ── Body ──
        ctx.shadowColor = 'rgba(36,150,237,0.35)';
        ctx.shadowBlur  = 14;
        const bg = ctx.createRadialGradient(-hw*0.22, -hh*0.28, 4, 0, 0, hw*1.1);
        bg.addColorStop(0,   '#FFFFFF');
        bg.addColorStop(0.55,'#E5F3FC');
        bg.addColorStop(1,   '#B5D5EE');
        ctx.fillStyle = bg;
        ctx.beginPath();
        ctx.ellipse(0, 0, hw, hh, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // ── Belly ──
        ctx.fillStyle = 'rgba(255,255,255,0.48)';
        ctx.beginPath();
        ctx.ellipse(hw*0.14, hh*0.34, hw*0.52, hh*0.4, -0.14, 0, Math.PI);
        ctx.fill();

        // ── Pectoral fin ──
        ctx.fillStyle = '#B6CCE0';
        ctx.beginPath();
        ctx.ellipse(hw*0.06, hh*0.65, 14, 7, 0.42, 0, Math.PI*2);
        ctx.fill();

        // ── Eye ──
        ctx.fillStyle = '#0A2540';
        ctx.beginPath(); ctx.arc(hw*0.44, -hh*0.18, 6, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(hw*0.44+2, -hh*0.18-2, 2.5, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#0A2540';
        ctx.beginPath(); ctx.arc(hw*0.44+1.5, -hh*0.18-1.5, 1, 0, Math.PI*2); ctx.fill();

        // ── Smile ──
        ctx.strokeStyle = '#0A2540'; ctx.lineWidth = 2; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(hw*0.34, hh*0.14, 11, 0.12, Math.PI-0.12);
        ctx.stroke();

        // ── Blowhole ──
        ctx.fillStyle = '#88C4E4';
        ctx.beginPath(); ctx.ellipse(hw*0.1, -hh+6, 7, 4, 0, 0, Math.PI*2); ctx.fill();
        if (frame % 32 < 16) {
            ctx.strokeStyle = 'rgba(180,225,255,0.55)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(hw*0.1, -hh+2);
            ctx.bezierCurveTo(hw*0.1-5, -hh-6, hw*0.1+5, -hh-13, hw*0.1, -hh-19);
            ctx.stroke();
        }

        // ── Docker containers on back ──
        drawBackContainers(hw, hh);

        ctx.restore();
    }
};

function drawBackContainers(hw, hh) {
    const cW = 15, cH = 9, gap = 2;
    const bx = -hw * 0.18, by = -hh * 0.55;
    const blue  = '#2496ED', dark = '#384D54', light = '#0DB7ED';

    function miniContainer(x, y, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, cW, cH);
        ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = 0.8;
        ctx.strokeRect(x, y, cW, cH);
        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        ctx.fillRect(x+1, y+1, cW-2, 2);
        ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(x+cW/2, y+1); ctx.lineTo(x+cW/2, y+cH-1); ctx.stroke();
    }

    // row 1 – 3 containers
    const r1y = by;
    [[-cW*1.5-gap, blue], [-cW/2, dark], [cW/2+gap, blue]].forEach(([ox, c]) => miniContainer(bx+ox, r1y, c));
    // row 2 – 2 containers
    const r2y = r1y - cH - gap;
    [[-cW-gap/2, light], [gap/2, blue]].forEach(([ox, c]) => miniContainer(bx+ox, r2y, c));
    // row 3 – 1 container
    miniContainer(bx - cW/2, r2y - cH - gap, light);
}

// ─── Pipes / Containers ───────────────────────────────────────────────────────
function pipeSpeed() { return PIPE_BASE_SPD + Math.floor(score / 5) * 0.5; }

function spawnPipe() {
    const minY = 80, maxY = H - GROUND_H - GAP_SIZE - 80;
    pipes.push({
        x: W + 10,
        gapY:    minY + Math.random() * (maxY - minY),
        scored:  false,
        colorIdx: Math.floor(Math.random() * C_COLORS.length)
    });
}

function drawSingleContainer(x, y, w, h, ci) {
    const col  = C_COLORS[ci % C_COLORS.length];
    const dark = shadeColor(col, -32);
    const lite = shadeColor(col, 30);

    ctx.fillStyle = col;   ctx.fillRect(x, y, w, h);
    ctx.fillStyle = lite;  ctx.fillRect(x, y, w, 4);
    ctx.fillStyle = dark;  ctx.fillRect(x, y+h-3, w, 3);
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x+w-5, y, 5, h);

    // horizontal ribs
    ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1;
    for (let ry = y+12; ry < y+h-4; ry += 14) {
        ctx.beginPath(); ctx.moveTo(x+2, ry); ctx.lineTo(x+w-7, ry); ctx.stroke();
    }
    // door divider
    ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x+w/2, y+3); ctx.lineTo(x+w/2, y+h-3); ctx.stroke();
    // handles
    if (h > 22) {
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        ctx.fillRect(x+w/2-7, y+h/2-3, 5, 6);
        ctx.fillRect(x+w/2+2,  y+h/2-3, 5, 6);
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.38)'; ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, w, h);
}

function drawPipe(p) {
    const topH   = p.gapY;
    const botY   = p.gapY + GAP_SIZE;
    const botH   = H - GROUND_H - botY;
    const capCol = shadeColor(C_COLORS[p.colorIdx], -42);

    // ── top stack ──
    let rem = topH, dy = 0, ci = p.colorIdx;
    while (rem > 0) {
        const h = Math.min(CONTAINER_H, rem);
        drawSingleContainer(p.x, dy, PIPE_W, h, ci);
        dy += h; rem -= h; ci = (ci+1) % C_COLORS.length;
    }
    // top cap
    ctx.fillStyle = capCol;
    ctx.fillRect(p.x - 5, p.gapY - 13, PIPE_W + 10, 13);
    ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1.5;
    ctx.strokeRect(p.x - 5, p.gapY - 13, PIPE_W + 10, 13);

    // ── bottom stack ──
    rem = botH; dy = botY; ci = (p.colorIdx + 3) % C_COLORS.length;
    while (rem > 0) {
        const h = Math.min(CONTAINER_H, rem);
        drawSingleContainer(p.x, dy, PIPE_W, h, ci);
        dy += h; rem -= h; ci = (ci+1) % C_COLORS.length;
    }
    // bottom cap
    ctx.fillStyle = capCol;
    ctx.fillRect(p.x - 5, botY, PIPE_W + 10, 13);
    ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1.5;
    ctx.strokeRect(p.x - 5, botY, PIPE_W + 10, 13);
}

// ─── Demo pipes (start screen autopilot) ─────────────────────────────────────
function spawnDemoPipe() {
    const minY = 100, maxY = H - GROUND_H - GAP_SIZE - 100;
    demoPipes.push({
        x: W + 10,
        gapY: minY + Math.random() * (maxY - minY),
        colorIdx: Math.floor(Math.random() * C_COLORS.length)
    });
}

function tickDemoPipes() {
    if (frame % 115 === 30) spawnDemoPipe();
    demoPipes = demoPipes.filter(p => p.x + PIPE_W + 10 > 0);
    demoPipes.forEach(p => { p.x -= 2.4; drawPipe(p); });
}

// ─── Particles & Bubbles ─────────────────────────────────────────────────────
function spawnBubbles(x, y, n = 8) {
    for (let i = 0; i < n; i++) {
        bubbles.push({
            x: x + (Math.random()-.5)*22, y: y + (Math.random()-.5)*22,
            r: 2 + Math.random()*5,
            vx: (Math.random()-.5)*1.4, vy: -1-Math.random()*2,
            alpha: 0.75, life: 55+Math.random()*35
        });
    }
}

function spawnScoreParticles(x, y) {
    for (let i = 0; i < 18; i++) {
        const a = (Math.PI*2/18)*i + Math.random()*0.25;
        const s = 3 + Math.random()*5;
        particles.push({
            x, y,
            vx: Math.cos(a)*s, vy: Math.sin(a)*s,
            r: 4 + Math.random()*6,
            color: C_COLORS[Math.floor(Math.random()*C_COLORS.length)],
            alpha: 1, life: 38 + Math.random()*20
        });
    }
}

function tickBubbles() {
    bubbles = bubbles.filter(b => {
        b.x += b.vx; b.y += b.vy;
        b.alpha -= 1/b.life; b.r += 0.04;
        if (b.alpha <= 0) return false;
        ctx.save(); ctx.globalAlpha = b.alpha;
        ctx.strokeStyle = 'rgba(140,215,255,0.8)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI*2); ctx.stroke();
        ctx.restore();
        return true;
    });
}

function tickParticles() {
    particles = particles.filter(p => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.18;
        p.alpha -= 1/p.life; p.r *= 0.97;
        if (p.alpha <= 0 || p.r < 0.5) return false;
        ctx.save(); ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill();
        ctx.restore();
        return true;
    });
}

// ─── Background ───────────────────────────────────────────────────────────────
function initBgBubbles() {
    bgBubbles = Array.from({length: 22}, () => ({
        x: Math.random()*W, y: Math.random()*H,
        r: 2 + Math.random()*8,
        spd: 0.18 + Math.random()*0.45,
        alpha: 0.05 + Math.random()*0.11
    }));
}

function drawBackground() {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0,   '#020D1B');
    sky.addColorStop(0.5, '#061C3A');
    sky.addColorStop(1,   '#092D52');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

    // grid
    ctx.strokeStyle = 'rgba(36,150,237,0.04)'; ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    // floating bubbles
    bgBubbles.forEach(b => {
        b.y -= b.spd;
        if (b.y + b.r < 0) { b.y = H + b.r; b.x = Math.random()*W; }
        ctx.save(); ctx.globalAlpha = b.alpha;
        ctx.strokeStyle = '#2496ED'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI*2); ctx.stroke();
        ctx.restore();
    });

    // twinkling stars
    for (let i = 0; i < 28; i++) {
        const sx = (Math.sin(i*137.508)*0.5+0.5)*W;
        const sy = (Math.cos(i*137.508)*0.5+0.5)*(H*0.82);
        const tw = Math.sin(frame*0.046 + i)*0.5 + 0.5;
        ctx.globalAlpha = 0.08 + tw * 0.32;
        ctx.fillStyle   = '#FFFFFF';
        ctx.beginPath(); ctx.arc(sx, sy, 1+tw*0.8, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1;
}

function drawGround() {
    const gy = H - GROUND_H;
    const gg = ctx.createLinearGradient(0, gy, 0, H);
    gg.addColorStop(0,   '#092C50');
    gg.addColorStop(0.3, '#0C3A6E');
    gg.addColorStop(1,   '#061524');
    ctx.fillStyle = gg; ctx.fillRect(0, gy, W, GROUND_H);

    ctx.shadowColor = '#2496ED'; ctx.shadowBlur = 12;
    ctx.fillStyle   = '#2496ED'; ctx.fillRect(0, gy, W, 2);
    ctx.shadowBlur  = 0;

    // circuit traces
    ctx.strokeStyle = 'rgba(36,150,237,0.13)'; ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 30) {
        ctx.beginPath(); ctx.moveTo(x, gy+10); ctx.lineTo(x+14,gy+10); ctx.lineTo(x+14,gy+26); ctx.stroke();
    }
    // dots
    ctx.fillStyle = 'rgba(36,150,237,0.18)';
    for (let x = 14; x < W; x += 30) {
        ctx.beginPath(); ctx.arc(x, gy+26, 2, 0, Math.PI*2); ctx.fill();
    }
}

// ─── Collision ────────────────────────────────────────────────────────────────
function checkCollisions() {
    const h = whale.hitbox();
    for (const p of pipes) {
        const inX = h.x + h.w > p.x + 5 && h.x < p.x + PIPE_W - 5;
        if (inX && (h.y < p.gapY || h.y + h.h > p.gapY + GAP_SIZE)) { endGame(); return; }
    }
}

// ─── Scoring ──────────────────────────────────────────────────────────────────
function checkScoring() {
    for (const p of pipes) {
        if (!p.scored && p.x + PIPE_W < whale.x) {
            p.scored = true; score++; scoreFlash = 16;
            spawnScoreParticles(whale.x + whale.w/2, whale.y);
            sfxScore();
            if (score > bestScore) { bestScore = score; localStorage.setItem('flappyDockerBest', bestScore); }
        }
    }
}

// ─── UI ───────────────────────────────────────────────────────────────────────
function drawHUD() {
    const size  = scoreFlash > 0 ? 54 + scoreFlash : 50;
    const alpha = scoreFlash > 0 ? 1 : 0.92;
    ctx.save();
    ctx.textAlign   = 'center';
    ctx.globalAlpha = alpha;
    ctx.shadowColor = '#2496ED'; ctx.shadowBlur = scoreFlash > 0 ? 22 : 6;
    ctx.fillStyle   = '#FFFFFF'; ctx.font = `bold ${size}px 'Courier New'`;
    ctx.fillText(score, W/2, 82);
    ctx.shadowBlur  = 0;
    ctx.fillStyle   = 'rgba(255,255,255,0.58)'; ctx.font = "bold 14px 'Courier New'";
    ctx.fillText(`MEJOR: ${bestScore}`, W/2, 104);
    ctx.restore();
    if (scoreFlash > 0) scoreFlash--;
}

function drawStartScreen() {
    ctx.textAlign = 'center';
    ctx.shadowColor = '#2496ED'; ctx.shadowBlur = 28;
    ctx.fillStyle   = '#FFFFFF'; ctx.font = "bold 54px 'Courier New'";
    ctx.fillText('FLAPPY', W/2, H/2 - 100);
    ctx.fillStyle   = '#2496ED'; ctx.font = "bold 54px 'Courier New'";
    ctx.fillText('DOCKER', W/2, H/2 - 42);
    ctx.shadowBlur  = 0;

    const pulse = Math.sin(frame * 0.065) * 0.32 + 0.68;
    ctx.globalAlpha = pulse;
    ctx.fillStyle   = 'rgba(255,255,255,0.9)'; ctx.font = "18px 'Courier New'";
    ctx.fillText('Haz clic o presiona ESPACIO', W/2, H/2 + 90);
    ctx.fillText('para iniciar', W/2, H/2 + 114);
    ctx.globalAlpha = 1;

    ctx.fillStyle = 'rgba(130,200,255,0.55)'; ctx.font = "13px 'Courier New'";
    ctx.fillText('Esquiva los contenedores Docker', W/2, H/2 + 152);
    ctx.fillText('con la ballena y consigue puntos', W/2, H/2 + 170);
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.62)'; ctx.fillRect(0, 0, W, H);

    const pW = 340, pH = 270;
    const px = (W-pW)/2, py = (H-pH)/2 - 18;

    ctx.shadowColor = '#E74C3C'; ctx.shadowBlur = 32;
    const pg = ctx.createLinearGradient(px, py, px, py+pH);
    pg.addColorStop(0, 'rgba(18,8,12,0.96)');
    pg.addColorStop(1, 'rgba(28,8,18,0.96)');
    ctx.fillStyle = pg;
    roundRect(px, py, pW, pH, 18); ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = 'rgba(231,76,60,0.58)'; ctx.lineWidth = 2;
    roundRect(px, py, pW, pH, 18); ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#FF6B6B'; ctx.font = "bold 26px 'Courier New'";
    ctx.shadowColor = '#E74C3C'; ctx.shadowBlur = 14;
    ctx.fillText('COLISION DE CONTENEDORES', W/2, py+54);
    ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(255,255,255,0.78)'; ctx.font = "18px 'Courier New'";
    ctx.fillText('Puntuacion', W/2, py+96);
    ctx.fillStyle = '#FFFFFF'; ctx.font = "bold 56px 'Courier New'";
    ctx.shadowColor = '#2496ED'; ctx.shadowBlur = 12;
    ctx.fillText(score, W/2, py+155);
    ctx.shadowBlur = 0;

    if (score > 0 && score >= bestScore) {
        ctx.fillStyle = '#FFD700'; ctx.font = "bold 16px 'Courier New'";
        ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 10;
        ctx.fillText('NUEVO RECORD!', W/2, py+178);
        ctx.shadowBlur = 0;
    } else {
        ctx.fillStyle = 'rgba(140,210,255,0.7)'; ctx.font = "15px 'Courier New'";
        ctx.fillText(`Mejor: ${bestScore}`, W/2, py+178);
    }

    // ── START OVER button ──
    const btnW = 220, btnH = 46;
    const btnX = px + (pW - btnW) / 2;
    const btnY = py + 202;
    startOverBtn = { x: btnX, y: btnY, w: btnW, h: btnH };

    const hovered = mouseX >= btnX && mouseX <= btnX + btnW &&
                    mouseY >= btnY && mouseY <= btnY + btnH;

    const btnGrad = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH);
    if (hovered) {
        btnGrad.addColorStop(0, '#3AAFFF');
        btnGrad.addColorStop(1, '#1A80CC');
    } else {
        btnGrad.addColorStop(0, '#2496ED');
        btnGrad.addColorStop(1, '#1268C0');
    }
    ctx.shadowColor = '#2496ED'; ctx.shadowBlur = hovered ? 20 : 10;
    ctx.fillStyle = btnGrad;
    roundRect(btnX, btnY, btnW, btnH, 10); ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = hovered ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1.5;
    roundRect(btnX, btnY, btnW, btnH, 10); ctx.stroke();

    ctx.fillStyle = '#FFFFFF'; ctx.font = "bold 18px 'Courier New'";
    ctx.textAlign = 'center';
    ctx.fillText('START OVER', btnX + btnW / 2, btnY + 30);

    ctx.globalAlpha = 1;
}

function drawCredit() {
    ctx.save();
    ctx.textAlign    = 'right';
    ctx.globalAlpha  = 0.5;
    ctx.fillStyle    = '#2496ED';
    ctx.font         = "11px 'Courier New'";
    ctx.shadowColor  = '#2496ED';
    ctx.shadowBlur   = 6;
    ctx.fillText('Created by @carotechie', W - 10, H - 10);
    ctx.restore();
}

// ─── Game lifecycle ───────────────────────────────────────────────────────────
function startGame() {
    state = 'playing'; score = 0; frame = 0;
    pipes = []; demoPipes = []; particles = []; bubbles = [];
    shake = 0; scoreFlash = 0;
    whale.reset(); whale.jump();
}

function endGame() {
    if (state !== 'playing') return;
    state = 'gameover'; shake = 22; sfxDeath();
    spawnScoreParticles(whale.x + whale.w/2, whale.y + whale.h/2);
}

// ─── Main loop ────────────────────────────────────────────────────────────────
function loop() {
    frame++;
    let sx = 0, sy = 0;
    if (shake > 0) {
        sx = (Math.random()-.5)*shake; sy = (Math.random()-.5)*shake;
        shake = Math.max(0, shake - 1.6);
    }
    ctx.save(); ctx.translate(sx, sy);

    drawBackground();

    if (state === 'playing') {
        if (frame % PIPE_INTERVAL === 18) spawnPipe();
        const spd = pipeSpeed();
        pipes = pipes.filter(p => p.x + PIPE_W + 10 > 0);
        pipes.forEach(p => { p.x -= spd; drawPipe(p); });
        checkCollisions();
        checkScoring();
    } else if (state === 'start') {
        tickDemoPipes();
    } else if (state === 'gameover') {
        pipes.forEach(drawPipe);
    }

    whale.update();
    tickBubbles();
    tickParticles();
    whale.draw();
    drawGround();

    if (state === 'playing')   drawHUD();
    if (state === 'start')     drawStartScreen();
    if (state === 'gameover')  { drawHUD(); drawGameOver(); }
    drawCredit();

    ctx.restore();
    requestAnimationFrame(loop);
}

// ─── Input ────────────────────────────────────────────────────────────────────
function restartToStart() {
    state = 'start'; particles = []; bubbles = []; demoPipes = []; whale.reset();
}

function hitStartOver(cx, cy) {
    return cx >= startOverBtn.x && cx <= startOverBtn.x + startOverBtn.w &&
           cy >= startOverBtn.y && cy <= startOverBtn.y + startOverBtn.h;
}

function canvasCoords(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (clientX - rect.left) * (W / rect.width),
        y: (clientY - rect.top)  * (H / rect.height)
    };
}

canvas.addEventListener('mousemove', e => {
    const c = canvasCoords(e.clientX, e.clientY);
    mouseX = c.x; mouseY = c.y;
});

canvas.addEventListener('click', e => {
    if (state === 'gameover') {
        const c = canvasCoords(e.clientX, e.clientY);
        if (hitStartOver(c.x, c.y)) restartToStart();
    } else if (state === 'start')   startGame();
    else if (state === 'playing')   whale.jump();
});

canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    if (state === 'gameover') {
        const c = canvasCoords(e.touches[0].clientX, e.touches[0].clientY);
        if (hitStartOver(c.x, c.y)) restartToStart();
    } else if (state === 'start')  startGame();
    else if (state === 'playing')  whale.jump();
}, { passive: false });

document.addEventListener('keydown', e => {
    if (!['Space','ArrowUp','Enter'].includes(e.code)) return;
    e.preventDefault();
    if (state === 'gameover')     restartToStart();
    else if (state === 'start')   startGame();
    else if (state === 'playing') whale.jump();
});

// ─── Init ─────────────────────────────────────────────────────────────────────
initBgBubbles();
whale.vy = JUMP_FORCE * 0.55; // start demo with a gentle upward kick
loop();
