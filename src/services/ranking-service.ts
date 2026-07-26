/**
 * Ranking service for submitting and retrieving leaderboard scores.
 * Uses fetchWithRetry internally; catches all errors and fails silently
 * so the game continues operating without interruption (Req 12.4).
 */

import type { RankingEntry, RankingSubmission } from '../types/api.types';
import type { LocalRankingData, LocalRankingEntry } from '../types/game.types';
import { fetchWithRetry } from './api-client';

const LOCAL_RANKING_KEY = 'vitabalance_rankings';

export class RankingService {
  /**
   * Submits a player's score to the ranking API.
   * Requires only an anonymous alias — no real name, email, or password (Req 12.3).
   * Stores alias, VitaScore, precision, variety, and timestamp (Req 12.1).
   * Fails silently on any error (Req 12.4).
   */
  static async submit(entry: RankingSubmission): Promise<void> {
    try {
      await fetchWithRetry('/rankings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
    } catch {
      // Fail silently — game continues without interruption (Req 12.4)
    }
  }

  /**
   * Retrieves top scores for a given level, ordered by VitaScore descending (Req 12.2).
   * Returns an empty array on any error (Req 12.4).
   *
   * @param level - The game level (1, 2, or 3).
   * @param limit - Maximum number of entries to retrieve (default handled by API).
   */
  static async getTopScores(
    level: 1 | 2 | 3,
    limit?: number,
  ): Promise<RankingEntry[]> {
    try {
      const params = new URLSearchParams({ level: String(level) });
      if (limit !== undefined) {
        params.set('limit', String(limit));
      }

      const response = await fetchWithRetry(`/rankings?${params.toString()}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      const data: RankingEntry[] = await response.json();
      return data;
    } catch {
      // Fail silently — return empty array (Req 12.4)
      return [];
    }
  }

  /**
   * Persists a ranking entry to localStorage under the local rankings key.
   * Sorts by vitaScore descending and keeps at most 10 entries per level.
   * Fails silently on any error (consistent with StorageService pattern).
   */
  static saveLocal(entry: RankingSubmission, matchId: string): void {
    try {
      const raw = localStorage.getItem(LOCAL_RANKING_KEY);
      const data: LocalRankingData = raw ? JSON.parse(raw) : {};

      const levelKey = String(entry.level);
      if (!data[levelKey]) {
        data[levelKey] = [];
      }

      const newEntry: LocalRankingEntry = {
        alias: entry.alias,
        level: entry.level,
        vitaScore: entry.vitaScore,
        precision: entry.precision,
        variety: entry.variety,
        matchId,
        createdAt: new Date().toISOString(),
      };

      data[levelKey].push(newEntry);
      data[levelKey].sort((a, b) => b.vitaScore - a.vitaScore);
      data[levelKey] = data[levelKey].slice(0, 10);

      localStorage.setItem(LOCAL_RANKING_KEY, JSON.stringify(data));
    } catch {
      // Fail silently — game continues without interruption
    }
  }

  /**
   * Checks if a matchId has already been submitted in any level's local rankings.
   * Returns false on any error (consistent with StorageService pattern).
   */
  static isAlreadySubmitted(matchId: string): boolean {
    try {
      const raw = localStorage.getItem(LOCAL_RANKING_KEY);
      if (!raw) return false;

      const data: LocalRankingData = JSON.parse(raw);
      for (const levelKey of Object.keys(data)) {
        if (data[levelKey].some((entry) => entry.matchId === matchId)) {
          return true;
        }
      }
      return false;
    } catch {
      // Fail silently — assume not submitted
      return false;
    }
  }

  /**
   * Returns local rankings for a given level, or an empty array if none exist.
   * Returns empty array on any error (consistent with StorageService pattern).
   */
  static getLocalRankings(level: 1 | 2 | 3): LocalRankingEntry[] {
    try {
      const raw = localStorage.getItem(LOCAL_RANKING_KEY);
      if (!raw) return [];

      const data: LocalRankingData = JSON.parse(raw);
      return data[String(level)] ?? [];
    } catch {
      // Fail silently — return empty array
      return [];
    }
  }
}
