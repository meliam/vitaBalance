import { describe, it, expect } from 'vitest';
import { checkWinCondition, checkLoseCondition } from '../../src/systems/objective-system';
import type { GameState, LevelObjective } from '../../src/types/game.types';

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

// ─── Unit Tests: Objective System ────────────────────────────────────────────

describe('Objective System — Unit Tests', () => {
  describe('Level 1 — Count Objective', () => {
    const countObjective: LevelObjective = { type: 'count', target: 8 };

    it('wins when correctCaptures >= target', () => {
      const state = { ...createInitialState(), correctCaptures: 10 };
      expect(checkWinCondition(state, countObjective)).toBe(true);
    });

    it('does not win when correctCaptures < target', () => {
      const state = { ...createInitialState(), correctCaptures: 5 };
      expect(checkWinCondition(state, countObjective)).toBe(false);
    });

    it('wins at exact boundary (correctCaptures === 8)', () => {
      const state = { ...createInitialState(), correctCaptures: 8 };
      expect(checkWinCondition(state, countObjective)).toBe(true);
    });
  });

  describe('Level 2 — Combine Objective', () => {
    const combineObjective: LevelObjective = {
      type: 'combine',
      vitaminC: true,
      potassium: true,
      variety: 5,
    };

    it('wins when all sub-objectives are met', () => {
      const state = {
        ...createInitialState(),
        vitaminCCaught: true,
        potassiumCaught: true,
        uniqueItems: ['naranja', 'banana', 'brocoli', 'frutilla', 'espinaca'],
      };
      expect(checkWinCondition(state, combineObjective)).toBe(true);
    });

    it('does not win when vitaminC is missing', () => {
      const state = {
        ...createInitialState(),
        vitaminCCaught: false,
        potassiumCaught: true,
        uniqueItems: ['naranja', 'banana', 'brocoli', 'frutilla', 'espinaca'],
      };
      expect(checkWinCondition(state, combineObjective)).toBe(false);
    });

    it('does not win when potassium is missing', () => {
      const state = {
        ...createInitialState(),
        vitaminCCaught: true,
        potassiumCaught: false,
        uniqueItems: ['naranja', 'banana', 'brocoli', 'frutilla', 'espinaca'],
      };
      expect(checkWinCondition(state, combineObjective)).toBe(false);
    });

    it('does not win when variety is insufficient', () => {
      const state = {
        ...createInitialState(),
        vitaminCCaught: true,
        potassiumCaught: true,
        uniqueItems: ['naranja', 'banana', 'brocoli'],
      };
      expect(checkWinCondition(state, combineObjective)).toBe(false);
    });
  });

  describe('Level 3 — Seasonal Objective', () => {
    const seasonalObjective: LevelObjective = {
      type: 'seasonal',
      products: ['naranja', 'mandarina', 'brocoli', 'espinaca', 'kiwi'],
    };

    it('wins when all products in checklist are captured', () => {
      const state = {
        ...createInitialState(),
        checklist: {
          naranja: true,
          mandarina: true,
          brocoli: true,
          espinaca: true,
          kiwi: true,
        },
      };
      expect(checkWinCondition(state, seasonalObjective)).toBe(true);
    });

    it('does not win when some products are missing', () => {
      const state = {
        ...createInitialState(),
        checklist: {
          naranja: true,
          mandarina: true,
          brocoli: true,
          espinaca: false,
          kiwi: true,
        },
      };
      expect(checkWinCondition(state, seasonalObjective)).toBe(false);
    });

    it('does not win with empty checklist', () => {
      const state = { ...createInitialState(), checklist: {} };
      expect(checkWinCondition(state, seasonalObjective)).toBe(false);
    });
  });

  describe('Lose Condition', () => {
    it('triggers when lives === 0', () => {
      const state = { ...createInitialState(), lives: 0 };
      expect(checkLoseCondition(state, 30)).toBe(true);
    });

    it('does not trigger when lives > 0', () => {
      const state = { ...createInitialState(), lives: 1 };
      expect(checkLoseCondition(state, 30)).toBe(false);
    });

    it('does not trigger at full lives', () => {
      const state = { ...createInitialState(), lives: 3 };
      expect(checkLoseCondition(state, 0)).toBe(false);
    });
  });

  describe('Partial Completion Does Not Trigger Win', () => {
    it('Level 1 — 7 of 8 correct captures does not win', () => {
      const objective: LevelObjective = { type: 'count', target: 8 };
      const state = { ...createInitialState(), correctCaptures: 7 };
      expect(checkWinCondition(state, objective)).toBe(false);
    });

    it('Level 2 — two of three sub-objectives met does not win', () => {
      const objective: LevelObjective = {
        type: 'combine',
        vitaminC: true,
        potassium: true,
        variety: 5,
      };
      // vitaminC and variety met, potassium missing
      const state = {
        ...createInitialState(),
        vitaminCCaught: true,
        potassiumCaught: false,
        uniqueItems: ['a', 'b', 'c', 'd', 'e'],
      };
      expect(checkWinCondition(state, objective)).toBe(false);
    });

    it('Level 3 — 4 of 5 seasonal products captured does not win', () => {
      const objective: LevelObjective = {
        type: 'seasonal',
        products: ['naranja', 'mandarina', 'brocoli', 'espinaca', 'kiwi'],
      };
      const state = {
        ...createInitialState(),
        checklist: {
          naranja: true,
          mandarina: true,
          brocoli: true,
          espinaca: true,
          // kiwi not captured
        },
      };
      expect(checkWinCondition(state, objective)).toBe(false);
    });
  });
});
