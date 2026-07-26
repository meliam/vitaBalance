/**
 * Ranking service for submitting and retrieving leaderboard scores.
 *
 * Uses localStorage as primary persistent store so rankings survive
 * page reloads and work offline. Also attempts to sync with the remote API
 * when VITE_API_URL is configured.
 *
 * @see Requirements 12.1–12.4
 */

import type { RankingEntry, RankingSubmission } from '../types/api.types';
import { fetchWithRetry } from './api-client';

const RANKING_STORAGE_KEY = 'vitabalance_rankings';

/**
 * Returns true if a remote API endpoint is configured.
 */
function hasRemoteApi(): boolean {
  const url = import.meta.env.VITE_API_URL ?? '';
  return url.length > 0;
}

export class RankingService {
  /**
   * Submits a player's score.
   * Always saves to localStorage for persistence.
   * Also sends to remote API if VITE_API_URL is configured.
   * Returns true on successful save.
   */
  static async submit(entry: RankingSubmission): Promise<boolean> {
    // Always save locally
    const saved = RankingService.saveToLocalStorage(entry);

    // Also try remote API if configured
    if (hasRemoteApi()) {
      try {
        await fetchWithRetry('/rankings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry),
        });
      } catch {
        // Remote unavailable — localStorage already has the data
      }
    }

    return saved;
  }

  /**
   * Retrieves top scores for a given level, ordered by VitaScore descending.
   * Reads from localStorage. If a remote API is configured, merges remote data.
   *
   * @param level - The game level (1, 2, or 3).
   * @param limit - Maximum number of entries to retrieve (default: 10).
   */
  static async getTopScores(
    level: 1 | 2 | 3,
    limit: number = 10,
  ): Promise<RankingEntry[]> {
    // Read from localStorage (always available)
    const localEntries = RankingService.getFromLocalStorage(level);

    // Try to merge remote data if API is configured
    if (hasRemoteApi()) {
      try {
        const params = new URLSearchParams({ level: String(level) });
        params.set('limit', String(limit));

        const response = await fetchWithRetry(`/rankings?${params.toString()}`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
        });
        const remoteEntries: RankingEntry[] = await response.json();

        // Merge and deduplicate
        const merged = RankingService.mergeEntries(localEntries, remoteEntries);
        return merged.slice(0, limit);
      } catch {
        // Remote unavailable — use local only
      }
    }

    return localEntries.slice(0, limit);
  }

  // ─── LocalStorage Helpers ──────────────────────────────────────────────────

  private static saveToLocalStorage(entry: RankingSubmission): boolean {
    try {
      const all = RankingService.getAllFromLocalStorage();

      const record = {
        alias: entry.alias,
        vitaScore: entry.vitaScore,
        precision: entry.precision,
        variety: entry.variety,
        createdAt: new Date().toISOString(),
        level: entry.level,
      };

      all.push(record);
      localStorage.setItem(RANKING_STORAGE_KEY, JSON.stringify(all));
      return true;
    } catch {
      return false;
    }
  }

  private static getFromLocalStorage(level: 1 | 2 | 3): RankingEntry[] {
    try {
      const all = RankingService.getAllFromLocalStorage();
      return all
        .filter((r) => Number(r.level) === Number(level))
        .sort((a, b) => b.vitaScore - a.vitaScore)
        .map(({ alias, vitaScore, precision, variety, createdAt }) => ({
          alias,
          vitaScore,
          precision,
          variety,
          createdAt,
        }));
    } catch {
      return [];
    }
  }

  private static getAllFromLocalStorage(): Array<RankingEntry & { level: number }> {
    try {
      const raw = localStorage.getItem(RANKING_STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  private static mergeEntries(local: RankingEntry[], remote: RankingEntry[]): RankingEntry[] {
    const seen = new Set<string>();
    const merged: RankingEntry[] = [];

    for (const entry of [...local, ...remote]) {
      const key = `${entry.alias}|${entry.vitaScore}|${entry.createdAt}`;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(entry);
      }
    }

    return merged.sort((a, b) => b.vitaScore - a.vitaScore);
  }
}
