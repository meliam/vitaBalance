# Implementation Plan

## Overview

Bugfix para agregar persistencia local de rankings en localStorage, implementar deduplicación por matchId, y mantener el top 10 por nivel ordenado por vitaScore descendente. El enfoque sigue la metodología de bug condition: primero se escriben tests que demuestran el bug, luego tests de preservación, después se implementa el fix, y finalmente se valida.

## Tasks

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Local Ranking Persistence and Deduplication
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists (no local persistence, no deduplication)
  - **Scoped PBT Approach**: Scope the property to concrete failing cases:
    - Case 1: Call `RankingService.submit()` with valid data and verify localStorage contains the ranking entry under key `vitabalance_rankings`
    - Case 2: Call submit twice with the same matchId and verify the second attempt is blocked
    - Case 3: Submit 15 entries for the same level and verify only top 10 by vitaScore desc are kept
  - **Bug Condition from design**: `isBugCondition(input)` where `input.action === 'submitRanking' AND (NOT resultPersistedLocally(input.submission, input.matchId) OR alreadySubmitted)`
  - **Expected Behavior**: For any input with a valid alias and unique matchId, the result SHALL be persisted in localStorage (top 10 per level, sorted by vitaScore desc) and the matchId SHALL be marked as submitted
  - Write property-based test in `tests/unit/local-ranking.property.test.ts` using fast-check:
    - Generate arbitrary `RankingSubmission` objects (alias: 1-16 alnum+spaces, level: 1|2|3, vitaScore: positive integer, precision: 0-100, variety: 1-15)
    - Assert: after `saveLocal(entry, matchId)`, `getLocalRankings(level)` contains the entry
    - Assert: after `saveLocal`, `isAlreadySubmitted(matchId)` returns true
    - Assert: `getLocalRankings(level).length <= 10`
    - Assert: rankings are sorted by vitaScore descending
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (methods `saveLocal`, `isAlreadySubmitted`, `getLocalRankings` do not exist yet - confirms the bug exists)
  - Document counterexamples found (e.g., "RankingService has no saveLocal method", "localStorage key vitabalance_rankings does not exist after submit")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Remote API Submission and Navigation Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs:
    - Observe: `RankingService.submit()` calls `fetchWithRetry('/rankings', { method: 'POST', ... })` with the correct payload
    - Observe: `RankingService.getTopScores(level)` calls `fetchWithRetry('/rankings?level=X')` and returns parsed JSON
    - Observe: Alias validation rejects strings outside 1-16 alnum+spaces pattern
    - Observe: Profile nickname is saved via `StorageService.saveProfile()` on valid submission
  - Write property-based test in `tests/unit/local-ranking-preservation.property.test.ts` using fast-check:
    - **Remote API preservation**: For all valid `RankingSubmission` inputs, `RankingService.submit()` SHALL call `fetchWithRetry('/rankings', ...)` with `method: 'POST'` and body matching the submission (mock fetchWithRetry and assert call)
    - **Alias validation preservation**: For all strings, alias is valid IFF length 1-16 AND matches `/^[a-zA-Z0-9 ]+$/`
    - **Profile save preservation**: For all valid aliases, `StorageService.saveProfile()` is called with the alias as nickname
    - **GetTopScores preservation**: For all levels (1|2|3), `getTopScores` calls the API with correct query params
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3. Fix for local ranking persistence and deduplication

  - [x] 3.1 Add `LocalRankingEntry` and `LocalRankingData` interfaces to `src/types/game.types.ts`
    - Add `LocalRankingEntry` with fields: alias (string), level (1|2|3), vitaScore (number), precision (number), variety (number), matchId (string), createdAt (string)
    - Add `LocalRankingData` as `Record<string, LocalRankingEntry[]>` mapping level keys to entry arrays
    - _Requirements: 2.1_

  - [x] 3.2 Add local ranking methods to `src/services/ranking-service.ts`
    - Add constant `LOCAL_RANKING_KEY = 'vitabalance_rankings'` (separate from SaveData key)
    - Add static method `saveLocal(entry: RankingSubmission, matchId: string): void` — persists entry to localStorage, sorts by vitaScore desc, truncates to 10 per level
    - Add static method `isAlreadySubmitted(matchId: string): boolean` — checks if matchId exists in any level's local rankings
    - Add static method `getLocalRankings(level: 1 | 2 | 3): LocalRankingEntry[]` — returns local rankings for a level
    - Wrap all localStorage operations in try/catch for resilient error handling (consistent with StorageService pattern)
    - _Bug_Condition: isBugCondition(input) where input.action === 'submitRanking' AND NOT resultPersistedLocally_
    - _Expected_Behavior: saveLocal persists entry, sorts desc by vitaScore, truncates to 10; isAlreadySubmitted returns true for existing matchId_
    - _Preservation: Remote API submission via fetchWithRetry('/rankings') unchanged; getTopScores unchanged_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 3.3 Modify `src/scenes/VictoryScene.ts` for local persistence and deduplication
    - Add `private matchId!: string` property
    - Add `private submitted = false` property
    - Generate matchId in `init()`: `this.matchId = Date.now().toString(36) + Math.random().toString(36).slice(2)`
    - Modify `handleSubmitRanking()`:
      - Check `this.submitted` flag — if true, show toast "Ya registrado" and return
      - Check `RankingService.isAlreadySubmitted(this.matchId)` — if true, show toast and return
      - Call `RankingService.saveLocal(submission, this.matchId)` before remote submit
      - Set `this.submitted = true` after successful local save
      - On remote API success: show "¡Puntaje enviado!" toast
      - On remote API failure: show "Resultado guardado localmente" differentiated toast
    - _Bug_Condition: isBugCondition(input) where submitted flag not checked, no local save_
    - _Expected_Behavior: matchId generated per scene init; submitted flag prevents duplicates; saveLocal persists before remote_
    - _Preservation: Remote API call still attempted; navigation buttons unchanged; alias validation unchanged_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 3.4 Modify `src/scenes/GameOverScene.ts` with same local persistence and deduplication logic
    - Same changes as VictoryScene: matchId property, submitted flag, generate matchId in init(), modify handleSubmitRanking() with deduplication + local save + differentiated toasts
    - _Bug_Condition: Same as VictoryScene — no local persistence, no deduplication_
    - _Expected_Behavior: Same as VictoryScene — local save + dedup + differentiated feedback_
    - _Preservation: Remote API call still attempted; navigation buttons (Reintentar, Menú) unchanged; alias validation unchanged_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 3.5 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Local Ranking Persistence and Deduplication
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1: `pnpm vitest run tests/unit/local-ranking.property.test.ts`
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed — saveLocal, isAlreadySubmitted, getLocalRankings work correctly)
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.6 Verify preservation tests still pass
    - **Property 2: Preservation** - Remote API Submission and Navigation Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2: `pnpm vitest run tests/unit/local-ranking-preservation.property.test.ts`
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions — remote API submission, alias validation, profile save all unchanged)
    - Confirm all tests still pass after fix (no regressions)

- [x] 4. Checkpoint - Ensure all tests pass
  - Run full test suite: `pnpm vitest run`
  - Verify all property-based tests pass (local-ranking.property.test.ts and local-ranking-preservation.property.test.ts)
  - Verify all existing tests still pass (scoring-system, objective-system, progress-system, spawn-system, storage-service, etc.)
  - Ensure no TypeScript compilation errors: `pnpm tsc --noEmit`
  - Ensure no lint errors: `pnpm lint`
  - Ask the user if questions arise


## Notes

- Property-based tests use fast-check library with Vitest
- All localStorage operations use separate key `vitabalance_rankings` to avoid polluting existing `vitabalance_save` data
- matchId generation uses `Date.now().toString(36) + Math.random().toString(36).slice(2)` for uniqueness
- The fix preserves the existing remote API submission — local save is additive, not a replacement
- All new methods in RankingService follow the same resilient error handling pattern (try/catch, silent failure) as the rest of the codebase

## Task Dependency Graph

```json
{
  "waves": [
    {
      "wave": 1,
      "tasks": ["1", "2"]
    },
    {
      "wave": 2,
      "tasks": ["3.1"]
    },
    {
      "wave": 3,
      "tasks": ["3.2"]
    },
    {
      "wave": 4,
      "tasks": ["3.3", "3.4"]
    },
    {
      "wave": 5,
      "tasks": ["3.5"]
    },
    {
      "wave": 6,
      "tasks": ["3.6"]
    },
    {
      "wave": 7,
      "tasks": ["4"]
    }
  ]
}
```
