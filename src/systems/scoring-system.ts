import type { GameState, CapturedItemData, ScoringConfig } from '../types/game.types';

/**
 * Scoring system — pure logic module.
 * Handles point calculation, combo tracking, precision, balance, variety,
 * and the composite VitaScore formula.
 *
 * All coefficients are read from the ScoringConfig parameter.
 * No Phaser dependencies. No hardcoded numeric values.
 *
 * @see Requirements 2.1–2.8
 */

/**
 * Clamps a value between min and max (inclusive).
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Processes a capture event and returns the partial state update.
 *
 * Behavior by item type:
 * - correct: +points, combo increment (if different from last), variety tracking,
 *   balance gain, vitaminC/potassium flags, totalCaught increment.
 * - spoiled: -1 life, balance penalty, combo reset, errors increment.
 * - unsolicited: combo reset (no life loss, no explicit counter needed).
 * - powerup: handled elsewhere (no scoring impact).
 *
 * All captures: increment totalCaptures, recalculate precision.
 */
export function processCapture(
  state: GameState,
  item: CapturedItemData,
  config: ScoringConfig,
): Partial<GameState> {
  const updates: Partial<GameState> = {};

  // All captures increment totalCaptures
  const newTotalCaptures = state.totalCaptures + 1;
  updates.totalCaptures = newTotalCaptures;

  switch (item.type) {
    case 'correct': {
      // Req 2.1: Add configured point value
      const comboBonus = Math.min(
        state.combo * config.comboBonusPerStreak,
        config.comboBonusMax,
      );
      updates.score = state.score + comboBonus + config.comboBonusPerStreak;

      // Req 2.2: Increment combo if different from last captured product
      const newCombo = item.name !== state.lastItemName ? state.combo + 1 : state.combo;
      updates.combo = newCombo;

      // Req 2.7 (Property 6): maxCombo is monotonically non-decreasing
      updates.maxCombo = Math.max(state.maxCombo, newCombo);

      // Track correct captures
      const newCorrectCaptures = state.correctCaptures + 1;
      updates.correctCaptures = newCorrectCaptures;

      // Req 2.6: Variety — track new unique items
      if (!state.uniqueItems.includes(item.name)) {
        updates.uniqueItems = [...state.uniqueItems, item.name];
      }

      // Balance gain (clamped to [0, balanceMax])
      updates.balance = clamp(
        state.balance + config.balanceGainOnCorrect,
        0,
        config.balanceMax,
      );

      // Track last item name for combo logic
      updates.lastItemName = item.name;

      // Level-specific flags
      if (item.vitaminC) {
        updates.vitaminCCaught = true;
      }
      if (item.potassium) {
        updates.potassiumCaught = true;
      }

      // totalCaught for L1 objective tracking
      updates.totalCaught = state.totalCaught + 1;

      // Req 2.4: Recalculate precision
      updates.precision = (newCorrectCaptures / newTotalCaptures) * 100;

      break;
    }

    case 'spoiled': {
      // Req 3.2: Reduce lives by 1
      updates.lives = state.lives - 1;

      // Req 2.5: Reduce balance (clamped to [0, balanceMax])
      updates.balance = clamp(
        state.balance - config.balancePenaltyOnSpoiled,
        0,
        config.balanceMax,
      );

      // Req 2.3: Reset combo
      updates.combo = 0;

      // Track errors (spoiled captures)
      updates.errors = state.errors + 1;

      // Req 2.4: Recalculate precision
      updates.precision = (state.correctCaptures / newTotalCaptures) * 100;

      break;
    }

    case 'unsolicited': {
      // Req 3.5: NO life reduction for unsolicited
      // Req 2.3: Reset combo
      updates.combo = 0;

      // Req 2.4: Recalculate precision
      updates.precision = (state.correctCaptures / newTotalCaptures) * 100;

      break;
    }

    case 'powerup': {
      // Power-ups don't affect scoring metrics directly.
      // They are handled by the game engine (speed reduction).
      // Still recalculate precision since totalCaptures increased.
      updates.precision = (state.correctCaptures / newTotalCaptures) * 100;
      break;
    }
  }

  return updates;
}

/**
 * Calculates the composite VitaScore using the formula:
 * VitaScore = score × scoreMultiplier + balance × balanceMultiplier
 *           + uniqueItems.length × varietyMultiplier + maxCombo × comboMaxBonus
 *
 * All coefficients are read from config. No hardcoded values.
 *
 * @see Requirements 2.7, 2.8
 */
export function calculateVitaScore(state: GameState, config: ScoringConfig): number {
  return (
    state.score * config.scoreMultiplier +
    state.balance * config.balanceMultiplier +
    state.uniqueItems.length * config.varietyMultiplier +
    state.maxCombo * config.comboMaxBonus
  );
}
