import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageService, DEFAULT_SAVE_DATA } from '../../src/services/storage-service';
import type { ProgressData, SettingsData, ProfileData, SaveData } from '../../src/types/game.types';

// ─── Helper: Mock localStorage ───────────────────────────────────────────────

const STORAGE_KEY = 'vitabalance_save';

function mockLocalStorage() {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
}

// ─── Unit Tests: Storage Service ─────────────────────────────────────────────

describe('Storage Service', () => {
  let localStorageMock: ReturnType<typeof mockLocalStorage>;

  beforeEach(() => {
    localStorageMock = mockLocalStorage();
    Object.defineProperty(globalThis, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });
  });

  describe('Load/Save round trip', () => {
    it('save data then load returns the same data', () => {
      const data: SaveData = {
        version: 1,
        progress: { levelsCompleted: [1, 2], unlockedLevel: 3, outfitLevel: 2 },
        settings: { reduceMotion: true, musicEnabled: false, volume: 0.5 },
        profile: { nickname: 'TestPlayer', totalVitaScore: 500, totalPoints: 1200 },
      };

      StorageService.save(data);
      const loaded = StorageService.load();

      expect(loaded).toEqual(data);
    });
  });

  describe('Load with no saved data', () => {
    it('returns DEFAULT_SAVE_DATA when localStorage is empty', () => {
      const loaded = StorageService.load();

      expect(loaded).toEqual(DEFAULT_SAVE_DATA);
    });
  });

  describe('Corrupted data fallback', () => {
    it('returns DEFAULT_SAVE_DATA when localStorage has invalid JSON', () => {
      localStorageMock.getItem.mockReturnValue('this is not valid json{{{');

      const loaded = StorageService.load();

      expect(loaded).toEqual(DEFAULT_SAVE_DATA);
    });

    it('does not throw when data is corrupted', () => {
      localStorageMock.getItem.mockReturnValue('corrupted!!!');

      expect(() => StorageService.load()).not.toThrow();
    });
  });

  describe('Unavailable localStorage', () => {
    it('returns DEFAULT_SAVE_DATA when localStorage.getItem throws', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage is not available');
      });

      const loaded = StorageService.load();

      expect(loaded).toEqual(DEFAULT_SAVE_DATA);
    });

    it('does not throw when localStorage.getItem throws', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('SecurityError: access denied');
      });

      expect(() => StorageService.load()).not.toThrow();
    });
  });

  describe('Save when localStorage is unavailable', () => {
    it('does not throw when localStorage.setItem throws', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      const data: SaveData = { ...DEFAULT_SAVE_DATA };

      expect(() => StorageService.save(data)).not.toThrow();
    });
  });

  describe('getProgress / saveProgress', () => {
    it('saves progress and retrieves it correctly', () => {
      const progress: ProgressData = {
        levelsCompleted: [1, 2],
        unlockedLevel: 3,
        outfitLevel: 2,
      };

      StorageService.saveProgress(progress);
      const loaded = StorageService.getProgress();

      expect(loaded).toEqual(progress);
    });

    it('returns default progress when no data is saved', () => {
      const progress = StorageService.getProgress();

      expect(progress).toEqual(DEFAULT_SAVE_DATA.progress);
    });
  });

  describe('getSettings / saveSettings', () => {
    it('saves settings and retrieves them correctly', () => {
      const settings: SettingsData = {
        reduceMotion: true,
        musicEnabled: false,
        volume: 0.3,
      };

      StorageService.saveSettings(settings);
      const loaded = StorageService.getSettings();

      expect(loaded).toEqual(settings);
    });

    it('returns default settings when no data is saved', () => {
      const settings = StorageService.getSettings();

      expect(settings).toEqual(DEFAULT_SAVE_DATA.settings);
    });
  });

  describe('getProfile / saveProfile', () => {
    it('saves profile and retrieves it correctly (nickname persistence)', () => {
      const profile: ProfileData = {
        nickname: 'VitaHero42',
        totalVitaScore: 1500,
        totalPoints: 3000,
      };

      StorageService.saveProfile(profile);
      const loaded = StorageService.getProfile();

      expect(loaded).toEqual(profile);
      expect(loaded.nickname).toBe('VitaHero42');
    });

    it('returns default profile when no data is saved', () => {
      const profile = StorageService.getProfile();

      expect(profile).toEqual(DEFAULT_SAVE_DATA.profile);
      expect(profile.nickname).toBe('Jugador');
    });
  });

  describe('reset', () => {
    it('removes stored data, subsequent load returns defaults', () => {
      const data: SaveData = {
        version: 1,
        progress: { levelsCompleted: [1], unlockedLevel: 2, outfitLevel: 1 },
        settings: { reduceMotion: false, musicEnabled: true, volume: 0.9 },
        profile: { nickname: 'ResetTest', totalVitaScore: 100, totalPoints: 200 },
      };

      StorageService.save(data);
      expect(StorageService.load()).toEqual(data);

      StorageService.reset();
      const loaded = StorageService.load();

      expect(loaded).toEqual(DEFAULT_SAVE_DATA);
    });

    it('does not throw when localStorage.removeItem throws', () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      expect(() => StorageService.reset()).not.toThrow();
    });
  });
});
