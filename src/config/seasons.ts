import type { SeasonConfig, SeasonalCombination } from '../types/game.types';

/**
 * Season definitions for the central region of Argentina (hemisferio sur).
 * Each season maps to calendar months and its characteristic products.
 */
export const seasons: SeasonConfig[] = [
  {
    id: 'verano',
    name: 'Verano',
    emoji: '☀️',
    color: '#f97316',
    months: [12, 1, 2],
    products: ['sandia', 'durazno', 'tomate', 'pepino', 'choclo'],
  },
  {
    id: 'otono',
    name: 'Otoño',
    emoji: '🍂',
    color: '#b45309',
    months: [3, 4, 5],
    products: ['manzana', 'pera', 'zapallo', 'uva', 'kiwi'],
  },
  {
    id: 'invierno',
    name: 'Invierno',
    emoji: '❄️',
    color: '#60a5fa',
    months: [6, 7, 8],
    products: [
      'naranja',
      'mandarina',
      'brocoli',
      'espinaca',
      'kiwi',
      'pomelo',
      'puerro',
      'papa',
      'limon',
    ],
  },
  {
    id: 'primavera',
    name: 'Primavera',
    emoji: '🌸',
    color: '#22c55e',
    months: [9, 10, 11],
    products: ['frutilla', 'lechuga', 'arvejas', 'espinaca'],
  },
];

/**
 * Seasonal combinations for Level 3 — Guardianes de las Estaciones.
 * Each combination defines the transition from the current season to the target season,
 * the products the player must collect, distractors to avoid, and visual/educational context.
 */
export const seasonalCombinations: SeasonalCombination[] = [
  {
    from: 'primavera',
    to: 'invierno',
    targetProducts: ['mandarina', 'pomelo', 'brocoli', 'puerro', 'papa'],
    distractors: ['frutilla', 'durazno', 'sandia', 'choclo'],
    bgGradient: 'linear-gradient(180deg, #0f2744 0%, #0a3060 60%, #091a40 100%)',
    explanation:
      'La mandarina, el pomelo, el brócoli, el puerro y la papa suelen estar disponibles en invierno en la región central de Argentina.',
  },
  {
    from: 'invierno',
    to: 'verano',
    targetProducts: ['sandia', 'durazno', 'tomate', 'pepino', 'choclo'],
    distractors: ['mandarina', 'pomelo', 'brocoli', 'puerro'],
    bgGradient: 'linear-gradient(180deg, #1a0a44 0%, #2a1800 60%, #1a0800 100%)',
    explanation:
      'La sandía, el durazno, el tomate, el pepino y el choclo son frutas y verduras características del verano en Argentina.',
  },
  {
    from: 'verano',
    to: 'otono',
    targetProducts: ['manzana', 'pera', 'uva', 'zanahoria', 'zapallo'],
    distractors: ['sandia', 'durazno', 'choclo', 'pepino'],
    bgGradient: 'linear-gradient(180deg, #2a1800 0%, #1a2a08 60%, #0f1a04 100%)',
    explanation:
      'La manzana, la pera, la uva, la zanahoria y el zapallo son alimentos típicos del otoño en Argentina.',
  },
  {
    from: 'otono',
    to: 'primavera',
    targetProducts: ['frutilla', 'lechuga', 'arvejas', 'espinaca', 'brocoli'],
    distractors: ['manzana', 'pera', 'uva', 'zapallo'],
    bgGradient: 'linear-gradient(180deg, #0f2a0a 0%, #1a3a10 60%, #0a2a08 100%)',
    explanation:
      'La frutilla, la lechuga, las arvejas y la espinaca son productos primaverales frecuentes en Argentina.',
  },
];
