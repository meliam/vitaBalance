/**
 * Ranking service for submitting and retrieving leaderboard scores.
 * Uses fetchWithRetry internally; catches all errors and fails silently
 * so the game continues operating without interruption (Req 12.4).
 */

import type { RankingEntry, RankingSubmission } from '../types/api.types';
import { fetchWithRetry } from './api-client';

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
}
