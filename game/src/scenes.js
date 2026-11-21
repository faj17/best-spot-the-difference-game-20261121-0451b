// Lantern Row: the three scenes, drawn procedurally on canvas. Each scene is one
// function that draws the same picture twice — once plain (left panel) and once
// with a Set of difference ids applied (right panel). A seeded RNG makes every
// random detail (stars, sparks, petals) identical in both panels, so only the
// declared differences ever differ. `t` is seconds, for gentle motion; both panels
// share it, so they stay in step.
import { mulberry32, range } from './rng.js';
import { PANEL_W, PANEL_H } from './config.js';
import { DIFFERENCES } from './differences.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
}

function star4(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
}

function sky(ctx, top, mid, bottom, horizon) {
  const g = ctx.createLinearGradient(0, 0, 0, horizon);
  g.addColorStop(0, top);
  g.addColorStop(0.6, mid);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, PANEL_W, horizon);
}

function stars(ctx, rng, n, yMax, bright) {
  for (let i = 0; i < n; i += 1) {
    const x = range(rng, 8, PANEL_W - 8);
    const y = range(rng, 8, yMax);
    const r = range(rng, 0.8, 2.2);
    ctx.globalAlpha = range(rng, 0.4, 1);
    star4(ctx, x, y, r, bright ? '#fff6d8' : '#ffe9a8');
  }
  ctx.globalAlpha = 1;
}

function moon(ctx, x, y, r, craters, halo) {
  if (halo) {
    const g = ctx.createRadialGradient(x, y, r * 0.9, x, y, r * 2.1);
    g.addColorStop(0, 'rgba(255, 240, 190, 0.35)');
    g.addColorStop(1, 'rgba(255, 240, 190, 0)');
    ctx.fillStyle = g;
    circle(ctx, x, y, r * 2.1);
    ctx.fill();
  }
  const g2 = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.2, x, y, r);
  g2.addColorStop(0, '#fff8dc');
  g2.addColorStop(1, '#f0d48a');
  ctx.fillStyle = g2;
  circle(ctx, x, y, r);
  ctx.fill();
  ctx.fillStyle = 'rgba(190, 160, 100, 0.55)';
  for (const [cx, cy, cr] of craters) {
    circle(ctx, x + cx, y + cy, cr);
    ctx.fill();
  }
}

function paperLantern(ctx, x, y, r, color, sway) {
  ctx.save();
  ctx.translate(x + Math.sin(sway) * 2, y);
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(-2, -r - 6, 4, 5);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r * 1.15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(120, 40, 20, 0.7)';
  ctx.lineWidth = 1.5;
  for (let i = -2; i <= 2; i += 1) {
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.92, r * 1.15 - Math.abs(i) * 3, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.35, r * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(-2, r * 1.15 + 1, 4, 5);
  ctx.restore();
}

function cat(ctx, x, y, s, tailUp, color) {
  ctx.fillStyle = color;
  ctx.beginPath(); // body
  ctx.ellipse(x, y, 22 * s, 15 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  circle(ctx, x + 16 * s, y - 14 * s, 11 * s); // head
  ctx.fill();
  ctx.beginPath(); // ears
  ctx.moveTo(x + 8 * s, y - 22 * s);
  ctx.lineTo(x + 11 * s, y - 32 * s);
  ctx.lineTo(x + 15 * s, y - 22 * s);
  ctx.moveTo(x + 18 * s, y - 23 * s);
  ctx.lineTo(x + 22 * s, y - 32 * s);
  ctx.lineTo(x + 25 * s, y - 22 * s);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 5 * s;
  ctx.lineCap = 'round';
  ctx.beginPath(); // tail
  if (tailUp) {
    ctx.moveTo(x - 20 * s, y + 2 * s);
    ctx.quadraticCurveTo(x - 34 * s, y - 6 * s, x - 30 * s, y - 26 * s);
  } else {
    ctx.moveTo(x - 20 * s, y + 2 * s);
    ctx.quadraticCurveTo(x - 34 * s, y + 4 * s, x - 36 * s, y + 14 * s);
  }
  ctx.stroke();
  ctx.fillStyle = '#1c1430';
  circle(ctx, x + 19 * s, y - 16 * s, 1.8 * s);
  ctx.fill();
  circle(ctx, x + 12 * s, y - 16 * s, 1.8 * s);
  ctx.fill();
}

// ---------------------------------------------------------------- level 0
function drawLanternRow(ctx, diffs, t) {
  const rng = mulberry32(101);
  sky(ctx, '#241640', '#5a2d5e', '#e07840', 268);
  stars(ctx, rng, 46, 130, true);
  moon(ctx, 92, 66, 34, [[-10, -6, 5], [8, 8, 4], [12, -12, 3]].concat(diffs.has('moon-crater') ? [[-2, 14, 5]] : []), true);
  if (diffs.has('star-extra')) star4(ctx, 522, 58, 4, '#fff6d8');
  // Distant rooftops.
  ctx.fillStyle = '#1c1030';
  ctx.beginPath();
  ctx.moveTo(0, 268);
  ctx.lineTo(0, 232); ctx.lineTo(70, 232); ctx.lineTo(70, 218); ctx.lineTo(150, 218);
  ctx.lineTo(150, 240); ctx.lineTo(300, 240); ctx.lineTo(300, 224); ctx.lineTo(420, 224);
  ctx.lineTo(420, 244); ctx.lineTo(520, 244); ctx.lineTo(520, 226); ctx.lineTo(600, 226);
  ctx.lineTo(600, 268);
  ctx.closePath();
  ctx.fill();
  // Street.
  ctx.fillStyle = '#4a3428';
  ctx.fillRect(0, 268, PANEL_W, PANEL_H - 268);
  ctx.fillStyle = 'rgba(255, 200, 120, 0.08)';
  for (let y = 280; y < PANEL_H; y += 18) ctx.fillRect(0, y, PANEL_W, 2);
  // Paper-lantern string across the street.
  ctx.strokeStyle = '#2a1a10';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 84);
  ctx.quadraticCurveTo(300, 118, 600, 82);
  ctx.stroke();
  const lanternXs = [52, 122, 192, 252, 302, 362, 432, 502, 552];
  lanternXs.forEach((x, i) => {
    if (diffs.has('lantern-missing') && x === 302) return;
    const y = 84 + Math.sin((x / 600) * Math.PI) * 30;
    paperLantern(ctx, x, y + 12, 13, i % 2 ? '#e8452c' : '#f2a541', t * 0.8 + i);
  });
  // Left stall with a striped awning and a signboard.
  stall(ctx, 60, 170, 180, 150, diffs.has('awning-stripe') ? '#2f8f7a' : '#e8452c', diffs.has('sign-glyph') ? 'TAE' : 'TEA');
  // Right stall, smaller, with a lit window above it.
  stall(ctx, 380, 190, 160, 130, '#3a6fd8', 'HOT');
  ctx.fillStyle = diffs.has('window-lit') ? '#ffd76a' : '#2c2350';
  rr(ctx, 408, 192, 34, 26, 3);
  ctx.fill();
  ctx.strokeStyle = '#1c1030';
  ctx.lineWidth = 2;
  ctx.strokeRect(408, 192, 34, 26);
  ctx.beginPath();
  ctx.moveTo(425, 192); ctx.lineTo(425, 218);
  ctx.moveTo(408, 205); ctx.lineTo(442, 205);
  ctx.stroke();
  // Crates and the cat.
  ctx.fillStyle = '#6b4a2f';
  ctx.fillRect(448, 330, 56, 30);
  ctx.fillRect(458, 312, 40, 20);
  ctx.strokeStyle = '#3a2a1a';
  ctx.lineWidth = 2;
  ctx.strokeRect(448, 330, 56, 30);
  cat(ctx, 482, 312, 1, diffs.has('cat-tail'), '#2b2b33');
  // Potted plant by the left stall.
  ctx.fillStyle = '#b3543a';
  ctx.beginPath();
  ctx.moveTo(30, 360); ctx.lineTo(70, 360); ctx.lineTo(64, 392); ctx.lineTo(36, 392);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#3f7a3a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(50, 360); ctx.quadraticCurveTo(34, 330, 26, 318);
  ctx.moveTo(50, 360); ctx.quadraticCurveTo(52, 326, 48, 310);
  ctx.moveTo(50, 360); ctx.quadraticCurveTo(66, 332, 76, 320);
  ctx.stroke();
}

function stall(ctx, x, y, w, h, stripe, glyph) {
  // Counter and posts.
  ctx.fillStyle = '#7a5230';
  ctx.fillRect(x, y + h - 46, w, 46);
  ctx.fillStyle = '#5a3a20';
  ctx.fillRect(x, y + h - 46, w, 8);
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(x + 4, y + 26, 6, h - 26);
  ctx.fillRect(x + w - 10, y + 26, 6, h - 26);
  // Striped awning.
  const stripes = 6;
  for (let i = 0; i < stripes; i += 1) {
    ctx.fillStyle = i % 2 ? '#f5ead6' : stripe;
    ctx.fillRect(x + (i * w) / stripes, y + 22, w / stripes + 1, 26);
  }
  ctx.fillStyle = '#2a1a10';
  ctx.fillRect(x - 4, y + 16, w + 8, 8);
  // Signboard with one glyph.
  ctx.fillStyle = '#f2b544';
  rr(ctx, x + w / 2 - 34, y - 34, 68, 40, 6);
  ctx.fill();
  ctx.strokeStyle = '#7a3c10';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#7a1e10';
  ctx.font = 'bold 22px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(glyph, x + w / 2, y - 13);
  // Goods on the counter: fruit and jars.
  ctx.fillStyle = '#e8452c';
  circle(ctx, x + 26, y + h - 52, 8); ctx.fill();
  circle(ctx, x + 44, y + h - 52, 8); ctx.fill();
  ctx.fillStyle = '#f2a541';
  circle(ctx, x + 62, y + h - 52, 8); ctx.fill();
  ctx.fillStyle = '#7fb069';
  circle(ctx, x + 80, y + h - 52, 8); ctx.fill();
  ctx.fillStyle = '#d8c49a';
  rr(ctx, x + w - 52, y + h - 66, 22, 20, 3);
  ctx.fill();
  rr(ctx, x + w - 26, y + h - 66, 18, 20, 3);
  ctx.fill();
}

// ---------------------------------------------------------------- level 1
function drawKoiPond(ctx, diffs, t) {
  const rng = mulberry32(202);
  sky(ctx, '#bfe3c0', '#d8ecd2', '#f2e3b6', 150);
  // Cherry tree, top left.
  ctx.fillStyle = '#5a3a28';
  ctx.beginPath();
  ctx.moveTo(58, 150); ctx.quadraticCurveTo(66, 90, 92, 52);
  ctx.quadraticCurveTo(70, 96, 62, 150);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f2a7c3';
  for (let i = 0; i < 26; i += 1) {
    const a = range(rng, 0, Math.PI * 2);
    const d = range(rng, 6, 62);
    circle(ctx, 92 + Math.cos(a) * d, 52 + Math.sin(a) * d * 0.7, range(rng, 7, 13));
    ctx.fill();
  }
  // Pagoda, top right.
  ctx.fillStyle = '#8a3a2a';
  ctx.fillRect(478, 60, 84, 90);
  ctx.fillStyle = '#3a2a3a';
  ctx.beginPath();
  ctx.moveTo(462, 62); ctx.lineTo(520, 26); ctx.lineTo(578, 62);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = diffs.has('pagoda-window') ? '#2c2350' : '#ffd76a';
  rr(ctx, 508, 84, 24, 30, 3);
  ctx.fill();
  // Grass.
  ctx.fillStyle = '#7fb069';
  ctx.fillRect(0, 150, PANEL_W, 70);
  ctx.fillStyle = '#6a9a58';
  for (let i = 0; i < 30; i += 1) {
    const x = range(rng, 0, PANEL_W);
    ctx.fillRect(x, 168 + range(rng, 0, 40), 3, 8);
  }
  // The pond.
  const pond = ctx.createRadialGradient(300, 300, 40, 300, 300, 260);
  pond.addColorStop(0, '#7fc4c9');
  pond.addColorStop(1, '#3a7a8a');
  ctx.fillStyle = pond;
  ctx.beginPath();
  ctx.ellipse(300, 310, 280, 105, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i += 1) {
    ctx.beginPath();
    ctx.ellipse(300, 300, 60 + i * 42, 24 + i * 16, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Lily pads and their flowers.
  lily(ctx, 210, 340, diffs.has('lily-flower'));
  lily(ctx, 400, 350, false);
  lily(ctx, 150, 290, false);
  // Koi.
  koi(ctx, 250, 290, 1, t);
  koi(ctx, 360, 320, -1, t + 2);
  koi(ctx, 180, 330, 1, t + 4);
  if (diffs.has('koi-extra')) koi(ctx, 300, 300, 1, t + 1);
  // Arched bridge across the pond.
  ctx.strokeStyle = '#8a5a30';
  ctx.lineWidth = 16;
  ctx.beginPath();
  ctx.moveTo(190, 236);
  ctx.quadraticCurveTo(300, 150, 410, 236);
  ctx.stroke();
  ctx.strokeStyle = '#a06a3a';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(190, 236);
  ctx.quadraticCurveTo(300, 150, 410, 236);
  ctx.stroke();
  ctx.fillStyle = diffs.has('bridge-plank') ? '#e8d8b0' : '#8a5a30';
  ctx.fillRect(292, 196, 16, 26);
  ctx.strokeStyle = '#5a3a20';
  ctx.lineWidth = 2;
  for (let i = 0; i <= 8; i += 1) {
    const u = i / 8;
    const x = 190 + u * 220;
    const y = 236 - Math.sin(u * Math.PI) * 62;
    ctx.beginPath();
    ctx.moveTo(x, y - 16);
    ctx.lineTo(x, y - 34);
    ctx.stroke();
  }
  // Stone lantern, left bank, and its flame.
  ctx.fillStyle = '#9a9a92';
  ctx.fillRect(80, 262, 16, 40);
  ctx.fillRect(70, 250, 36, 14);
  ctx.beginPath();
  ctx.moveTo(66, 250); ctx.lineTo(88, 232); ctx.lineTo(110, 250);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = diffs.has('lantern-flame') ? '#6aa8ff' : '#ff9a3c';
  circle(ctx, 88, 244, 6 + Math.sin(t * 3) * 1.5);
  ctx.fill();
  // Stepping stones on the right bank.
  ctx.fillStyle = '#b8b0a0';
  const stones = [[440, 356], [470, 350], [500, 358], [530, 350]];
  stones.forEach(([x, y]) => {
    if (diffs.has('stone-missing') && x === 470) return;
    ctx.beginPath();
    ctx.ellipse(x, y, 18, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  // Frog on a lily pad, right side — only in the changed panel.
  if (diffs.has('frog')) {
    ctx.fillStyle = '#58a858';
    circle(ctx, 520, 296, 12);
    ctx.fill();
    circle(ctx, 512, 286, 6); ctx.fill();
    circle(ctx, 528, 286, 6); ctx.fill();
    ctx.fillStyle = '#1c1430';
    circle(ctx, 512, 285, 2); ctx.fill();
    circle(ctx, 528, 285, 2); ctx.fill();
  }
  // A fallen blossom on the grass — only in the changed panel.
  if (diffs.has('blossom-fallen')) {
    ctx.fillStyle = '#f2a7c3';
    for (let i = 0; i < 5; i += 1) {
      circle(ctx, 120 + Math.cos(i * 1.26) * 8, 120 + Math.sin(i * 1.26) * 8, 5);
      ctx.fill();
    }
  }
}

function lily(ctx, x, y, blooming) {
  ctx.fillStyle = '#4a8a4a';
  ctx.beginPath();
  ctx.ellipse(x, y, 34, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  if (blooming) {
    ctx.fillStyle = '#f2a7c3';
    for (let i = 0; i < 6; i += 1) {
      const a = (i / 6) * Math.PI * 2;
      circle(ctx, x + Math.cos(a) * 9, y - 4 + Math.sin(a) * 5, 6);
      ctx.fill();
    }
    ctx.fillStyle = '#ffd76a';
    circle(ctx, x, y - 4, 4);
    ctx.fill();
  } else {
    ctx.fillStyle = '#7fb069';
    circle(ctx, x + 8, y - 6, 5);
    ctx.fill();
  }
}

function koi(ctx, x, y, dir, t) {
  const wob = Math.sin(t * 2 + x) * 3;
  ctx.save();
  ctx.translate(x, y + wob);
  ctx.scale(dir, 1);
  ctx.fillStyle = '#f28c38';
  ctx.beginPath();
  ctx.ellipse(0, 0, 22, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff5e0';
  ctx.beginPath();
  ctx.ellipse(-6, -2, 10, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f28c38';
  ctx.beginPath();
  ctx.moveTo(-20, 0);
  ctx.lineTo(-32, -8);
  ctx.lineTo(-32, 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#1c1430';
  circle(ctx, 12, -3, 2);
  ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------------- level 2
function drawMoonFestival(ctx, diffs, t) {
  const rng = mulberry32(303);
  sky(ctx, '#120e2a', '#2c1a4e', '#7a3a5e', 300);
  stars(ctx, rng, 60, 180, true);
  moon(ctx, 300, 70, 40, [[-12, -8, 6], [10, 10, 5]], !diffs.has('moon-halo'));
  if (diffs.has('shooting-star')) {
    ctx.strokeStyle = 'rgba(255, 246, 216, 0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60, 60);
    ctx.lineTo(96, 84);
    ctx.stroke();
    star4(ctx, 96, 84, 3, '#fff6d8');
  }
  if (diffs.has('firework')) {
    for (let i = 0; i < 12; i += 1) {
      const a = (i / 12) * Math.PI * 2 + t * 0.2;
      ctx.strokeStyle = i % 2 ? '#ffd76a' : '#ff7a9a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(480, 80);
      ctx.lineTo(480 + Math.cos(a) * 26, 80 + Math.sin(a) * 26);
      ctx.stroke();
    }
    star4(ctx, 480, 80, 4, '#fff6d8');
  }
  // Kite with a tail.
  ctx.strokeStyle = '#f2b544';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(210, 90);
  ctx.lineTo(150, 200);
  ctx.stroke();
  ctx.fillStyle = '#e8452c';
  ctx.beginPath();
  ctx.moveTo(210, 66); ctx.lineTo(232, 92); ctx.lineTo(210, 116); ctx.lineTo(188, 92);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#f2a7c3';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(210, 116);
  const tailLen = diffs.has('kite-tail') ? 66 : 26;
  ctx.quadraticCurveTo(218, 116 + tailLen / 2, 210, 116 + tailLen);
  ctx.stroke();
  // Rooftops.
  ctx.fillStyle = '#1c1030';
  ctx.beginPath();
  ctx.moveTo(0, 430);
  ctx.lineTo(0, 300); ctx.lineTo(140, 300); ctx.lineTo(140, 268); ctx.lineTo(300, 268);
  ctx.lineTo(300, 300); ctx.lineTo(460, 300); ctx.lineTo(460, 276); ctx.lineTo(600, 276);
  ctx.lineTo(600, 430);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#2c1a4e';
  ctx.fillRect(0, 296, 600, 6);
  // Festival flag string.
  ctx.strokeStyle = '#3a2a1a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(40, 108);
  ctx.quadraticCurveTo(300, 150, 560, 104);
  ctx.stroke();
  const flagCols = ['#e8452c', '#f2b544', '#58d68d', '#3a6fd8', '#f2a7c3'];
  for (let i = 0; i < 9; i += 1) {
    const x = 70 + i * 58;
    const y = 108 + Math.sin((x / 600) * Math.PI) * 34;
    ctx.fillStyle = diffs.has('flag-color') && i === 1 ? '#2f8f3a' : flagCols[i % flagCols.length];
    ctx.beginPath();
    ctx.moveTo(x - 12, y);
    ctx.lineTo(x + 12, y);
    ctx.lineTo(x, y + 22);
    ctx.closePath();
    ctx.fill();
  }
  // Windows on the rooftops; one shutter closes in the changed panel.
  ctx.fillStyle = '#ffd76a';
  rr(ctx, 60, 316, 30, 26, 3); ctx.fill();
  rr(ctx, 360, 312, 30, 26, 3); ctx.fill();
  ctx.fillStyle = diffs.has('window-shutter') ? '#3a2a1a' : '#ffd76a';
  rr(ctx, 166, 226, 28, 24, 3); ctx.fill();
  ctx.strokeStyle = '#1c1030';
  ctx.lineWidth = 2;
  ctx.strokeRect(166, 226, 28, 24);
  // Chimney with smoke — smoke missing in the changed panel.
  ctx.fillStyle = '#3a2a3a';
  ctx.fillRect(524, 116, 30, 60);
  if (!diffs.has('chimney-smoke')) {
    ctx.fillStyle = 'rgba(220, 220, 230, 0.5)';
    circle(ctx, 539, 104, 8 + Math.sin(t) * 2); ctx.fill();
    circle(ctx, 548, 88, 11); ctx.fill();
    circle(ctx, 556, 70, 14); ctx.fill();
  }
  // The cat on the middle roof — only in the changed panel.
  if (diffs.has('cat-roof')) cat(ctx, 420, 268, 0.9, true, '#101018');
  // Mooncake table on the terrace.
  ctx.fillStyle = '#7a5230';
  ctx.fillRect(230, 330, 140, 10);
  ctx.fillRect(240, 340, 10, 40);
  ctx.fillRect(350, 340, 10, 40);
  ctx.fillStyle = '#d8a04a';
  const cakes = [[258, 322], [282, 322], [306, 322], [330, 322]];
  cakes.forEach(([x, y]) => {
    if (diffs.has('mooncake') && x === 306) return;
    ctx.beginPath();
    ctx.ellipse(x, y, 12, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8a5a20';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(x, y, 7, 4, 0, 0, Math.PI * 2);
    ctx.stroke();
  });
  // A ground lantern, tipped over in the changed panel.
  if (diffs.has('lantern-ground')) {
    ctx.save();
    ctx.translate(360, 382);
    ctx.rotate(Math.PI / 2.4);
    paperLantern(ctx, 0, 0, 13, '#e8452c', t);
    ctx.restore();
  } else {
    paperLantern(ctx, 360, 372, 13, '#e8452c', t);
  }
}

// Draw one panel: `variant` true draws the right panel with every difference
// of the level applied; false draws the original. The caller clips to the panel
// and translates to its origin first.
export function drawSceneInto(ctx, level, variant, t) {
  const diffs = new Set(variant ? DIFFERENCES[level].map((d) => d.id) : []);
  if (level === 0) drawLanternRow(ctx, diffs, t);
  else if (level === 1) drawKoiPond(ctx, diffs, t);
  else drawMoonFestival(ctx, diffs, t);
}
