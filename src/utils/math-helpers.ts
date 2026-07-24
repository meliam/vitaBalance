/**
 * Pure math utility functions for VitaBalance.
 * No Phaser dependencies — used across systems for spawn logic, interpolation, and clamping.
 */

/**
 * Constrains a value to the range [min, max].
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Returns a random float between min (inclusive) and max (exclusive).
 */
export function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Linear interpolation between a and b by factor t.
 * When t = 0 returns a, when t = 1 returns b.
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Selects a value from a weighted options array using weighted random selection.
 * Each option has a value and a weight (relative probability).
 * Throws if options array is empty or all weights are <= 0.
 */
export function weightedRandom<T>(options: { value: T; weight: number }[]): T {
  if (options.length === 0) {
    throw new Error('weightedRandom: options array must not be empty');
  }

  const totalWeight = options.reduce((sum, opt) => sum + Math.max(0, opt.weight), 0);

  if (totalWeight <= 0) {
    throw new Error('weightedRandom: total weight must be greater than 0');
  }

  let roll = Math.random() * totalWeight;

  for (const option of options) {
    const w = Math.max(0, option.weight);
    roll -= w;
    if (roll <= 0) {
      return option.value;
    }
  }

  // Fallback for floating point edge cases — return last option
  return options[options.length - 1].value;
}
