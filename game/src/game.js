// Lantern Row: the game itself — state machine, timer, scoring, markers, HUD,
// mouse + keyboard input. The pictures are drawn by scenes.js; this file owns
// everything around them: what counts as found, what a hint does, what the
// player sees between the panels.
import {
  W, H, PANEL_W, PANEL_H, PANEL_Y, LEFT_X, RIGHT_X,
  TIME_PER_LEVEL, HINTS_PER_LEVEL, HINT_SECONDS, WRONG_TIME_PENALTY,
  POINTS_FIND, POINTS_HINT, POINTS_WRONG, LEVELS, INK, INK_DIM, GOLD, GREEN, RED,
} from './config.js';
import { DIFFERENCES } from './differences.js';
import { drawSceneInto } from './scenes.js';
import { Sound } from './audio.js';
import { Particles } from './particles.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_LEVEL_DONE = 'levelDone';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.sound = new Sound();
    this.particles = new Particles();
    this.state = SCREEN_TITLE;
    this.level = 0;
    this.found = new Set();
    this.score = 0;
    this.combo = 0;
    this.timeLeft = TIME_PER_LEVEL;
    this.hintsLeft = HINTS_PER_LEVEL;
    this.hint = null; // { id, until } — seconds on the game clock
    this.wrong = null; // { x, y, panel, until }
    this.levelScore = 0;
    this.stars = 0;
    this.now = 0;
    this.cursor = { x: W / 2, y: PANEL_Y + PANEL_H / 2, shown: false };
    this.flash = 0; // red edge flash on a wrong click
    this.announce = '';
  }

  get total() {
    return DIFFERENCES[this.level].length;
  }

  get remain() {
    return this.total - this.found.size;
  }

  startLevel(i) {
    this.level = i;
    this.found = new Set();
    this.timeLeft = TIME_PER_LEVEL;
    this.hintsLeft = HINTS_PER_LEVEL;
    this.hint = null;
    this.wrong = null;
    this.levelScore = 0;
    this.combo = 0;
    this.state = SCREEN_PLAY;
    this.announce = `${LEVELS[i].name}: find ${this.total} differences.`;
  }

  startGame() {
    this.score = 0;
    this.startLevel(0);
  }

  toTitle() {
    this.state = SCREEN_TITLE;
    this.announce = 'Lantern Row. Press Enter to play.';
  }

  // A click in canvas pixels. Returns 'found' | 'wrong' | 'ignored'.
  clickAt(x, y) {
    if (this.state !== SCREEN_PLAY) {
      if (this.state === SCREEN_TITLE) { this.sound.click(); this.startGame(); return 'ignored'; }
      if (this.state === SCREEN_LEVEL_DONE) { this.sound.click(); this.nextLevel(); return 'ignored'; }
      if (this.state === SCREEN_OVER || this.state === SCREEN_WIN) { this.sound.click(); this.startGame(); return 'ignored'; }
      return 'ignored';
    }
    this.sound.ensure();
    const panel = this.panelAt(x, y);
    if (!panel) return 'ignored';
    const lx = x - panel.x;
    const ly = y - PANEL_Y;
    for (const d of DIFFERENCES[this.level]) {
      if (this.found.has(d.id)) continue;
      const dx = lx - d.x;
      const dy = ly - d.y;
      if (dx * dx + dy * dy <= (d.r + 8) * (d.r + 8)) {
        this.markFound(d, panel);
        return 'found';
      }
    }
    // A miss: points and time lost, combo broken, red flash where it landed.
    this.combo = 0;
    this.score = Math.max(0, this.score + POINTS_WRONG);
    this.timeLeft = Math.max(0, this.timeLeft - WRONG_TIME_PENALTY);
    this.wrong = { x: lx, y: ly, panel: panel.name, until: this.now + 0.6 };
    this.flash = 0.35;
    this.sound.wrong();
    this.announce = 'Not a difference. Five seconds lost.';
    return 'wrong';
  }

  markFound(d, panel) {
    this.found.add(d.id);
    this.combo += 1;
    const gained = POINTS_FIND + (this.combo - 1) * 10;
    this.score += gained;
    this.levelScore += gained;
    this.sound.find();
    // Sparkles on both panels, at the same spot.
    for (const px of [LEFT_X, RIGHT_X]) {
      this.particles.burst(px + d.x, PANEL_Y + d.y, '#ffe9a8', 14);
      this.particles.ring(px + d.x, PANEL_Y + d.y, GREEN);
    }
    this.announce = `Found: ${d.label}. ${this.remain} remain.`;
    if (this.found.size === this.total) this.completeLevel();
  }

  completeLevel() {
    const bonus = Math.round(this.timeLeft) * 2;
    this.score += bonus;
    this.levelScore += bonus;
    this.stars = this.timeLeft > 60 ? 3 : this.timeLeft > 25 ? 2 : 1;
    this.state = SCREEN_LEVEL_DONE;
    this.sound.win();
    this.announce = `${LEVELS[this.level].name} complete. ${this.stars} stars, ${bonus} time bonus.`;
  }

  nextLevel() {
    if (this.level + 1 < LEVELS.length) this.startLevel(this.level + 1);
    else {
      this.state = SCREEN_WIN;
      this.announce = `You found every difference. Final score ${this.score}.`;
    }
  }

  useHint() {
    if (this.state !== SCREEN_PLAY || this.hintsLeft <= 0) return false;
    const rest = DIFFERENCES[this.level].filter((d) => !this.found.has(d.id));
    if (!rest.length) return false;
    const pick = rest[Math.floor(Math.random() * rest.length)];
    this.hintsLeft -= 1;
    this.score = Math.max(0, this.score + POINTS_HINT);
    this.hint = { id: pick.id, until: this.now + HINT_SECONDS };
    this.sound.hint();
    this.announce = `Hint: look near ${pick.label}.`;
    return true;
  }

  panelAt(x, y) {
    if (y < PANEL_Y || y > PANEL_Y + PANEL_H) return null;
    if (x >= LEFT_X && x <= LEFT_X + PANEL_W) return { name: 'left', x: LEFT_X };
    if (x >= RIGHT_X && x <= RIGHT_X + PANEL_W) return { name: 'right', x: RIGHT_X };
    return null;
  }

  moveCursor(dx, dy) {
    this.cursor.shown = true;
    this.cursor.x = clamp(this.cursor.x + dx, 8, W - 8);
    this.cursor.y = clamp(this.cursor.y + dy, 8, H - 8);
  }

  tick(dt) {
    this.now += dt;
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt);
    this.particles.step(dt);
    if (this.state === SCREEN_PLAY) {
      this.timeLeft -= dt;
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.state = SCREEN_OVER;
        this.sound.wrong();
        this.announce = 'Time is up. Press R to try this level again.';
      }
    }
    if (this.hint && this.now > this.hint.until) this.hint = null;
    if (this.wrong && this.now > this.wrong.until) this.wrong = null;
  }

  // ------------------------------------------------------------ rendering
  render() {
    const ctx = this.ctx;
    const t = this.now;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0d0a18';
    ctx.fillRect(0, 0, W, H);
    this.drawHud(ctx);
    if (this.state === SCREEN_TITLE) {
      this.drawTitle(ctx, t);
      return;
    }
    this.drawPanels(ctx, t);
    this.drawCounter(ctx);
    if (this.state === SCREEN_LEVEL_DONE) this.drawLevelDone(ctx);
    if (this.state === SCREEN_OVER) this.drawOver(ctx, false);
    if (this.state === SCREEN_WIN) this.drawOver(ctx, true);
    if (this.flash > 0) {
      ctx.strokeStyle = `rgba(239, 83, 80, ${this.flash})`;
      ctx.lineWidth = 10;
      ctx.strokeRect(5, 5, W - 10, H - 10);
    }
  }

  drawHud(ctx) {
    ctx.fillStyle = '#17102a';
    ctx.fillRect(0, 0, W, 96);
    ctx.fillStyle = 'rgba(242, 181, 68, 0.25)';
    ctx.fillRect(0, 94, W, 2);
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = GOLD;
    ctx.font = 'bold 30px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText('Lantern Row', 24, 44);
    ctx.fillStyle = INK_DIM;
    ctx.font = '15px Georgia, serif';
    ctx.fillText('SPOT THE DIFFERENCE', 24, 70);
    // Level tabs.
    LEVELS.forEach((lv, i) => {
      const x = 320 + i * 156;
      const active = this.state !== SCREEN_TITLE && i === this.level;
      const done = this.state !== SCREEN_TITLE && i < this.level;
      ctx.fillStyle = active ? '#2c1a4e' : '#1d1436';
      rr(ctx, x, 18, 148, 58, 10);
      ctx.fill();
      ctx.strokeStyle = active ? GOLD : '#3a2a5e';
      ctx.lineWidth = active ? 2 : 1;
      ctx.stroke();
      ctx.fillStyle = done ? GREEN : active ? INK : INK_DIM;
      ctx.font = 'bold 14px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${i + 1}. ${lv.short}`, x + 74, 44);
      ctx.fillStyle = INK_DIM;
      ctx.font = '12px Georgia, serif';
      ctx.fillText(done ? '✓ complete' : active ? `${this.remain} to find` : `${lv.diffs} differences`, x + 74, 64);
    });
    // Score and timer, right side.
    ctx.textAlign = 'right';
    ctx.fillStyle = INK;
    ctx.font = 'bold 26px Georgia, serif';
    ctx.fillText(`Score ${this.score}`, 1256, 42);
    const secs = Math.max(0, Math.ceil(this.timeLeft));
    ctx.fillStyle = secs <= 30 && this.state === SCREEN_PLAY ? RED : INK_DIM;
    ctx.font = 'bold 20px Georgia, serif';
    ctx.fillText(`${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`, 1256, 70);
    // Timer bar.
    const bw = 220;
    ctx.fillStyle = '#2c1a4e';
    rr(ctx, 1256 - bw, 78, bw, 8, 4);
    ctx.fill();
    ctx.fillStyle = secs <= 30 ? RED : GOLD;
    const frac = clamp(this.timeLeft / TIME_PER_LEVEL, 0, 1);
    if (frac > 0) {
      rr(ctx, 1256 - bw, 78, bw * frac, 8, 4);
      ctx.fill();
    }
    // Hints.
    ctx.textAlign = 'left';
    ctx.fillStyle = INK_DIM;
    ctx.font = '15px Georgia, serif';
    ctx.fillText(`Hint (H): ${this.hintsLeft} left`, 800, 44);
    ctx.fillText(this.sound.muted ? 'Sound (M): off' : 'Sound (M): on', 800, 68);
  }

  drawPanels(ctx, t) {
    for (const [name, px] of [['left', LEFT_X], ['right', RIGHT_X]]) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(px, PANEL_Y, PANEL_W, PANEL_H);
      ctx.clip();
      ctx.translate(px, PANEL_Y);
      drawSceneInto(ctx, this.level, name === 'right', t);
      ctx.restore();
      ctx.strokeStyle = '#3a2a5e';
      ctx.lineWidth = 3;
      ctx.strokeRect(px, PANEL_Y, PANEL_W, PANEL_H);
      // Found markers and the hint ring, on both panels at once.
      for (const d of DIFFERENCES[this.level]) {
        if (!this.found.has(d.id)) continue;
        ctx.strokeStyle = GREEN;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(px + d.x, PANEL_Y + d.y, d.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = '#0d5a2a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px + d.x, PANEL_Y + d.y, d.r + 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = GREEN;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(px + d.x - 9, PANEL_Y + d.y);
        ctx.lineTo(px + d.x - 2, PANEL_Y + d.y + 8);
        ctx.lineTo(px + d.x + 11, PANEL_Y + d.y - 8);
        ctx.stroke();
      }
      if (this.hint) {
        const d = DIFFERENCES[this.level].find((x) => x.id === this.hint.id);
        if (d) {
          const pulse = 1 + Math.sin(t * 6) * 0.12;
          ctx.strokeStyle = GOLD;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(px + d.x, PANEL_Y + d.y, d.r * pulse + 6, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = GOLD;
          ctx.font = 'bold 13px Georgia, serif';
          ctx.textAlign = 'center';
          ctx.fillText('HINT', px + d.x, PANEL_Y + d.y - d.r - 10);
        }
      }
      // Wrong-click mark.
      if (this.wrong && this.wrong.panel === name) {
        ctx.strokeStyle = RED;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        const cx = px + this.wrong.x;
        const cy = PANEL_Y + this.wrong.y;
        ctx.beginPath();
        ctx.moveTo(cx - 10, cy - 10); ctx.lineTo(cx + 10, cy + 10);
        ctx.moveTo(cx + 10, cy - 10); ctx.lineTo(cx - 10, cy + 10);
        ctx.stroke();
      }
      // Panel caption.
      ctx.fillStyle = 'rgba(13, 10, 24, 0.75)';
      ctx.fillRect(px + 10, PANEL_Y + PANEL_H - 30, 92, 22);
      ctx.fillStyle = INK_DIM;
      ctx.font = '13px Georgia, serif';
      ctx.textAlign = 'left';
      ctx.fillText(name === 'left' ? 'Picture 1' : 'Picture 2', px + 18, PANEL_Y + PANEL_H - 14);
    }
    this.particles.draw(ctx);
    // Keyboard crosshair.
    if (this.cursor.shown && this.state === SCREEN_PLAY) {
      ctx.strokeStyle = 'rgba(245, 234, 214, 0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.cursor.x, this.cursor.y, 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(this.cursor.x - 20, this.cursor.y); ctx.lineTo(this.cursor.x - 8, this.cursor.y);
      ctx.moveTo(this.cursor.x + 8, this.cursor.y); ctx.lineTo(this.cursor.x + 20, this.cursor.y);
      ctx.moveTo(this.cursor.x, this.cursor.y - 20); ctx.lineTo(this.cursor.x, this.cursor.y - 8);
      ctx.moveTo(this.cursor.x, this.cursor.y + 8); ctx.lineTo(this.cursor.x, this.cursor.y + 20);
      ctx.stroke();
    }
  }

  drawCounter(ctx) {
    const y = 588;
    ctx.textAlign = 'center';
    ctx.fillStyle = INK;
    ctx.font = 'bold 26px Georgia, serif';
    ctx.fillText(`Found ${this.found.size} / ${this.total}  ·  ${this.remain} remain`, W / 2, y);
    // Progress dots.
    DIFFERENCES[this.level].forEach((d, i) => {
      const x = W / 2 - ((this.total - 1) * 18) / 2 + i * 18;
      ctx.fillStyle = this.found.has(d.id) ? GREEN : '#3a2a5e';
      ctx.beginPath();
      ctx.arc(x, y + 24, 6, 0, Math.PI * 2);
      ctx.fill();
      if (this.found.has(d.id)) {
        ctx.strokeStyle = '#0d5a2a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y + 24, 8, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
    ctx.fillStyle = INK_DIM;
    ctx.font = '15px Georgia, serif';
    ctx.fillText('Click a difference in either picture  ·  Arrows move the crosshair, Enter checks  ·  H hint  ·  R restart  ·  M sound', W / 2, 648);
    if (this.combo >= 2) {
      ctx.fillStyle = GOLD;
      ctx.font = 'bold 17px Georgia, serif';
      ctx.fillText(`Combo ×${this.combo} — keep it going!`, W / 2, 676);
    }
    const status = document.getElementById('status');
    if (status && status.textContent !== this.announce) status.textContent = this.announce;
  }

  drawTitle(ctx, t) {
    // A dimmed preview of level 1 behind the title card.
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.rect(LEFT_X, PANEL_Y, PANEL_W, PANEL_H);
    ctx.clip();
    ctx.translate(LEFT_X, PANEL_Y);
    drawSceneInto(ctx, 0, false, t);
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.rect(RIGHT_X, PANEL_Y, PANEL_W, PANEL_H);
    ctx.clip();
    ctx.translate(RIGHT_X, PANEL_Y);
    drawSceneInto(ctx, 0, true, t);
    ctx.restore();
    ctx.fillStyle = 'rgba(13, 10, 24, 0.72)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = GOLD;
    ctx.font = 'bold 64px Georgia, serif';
    ctx.fillText('Lantern Row', W / 2, 210);
    ctx.fillStyle = INK;
    ctx.font = '28px Georgia, serif';
    ctx.fillText('Spot the Difference', W / 2, 258);
    ctx.fillStyle = INK_DIM;
    ctx.font = '18px Georgia, serif';
    ctx.fillText('Two pictures. A handful of tiny changes. Find them all before the lanterns burn down.', W / 2, 300);
    ctx.fillStyle = INK;
    ctx.font = '19px Georgia, serif';
    ctx.fillText('3 scenes  ·  25 differences  ·  150 seconds a scene  ·  3 hints a scene', W / 2, 348);
    ctx.fillText('Click a difference — or move the crosshair with the arrow keys and press Enter.', W / 2, 380);
    ctx.fillStyle = GOLD;
    ctx.font = 'bold 24px Georgia, serif';
    ctx.globalAlpha = this.now % 1.6 < 0.9 ? 1 : 0.35;
    ctx.fillText('Click or press Enter to play', W / 2, 448);
    ctx.globalAlpha = 1;
    ctx.fillStyle = INK_DIM;
    ctx.font = '15px Georgia, serif';
    ctx.fillText('A wrong click costs 5 seconds and 25 points. A hint costs 50 points. Finds build a combo.', W / 2, 500);
  }

  drawLevelDone(ctx) {
    ctx.fillStyle = 'rgba(13, 10, 24, 0.78)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = GREEN;
    ctx.font = 'bold 44px Georgia, serif';
    ctx.fillText(`${LEVELS[this.level].name} complete!`, W / 2, 220);
    ctx.fillStyle = GOLD;
    ctx.font = '44px Georgia, serif';
    ctx.fillText('★'.repeat(this.stars) + '☆'.repeat(3 - this.stars), W / 2, 280);
    ctx.fillStyle = INK;
    ctx.font = '22px Georgia, serif';
    ctx.fillText(`Level score ${this.levelScore}  ·  Total score ${this.score}`, W / 2, 330);
    ctx.fillStyle = INK_DIM;
    ctx.font = '17px Georgia, serif';
    const found = DIFFERENCES[this.level].map((d) => d.label).join('  ·  ');
    wrapText(ctx, `You found: ${found}`, W / 2, 372, 900, 26);
    ctx.fillStyle = GOLD;
    ctx.font = 'bold 22px Georgia, serif';
    ctx.fillText(this.level + 1 < LEVELS.length ? 'Click or press N for the next scene' : 'Click or press N to see your festival', W / 2, 480);
  }

  drawOver(ctx, won) {
    ctx.fillStyle = 'rgba(13, 10, 24, 0.82)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    if (won) {
      ctx.fillStyle = GOLD;
      ctx.font = 'bold 48px Georgia, serif';
      ctx.fillText('Festival Complete!', W / 2, 220);
      ctx.fillStyle = INK;
      ctx.font = '24px Georgia, serif';
      ctx.fillText(`You found all 25 differences across 3 scenes.`, W / 2, 272);
      ctx.fillText(`Final score: ${this.score}`, W / 2, 312);
      ctx.fillStyle = INK_DIM;
      ctx.font = '18px Georgia, serif';
      ctx.fillText('The lanterns stay lit for you. Thanks for playing!', W / 2, 360);
    } else {
      ctx.fillStyle = RED;
      ctx.font = 'bold 48px Georgia, serif';
      ctx.fillText('Time’s up!', W / 2, 220);
      ctx.fillStyle = INK;
      ctx.font = '24px Georgia, serif';
      ctx.fillText(`You found ${this.found.size} of ${this.total} differences in ${LEVELS[this.level].name}.`, W / 2, 272);
      ctx.fillStyle = INK_DIM;
      ctx.font = '18px Georgia, serif';
      ctx.fillText('The differences are still hiding. Try the scene again?', W / 2, 320);
    }
    ctx.fillStyle = GOLD;
    ctx.font = 'bold 22px Georgia, serif';
    ctx.fillText('Click or press R to play again', W / 2, 460);
  }
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx, text, cx, y, maxW, lh) {
  const words = text.split(' ');
  let line = '';
  let yy = y;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, cx, yy);
      line = w;
      yy += lh;
    } else line = test;
  }
  if (line) ctx.fillText(line, cx, yy);
}
