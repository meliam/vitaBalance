import type { LevelConfig } from '../types/game.types';

/**
 * Level configuration for all 3 game levels.
 *
 * Each level defines duration, speed, spawn parameters, objectives,
 * rewards, and visual theming. Values are data-driven to allow
 * balance adjustments without modifying game logic.
 *
 * @see Requirements 5.1, 6.1, 7.1, 16.3
 */
export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    title: 'Nivel 1: Reconocer',
    description: 'Aprendé a identificar frutas y verduras frescas. ¡Evitá los productos en mal estado!',
    duration: 60,
    baseSpeed: 1.6,
    speedVariance: 1.0,
    spawnInterval: 1.3,
    spawnProbabilities: {
      correct: 0.52,
      spoiled: 0.18,
      unsolicited: 0.18,
      powerup: 0.12,
    },
    objective: { type: 'count', target: 8 },
    reward: { name: 'Gorra Cítrica', emoji: '🧢', outfitLevel: 1 },
    color: '#22c55e',
    bgGradient: 'linear-gradient(180deg, #0f2744 0%, #0a3d1a 60%, #1a4a0a 100%)',
  },
  {
    id: 2,
    title: 'Nivel 2: Combinar',
    description:
      'Combiná distintas frutas y verduras para completar los tres objetivos nutricionales.',
    duration: 75,
    baseSpeed: 2.2,
    speedVariance: 1.0,
    spawnInterval: 0.95,
    spawnProbabilities: {
      correct: 0.52,
      spoiled: 0.18,
      unsolicited: 0.18,
      powerup: 0.12,
    },
    objective: { type: 'combine', vitaminC: true, potassium: true, variety: 5 },
    reward: { name: 'Remera VitaBalance', emoji: '👕', outfitLevel: 2 },
    color: '#f97316',
    bgGradient: 'linear-gradient(180deg, #0f2744 0%, #0a3d1a 60%, #1a4a0a 100%)',
  },
  {
    id: 3,
    title: 'Nivel 3: Guardianes de las Estaciones',
    description:
      'Prepará la canasta de la estación objetivo. Recolectá los 5 productos correctos.',
    duration: 90,
    baseSpeed: 2.8,
    speedVariance: 1.0,
    spawnInterval: 0.72,
    spawnProbabilities: {
      correct: 0.52,
      spoiled: 0.18,
      unsolicited: 0.18,
      powerup: 0.12,
    },
    objective: { type: 'seasonal', products: [] },
    reward: { name: 'Capa VitaHero', emoji: '🦸', outfitLevel: 3 },
    color: '#7c3aed',
    bgGradient: 'linear-gradient(180deg, #0f2a0a 0%, #1a3a10 60%, #0a2a08 100%)',
  },
];
