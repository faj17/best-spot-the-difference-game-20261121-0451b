// The differences of each level. Coordinates live in panel space (600 x 430),
// shared by the left (original) and right (changed) panel, so a click on either
// panel tests the same spot. `r` is the click tolerance in pixels; `label` is the
// name the level-complete screen shows. The scene draw functions in scenes.js
// read `diffs` (a Set of applied ids) and change exactly these details.
export const DIFFERENCES = [
  // Level 0 — Lantern Row (7)
  [
    { id: 'moon-crater', x: 92, y: 66, r: 30, label: 'the extra crater on the moon' },
    { id: 'lantern-missing', x: 302, y: 126, r: 24, label: 'the missing paper lantern' },
    { id: 'awning-stripe', x: 148, y: 205, r: 30, label: 'the teal awning stripe' },
    { id: 'cat-tail', x: 458, y: 306, r: 26, label: 'the cat’s raised tail' },
    { id: 'sign-glyph', x: 150, y: 157, r: 24, label: 'the changed shop sign' },
    { id: 'star-extra', x: 522, y: 58, r: 22, label: 'the extra star' },
    { id: 'window-lit', x: 425, y: 205, r: 26, label: 'the lit window' },
  ],
  // Level 1 — Koi Pond Garden (8)
  [
    { id: 'koi-extra', x: 300, y: 300, r: 28, label: 'the extra koi' },
    { id: 'blossom-fallen', x: 120, y: 120, r: 24, label: 'the fallen blossom' },
    { id: 'bridge-plank', x: 300, y: 210, r: 26, label: 'the pale bridge plank' },
    { id: 'stone-missing', x: 470, y: 350, r: 24, label: 'the missing stepping stone' },
    { id: 'lantern-flame', x: 88, y: 244, r: 24, label: 'the blue lantern flame' },
    { id: 'frog', x: 520, y: 296, r: 24, label: 'the frog on the lily pad' },
    { id: 'lily-flower', x: 210, y: 340, r: 24, label: 'the blooming lily' },
    { id: 'pagoda-window', x: 520, y: 99, r: 22, label: 'the dark pagoda window' },
  ],
  // Level 2 — Rooftop Moon Festival (10)
  [
    { id: 'firework', x: 480, y: 80, r: 30, label: 'the extra firework burst' },
    { id: 'mooncake', x: 306, y: 322, r: 26, label: 'the missing mooncake' },
    { id: 'flag-color', x: 128, y: 129, r: 24, label: 'the green festival flag' },
    { id: 'chimney-smoke', x: 548, y: 88, r: 26, label: 'the missing chimney smoke' },
    { id: 'kite-tail', x: 210, y: 90, r: 26, label: 'the kite’s long tail' },
    { id: 'cat-roof', x: 420, y: 268, r: 26, label: 'the cat on the roof' },
    { id: 'window-shutter', x: 180, y: 238, r: 26, label: 'the closed shutter' },
    { id: 'star-shooting', x: 60, y: 60, r: 24, label: 'the shooting star' },
    { id: 'lantern-ground', x: 360, y: 374, r: 24, label: 'the tipped ground lantern' },
    { id: 'moon-halo', x: 300, y: 70, r: 30, label: 'the moon’s missing halo' },
  ],
];

export function diffsFor(level) {
  return DIFFERENCES[level];
}

export function totalDiffs() {
  return DIFFERENCES.reduce((n, list) => n + list.length, 0);
}
