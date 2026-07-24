import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { PreloadScene } from '../scenes/PreloadScene';
import { MenuScene } from '../scenes/MenuScene';
import { LevelScene } from '../scenes/LevelScene';
import { HudScene } from '../scenes/HudScene';
import { PauseScene } from '../scenes/PauseScene';
import { VictoryScene } from '../scenes/VictoryScene';
import { GameOverScene } from '../scenes/GameOverScene';
import { RankingScene } from '../scenes/RankingScene';
import { ProfileScene } from '../scenes/ProfileScene';
import { HowToPlayScene } from '../scenes/HowToPlayScene';
import { SettingsScene } from '../scenes/SettingsScene';

export const GAME_CONFIG: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1280,
  height: 520,
  parent: 'game-container',
  backgroundColor: '#0d1b2a',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: {
      width: 640,
      height: 360,
    },
    max: {
      width: 1920,
      height: 1080,
    },
  },
  scene: [BootScene, PreloadScene, MenuScene, LevelScene, HudScene, PauseScene, VictoryScene, GameOverScene, RankingScene, ProfileScene, HowToPlayScene, SettingsScene],
};
