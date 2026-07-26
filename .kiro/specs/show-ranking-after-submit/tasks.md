# Implementation Plan: Show Ranking After Submit

## Overview

Modify VictoryScene and GameOverScene to automatically navigate the player to RankingScene after submitting their score. Add a 2-second delay for reading the toast, pass the played level as a parameter so RankingScene pre-selects the correct tab, and handle error/validation cases where navigation should be blocked. Update RankingScene to accept and validate the level parameter via its `init()` method.

## Tasks

- [x] 1. Add level parameter support to RankingScene
  - [x] 1.1 Add `init(data)` method to RankingScene that receives and validates the level parameter
    - Add `init(data?: { level?: number }): void` method before `create()`
    - If `data.level` is exactly 1, 2, or 3, set `this.selectedLevel` to that value
    - Otherwise default `this.selectedLevel` to 1
    - This ensures RankingScene pre-selects the correct tab when opened from result scenes
    - _Requirements: 1.3, 1.4, 2.4, 4.3_

  - [ ]* 1.2 Write property tests for RankingScene level parameter initialization
    - **Property 2: Level parameter initialization** — For any value where `data.level` is exactly 1, 2, or 3, `selectedLevel` equals that value
    - **Property 3: Invalid level parameter defaults to 1** — For any value that is NOT 1, 2, or 3 (undefined, null, 0, negatives, >3, non-numbers), `selectedLevel` equals 1
    - **Validates: Requirements 1.3, 1.4, 2.4, 4.3**

  - [x] 1.3 Set initial keyboard focus on the first level-selector tab when RankingScene loads
    - After `setupKeyboardNavigation()` in `create()`, ensure `this.focusableElements[0].setFocused(true)` targets the first tab button (already exists, verify behavior)
    - _Requirements: 6.1_

- [-] 2. Implement delayed transition in VictoryScene after submission
  - [x] 2.1 Add `transitionBlocked` and `pendingTransition` properties to VictoryScene
    - Add `private transitionBlocked = false` property
    - Add `private pendingTransition: Phaser.Time.TimerEvent | null = null` property
    - _Requirements: 3.1, 3.3_

  - [x] 2.2 Modify `handleSubmitRanking()` in VictoryScene to wrap `saveLocal()` in try/catch and schedule navigation
    - Wrap `RankingService.saveLocal(submission, this.matchId)` in a try/catch block
    - If `saveLocal()` throws, show error Toast ("No se pudo guardar") and return without navigating
    - If `saveLocal()` succeeds, verify the save by calling `RankingService.isAlreadySubmitted(this.matchId)` — if false, show error toast and return
    - After showing the confirmation/failure toast, call `scheduleRankingTransition()`
    - Remove the existing try/catch around `RankingService.submit()` and make it fire-and-forget (don't await result before scheduling transition)
    - _Requirements: 1.1, 2.1, 2.3, 3.1, 5.1, 5.3_

  - [x] 2.3 Add `scheduleRankingTransition()` method to VictoryScene
    - Disable all buttons in `this.focusableElements` using `btn.setEnabled(false)`
    - Set `this.transitionBlocked = true`
    - Schedule `this.pendingTransition = this.time.delayedCall(2000, () => this.scene.start('RankingScene', { level: this.level }))`
    - _Requirements: 1.1, 2.1, 3.1_

  - [x] 2.4 Block navigation inputs (Tab, Escape) during the transition delay in VictoryScene
    - Modify `setupKeyboardNavigation()` so that Tab and Escape handlers check `this.transitionBlocked` and return early if true
    - _Requirements: 3.3_

  - [x] 2.5 Add `shutdown()` method to VictoryScene to cancel pending transition on scene destroy
    - If `this.pendingTransition` is not null, call `this.pendingTransition.remove(false)` and set it to null
    - _Requirements: 3.4_

  - [ ]* 2.6 Write property test: successful submission navigates with correct level (VictoryScene)
    - **Property 1: Successful submission navigates with correct level**
    - For any valid level (1, 2, 3) and valid alias, if `saveLocal()` succeeds, the handler schedules navigation to RankingScene with that exact level value
    - **Validates: Requirements 1.1, 2.1**

  - [ ]* 2.7 Write property test: invalid alias blocks navigation (VictoryScene)
    - **Property 4: Invalid alias blocks navigation**
    - For any string that fails validation (empty, >16 chars, non-alphanumeric/non-space), the handler does NOT schedule navigation
    - **Validates: Requirements 5.1**

  - [ ]* 2.8 Write property test: deduplication blocks navigation (VictoryScene)
    - **Property 5: Deduplication blocks navigation**
    - If in-memory `submitted` flag is true OR `isAlreadySubmitted(matchId)` returns true, no navigation is scheduled
    - **Validates: Requirements 5.3**

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement delayed transition in GameOverScene after submission
  - [x] 4.1 Add `transitionBlocked` and `pendingTransition` properties to GameOverScene
    - Add `private transitionBlocked = false` property
    - Add `private pendingTransition: Phaser.Time.TimerEvent | null = null` property
    - _Requirements: 3.2, 3.3_

  - [x] 4.2 Modify `handleSubmitRanking()` in GameOverScene to wrap `saveLocal()` in try/catch and schedule navigation
    - Wrap `RankingService.saveLocal(submission, this.matchId)` in a try/catch block
    - If `saveLocal()` throws, show error Toast ("No se pudo guardar") and return without navigating
    - If `saveLocal()` succeeds, verify the save by calling `RankingService.isAlreadySubmitted(this.matchId)` — if false, show error toast and return
    - After showing the confirmation/failure toast, call `scheduleRankingTransition()`
    - Make `RankingService.submit()` fire-and-forget (don't await result before scheduling transition)
    - _Requirements: 1.2, 2.2, 2.3, 3.2, 5.2, 5.4_

  - [x] 4.3 Add `scheduleRankingTransition()` method to GameOverScene
    - Disable all buttons in `this.focusableElements` using `btn.setEnabled(false)`
    - Set `this.transitionBlocked = true`
    - Schedule `this.pendingTransition = this.time.delayedCall(2000, () => this.scene.start('RankingScene', { level: this.level }))`
    - _Requirements: 1.2, 2.2, 3.2_

  - [x] 4.4 Block navigation inputs (Tab, Escape) during the transition delay in GameOverScene
    - Modify `setupKeyboardNavigation()` so that Tab and Escape handlers check `this.transitionBlocked` and return early if true
    - _Requirements: 3.3_

  - [x] 4.5 Add `shutdown()` method to GameOverScene to cancel pending transition on scene destroy
    - If `this.pendingTransition` is not null, call `this.pendingTransition.remove(false)` and set it to null
    - _Requirements: 3.4_

  - [ ]* 4.6 Write property test: successful submission navigates with correct level (GameOverScene)
    - **Property 1: Successful submission navigates with correct level**
    - For any valid level (1, 2, 3) and valid alias, if `saveLocal()` succeeds, the handler schedules navigation to RankingScene with that exact level value
    - **Validates: Requirements 1.2, 2.2**

  - [ ]* 4.7 Write property test: invalid alias blocks navigation (GameOverScene)
    - **Property 4: Invalid alias blocks navigation**
    - For any string that fails validation (empty, >16 chars, non-alphanumeric/non-space), the handler does NOT schedule navigation
    - **Validates: Requirements 5.2**

  - [ ]* 4.8 Write property test: deduplication blocks navigation (GameOverScene)
    - **Property 5: Deduplication blocks navigation**
    - If in-memory `submitted` flag is true OR `isAlreadySubmitted(matchId)` returns true, no navigation is scheduled
    - **Validates: Requirements 5.4**

- [-] 5. Update RankingScene accessibility and back-navigation
  - [x] 5.1 Ensure RankingScene back button has minimum 44×44px touch target and "← Volver" label
    - Verify existing back button meets requirements (currently 120×44, label "← Volver") — confirm no changes needed or adjust
    - _Requirements: 4.1_

  - [x] 5.2 Ensure Tab key cycles focus through all interactive elements with wrapping (Shift+Tab for reverse)
    - Verify existing `cycleFocus()` logic wraps correctly from last element to first and vice versa
    - Ensure Enter activates the focused element (already handled by Button's `keydown-ENTER` listener)
    - _Requirements: 6.2, 6.3, 6.4_

  - [x] 5.3 Ensure Escape key navigates to MenuScene from any focus state
    - Verify existing `keydown-ESC` handler in RankingScene transitions to MenuScene regardless of focus state
    - _Requirements: 4.4, 6.2_

- [x] 6. Wire everything together and final integration
  - [x] 6.1 Ensure RankingScene level tabs remain navigable after arriving from result scenes
    - Verify that after navigating from VictoryScene/GameOverScene with a level parameter, the player can still switch tabs to view other levels
    - _Requirements: 4.2_

  - [ ]* 6.2 Write unit tests for the full submission-to-navigation flow
    - Test: valid alias + saveLocal success → toast shown → buttons disabled → navigation scheduled after 2000ms
    - Test: saveLocal failure → error toast shown → no navigation
    - Test: invalid alias → validation toast → no navigation
    - Test: duplicate submission → dedup toast → no navigation
    - Test: scene destroyed during delay → timer cancelled → no navigation
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 3.1, 3.2, 3.4, 5.1, 5.2, 5.3, 5.4_

- [x] 7. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The `scheduleRankingTransition()` logic is identical in both VictoryScene and GameOverScene — consider extracting a shared utility if code duplication is a concern during implementation
- The existing `RankingService.saveLocal()` currently catches errors internally and fails silently. The implementation must detect save failure by verifying with `isAlreadySubmitted(matchId)` after calling `saveLocal()`

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "4.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "2.2", "2.3", "4.2", "4.3"] },
    { "id": 2, "tasks": ["2.4", "2.5", "4.4", "4.5", "5.1", "5.2", "5.3"] },
    { "id": 3, "tasks": ["2.6", "2.7", "2.8", "4.6", "4.7", "4.8", "6.1"] },
    { "id": 4, "tasks": ["6.2"] }
  ]
}
```
