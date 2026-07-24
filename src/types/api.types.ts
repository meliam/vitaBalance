/**
 * API type definitions for VitaBalance ranking service.
 * Defines request/response interfaces for the ranking REST API
 * (API Gateway + Lambda + DynamoDB).
 */

// ─── Ranking Models ──────────────────────────────────────────────────────────

/**
 * Payload sent when a player submits their score to the ranking.
 * Requires only an anonymous alias — no real name, email, or password.
 */
export interface RankingSubmission {
  alias: string;
  level: 1 | 2 | 3;
  vitaScore: number;
  precision: number;
  variety: number;
}

/**
 * A single entry returned from the ranking leaderboard query.
 * Ordered by vitaScore descending.
 */
export interface RankingEntry {
  alias: string;
  vitaScore: number;
  precision: number;
  variety: number;
  createdAt: string;
}
