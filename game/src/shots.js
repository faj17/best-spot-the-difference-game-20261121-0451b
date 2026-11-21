// Lantern Row: the staged scenes behind ?shot=start|play|hint|win. Each one
// plays the real rules forward from a fresh level — found differences are marked
// by the game's own click path, so the frame is what a real game looks like and
// the same seed always gives the same frame. shots.json names them.
import { SCREEN_TITLE } from './game.js';
import { DIFFERENCES } from './differences.js';
import { LEFT_X, PANEL_Y } from './config.js';

function clickDiff(game, level, id) {
  const d = DIFFERENCES[level].find((x) => x.id === id);
  game.clickAt(LEFT_X + d.x, PANEL_Y + d.y);
}

// Set `game` to the named scene and return the screen it shows.
export function stageShot(name, game) {
  if (name === 'play') {
    game.startLevel(0);
    // Four found, three still hidden — the counter reads 4 / 7, 3 remain.
    for (const id of ['moon-crater', 'star-extra', 'awning-stripe', 'window-lit']) clickDiff(game, 0, id);
    return { screen: 'play', found: game.found.size };
  }
  if (name === 'hint') {
    game.startLevel(1);
    for (const id of ['koi-extra', 'bridge-plank']) clickDiff(game, 1, id);
    game.useHint();
    return { screen: 'play', found: game.found.size };
  }
  if (name === 'win') {
    game.startLevel(0);
    for (const d of DIFFERENCES[0]) clickDiff(game, 0, d.id);
    return { screen: 'levelDone', found: game.found.size };
  }
  game.toTitle();
  return { screen: SCREEN_TITLE, found: 0 };
}
