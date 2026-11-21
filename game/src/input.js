// Lantern Row: mouse + keyboard input. Mouse clicks map client pixels to canvas
// pixels; arrow keys move a crosshair and Enter/Space checks the spot under it.
// H hints, M mutes, R restarts the level, N advances, Esc goes to the title.
import { W, H, PANEL_Y, PANEL_H, LEFT_X, RIGHT_X, PANEL_W } from './config.js';
import { SCREEN_PLAY, SCREEN_TITLE } from './game.js';

function toCanvas(canvas, clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((clientX - r.left) / r.width) * W,
    y: ((clientY - r.top) / r.height) * H,
  };
}

export function bindInput(canvas, game) {
  canvas.addEventListener('click', (e) => {
    const p = toCanvas(canvas, e.clientX, e.clientY);
    game.clickAt(p.x, p.y);
  });

  canvas.addEventListener('mousemove', (e) => {
    const p = toCanvas(canvas, e.clientX, e.clientY);
    game.cursor.x = p.x;
    game.cursor.y = p.y;
  });

  window.addEventListener('keydown', (e) => {
    const step = e.shiftKey ? 60 : 24;
    switch (e.key) {
      case 'ArrowLeft': game.moveCursor(-step, 0); e.preventDefault(); break;
      case 'ArrowRight': game.moveCursor(step, 0); e.preventDefault(); break;
      case 'ArrowUp': game.moveCursor(0, -step); e.preventDefault(); break;
      case 'ArrowDown': game.moveCursor(0, step); e.preventDefault(); break;
      case 'Enter':
      case ' ': {
        e.preventDefault();
        game.sound.ensure();
        if (game.state === SCREEN_PLAY) {
          game.cursor.shown = true;
          game.clickAt(game.cursor.x, game.cursor.y);
        } else {
          game.clickAt(game.cursor.x, game.cursor.y);
        }
        break;
      }
      case 'h':
      case 'H': game.useHint(); break;
      case 'm':
      case 'M': game.sound.muted = !game.sound.muted; break;
      case 'r':
      case 'R':
        if (game.state === SCREEN_PLAY || game.state === 'over' || game.state === 'win') {
          if (game.state === 'win') game.startGame();
          else game.startLevel(game.level);
        }
        break;
      case 'n':
      case 'N':
        if (game.state === 'levelDone') game.nextLevel();
        break;
      case '1': if (game.state === SCREEN_TITLE) game.startLevel(0); break;
      case '2': if (game.state === SCREEN_TITLE) game.startLevel(1); break;
      case '3': if (game.state === SCREEN_TITLE) game.startLevel(2); break;
      case 'Escape': game.toTitle(); break;
      default: break;
    }
  });

  // Keep the crosshair inside the play area when it first appears.
  game.cursor.x = LEFT_X + PANEL_W / 2;
  game.cursor.y = PANEL_Y + PANEL_H / 2;
  void RIGHT_X;
}
