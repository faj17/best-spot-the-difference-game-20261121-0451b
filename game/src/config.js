// Lantern Row — Spot the Difference: shared constants and level metadata.
// The game is one 1280x720 canvas. Two 600x430 panels sit side by side under a
// HUD bar; the right panel is the same scene drawn with a few differences applied.
export const W = 1280;
export const H = 720;
export const PANEL_W = 600;
export const PANEL_H = 430;
export const PANEL_Y = 118;
export const LEFT_X = 20;
export const RIGHT_X = 660;
export const HUD_H = 96;
export const TIME_PER_LEVEL = 150; // seconds
export const HINTS_PER_LEVEL = 3;
export const HINT_SECONDS = 4;
export const WRONG_TIME_PENALTY = 5; // seconds lost on a wrong click
export const POINTS_FIND = 100;
export const POINTS_HINT = -50;
export const POINTS_WRONG = -25;

export const LEVELS = [
  { id: 0, name: 'Lantern Row', short: 'Lantern Row', sub: 'a night market at dusk', diffs: 7, seed: 101 },
  { id: 1, name: 'Koi Pond Garden', short: 'Koi Pond', sub: 'a quiet garden after rain', diffs: 8, seed: 202 },
  { id: 2, name: 'Rooftop Moon Festival', short: 'Moon Festival', sub: 'mooncakes under a full moon', diffs: 10, seed: 303 },
];

// Colours shared by the HUD and the scenes.
export const INK = '#f5ead6';
export const INK_DIM = '#cbb98f';
export const GOLD = '#f2b544';
export const GREEN = '#58d68d';
export const RED = '#ef5350';
