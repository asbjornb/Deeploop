/**
 * Random integer between min and max (inclusive).
 */
export function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Pick a random element from an array.
 */
export function randChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Shuffle an array (Fisher-Yates) and return a new array.
 */
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * XP required to reach a given level.
 */
export function xpForLevel(level) {
  return Math.floor(50 * Math.pow(level, 1.8));
}

/**
 * Physical damage formula.
 */
export function calculateDamage(atk, def, variance = 0.2) {
  const base = Math.max(1, atk * 1.2 - def * 0.5);
  const mult = 1 + (Math.random() * 2 - 1) * variance;
  return Math.max(1, Math.floor(base * mult));
}

/**
 * Magic damage formula.
 */
export function calculateMagicDamage(mag, def, variance = 0.2) {
  const base = Math.max(1, mag * 1.4 - def * 0.3);
  const mult = 1 + (Math.random() * 2 - 1) * variance;
  return Math.max(1, Math.floor(base * mult));
}

/**
 * Scaling multiplier for dungeon floor difficulty.
 */
export function floorScaling(floor) {
  return 1 + (floor - 1) * 0.18 + Math.pow(floor / 10, 1.5);
}

/**
 * Gold reward calculation.
 */
export function goldReward(floor, enemyCount) {
  return Math.floor((5 + floor * 3) * enemyCount * (0.8 + Math.random() * 0.4));
}

/**
 * Format large numbers with suffixes.
 */
export function formatNumber(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return Math.floor(n).toString();
}

/**
 * Clamp a value between min and max.
 */
export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}
