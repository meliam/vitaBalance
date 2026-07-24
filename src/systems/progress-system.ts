import type { AvatarReward, ProgressData } from '../types/game.types';
import { LEVELS } from '../config/levels';

/**
 * Progress system — manages level completion, unlocking, and rewards.
 *
 * Pure functions with no side effects or Phaser dependencies.
 * All reward data is read from the LEVELS config.
 *
 * @see Requirements 5.4, 6.4, 7.4, 9.1–9.5, 22.1–22.6
 */

/**
 * Handles level completion logic.
 *
 * If the player won:
 * - Adds the level to levelsCompleted (if not already present)
 * - Unlocks the next level (capped at 3)
 * - Sets outfitLevel to the level's reward outfitLevel
 *
 * If the player lost, returns progress unchanged.
 */
export function handleLevelComplete(
  level: number,
  won: boolean,
  progress: ProgressData,
): ProgressData {
  if (!won) {
    return progress;
  }

  const levelsCompleted = progress.levelsCompleted.includes(level)
    ? [...progress.levelsCompleted]
    : [...progress.levelsCompleted, level];

  const unlockedLevel = Math.min(level + 1, 3) as 1 | 2 | 3;

  const reward = getRewardForLevel(level);
  const outfitLevel = reward.outfitLevel;

  return {
    levelsCompleted,
    unlockedLevel,
    outfitLevel,
  };
}

/**
 * Checks whether a given level is unlocked for the player.
 *
 * - Level 1 is always unlocked.
 * - Level N (N > 1) requires level N-1 to be in levelsCompleted.
 */
export function isLevelUnlocked(level: number, progress: ProgressData): boolean {
  if (level === 1) {
    return true;
  }
  return progress.levelsCompleted.includes(level - 1);
}

/**
 * Returns the avatar reward for a given level from the LEVELS config.
 */
export function getRewardForLevel(level: number): AvatarReward {
  const levelConfig = LEVELS.find((l) => l.id === level);
  if (!levelConfig) {
    return { name: '', emoji: '', outfitLevel: 0 };
  }
  return levelConfig.reward;
}
