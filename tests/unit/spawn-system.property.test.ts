import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { selectItemType, createSpawnConfig } from '../../src/systems/spawn-system';
import type { SpawnProbabilities, LevelConfig, ItemType } from '../../src/types/game.types';
import { LEVELS } from '../../src/config/levels';

// ─── Arbitrary Generators ────────────────────────────────────────────────────

/**
 * Generates arbitrary SpawnProbabilities that sum to exactly 1.0.
 * Uses the stick-breaking method: generate 3 random cuts in [0,1] and derive 4 segments.
 */
function arbSpawnProbabilities(): fc.Arbitrary<SpawnProbabilities> {
  return fc
    .tuple(
      fc.double({ min: 0.01, max: 0.97, noNaN: true }),
      fc.double({ min: 0.01, max: 0.97, noNaN: true }),
      fc.double({ min: 0.01, max: 0.97, noNaN: true }),
    )
    .map(([a, b, c]) => {
      // Sort the 3 cut points to create 4 segments that sum to 1
      const cuts = [a, b, c].sort((x, y) => x - y);
      const correct = cuts[0];
      const spoiled = cuts[1] - cuts[0];
      const unsolicited = cuts[2] - cuts[1];
      const powerup = 1.0 - cuts[2];
      return { correct, spoiled, unsolicited, powerup };
    })
    .filter((p) => p.correct > 0 && p.spoiled > 0 && p.unsolicited > 0 && p.powerup > 0);
}

// ─── Property Tests ──────────────────────────────────────────────────────────

describe('Spawn System — Property-Based Tests', () => {
  /**
   * Property 11: Spawn probabilities sum to 1.0
   * **Validates: Requirements 1.5, 1.6**
   *
   * For any LevelConfig, the sum of all probabilities equals 1.0 (within floating point tolerance).
   */
  describe('Property 11: Spawn probabilities sum to 1.0', () => {
    it('all configured level spawn probabilities sum to 1.0', () => {
      for (const level of LEVELS) {
        const { correct, spoiled, unsolicited, powerup } = level.spawnProbabilities;
        const sum = correct + spoiled + unsolicited + powerup;
        expect(sum).toBeCloseTo(1.0, 10);
      }
    });

    it('arbitrary SpawnProbabilities that sum to 1.0 satisfy the invariant', () => {
      fc.assert(
        fc.property(arbSpawnProbabilities(), (probabilities) => {
          const { correct, spoiled, unsolicited, powerup } = probabilities;
          const sum = correct + spoiled + unsolicited + powerup;
          expect(sum).toBeCloseTo(1.0, 5);
        }),
      );
    });

    it('selectItemType always returns a valid ItemType for any valid probabilities', () => {
      fc.assert(
        fc.property(arbSpawnProbabilities(), (probabilities) => {
          const validTypes: ItemType[] = ['correct', 'spoiled', 'unsolicited', 'powerup'];
          const result = selectItemType(probabilities);
          expect(validTypes).toContain(result);
        }),
      );
    });

    it('statistical distribution approximates configured probabilities within 5% tolerance over 10000 samples', () => {
      fc.assert(
        fc.property(
          arbSpawnProbabilities(),
          fc.integer({ min: 1, max: 2147483647 }),
          (probabilities, seed) => {
            const sampleCount = 10000;
            const counts: Record<ItemType, number> = {
              correct: 0,
              spoiled: 0,
              unsolicited: 0,
              powerup: 0,
            };

            // Use a simple seeded PRNG (mulberry32) for determinism
            let s = seed | 0;
            const rng = () => {
              s = (s + 0x6d2b79f5) | 0;
              let t = Math.imul(s ^ (s >>> 15), 1 | s);
              t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
              return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
            };

            for (let i = 0; i < sampleCount; i++) {
              const type = selectItemType(probabilities, rng);
              counts[type]++;
            }

            const tolerance = 0.05;

            const correctRatio = counts.correct / sampleCount;
            const spoiledRatio = counts.spoiled / sampleCount;
            const unsolicitedRatio = counts.unsolicited / sampleCount;
            const powerupRatio = counts.powerup / sampleCount;

            expect(Math.abs(correctRatio - probabilities.correct)).toBeLessThan(tolerance);
            expect(Math.abs(spoiledRatio - probabilities.spoiled)).toBeLessThan(tolerance);
            expect(Math.abs(unsolicitedRatio - probabilities.unsolicited)).toBeLessThan(tolerance);
            expect(Math.abs(powerupRatio - probabilities.powerup)).toBeLessThan(tolerance);
          },
        ),
        { numRuns: 50 }, // Reduce runs since each run does 10000 samples
      );
    });

    it('createSpawnConfig always produces a valid spawn config for any seed', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 2147483647 }), (seed) => {
          const level = LEVELS[0]; // Level 1
          const config = createSpawnConfig(level, undefined, seed);

          // Type must be valid
          const validTypes: ItemType[] = ['correct', 'spoiled', 'unsolicited', 'powerup'];
          expect(validTypes).toContain(config.type);

          // ProductConfig must be defined
          expect(config.productConfig).toBeDefined();
          expect(config.productConfig.id).toBeDefined();
          expect(config.productConfig.name).toBeDefined();
          expect(config.productConfig.emoji).toBeDefined();

          // x position within game bounds [0, 1280)
          expect(config.x).toBeGreaterThanOrEqual(0);
          expect(config.x).toBeLessThan(1280);

          // Speed within expected range [baseSpeed, baseSpeed + speedVariance)
          expect(config.speed).toBeGreaterThanOrEqual(level.baseSpeed);
          expect(config.speed).toBeLessThan(level.baseSpeed + level.speedVariance);
        }),
      );
    });
  });
});
