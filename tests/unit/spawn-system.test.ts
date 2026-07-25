import { describe, it, expect } from 'vitest';
import { selectItemType, createSpawnConfig } from '../../src/systems/spawn-system';
import type { SpawnProbabilities, LevelConfig, SeasonalCombination } from '../../src/types/game.types';
import { LEVELS } from '../../src/config/levels';
import { PRODUCTS, SPOILED_ITEMS } from '../../src/config/products';
import { seasonalCombinations } from '../../src/config/seasons';

// ─── Unit Tests: Spawn System ────────────────────────────────────────────────

describe('Spawn System — selectItemType', () => {
  const defaultProbabilities: SpawnProbabilities = {
    correct: 0.52,
    spoiled: 0.18,
    unsolicited: 0.18,
    powerup: 0.12,
  };

  it('returns "correct" when roll is below correct probability', () => {
    const rng = () => 0.1; // 0.1 < 0.52
    expect(selectItemType(defaultProbabilities, rng)).toBe('correct');
  });

  it('returns "correct" at boundary (roll = 0)', () => {
    const rng = () => 0;
    expect(selectItemType(defaultProbabilities, rng)).toBe('correct');
  });

  it('returns "spoiled" when roll is between correct and correct+spoiled', () => {
    const rng = () => 0.55; // 0.52 <= 0.55 < 0.70
    expect(selectItemType(defaultProbabilities, rng)).toBe('spoiled');
  });

  it('returns "unsolicited" when roll is between correct+spoiled and correct+spoiled+unsolicited', () => {
    const rng = () => 0.75; // 0.70 <= 0.75 < 0.88
    expect(selectItemType(defaultProbabilities, rng)).toBe('unsolicited');
  });

  it('returns "powerup" when roll is above all other cumulative thresholds', () => {
    const rng = () => 0.95; // 0.88 <= 0.95
    expect(selectItemType(defaultProbabilities, rng)).toBe('powerup');
  });

  it('returns "powerup" at the edge (roll = 0.9999)', () => {
    const rng = () => 0.9999;
    expect(selectItemType(defaultProbabilities, rng)).toBe('powerup');
  });

  it('handles equal probability distribution', () => {
    const equalProb: SpawnProbabilities = {
      correct: 0.25,
      spoiled: 0.25,
      unsolicited: 0.25,
      powerup: 0.25,
    };

    expect(selectItemType(equalProb, () => 0.1)).toBe('correct');
    expect(selectItemType(equalProb, () => 0.3)).toBe('spoiled');
    expect(selectItemType(equalProb, () => 0.6)).toBe('unsolicited');
    expect(selectItemType(equalProb, () => 0.9)).toBe('powerup');
  });
});

describe('Spawn System — createSpawnConfig', () => {
  const level1 = LEVELS[0];
  const level3 = LEVELS[2];
  const seasonalConfig = seasonalCombinations[0]; // primavera → invierno

  it('returns a valid SpawnItemConfig with all required fields', () => {
    const config = createSpawnConfig(level1, undefined, 42);

    expect(config).toHaveProperty('type');
    expect(config).toHaveProperty('productConfig');
    expect(config).toHaveProperty('x');
    expect(config).toHaveProperty('speed');
    expect(['correct', 'spoiled', 'unsolicited', 'powerup']).toContain(config.type);
  });

  it('produces deterministic results with same seed', () => {
    const config1 = createSpawnConfig(level1, undefined, 123);
    const config2 = createSpawnConfig(level1, undefined, 123);

    expect(config1.type).toBe(config2.type);
    expect(config1.productConfig.id).toBe(config2.productConfig.id);
    expect(config1.x).toBe(config2.x);
    expect(config1.speed).toBe(config2.speed);
  });

  it('produces different results with different seeds', () => {
    const config1 = createSpawnConfig(level1, undefined, 1);
    const config2 = createSpawnConfig(level1, undefined, 999);

    // With different seeds, at least one field should differ (probabilistically)
    const differs =
      config1.type !== config2.type ||
      config1.productConfig.id !== config2.productConfig.id ||
      config1.x !== config2.x ||
      config1.speed !== config2.speed;
    expect(differs).toBe(true);
  });

  it('x position is within game bounds [0, 1280)', () => {
    for (let seed = 0; seed < 50; seed++) {
      const config = createSpawnConfig(level1, undefined, seed);
      expect(config.x).toBeGreaterThanOrEqual(0);
      expect(config.x).toBeLessThan(1280);
    }
  });

  it('speed is within expected range [baseSpeed, baseSpeed + speedVariance)', () => {
    for (let seed = 0; seed < 50; seed++) {
      const config = createSpawnConfig(level1, undefined, seed);
      expect(config.speed).toBeGreaterThanOrEqual(level1.baseSpeed);
      expect(config.speed).toBeLessThan(level1.baseSpeed + level1.speedVariance);
    }
  });

  it('assigns Estrella Vita config for powerup type', () => {
    // Find a seed that produces a powerup
    let powerupConfig = null;
    for (let seed = 0; seed < 1000; seed++) {
      const config = createSpawnConfig(level1, undefined, seed);
      if (config.type === 'powerup') {
        powerupConfig = config;
        break;
      }
    }

    expect(powerupConfig).not.toBeNull();
    expect(powerupConfig!.productConfig.id).toBe('estrella-vita');
    expect(powerupConfig!.productConfig.name).toBe('Estrella Vita');
    expect(powerupConfig!.productConfig.emoji).toBe('⭐');
  });

  it('assigns a SPOILED_ITEMS product for spoiled type', () => {
    let spoiledConfig = null;
    for (let seed = 0; seed < 1000; seed++) {
      const config = createSpawnConfig(level1, undefined, seed);
      if (config.type === 'spoiled') {
        spoiledConfig = config;
        break;
      }
    }

    expect(spoiledConfig).not.toBeNull();
    const spoiledIds = SPOILED_ITEMS.map((p) => p.id);
    expect(spoiledIds).toContain(spoiledConfig!.productConfig.id);
  });

  describe('Level 3 with seasonalConfig', () => {
    it('correct type picks from seasonalConfig.targetProducts', () => {
      let correctConfig = null;
      for (let seed = 0; seed < 1000; seed++) {
        const config = createSpawnConfig(level3, seasonalConfig, seed);
        if (config.type === 'correct') {
          correctConfig = config;
          break;
        }
      }

      expect(correctConfig).not.toBeNull();
      expect(seasonalConfig.targetProducts).toContain(correctConfig!.productConfig.id);
    });

    it('unsolicited type picks from seasonalConfig.distractors', () => {
      let unsolicitedConfig = null;
      for (let seed = 0; seed < 1000; seed++) {
        const config = createSpawnConfig(level3, seasonalConfig, seed);
        if (config.type === 'unsolicited') {
          unsolicitedConfig = config;
          break;
        }
      }

      expect(unsolicitedConfig).not.toBeNull();
      expect(seasonalConfig.distractors).toContain(unsolicitedConfig!.productConfig.id);
    });
  });
});
