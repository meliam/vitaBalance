import { describe, it, expect } from 'vitest';
import {
  handleLevelComplete,
  isLevelUnlocked,
  getRewardForLevel,
} from '../../src/systems/progress-system';
import type { ProgressData } from '../../src/types/game.types';

describe('Progress System — Unit Tests', () => {
  describe('Completing level 1 unlocks level 2', () => {
    it('should add level 1 to levelsCompleted, set unlockedLevel to 2, and outfitLevel to 1', () => {
      const progress: ProgressData = { levelsCompleted: [], unlockedLevel: 1, outfitLevel: 0 };

      const result = handleLevelComplete(1, true, progress);

      expect(result.levelsCompleted).toContain(1);
      expect(result.unlockedLevel).toBe(2);
      expect(result.outfitLevel).toBe(1); // Gorra Cítrica
      expect(isLevelUnlocked(2, result)).toBe(true);
    });
  });

  describe('Completing level 2 unlocks level 3', () => {
    it('should add level 2 to levelsCompleted, set unlockedLevel to 3, and outfitLevel to 2', () => {
      const progress: ProgressData = { levelsCompleted: [1], unlockedLevel: 2, outfitLevel: 1 };

      const result = handleLevelComplete(2, true, progress);

      expect(result.levelsCompleted).toContain(2);
      expect(result.unlockedLevel).toBe(3);
      expect(result.outfitLevel).toBe(2); // Remera VitaBalance
      expect(isLevelUnlocked(3, result)).toBe(true);
    });
  });

  describe('Locked level returns false from isLevelUnlocked', () => {
    it('should return false for levels 2 and 3 when no levels are completed', () => {
      const progress: ProgressData = { levelsCompleted: [], unlockedLevel: 1, outfitLevel: 0 };

      expect(isLevelUnlocked(2, progress)).toBe(false);
      expect(isLevelUnlocked(3, progress)).toBe(false);
    });
  });

  describe('Losing does not unlock next level', () => {
    it('should return progress unchanged when the player loses', () => {
      const progress: ProgressData = { levelsCompleted: [], unlockedLevel: 1, outfitLevel: 0 };

      const result = handleLevelComplete(1, false, progress);

      expect(result).toBe(progress);
      expect(result.levelsCompleted).toHaveLength(0);
      expect(result.unlockedLevel).toBe(1);
      expect(isLevelUnlocked(2, result)).toBe(false);
    });
  });

  describe('getRewardForLevel returns correct rewards', () => {
    it('should return Gorra Cítrica for level 1', () => {
      const reward = getRewardForLevel(1);

      expect(reward).toEqual({ name: 'Gorra Cítrica', emoji: '🧢', outfitLevel: 1 });
    });

    it('should return Remera VitaBalance for level 2', () => {
      const reward = getRewardForLevel(2);

      expect(reward).toEqual({ name: 'Remera VitaBalance', emoji: '👕', outfitLevel: 2 });
    });

    it('should return Capa VitaHero for level 3', () => {
      const reward = getRewardForLevel(3);

      expect(reward).toEqual({ name: 'Capa VitaHero', emoji: '🦸', outfitLevel: 3 });
    });
  });
});
