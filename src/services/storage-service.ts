/**
 * Storage service for persisting game progress, settings, and profile data.
 * Wraps localStorage with resilient error handling — returns defaults on failure
 * and catches write errors silently so the game never breaks due to storage issues.
 */

import type { ProgressData, ProfileData, SaveData, SettingsData } from '../types/game.types';

const STORAGE_KEY = 'vitabalance_save';

const DEFAULT_PROGRESS: ProgressData = {
  levelsCompleted: [],
  unlockedLevel: 1,
  outfitLevel: 0,
};

const DEFAULT_SETTINGS: SettingsData = {
  reduceMotion: false,
  musicEnabled: true,
  volume: 0.7,
};

const DEFAULT_PROFILE: ProfileData = {
  nickname: 'Jugador',
  totalVitaScore: 0,
  totalPoints: 0,
};

export const DEFAULT_SAVE_DATA: SaveData = {
  version: 1,
  progress: DEFAULT_PROGRESS,
  settings: DEFAULT_SETTINGS,
  profile: DEFAULT_PROFILE,
};

/**
 * Static service for localStorage persistence.
 * All methods are wrapped in try/catch — on any failure they return defaults
 * or silently swallow the error, ensuring the game operates without interruption.
 */
export class StorageService {
  /**
   * Loads the full save data from localStorage.
   * Returns DEFAULT_SAVE_DATA if storage is unavailable or data is corrupted.
   */
  static load(): SaveData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return { ...DEFAULT_SAVE_DATA };
      }
      const parsed: SaveData = JSON.parse(raw);
      return parsed;
    } catch {
      return { ...DEFAULT_SAVE_DATA };
    }
  }

  /**
   * Persists the full save data to localStorage.
   * Silently catches any write errors.
   */
  static save(data: SaveData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Silent failure — game continues without persistence
    }
  }

  /**
   * Resets all saved data by removing the storage key.
   */
  static reset(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Silent failure
    }
  }

  /**
   * Loads only the progress section from saved data.
   */
  static getProgress(): ProgressData {
    try {
      const data = StorageService.load();
      return data.progress;
    } catch {
      return { ...DEFAULT_PROGRESS };
    }
  }

  /**
   * Persists updated progress data immediately.
   */
  static saveProgress(progress: ProgressData): void {
    try {
      const data = StorageService.load();
      data.progress = progress;
      StorageService.save(data);
    } catch {
      // Silent failure
    }
  }

  /**
   * Loads only the settings section from saved data.
   */
  static getSettings(): SettingsData {
    try {
      const data = StorageService.load();
      return data.settings;
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  /**
   * Persists updated settings data immediately.
   */
  static saveSettings(settings: SettingsData): void {
    try {
      const data = StorageService.load();
      data.settings = settings;
      StorageService.save(data);
    } catch {
      // Silent failure
    }
  }

  /**
   * Loads only the profile section from saved data.
   */
  static getProfile(): ProfileData {
    try {
      const data = StorageService.load();
      return data.profile;
    } catch {
      return { ...DEFAULT_PROFILE };
    }
  }

  /**
   * Persists updated profile data immediately (including nickname for ranking).
   */
  static saveProfile(profile: ProfileData): void {
    try {
      const data = StorageService.load();
      data.profile = profile;
      StorageService.save(data);
    } catch {
      // Silent failure
    }
  }
}
