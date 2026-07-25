import type { GameState, LevelObjective } from '../types/game.types';

/**
 * Objective system — pure logic module.
 * Evaluates win and lose conditions for each level type.
 * No Phaser dependencies.
 *
 * @see Requirements 5.2, 5.3, 6.2, 6.3, 7.2, 7.3
 */

/**
 * Checks if the player has met the win condition for the current level objective.
 *
 * - Level 1 (count): correctCaptures >= target
 * - Level 2 (combine): vitaminCCaught && potassiumCaught && uniqueItems.length >= variety
 * - Level 3 (seasonal): all required products in state.checklist are true
 *
 * @see Requirements 5.2, 6.2, 7.2
 */
export function checkWinCondition(state: GameState, objective: LevelObjective): boolean {
  switch (objective.type) {
    case 'count': {
      return state.correctCaptures >= objective.target;
    }

    case 'combine': {
      return (
        state.vitaminCCaught &&
        state.potassiumCaught &&
        state.uniqueItems.length >= objective.variety
      );
    }

    case 'seasonal': {
      return objective.products.every((product) => state.checklist[product] === true);
    }
  }
}

/**
 * Checks if the player has met the lose condition.
 * The player loses when all lives are depleted (lives === 0).
 * The timeLeft parameter is accepted for interface consistency but
 * time expiry is handled by the scene, not this system.
 *
 * @see Requirements 5.3, 6.3, 7.3
 */
export function checkLoseCondition(state: GameState, _timeLeft: number): boolean {
  return state.lives === 0;
}
