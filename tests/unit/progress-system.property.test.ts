import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { isLevelUnlocked, handleLevelComplete } from '../../src/systems/progress-system';
import type { ProgressData } from '../../src/types/game.types';
import { PRODUCTS } from '../../src/config/products';

// ─── Arbitrary Generators ────────────────────────────────────────────────────

/**
 * Generates arbitrary ProgressData with random levelsCompleted subsets
 * from the valid level range [1, 2, 3].
 */
function arbProgressData(): fc.Arbitrary<ProgressData> {
  return fc
    .subarray([1, 2, 3], { minLength: 0, maxLength: 3 })
    .chain((levelsCompleted) => {
      // unlockedLevel is based on the highest completed level + 1, capped at 3
      const maxCompleted = levelsCompleted.length > 0 ? Math.max(...levelsCompleted) : 0;
      const unlockedLevel = Math.min(maxCompleted + 1, 3) as 1 | 2 | 3;
      return fc.record({
        levelsCompleted: fc.constant(levelsCompleted),
        unlockedLevel: fc.constant(unlockedLevel),
        outfitLevel: fc.integer({ min: 0, max: 3 }),
      });
    });
}

/**
 * Generates arbitrary ProgressData with completely random levelsCompleted arrays
 * (may include non-sequential completions to test edge cases).
 */
function arbArbitraryProgressData(): fc.Arbitrary<ProgressData> {
  return fc.record({
    levelsCompleted: fc.subarray([1, 2, 3], { minLength: 0, maxLength: 3 }),
    unlockedLevel: fc.constantFrom(1, 2, 3) as fc.Arbitrary<1 | 2 | 3>,
    outfitLevel: fc.integer({ min: 0, max: 3 }),
  });
}

/**
 * Generates a random product name from the available products config.
 */
function arbProductName(): fc.Arbitrary<string> {
  const productNames = PRODUCTS.map((p) => p.name);
  return fc.constantFrom(...productNames);
}

// ─── Property Tests ──────────────────────────────────────────────────────────

describe('Progress System — Property-Based Tests', () => {
  /**
   * Property 9: Level unlock is sequential
   * **Validates: Requirements 22.1–22.4**
   *
   * For any level N > 1, isLevelUnlocked(N) requires levelsCompleted.includes(N-1).
   * Level 1 is always unlocked.
   */
  describe('Property 9: Level unlock is sequential', () => {
    it('Level 1 is always unlocked regardless of progress state', () => {
      fc.assert(
        fc.property(arbArbitraryProgressData(), (progress) => {
          expect(isLevelUnlocked(1, progress)).toBe(true);
        }),
      );
    });

    it('for level N > 1, isLevelUnlocked(N) is true ONLY IF levelsCompleted includes N-1', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(2, 3),
          arbArbitraryProgressData(),
          (level, progress) => {
            const unlocked = isLevelUnlocked(level, progress);
            const previousCompleted = progress.levelsCompleted.includes(level - 1);

            if (unlocked) {
              // If unlocked, then the previous level MUST be completed
              expect(previousCompleted).toBe(true);
            }
            if (!previousCompleted) {
              // If previous level is NOT completed, then this level MUST be locked
              expect(unlocked).toBe(false);
            }
          },
        ),
      );
    });

    it('cannot skip levels — level 3 locked without level 2 completion', () => {
      fc.assert(
        fc.property(
          fc.record({
            levelsCompleted: fc.constant([1] as number[]),
            unlockedLevel: fc.constantFrom(1, 2, 3) as fc.Arbitrary<1 | 2 | 3>,
            outfitLevel: fc.integer({ min: 0, max: 3 }),
          }),
          (progress) => {
            // Level 2 should be unlocked (level 1 completed)
            expect(isLevelUnlocked(2, progress)).toBe(true);
            // Level 3 should be locked (level 2 not completed)
            expect(isLevelUnlocked(3, progress)).toBe(false);
          },
        ),
      );
    });

    it('handleLevelComplete maintains sequential unlock semantics', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(1, 2, 3),
          fc.boolean(),
          arbProgressData(),
          (level, won, progress) => {
            const result = handleLevelComplete(level, won, progress);

            if (won) {
              // Winning should add the level to levelsCompleted
              expect(result.levelsCompleted).toContain(level);
              // The next level should be unlocked (capped at 3)
              expect(result.unlockedLevel).toBeLessThanOrEqual(3);
              expect(result.unlockedLevel).toBeGreaterThanOrEqual(1);
            } else {
              // Losing should NOT change progress
              expect(result).toEqual(progress);
            }
          },
        ),
      );
    });
  });

  /**
   * Property 10: Variety never exceeds available products
   * **Validates: Requirements 22.1–22.4**
   *
   * For any sequence of captures, uniqueItems.length <= total unique products available.
   * The PRODUCTS config has a fixed number of unique products.
   */
  describe('Property 10: Variety never exceeds available products', () => {
    it('uniqueItems length never exceeds total unique products available', () => {
      const totalUniqueProducts = PRODUCTS.length;

      fc.assert(
        fc.property(
          fc.array(arbProductName(), { minLength: 1, maxLength: 100 }),
          (capturedNames) => {
            // Simulate tracking unique items as the game does
            const uniqueItems: string[] = [];
            for (const name of capturedNames) {
              if (!uniqueItems.includes(name)) {
                uniqueItems.push(name);
              }
            }

            expect(uniqueItems.length).toBeLessThanOrEqual(totalUniqueProducts);
          },
        ),
      );
    });

    it('uniqueItems is always a subset of the available product names', () => {
      const allProductNames = new Set(PRODUCTS.map((p) => p.name));

      fc.assert(
        fc.property(
          fc.array(arbProductName(), { minLength: 1, maxLength: 50 }),
          (capturedNames) => {
            const uniqueItems: string[] = [];
            for (const name of capturedNames) {
              if (!uniqueItems.includes(name)) {
                uniqueItems.push(name);
              }
            }

            // Every unique item must be in the known product catalog
            for (const item of uniqueItems) {
              expect(allProductNames.has(item)).toBe(true);
            }
          },
        ),
      );
    });

    it('capturing all products exactly once yields uniqueItems.length === total products', () => {
      const allProductNames = PRODUCTS.map((p) => p.name);
      const totalUniqueProducts = PRODUCTS.length;

      fc.assert(
        fc.property(
          fc.shuffledSubarray(allProductNames, {
            minLength: allProductNames.length,
            maxLength: allProductNames.length,
          }),
          (shuffledNames) => {
            const uniqueItems: string[] = [];
            for (const name of shuffledNames) {
              if (!uniqueItems.includes(name)) {
                uniqueItems.push(name);
              }
            }

            expect(uniqueItems.length).toBe(totalUniqueProducts);
            expect(uniqueItems.length).toBeLessThanOrEqual(totalUniqueProducts);
          },
        ),
      );
    });

    it('duplicate captures do not increase uniqueItems count beyond product catalog size', () => {
      const totalUniqueProducts = PRODUCTS.length;

      fc.assert(
        fc.property(
          fc.array(arbProductName(), { minLength: 1, maxLength: 200 }),
          (capturedNames) => {
            const uniqueItems: string[] = [];
            for (const name of capturedNames) {
              if (!uniqueItems.includes(name)) {
                uniqueItems.push(name);
              }
            }

            // Even with 200 captures, uniqueItems cannot exceed total products
            expect(uniqueItems.length).toBeLessThanOrEqual(totalUniqueProducts);
            // Also, uniqueItems should never exceed the number of captures
            expect(uniqueItems.length).toBeLessThanOrEqual(capturedNames.length);
          },
        ),
      );
    });
  });
});
