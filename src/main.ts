import Phaser from 'phaser';
import { GAME_CONFIG } from './config/game-config';

// Global error boundaries — catch any unhandled errors so they never reach the user.
// Requirements: 12.4, 17.4, 18.4
window.addEventListener('unhandledrejection', (event) => {
  event.preventDefault();
  console.warn('[VitaBalance] Unhandled promise rejection caught:', event.reason);
});

window.addEventListener('error', (event) => {
  event.preventDefault();
  console.warn('[VitaBalance] Uncaught error caught:', event.error);
});

const game = new Phaser.Game(GAME_CONFIG);

export default game;
