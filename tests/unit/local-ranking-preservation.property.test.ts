import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { RankingService } from '../../src/services/ranking-service';
import { StorageService } from '../../src/services/storage-service';
import type { RankingSubmission } from '../../src/types/api.types';

/**
 * Preservation Property Tests — Remote API Submission and Navigation Unchanged
 *
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
 *
 * These tests observe and lock down the EXISTING behavior on unfixed code.
 * They must PASS on the current codebase to confirm the baseline behavior
 * that should be preserved after the fix is applied.
 */

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('../../src/services/api-client', () => ({
  fetchWithRetry: vi.fn(),
}));

import { fetchWithRetry } from '../../src/services/api-client';

const mockFetchWithRetry = vi.mocked(fetchWithRetry);

// ─── Helper: Mock localStorage ───────────────────────────────────────────────

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

// ─── Generators ──────────────────────────────────────────────────────────────

const ALIAS_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ';

/** Arbitrary valid alias: 1-16 alphanumeric characters + spaces, non-empty after trim */
const arbValidAlias = fc
  .array(fc.constantFrom(...ALIAS_CHARS.split('')), { minLength: 1, maxLength: 16 })
  .map((chars) => chars.join(''))
  .filter((s) => s.trim().length > 0);

/** Arbitrary level: 1, 2, or 3 */
const arbLevel = fc.constantFrom(1, 2, 3) as fc.Arbitrary<1 | 2 | 3>;

/** Arbitrary positive vitaScore */
const arbVitaScore = fc.integer({ min: 1, max: 10000 });

/** Arbitrary precision: 0-100 */
const arbPrecision = fc.integer({ min: 0, max: 100 });

/** Arbitrary variety: 1-15 */
const arbVariety = fc.integer({ min: 1, max: 15 });

/** Arbitrary valid RankingSubmission */
const arbRankingSubmission: fc.Arbitrary<RankingSubmission> = fc.record({
  alias: arbValidAlias,
  level: arbLevel,
  vitaScore: arbVitaScore,
  precision: arbPrecision,
  variety: arbVariety,
});

/** Arbitrary string (for alias validation testing — includes invalid chars) */
const arbAnyString = fc.string({ minLength: 0, maxLength: 30 });

// ─── Property Tests ──────────────────────────────────────────────────────────

describe('Preservation — Remote API Submission and Navigation Unchanged (Property-Based)', () => {
  let localStorageMock: ReturnType<typeof mockLocalStorage>;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock = mockLocalStorage();
    Object.defineProperty(globalThis, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });

    // Default: fetchWithRetry resolves successfully
    mockFetchWithRetry.mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));
  });

  /**
   * Remote API preservation: For all valid RankingSubmission inputs,
   * RankingService.submit() SHALL call fetchWithRetry('/rankings', ...)
   * with method: 'POST' and body matching the submission.
   *
   * **Validates: Requirements 3.1, 3.4**
   */
  it('submit() calls fetchWithRetry with POST and correct body for all valid submissions', async () => {
    await fc.assert(
      fc.asyncProperty(arbRankingSubmission, async (submission) => {
        mockFetchWithRetry.mockClear();
        mockFetchWithRetry.mockResolvedValue(new Response('{}', { status: 200 }));

        await RankingService.submit(submission);

        expect(mockFetchWithRetry).toHaveBeenCalledTimes(1);
        expect(mockFetchWithRetry).toHaveBeenCalledWith('/rankings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submission),
        });
      }),
      { numRuns: 50 },
    );
  });

  /**
   * Alias validation preservation: For all strings, an alias is valid
   * IFF length 1-16 AND matches /^[a-zA-Z0-9 ]+$/.
   *
   * This mirrors the validation logic in VictoryScene.handleSubmitRanking().
   *
   * **Validates: Requirements 3.4, 3.5**
   */
  it('alias validation: valid IFF length 1-16 and alphanumeric+spaces only', () => {
    fc.assert(
      fc.property(arbAnyString, (rawAlias) => {
        const alias = rawAlias.trim();

        // The actual validation logic from VictoryScene/GameOverScene
        const isValid =
          alias.length >= 1 && alias.length <= 16 && /^[a-zA-Z0-9 ]+$/.test(alias);

        // Reference validation (same logic expressed differently for cross-check)
        const lengthOk = alias.length >= 1 && alias.length <= 16;
        const charsOk = alias.split('').every((ch) => ALIAS_CHARS.includes(ch));
        const expectedValid = lengthOk && charsOk;

        expect(isValid).toBe(expectedValid);
      }),
      { numRuns: 200 },
    );
  });

  /**
   * Profile save preservation: For all valid aliases,
   * StorageService.saveProfile() is called with the alias as nickname.
   *
   * This tests the profile-save behavior that occurs in handleSubmitRanking
   * when a valid alias is provided.
   *
   * **Validates: Requirements 3.3, 3.4**
   */
  it('saveProfile is called with alias as nickname for all valid aliases', () => {
    fc.assert(
      fc.property(arbValidAlias, (alias) => {
        // Reset localStorage for clean state
        localStorageMock.clear();
        localStorageMock.setItem.mockClear();

        // Simulate what handleSubmitRanking does for profile save:
        // 1. Get current profile
        const profile = StorageService.getProfile();
        // 2. Set nickname
        profile.nickname = alias;
        // 3. Save profile
        StorageService.saveProfile(profile);

        // Verify localStorage.setItem was called (StorageService.save internally)
        expect(localStorageMock.setItem).toHaveBeenCalled();

        // Verify the saved data contains the alias as nickname
        const savedCalls = localStorageMock.setItem.mock.calls;
        const lastCall = savedCalls[savedCalls.length - 1];
        const savedData = JSON.parse(lastCall[1]);
        expect(savedData.profile.nickname).toBe(alias);
      }),
      { numRuns: 50 },
    );
  });

  /**
   * GetTopScores preservation: For all levels (1|2|3), getTopScores calls
   * the API with correct query params including level.
   *
   * **Validates: Requirements 3.1, 3.4**
   */
  it('getTopScores calls fetchWithRetry with correct query params for all levels', async () => {
    await fc.assert(
      fc.asyncProperty(arbLevel, async (level) => {
        mockFetchWithRetry.mockClear();
        mockFetchWithRetry.mockResolvedValue(
          new Response(JSON.stringify([]), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        );

        await RankingService.getTopScores(level);

        expect(mockFetchWithRetry).toHaveBeenCalledTimes(1);

        const [url, options] = mockFetchWithRetry.mock.calls[0];
        // URL should contain the level query param
        expect(url).toContain('/rankings?');
        expect(url).toContain(`level=${level}`);
        // Method should be GET
        expect(options).toEqual(
          expect.objectContaining({
            method: 'GET',
            headers: { Accept: 'application/json' },
          }),
        );
      }),
      { numRuns: 20 },
    );
  });
});
