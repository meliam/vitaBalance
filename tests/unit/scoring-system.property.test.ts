import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { processCapture, calculateVitaScore } from '../../src/systems/scoring-system';
import type { GameState, CapturedItemData, ScoringConfig, ItemType } from '../../src/types/game.types';
import { SCORING_CONFIG } from '../../src/config/scoring';

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

function arbItemType(): fc.Arbitrary<ItemType> {
  return fc.constantFrom('correct', 'spoiled', 'unsolicited', 'powerup') as fc.Arbitrary<ItemType>;
}

function arbCapturedItemData(): fc.Arbitrary<CapturedItemData> {
  return fc.record({
    type: arbItemType(),
    name: fc.constantFrom(
      'naranja', 'banana', 'brocoli', 'frutilla', 'espinaca',
      'zanahoria', 'manzana', 'tomate', 'kiwi', 'sandia',
    ),
    vitaminC: fc.option(fc.boolean(), { nil: undefined }),
    potassium: fc.option(fc.boolean(), { nil: undefined }),
  });
}

function arbScoringConfig(): fc.Arbitrary<ScoringConfig> {
  return fc.record({
    scoreMultiplier: fc.double({ min: 0.01, max: 5, noNaN: true }),
    balanceMultiplier: fc.double({ min: 0.01, max: 10, noNaN: true }),
    varietyMultiplier: fc.double({ min: 0.01, max: 100, noNaN: true }),
    comboMaxBonus: fc.double({ min: 0.01, max: 50, noNaN: true }),
    balancePenaltyOnSpoiled: fc.double({ min: 1, max: 50, noNaN: true }),
    balanceGainOnCorrect: fc.double({ min: 0.1, max: 20, noNaN: true }),
    balanceMax: fc.integer({ min: 50, max: 200 }),
    precisionPenaltyOnSpoiled: fc.double({ min: 1, max: 30, noNaN: true }),
    precisionPenaltyOnUnsolicited: fc.double({ min: 1, max: 30, noNaN: true }),
    comboBonusPerStreak: fc.double({ min: 1, max: 20, noNaN: true }),
    comboBonusMax: fc.double({ min: 10, max: 100, noNaN: true }),
  });
}

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
    uniqueItems: fc.array(fc.string({ minLength: 1, maxLength: 3 }), { maxLength: 15 }),
    lastItemName: fc.string({ minLength: 0, maxLength: 3 }),
    powerupActive: fc.boolean(),
    powerupTimeRemaining: fc.integer({ min: 0, max: 3000 }),
    totalCaught: fc.integer({ min: 0, max: 200 }),
    vitaminCCaught: fc.boolean(),
    potassiumCaught: fc.boolean(),
    checklist: fc.constant({}),
  });
}

// ─── Helper: Apply a sequence of captures ────────────────────────────────────

function applyCaptures(
  items: CapturedItemData[],
  config: ScoringConfig,
  initialState?: GameState,
): GameState {
  let state = initialState ?? createInitialState();
  for (const item of items) {
    const updates = processCapture(state, item, config);
    state = { ...state, ...updates };
  }
  return state;
}

// ─── Property Tests ──────────────────────────────────────────────────────────

describe('Scoring System — Property-Based Tests', () => {
  /**
   * Property 1: Capture accounting identity
   * **Validates: Requirements 2.4**
   *
   * For any sequence of captures:
   * totalCaptures === correctCaptures + errors + unsolicitedCaptures
   * where unsolicitedCaptures = totalCaptures - correctCaptures - errors
   */
  describe('Property 1: Capture accounting identity', () => {
    it('totalCaptures === correctCaptures + errors + unsolicitedCaptures for any sequence', () => {
      fc.assert(
        fc.property(
          fc.array(arbCapturedItemData(), { minLength: 1, maxLength: 50 }),
          (items) => {
            const state = applyCaptures(items, SCORING_CONFIG);

            // Count expected values from the sequence
            const expectedTotal = items.length;
            const expectedCorrect = items.filter((i) => i.type === 'correct').length;
            const expectedErrors = items.filter((i) => i.type === 'spoiled').length;
            const unsolicitedCaptures = expectedTotal - expectedCorrect - expectedErrors;

            expect(state.totalCaptures).toBe(expectedTotal);
            expect(state.correctCaptures).toBe(expectedCorrect);
            expect(state.errors).toBe(expectedErrors);
            expect(state.totalCaptures).toBe(
              state.correctCaptures + state.errors + unsolicitedCaptures,
            );
          },
        ),
      );
    });
  });

  /**
   * Property 2: Precision formula correctness
   * **Validates: Requirements 2.4**
   *
   * For any state with totalCaptures > 0:
   * precision === (correctCaptures / totalCaptures) × 100
   */
  describe('Property 2: Precision formula correctness', () => {
    it('precision equals (correctCaptures / totalCaptures) × 100 for any sequence', () => {
      fc.assert(
        fc.property(
          fc.array(arbCapturedItemData(), { minLength: 1, maxLength: 50 }),
          (items) => {
            const state = applyCaptures(items, SCORING_CONFIG);

            const expectedPrecision = (state.correctCaptures / state.totalCaptures) * 100;
            expect(Math.abs(state.precision - expectedPrecision)).toBeLessThan(0.0001);
          },
        ),
      );
    });
  });

  /**
   * Property 4: Combo resets on error capture
   * **Validates: Requirements 2.3**
   *
   * For any capture of Spoiled or Unsolicited product, resulting combo === 0
   */
  describe('Property 4: Combo resets on error capture', () => {
    it('combo resets to 0 after capturing a spoiled product', () => {
      fc.assert(
        fc.property(
          arbGameState(),
          fc.record({
            type: fc.constant('spoiled' as ItemType),
            name: fc.string({ minLength: 1, maxLength: 3 }),
            vitaminC: fc.option(fc.boolean(), { nil: undefined }),
            potassium: fc.option(fc.boolean(), { nil: undefined }),
          }),
          arbScoringConfig(),
          (state, item, config) => {
            const updates = processCapture(state, item, config);
            expect(updates.combo).toBe(0);
          },
        ),
      );
    });

    it('combo resets to 0 after capturing an unsolicited product', () => {
      fc.assert(
        fc.property(
          arbGameState(),
          fc.record({
            type: fc.constant('unsolicited' as ItemType),
            name: fc.string({ minLength: 1, maxLength: 3 }),
            vitaminC: fc.option(fc.boolean(), { nil: undefined }),
            potassium: fc.option(fc.boolean(), { nil: undefined }),
          }),
          arbScoringConfig(),
          (state, item, config) => {
            const updates = processCapture(state, item, config);
            expect(updates.combo).toBe(0);
          },
        ),
      );
    });
  });

  /**
   * Property 5: Combo increments on distinct correct capture
   * **Validates: Requirements 2.2**
   *
   * For any correct capture with different name than last, combo === prev + 1
   */
  describe('Property 5: Combo increments on distinct correct capture', () => {
    it('combo increments by 1 when capturing a correct product with different name than last', () => {
      fc.assert(
        fc.property(
          arbGameState().filter((s) => s.lastItemName.length > 0),
          arbScoringConfig(),
          fc.string({ minLength: 1, maxLength: 3 }).filter((name) => name.length > 0),
          (state, config, name) => {
            // Ensure the item name is different from lastItemName
            const differentName = name === state.lastItemName ? name + 'x' : name;
            const item: CapturedItemData = {
              type: 'correct',
              name: differentName,
            };
            const updates = processCapture(state, item, config);
            expect(updates.combo).toBe(state.combo + 1);
          },
        ),
      );
    });

    it('combo stays the same when capturing a correct product with same name as last', () => {
      fc.assert(
        fc.property(
          arbGameState().filter((s) => s.lastItemName.length > 0),
          arbScoringConfig(),
          (state, config) => {
            const item: CapturedItemData = {
              type: 'correct',
              name: state.lastItemName,
            };
            const updates = processCapture(state, item, config);
            expect(updates.combo).toBe(state.combo);
          },
        ),
      );
    });
  });

  /**
   * Property 6: maxCombo is monotonically non-decreasing
   * **Validates: Requirements 2.7**
   *
   * For any capture event, resulting maxCombo >= previous maxCombo
   */
  describe('Property 6: maxCombo is monotonically non-decreasing', () => {
    it('maxCombo never decreases after any single capture event', () => {
      fc.assert(
        fc.property(
          arbGameState(),
          arbCapturedItemData(),
          arbScoringConfig(),
          (state, item, config) => {
            const updates = processCapture(state, item, config);
            const newMaxCombo = updates.maxCombo ?? state.maxCombo;
            expect(newMaxCombo).toBeGreaterThanOrEqual(state.maxCombo);
          },
        ),
      );
    });

    it('maxCombo never decreases over a sequence of captures', () => {
      fc.assert(
        fc.property(
          fc.array(arbCapturedItemData(), { minLength: 2, maxLength: 30 }),
          arbScoringConfig(),
          (items, config) => {
            let state = createInitialState();
            let prevMaxCombo = state.maxCombo;

            for (const item of items) {
              const updates = processCapture(state, item, config);
              state = { ...state, ...updates };
              expect(state.maxCombo).toBeGreaterThanOrEqual(prevMaxCombo);
              prevMaxCombo = state.maxCombo;
            }
          },
        ),
      );
    });
  });

  /**
   * Property 7: VitaScore uses configurable coefficients
   * **Validates: Requirements 2.7, 2.8**
   *
   * For any GameState and ScoringConfig, vitaScore equals the formula
   * applied with those config values.
   */
  describe('Property 7: VitaScore uses configurable coefficients', () => {
    it('calculateVitaScore matches the formula for any state and config', () => {
      fc.assert(
        fc.property(arbGameState(), arbScoringConfig(), (state, config) => {
          const result = calculateVitaScore(state, config);
          const expected =
            state.score * config.scoreMultiplier +
            state.balance * config.balanceMultiplier +
            state.uniqueItems.length * config.varietyMultiplier +
            state.maxCombo * config.comboMaxBonus;

          expect(Math.abs(result - expected)).toBeLessThan(0.0001);
        }),
      );
    });
  });

  /**
   * Property 12: Balance bounded [0, balanceMax]
   * **Validates: Requirements 2.5**
   *
   * For any sequence of captures, balance stays within [0, config.balanceMax]
   */
  describe('Property 12: Balance bounded [0, balanceMax]', () => {
    it('balance stays within [0, balanceMax] for any sequence of captures', () => {
      fc.assert(
        fc.property(
          fc.array(arbCapturedItemData(), { minLength: 1, maxLength: 50 }),
          arbScoringConfig(),
          (items, config) => {
            let state = { ...createInitialState(), balance: config.balanceMax };

            for (const item of items) {
              const updates = processCapture(state, item, config);
              state = { ...state, ...updates };
              expect(state.balance).toBeGreaterThanOrEqual(0);
              expect(state.balance).toBeLessThanOrEqual(config.balanceMax);
            }
          },
        ),
      );
    });

    it('balance stays bounded even with many consecutive spoiled captures', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          arbScoringConfig(),
          (count, config) => {
            const spoiledItems: CapturedItemData[] = Array.from({ length: count }, (_, i) => ({
              type: 'spoiled' as ItemType,
              name: `item${i}`,
            }));

            let state = { ...createInitialState(), balance: config.balanceMax };
            for (const item of spoiledItems) {
              const updates = processCapture(state, item, config);
              state = { ...state, ...updates };
              expect(state.balance).toBeGreaterThanOrEqual(0);
              expect(state.balance).toBeLessThanOrEqual(config.balanceMax);
            }
          },
        ),
      );
    });
  });
});
