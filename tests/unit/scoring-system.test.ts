import { describe, it, expect } from 'vitest';
import { processCapture, calculateVitaScore } from '../../src/systems/scoring-system';
import type { GameState, CapturedItemData } from '../../src/types/game.types';
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

// ─── Unit Tests: Scoring System Edge Cases ───────────────────────────────────

describe('Scoring System — Edge Case Unit Tests', () => {
  describe('Precision', () => {
    it('first capture sets precision to 100% when it is a correct product', () => {
      const state = createInitialState();
      const item: CapturedItemData = { type: 'correct', name: 'naranja', vitaminC: true };

      const updates = processCapture(state, item, SCORING_CONFIG);
      const newState = { ...state, ...updates };

      expect(newState.precision).toBe(100);
    });

    it('precision is 0 when only spoiled captures occur', () => {
      let state = createInitialState();

      const spoiledItems: CapturedItemData[] = [
        { type: 'spoiled', name: 'naranja_spoiled' },
        { type: 'spoiled', name: 'banana_spoiled' },
        { type: 'spoiled', name: 'tomate_spoiled' },
      ];

      for (const item of spoiledItems) {
        const updates = processCapture(state, item, SCORING_CONFIG);
        state = { ...state, ...updates };
      }

      expect(state.precision).toBe(0);
    });
  });

  describe('Combo', () => {
    it('capturing same product consecutively does NOT increment combo', () => {
      const state = createInitialState();
      const item: CapturedItemData = { type: 'correct', name: 'naranja' };

      // First capture — combo goes from 0 to 1 (different from '' lastItemName)
      const updates1 = processCapture(state, item, SCORING_CONFIG);
      const state1 = { ...state, ...updates1 };
      expect(state1.combo).toBe(1);

      // Second capture — same product, combo should NOT increment
      const updates2 = processCapture(state1, item, SCORING_CONFIG);
      const state2 = { ...state1, ...updates2 };
      expect(state2.combo).toBe(1);
    });

    it('combo does not increment for same product captured twice', () => {
      let state = createInitialState();

      // Build some combo first with different products
      const banana: CapturedItemData = { type: 'correct', name: 'banana' };
      const naranja: CapturedItemData = { type: 'correct', name: 'naranja' };

      const updates1 = processCapture(state, banana, SCORING_CONFIG);
      state = { ...state, ...updates1 };
      expect(state.combo).toBe(1);

      const updates2 = processCapture(state, naranja, SCORING_CONFIG);
      state = { ...state, ...updates2 };
      expect(state.combo).toBe(2);

      // Now capture naranja again — combo should stay at 2
      const updates3 = processCapture(state, naranja, SCORING_CONFIG);
      state = { ...state, ...updates3 };
      expect(state.combo).toBe(2);
    });

    it('maxCombo preserves highest value after combo resets', () => {
      let state = createInitialState();

      // Build combo to 3
      const items: CapturedItemData[] = [
        { type: 'correct', name: 'naranja' },
        { type: 'correct', name: 'banana' },
        { type: 'correct', name: 'manzana' },
      ];

      for (const item of items) {
        const updates = processCapture(state, item, SCORING_CONFIG);
        state = { ...state, ...updates };
      }
      expect(state.combo).toBe(3);
      expect(state.maxCombo).toBe(3);

      // Reset combo with a spoiled capture
      const spoiled: CapturedItemData = { type: 'spoiled', name: 'bad_item' };
      const spoiledUpdates = processCapture(state, spoiled, SCORING_CONFIG);
      state = { ...state, ...spoiledUpdates };

      expect(state.combo).toBe(0);
      expect(state.maxCombo).toBe(3); // maxCombo retains peak value
    });
  });

  describe('VitaScore', () => {
    it('VitaScore is 0 when all metrics are 0', () => {
      const state: GameState = {
        ...createInitialState(),
        score: 0,
        balance: 0,
        uniqueItems: [],
        maxCombo: 0,
      };

      const vitaScore = calculateVitaScore(state, SCORING_CONFIG);
      expect(vitaScore).toBe(0);
    });
  });

  describe('Balance', () => {
    it('balance does not go below 0 on multiple spoiled captures', () => {
      let state = createInitialState();

      // Apply many spoiled captures to try driving balance below 0
      const spoiledItem: CapturedItemData = { type: 'spoiled', name: 'bad_item' };

      for (let i = 0; i < 20; i++) {
        const updates = processCapture(state, spoiledItem, SCORING_CONFIG);
        state = { ...state, ...updates };
        expect(state.balance).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Variety', () => {
    it('variety only counts unique products', () => {
      let state = createInitialState();

      // Capture 'naranja' 5 times
      const item: CapturedItemData = { type: 'correct', name: 'naranja' };
      for (let i = 0; i < 5; i++) {
        const updates = processCapture(state, item, SCORING_CONFIG);
        state = { ...state, ...updates };
      }

      expect(state.uniqueItems).toHaveLength(1);
      expect(state.uniqueItems).toContain('naranja');

      // Capture a different product
      const banana: CapturedItemData = { type: 'correct', name: 'banana' };
      const updates = processCapture(state, banana, SCORING_CONFIG);
      state = { ...state, ...updates };

      expect(state.uniqueItems).toHaveLength(2);
      expect(state.uniqueItems).toContain('banana');
    });
  });
});
