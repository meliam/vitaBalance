import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { checkWinCondition, checkLoseCondition } from '../../src/systems/objective-system';
import { processCapture } from '../../src/systems/scoring-system';
import { SCORING_CONFIG } from '../../src/config/scoring';
import type { GameState, LevelObjective, CapturedItemData } from '../../src/types/game.types';

// ─── Helper: Initial Game State Factory ──────────────────────────────────────

function createInitialState(): GameState {
  return {
    score: 0,
    lives: 3,
    timeLeft: 60,
    paused: false,
    won: false,
    gameOver: false,
    balance: 100,
    precision: 0,
    combo: 0,
    maxCombo: 0,
    errors: 0,
    totalCaptures: 0,
    correctCaptures: 0,
    uniqueItems: [],
    lastItemName: '',
    powerupActive: false,
    powerupTimeRemaining: 0,
    totalCaught: 0,
    vitaminCCaught: false,
    potassiumCaught: false,
    checklist: {},
  };
}

// ─── Arbitrary Generators ────────────────────────────────────────────────────

function arbGameState(): fc.Arbitrary<GameState> {
  return fc.record({
    score: fc.integer({ min: 0, max: 10000 }),
    lives: fc.integer({ min: 0, max: 3 }),
    timeLeft: fc.integer({ min: 0, max: 90 }),
    paused: fc.boolean(),
    won: fc.boolean(),
    gameOver: fc.boolean(),
    balance: fc.integer({ min: 0, max: 100 }),
    precision: fc.double({ min: 0, max: 100, noNaN: true }),
    combo: fc.integer({ min: 0, max: 50 }),
    maxCombo: fc.integer({ min: 0, max: 50 }),
    errors: fc.integer({ min: 0, max: 100 }),
    totalCaptures: fc.integer({ min: 0, max: 200 }),
    correctCaptures: fc.integer({ min: 0, max: 200 }),
    uniqueItems: fc.array(
      fc.constantFrom(
        'naranja', 'banana', 'brocoli', 'frutilla', 'espinaca',
        'zanahoria', 'manzana', 'tomate', 'kiwi', 'sandia',
      ),
      { maxLength: 10 },
    ),
    lastItemName: fc.constantFrom('', 'naranja', 'banana', 'brocoli', 'frutilla'),
    powerupActive: fc.boolean(),
    powerupTimeRemaining: fc.integer({ min: 0, max: 3000 }),
    totalCaught: fc.integer({ min: 0, max: 200 }),
    vitaminCCaught: fc.boolean(),
    potassiumCaught: fc.boolean(),
    checklist: fc.dictionary(
      fc.constantFrom('naranja', 'mandarina', 'brocoli', 'espinaca', 'kiwi'),
      fc.boolean(),
    ),
  });
}

function arbCountObjective(): fc.Arbitrary<LevelObjective> {
  return fc.integer({ min: 1, max: 20 }).map((target) => ({
    type: 'count' as const,
    target,
  }));
}

function arbCombineObjective(): fc.Arbitrary<LevelObjective> {
  return fc.integer({ min: 1, max: 10 }).map((variety) => ({
    type: 'combine' as const,
    vitaminC: true,
    potassium: true,
    variety,
  }));
}

function arbSeasonalObjective(): fc.Arbitrary<LevelObjective> {
  return fc.subarray(
    ['naranja', 'mandarina', 'brocoli', 'espinaca', 'kiwi'],
    { minLength: 1, maxLength: 5 },
  ).map((products) => ({
    type: 'seasonal' as const,
    products,
  }));
}

function arbLevelObjective(): fc.Arbitrary<LevelObjective> {
  return fc.oneof(arbCountObjective(), arbCombineObjective(), arbSeasonalObjective());
}

// ─── Property Tests ──────────────────────────────────────────────────────────

describe('Objective System — Property-Based Tests', () => {
  /**
   * Property 3: Lives bounded [0, 3]
   * **Validates: Requirements 3.1, 3.2**
   *
   * Starting from lives=3, after any number of spoiled captures
   * (which decrement lives via processCapture), the game stops processing
   * captures once checkLoseCondition returns true (lives === 0).
   * Therefore lives always remains in [0, 3].
   */
  describe('Property 3: Lives bounded [0, 3]', () => {
    it('lives stays in [0, 3] for any sequence of spoiled captures starting from initial state', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 20 }),
          (numSpoiledCaptures) => {
            let state = createInitialState(); // lives = 3

            for (let i = 0; i < numSpoiledCaptures; i++) {
              // Check lose condition before processing (game would stop here)
              if (checkLoseCondition(state, state.timeLeft)) {
                break;
              }

              const spoiledItem: CapturedItemData = {
                type: 'spoiled',
                name: `bad_item_${i}`,
              };
              const updates = processCapture(state, spoiledItem, SCORING_CONFIG);
              state = { ...state, ...updates };

              // After each capture, lives must be in [0, 3]
              expect(state.lives).toBeGreaterThanOrEqual(0);
              expect(state.lives).toBeLessThanOrEqual(3);
            }
          },
        ),
      );
    });

    it('lives stays in [0, 3] for any mixed sequence of captures starting from initial state', () => {
      const arbItemType = fc.constantFrom('correct', 'spoiled', 'unsolicited', 'powerup');
      const arbItemName = fc.constantFrom(
        'naranja', 'banana', 'brocoli', 'frutilla', 'espinaca',
        'zanahoria', 'manzana', 'tomate', 'kiwi', 'sandia',
      );

      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              type: arbItemType,
              name: arbItemName,
            }),
            { minLength: 1, maxLength: 30 },
          ),
          (items) => {
            let state = createInitialState(); // lives = 3

            for (const item of items) {
              // Game ends when lives hit 0
              if (checkLoseCondition(state, state.timeLeft)) {
                break;
              }

              const capturedItem: CapturedItemData = {
                type: item.type as CapturedItemData['type'],
                name: item.name,
              };
              const updates = processCapture(state, capturedItem, SCORING_CONFIG);
              state = { ...state, ...updates };

              expect(state.lives).toBeGreaterThanOrEqual(0);
              expect(state.lives).toBeLessThanOrEqual(3);
            }
          },
        ),
      );
    });
  });

  /**
   * Win condition is deterministic
   * **Validates: Requirements 5.2, 6.2, 7.2**
   *
   * For any GameState and LevelObjective, calling checkWinCondition
   * twice with the same inputs returns the same result.
   */
  describe('Win condition is deterministic', () => {
    it('checkWinCondition returns the same result on repeated calls', () => {
      fc.assert(
        fc.property(arbGameState(), arbLevelObjective(), (state, objective) => {
          const result1 = checkWinCondition(state, objective);
          const result2 = checkWinCondition(state, objective);
          expect(result1).toBe(result2);
        }),
      );
    });
  });

  /**
   * Count objective monotonicity
   * **Validates: Requirements 5.2**
   *
   * If state A has more correctCaptures than state B, and
   * checkWinCondition(B, countObjective) is true, then
   * checkWinCondition(A, countObjective) must also be true.
   */
  describe('Count objective monotonicity', () => {
    it('if fewer captures wins, then more captures also wins', () => {
      fc.assert(
        fc.property(
          arbGameState(),
          arbCountObjective(),
          fc.integer({ min: 1, max: 50 }),
          (baseState, objective, extraCaptures) => {
            // If baseState wins the count objective...
            if (checkWinCondition(baseState, objective)) {
              // ...then any state with MORE correctCaptures must also win
              const stateWithMore = {
                ...baseState,
                correctCaptures: baseState.correctCaptures + extraCaptures,
              };
              expect(checkWinCondition(stateWithMore, objective)).toBe(true);
            }
          },
        ),
      );
    });
  });

  /**
   * Lose condition is purely lives-based
   * **Validates: Requirements 5.3, 6.3, 7.3**
   *
   * checkLoseCondition returns true if and only if lives === 0,
   * regardless of timeLeft value.
   */
  describe('Lose condition is purely lives-based', () => {
    it('checkLoseCondition returns true iff lives === 0, regardless of timeLeft', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 3 }),
          fc.integer({ min: 0, max: 90 }),
          (lives, timeLeft) => {
            const state = { ...createInitialState(), lives };
            const result = checkLoseCondition(state, timeLeft);

            if (lives === 0) {
              expect(result).toBe(true);
            } else {
              expect(result).toBe(false);
            }
          },
        ),
      );
    });
  });
});
