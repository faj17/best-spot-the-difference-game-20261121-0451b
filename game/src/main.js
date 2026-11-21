// Lantern Row — Spot the Difference: boot. One 1280x720 canvas, a requestAnimationFrame
// loop, and the ?shot= staging hook the screenshots use. Served as static files:
// open game/index.html from any static server and play.
import { Game } from './game.js';
import { bindInput } from './input.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const game = new Game(canvas);
bindInput(canvas, game);

// ?shot=start|play|hint|win stages a fixed scene for screenshots; ?seed is
// accepted and ignored (the scenes are seeded already). Any other value —
// or none — opens the title screen.
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  const staged = stageShot(shot, game);
  game.staged = staged;
} else {
  game.toTitle();
}

// The playtest probe: state a headless browser can read back.
window.__game = {
  get state() { return game.state; },
  get level() { return game.level; },
  get found() { return [...game.found]; },
  get remain() { return game.remain; },
  get score() { return game.score; },
  get timeLeft() { return Math.round(game.timeLeft); },
  get hintsLeft() { return game.hintsLeft; },
  game,
};

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  game.tick(dt);
  game.render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
