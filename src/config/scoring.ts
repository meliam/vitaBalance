import type { ScoringConfig } from '../types/game.types';

/**
 * VitaScore formula coefficients and scoring parameters.
 *
 * VitaScore = score × scoreMultiplier + balance × balanceMultiplier
 *           + uniqueItems.length × varietyMultiplier + maxCombo × comboMaxBonus
 *
 * All values are configurable here to allow balance adjustments
 * without modifying scoring logic code.
 *
 * @see Requirements 2.7, 2.8, 16.4
 */
export const SCORING_CONFIG: ScoringConfig = {
  /** Weight applied to raw score in VitaScore formula */
  scoreMultiplier: 0.35,

  /** Weight applied to balance metric in VitaScore formula */
  balanceMultiplier: 2,

  /** Weight applied to variety (unique items count) in VitaScore formula */
  varietyMultiplier: 25,

  /** Bonus per max combo point in VitaScore formula */
  comboMaxBonus: 10,

  /** Balance reduction when a spoiled product is captured */
  balancePenaltyOnSpoiled: 15,

  /** Balance increase when a correct product is captured */
  balanceGainOnCorrect: 3,

  /** Maximum balance value (clamped) */
  balanceMax: 100,

  /** Precision reduction when a spoiled product is captured */
  precisionPenaltyOnSpoiled: 12,

  /** Precision reduction when an unsolicited product is captured */
  precisionPenaltyOnUnsolicited: 8,

  /** Combo bonus points per consecutive streak */
  comboBonusPerStreak: 5,

  /** Maximum achievable combo bonus */
  comboBonusMax: 50,
};
