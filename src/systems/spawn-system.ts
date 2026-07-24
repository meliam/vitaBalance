import type {
  ItemType,
  SpawnProbabilities,
  LevelConfig,
  SeasonalCombination,
  SpawnItemConfig,
  ProductConfig,
} from '../types/game.types';
import { PRODUCTS, SPOILED_ITEMS } from '../config/products';

/**
 * Spawn system — pure logic module.
 * Handles item type selection via weighted random and spawn configuration
 * generation based on level parameters and seasonal constraints.
 *
 * Uses a seeded PRNG for deterministic testability.
 * No Phaser dependencies.
 *
 * @see Requirements 1.5, 1.6, 1.7
 */

/** Game width used for random x positioning. */
const GAME_WIDTH = 1280;

/**
 * Mulberry32 seeded PRNG — returns a function that produces
 * pseudo-random numbers in [0, 1) on each call.
 */
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Creates a random number generator. If a seed is provided, uses a
 * deterministic PRNG (mulberry32). Otherwise falls back to Math.random.
 */
function createRng(seed?: number): () => number {
  if (seed !== undefined) {
    return mulberry32(seed);
  }
  return Math.random;
}

/**
 * Selects an item type based on weighted probabilities.
 *
 * Default distribution: correct 52%, spoiled 18%, unsolicited 18%, powerup 12%.
 * The probabilities must sum to 1 (or close to it).
 *
 * @param probabilities - Weighted spawn probabilities for each item type
 * @param rng - Random number generator function (defaults to Math.random)
 * @returns The selected ItemType
 */
export function selectItemType(
  probabilities: SpawnProbabilities,
  rng: () => number = Math.random,
): ItemType {
  const roll = rng();
  let cumulative = 0;

  cumulative += probabilities.correct;
  if (roll < cumulative) return 'correct';

  cumulative += probabilities.spoiled;
  if (roll < cumulative) return 'spoiled';

  cumulative += probabilities.unsolicited;
  if (roll < cumulative) return 'unsolicited';

  return 'powerup';
}

/**
 * Estrella Vita power-up configuration.
 * Created as a special ProductConfig for powerup item type.
 */
const ESTRELLA_VITA: ProductConfig = {
  id: 'estrella-vita',
  name: 'Estrella Vita',
  emoji: '⭐',
  nutrient: 'Reduce velocidad de caída',
  season: 'all',
  points: 0,
};

/**
 * Returns correct products for a given level configuration.
 * - Level 3 with seasonalConfig: picks from targetProducts
 * - Other levels: picks from PRODUCTS matching the level's season or 'all'
 */
function getCorrectProducts(
  levelConfig: LevelConfig,
  seasonalConfig?: SeasonalCombination,
): ProductConfig[] {
  if (levelConfig.id === 3 && seasonalConfig) {
    return PRODUCTS.filter((p) => seasonalConfig.targetProducts.includes(p.id));
  }

  // For levels 1 and 2: all products are valid correct items
  return PRODUCTS;
}

/**
 * Returns unsolicited (distractor) products for a given level configuration.
 * - Level 3 with seasonalConfig: picks from distractors
 * - Other levels: returns all products (unsolicited is still a valid product, just not mission-critical)
 */
function getUnsolicitedProducts(
  levelConfig: LevelConfig,
  seasonalConfig?: SeasonalCombination,
): ProductConfig[] {
  if (levelConfig.id === 3 && seasonalConfig) {
    return PRODUCTS.filter((p) => seasonalConfig.distractors.includes(p.id));
  }

  // For levels 1 and 2: unsolicited items are products that don't specifically
  // match the mission but are still healthy foods
  return PRODUCTS;
}

/**
 * Creates a complete spawn item configuration for a falling item.
 *
 * Selects the item type via weighted random, then picks an appropriate product
 * from the relevant pool based on level and seasonal constraints.
 *
 * @param levelConfig - Current level configuration
 * @param seasonalConfig - Optional seasonal combination (Level 3)
 * @param seed - Optional seed for deterministic RNG
 * @returns A fully configured SpawnItemConfig ready for the game engine
 */
export function createSpawnConfig(
  levelConfig: LevelConfig,
  seasonalConfig?: SeasonalCombination,
  seed?: number,
): SpawnItemConfig {
  const rng = createRng(seed);

  const type = selectItemType(levelConfig.spawnProbabilities, rng);

  let productConfig: ProductConfig;

  switch (type) {
    case 'correct': {
      const pool = getCorrectProducts(levelConfig, seasonalConfig);
      const index = Math.floor(rng() * pool.length);
      productConfig = pool[index];
      break;
    }

    case 'spoiled': {
      const index = Math.floor(rng() * SPOILED_ITEMS.length);
      productConfig = SPOILED_ITEMS[index];
      break;
    }

    case 'unsolicited': {
      const pool = getUnsolicitedProducts(levelConfig, seasonalConfig);
      const index = Math.floor(rng() * pool.length);
      productConfig = pool[index];
      break;
    }

    case 'powerup': {
      productConfig = ESTRELLA_VITA;
      break;
    }
  }

  // Random x position within game bounds
  const x = rng() * GAME_WIDTH;

  // Speed = baseSpeed + random variance (0 to speedVariance)
  const speed = levelConfig.baseSpeed + rng() * levelConfig.speedVariance;

  return {
    type,
    productConfig,
    x,
    speed,
  };
}
