import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { RankingService } from '../../src/services/ranking-service';
import type { RankingSubmission } from '../../src/types/api.types';

/**
 * Bug Condition Exploration Test — Local Ranking Persistence and Deduplication
 *
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3**
 *
 * This test encodes the EXPECTED behavior after the fix:
 * - saveLocal persists entries to localStorage
 * - isAlreadySubmitted detects duplicate matchIds
 * - getLocalRankings returns sorted top-10 per level
 *
 * On UNFIXED code, these methods do not exist, so the test FAILS —
 * confirming the bug condition is present.
 */

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
const MATCH_ID_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';

/** Arbitrary alias: 1-16 alphanumeric characters + spaces, non-empty after trim */
const arbAlias = fc
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

/** Arbitrary RankingSubmission */
const arbRankingSubmission: fc.Arbitrary<RankingSubmission> = fc.record({
  alias: arbAlias,
  level: arbLevel,
  vitaScore: arbVitaScore,
  precision: arbPrecision,
  variety: arbVariety,
});

/** Arbitrary matchId: unique-ish string */
const arbMatchId = fc
  .array(fc.constantFrom(...MATCH_ID_CHARS.split('')), { minLength: 8, maxLength: 20 })
  .map((chars) => chars.join(''));

// ─── Property Tests ──────────────────────────────────────────────────────────

describe('Local Ranking — Bug Condition Exploration (Property-Based)', () => {
  let localStorageMock: ReturnType<typeof mockLocalStorage>;

  beforeEach(() => {
    localStorageMock = mockLocalStorage();
    Object.defineProperty(globalThis, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });
  });

  /**
   * Case 1: After saveLocal, getLocalRankings contains the entry
   *
   * **Validates: Requirements 1.1, 2.1**
   *
   * For any valid RankingSubmission and unique matchId, calling
   * saveLocal(entry, matchId) SHALL result in the entry being
   * retrievable via getLocalRankings(level).
   */
  it('saveLocal persists entry and getLocalRankings retrieves it', () => {
    fc.assert(
      fc.property(arbRankingSubmission, arbMatchId, (submission, matchId) => {
        // Reset localStorage between iterations
        localStorageMock.clear();

        // Call saveLocal — this method does not exist on unfixed code
        RankingService.saveLocal(submission, matchId);

        // Verify entry is retrievable
        const rankings = RankingService.getLocalRankings(submission.level);
        const found = rankings.some(
          (entry) => entry.matchId === matchId && entry.vitaScore === submission.vitaScore,
        );

        expect(found).toBe(true);
      }),
      { numRuns: 50 },
    );
  });

  /**
   * Case 2: After saveLocal, isAlreadySubmitted returns true for same matchId
   *
   * **Validates: Requirements 1.3, 2.2**
   *
   * For any valid RankingSubmission and matchId, after calling
   * saveLocal(entry, matchId), isAlreadySubmitted(matchId) SHALL return true.
   */
  it('isAlreadySubmitted returns true after saveLocal with same matchId', () => {
    fc.assert(
      fc.property(arbRankingSubmission, arbMatchId, (submission, matchId) => {
        localStorageMock.clear();

        RankingService.saveLocal(submission, matchId);

        const alreadySubmitted = RankingService.isAlreadySubmitted(matchId);
        expect(alreadySubmitted).toBe(true);
      }),
      { numRuns: 50 },
    );
  });

  /**
   * Case 3: Rankings per level are capped at 10 and sorted by vitaScore desc
   *
   * **Validates: Requirements 1.2, 1.4, 2.3**
   *
   * After submitting 15 entries for the same level, getLocalRankings SHALL
   * return at most 10 entries, sorted by vitaScore descending.
   */
  it('getLocalRankings returns at most 10 entries sorted by vitaScore desc', () => {
    fc.assert(
      fc.property(
        arbLevel,
        fc.array(fc.tuple(arbRankingSubmission, arbMatchId), { minLength: 15, maxLength: 15 }),
        (level, entries) => {
          localStorageMock.clear();

          // Submit 15 entries for the same level
          for (const [submission, matchId] of entries) {
            const entryForLevel: RankingSubmission = { ...submission, level };
            RankingService.saveLocal(entryForLevel, matchId);
          }

          const rankings = RankingService.getLocalRankings(level);

          // At most 10 entries
          expect(rankings.length).toBeLessThanOrEqual(10);

          // Sorted by vitaScore descending
          for (let i = 1; i < rankings.length; i++) {
            expect(rankings[i - 1].vitaScore).toBeGreaterThanOrEqual(rankings[i].vitaScore);
          }
        },
      ),
      { numRuns: 20 },
    );
  });
});
