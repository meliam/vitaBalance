import Phaser from 'phaser';
import type { GameState, LevelConfig } from '../types/game.types';
import { GAME_WIDTH, MAX_LIVES } from '../utils/constants';
import { PRODUCTS } from '../config/products';

/**
 * HudScene — Overlay UI displayed during gameplay.
 *
 * Launched in parallel with LevelScene. Reads shared game state from the
 * Phaser registry each frame and updates score, lives, timer, balance bar,
 * combo counter, level-specific objective indicators, power-up status,
 * and a pause button.
 *
 * @see Requirements 4.2, 5.5, 6.5, 7.5
 */
export class HudScene extends Phaser.Scene {
  // ─── Configuration ───────────────────────────────────────────────────────────
  private levelConfig!: LevelConfig;

  // ─── HUD Elements ────────────────────────────────────────────────────────────
  private scoreText!: Phaser.GameObjects.Text;
  private livesTexts: Phaser.GameObjects.Text[] = [];
  private timerText!: Phaser.GameObjects.Text;
  private balanceBarBg!: Phaser.GameObjects.Graphics;
  private balanceBarFill!: Phaser.GameObjects.Graphics;
  private balanceLabel!: Phaser.GameObjects.Text;
  private comboContainer!: Phaser.GameObjects.Container;
  private comboText!: Phaser.GameObjects.Text;

  // ─── Level Objective Elements ────────────────────────────────────────────────
  private objectiveContainer!: Phaser.GameObjects.Container;

  // Level 1
  private level1Text!: Phaser.GameObjects.Text;

  // Level 2
  private level2VitCText!: Phaser.GameObjects.Text;
  private level2PotText!: Phaser.GameObjects.Text;
  private level2VarText!: Phaser.GameObjects.Text;

  // Level 3
  private level3Items: Phaser.GameObjects.Text[] = [];
  private level3Checks: Phaser.GameObjects.Text[] = [];

  // ─── Power-up Indicator ──────────────────────────────────────────────────────
  private powerupContainer!: Phaser.GameObjects.Container;
  private powerupDot!: Phaser.GameObjects.Graphics;
  private powerupTimeText!: Phaser.GameObjects.Text;
  private powerupTween: Phaser.Tweens.Tween | null = null;

  // ─── Pause Button ────────────────────────────────────────────────────────────
  private pauseBtn!: Phaser.GameObjects.Container;

  // ─── Constants ───────────────────────────────────────────────────────────────
  private static readonly HUD_HEIGHT = 48;
  private static readonly BAR_WIDTH = 120;
  private static readonly BAR_HEIGHT = 16;
  private static readonly BG_COLOR = 0x0d1b2a;
  private static readonly BG_ALPHA = 0.85;
  private static readonly TEXT_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
    fontFamily: 'Arial, sans-serif',
    fontSize: '16px',
    color: '#ffffff',
    align: 'center',
  };

  constructor() {
    super({ key: 'HudScene' });
  }

  // ─── Scene Lifecycle ─────────────────────────────────────────────────────────

  init(data: { state: GameState; levelConfig: LevelConfig }): void {
    this.levelConfig = data.levelConfig;
  }

  create(): void {
    // Semi-transparent background strip
    const bgGraphics = this.add.graphics();
    bgGraphics.fillStyle(HudScene.BG_COLOR, HudScene.BG_ALPHA);
    bgGraphics.fillRect(0, 0, GAME_WIDTH, HudScene.HUD_HEIGHT);
    bgGraphics.setDepth(0);

    this.createScoreDisplay();
    this.createLivesDisplay();
    this.createTimerDisplay();
    this.createBalanceBar();
    this.createComboDisplay();
    this.createPauseButton();
    this.createPowerupIndicator();
    this.createObjectiveDisplay();
  }

  update(): void {
    // Safety: stop updating if this scene is being shut down or objects were destroyed
    if (!this.scene.isActive()) return;

    const state = this.registry.get('gameState') as GameState | undefined;
    if (!state) return;

    try {
      this.updateScore(state.score);
      this.updateLives(state.lives);
      this.updateTimer(state.timeLeft);
      this.updateBalanceBar(state.balance);
      this.updateCombo(state.combo);
      this.updateObjective(state);
      this.updatePowerup(state);
    } catch {
      // Scene objects may have been destroyed during transition — stop gracefully
    }
  }

  // ─── Create Methods ──────────────────────────────────────────────────────────

  private createScoreDisplay(): void {
    this.scoreText = this.add.text(16, HudScene.HUD_HEIGHT / 2, '🎯 0', {
      ...HudScene.TEXT_STYLE,
      fontStyle: 'bold',
    });
    this.scoreText.setOrigin(0, 0.5);
  }

  private createLivesDisplay(): void {
    const startX = 140;
    for (let i = 0; i < MAX_LIVES; i++) {
      const heartText = this.add.text(
        startX + i * 28,
        HudScene.HUD_HEIGHT / 2,
        '❤️',
        { ...HudScene.TEXT_STYLE, fontSize: '18px' },
      );
      heartText.setOrigin(0, 0.5);
      this.livesTexts.push(heartText);
    }
  }

  private createTimerDisplay(): void {
    this.timerText = this.add.text(GAME_WIDTH / 2, HudScene.HUD_HEIGHT / 2, '00:00', {
      ...HudScene.TEXT_STYLE,
      fontSize: '20px',
      fontStyle: 'bold',
    });
    this.timerText.setOrigin(0.5, 0.5);
  }

  private createBalanceBar(): void {
    const barX = GAME_WIDTH - 300;
    const barY = HudScene.HUD_HEIGHT / 2 - HudScene.BAR_HEIGHT / 2;

    // Label
    this.balanceLabel = this.add.text(barX - 8, HudScene.HUD_HEIGHT / 2, '⚖️', {
      ...HudScene.TEXT_STYLE,
      fontSize: '16px',
    });
    this.balanceLabel.setOrigin(1, 0.5);

    // Background
    this.balanceBarBg = this.add.graphics();
    this.balanceBarBg.fillStyle(0x333333, 1);
    this.balanceBarBg.fillRoundedRect(barX, barY, HudScene.BAR_WIDTH, HudScene.BAR_HEIGHT, 4);

    // Fill
    this.balanceBarFill = this.add.graphics();
    this.drawBalanceFill(100);
  }

  private createComboDisplay(): void {
    this.comboContainer = this.add.container(GAME_WIDTH - 100, HudScene.HUD_HEIGHT / 2);
    this.comboText = this.add.text(0, 0, '🔥 0', {
      ...HudScene.TEXT_STYLE,
      fontStyle: 'bold',
    });
    this.comboText.setOrigin(0.5, 0.5);
    this.comboContainer.add(this.comboText);
    this.comboContainer.setVisible(false);
  }

  private createPauseButton(): void {
    this.pauseBtn = this.add.container(GAME_WIDTH - 36, HudScene.HUD_HEIGHT / 2);

    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x455a64, 1);
    btnBg.fillCircle(0, 0, 18);
    this.pauseBtn.add(btnBg);

    const pauseIcon = this.add.text(0, 0, '⏸', {
      fontSize: '16px',
      align: 'center',
    });
    pauseIcon.setOrigin(0.5, 0.5);
    this.pauseBtn.add(pauseIcon);

    // Use a Zone for reliable click detection (same pattern as Button)
    const hitZone = this.add.zone(0, 0, 44, 44);
    hitZone.setInteractive({ useHandCursor: true });
    hitZone.on('pointerdown', () => {
      const levelScene = this.scene.get('LevelScene');
      if (levelScene && levelScene.scene.isActive()) {
        levelScene.scene.launch('PauseScene');
        levelScene.scene.pause();
      }
    });
    this.pauseBtn.add(hitZone);
  }

  private createPowerupIndicator(): void {
    this.powerupContainer = this.add.container(GAME_WIDTH / 2 + 80, HudScene.HUD_HEIGHT / 2);

    // Blue pulsing dot
    this.powerupDot = this.add.graphics();
    this.powerupDot.fillStyle(0x2196f3, 1);
    this.powerupDot.fillCircle(0, 0, 6);
    this.powerupContainer.add(this.powerupDot);

    // Countdown text
    this.powerupTimeText = this.add.text(14, 0, '', {
      ...HudScene.TEXT_STYLE,
      fontSize: '13px',
      color: '#64b5f6',
    });
    this.powerupTimeText.setOrigin(0, 0.5);
    this.powerupContainer.add(this.powerupTimeText);

    this.powerupContainer.setVisible(false);
  }

  private createObjectiveDisplay(): void {
    this.objectiveContainer = this.add.container(0, HudScene.HUD_HEIGHT + 4);

    // Objective background strip
    const objBg = this.add.graphics();
    objBg.fillStyle(HudScene.BG_COLOR, 0.7);
    objBg.fillRect(0, 0, GAME_WIDTH, 28);
    this.objectiveContainer.add(objBg);

    const levelId = this.levelConfig.id;

    if (levelId === 1) {
      this.createLevel1Objective();
    } else if (levelId === 2) {
      this.createLevel2Objective();
    } else if (levelId === 3) {
      this.createLevel3Objective();
    }
  }

  private createLevel1Objective(): void {
    this.level1Text = this.add.text(GAME_WIDTH / 2, 14, '0/8 🍎', {
      ...HudScene.TEXT_STYLE,
      fontSize: '14px',
    });
    this.level1Text.setOrigin(0.5, 0.5);
    this.objectiveContainer.add(this.level1Text);
  }

  private createLevel2Objective(): void {
    const y = 14;
    const spacing = 200;
    const startX = GAME_WIDTH / 2 - spacing;

    this.level2VitCText = this.add.text(startX, y, 'Vit C: ✗', {
      ...HudScene.TEXT_STYLE,
      fontSize: '14px',
      color: '#ff8a80',
    });
    this.level2VitCText.setOrigin(0.5, 0.5);
    this.objectiveContainer.add(this.level2VitCText);

    this.level2PotText = this.add.text(startX + spacing, y, 'Potasio: ✗', {
      ...HudScene.TEXT_STYLE,
      fontSize: '14px',
      color: '#ff8a80',
    });
    this.level2PotText.setOrigin(0.5, 0.5);
    this.objectiveContainer.add(this.level2PotText);

    this.level2VarText = this.add.text(startX + spacing * 2, y, 'Variedad: 0/5', {
      ...HudScene.TEXT_STYLE,
      fontSize: '14px',
    });
    this.level2VarText.setOrigin(0.5, 0.5);
    this.objectiveContainer.add(this.level2VarText);
  }

  private createLevel3Objective(): void {
    const objective = this.levelConfig.objective;
    if (objective.type !== 'seasonal') return;

    const products = objective.products;
    const spacing = 56;
    const totalWidth = (products.length - 1) * spacing;
    const startX = GAME_WIDTH / 2 - totalWidth / 2;

    for (let i = 0; i < products.length; i++) {
      const productId = products[i];
      const productConfig = PRODUCTS.find((p) => p.id === productId);
      const emoji = productConfig?.emoji ?? '🍎';

      // Product emoji
      const itemText = this.add.text(startX + i * spacing, 14, emoji, {
        fontSize: '18px',
        align: 'center',
      });
      itemText.setOrigin(0.5, 0.5);
      this.objectiveContainer.add(itemText);
      this.level3Items.push(itemText);

      // Check overlay (hidden initially)
      const checkText = this.add.text(startX + i * spacing, 14, '✓', {
        fontSize: '14px',
        color: '#4caf50',
        fontStyle: 'bold',
        align: 'center',
      });
      checkText.setOrigin(0.5, 0.5);
      checkText.setVisible(false);
      this.objectiveContainer.add(checkText);
      this.level3Checks.push(checkText);
    }
  }

  // ─── Update Methods ──────────────────────────────────────────────────────────

  private updateScore(score: number): void {
    this.scoreText.setText(`🎯 ${score}`);
  }

  private updateLives(lives: number): void {
    for (let i = 0; i < MAX_LIVES; i++) {
      this.livesTexts[i].setText(i < lives ? '❤️' : '🖤');
    }
  }

  private updateTimer(timeLeft: number): void {
    const seconds = Math.max(0, Math.ceil(timeLeft));
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    this.timerText.setText(formatted);

    // Flash red when low on time
    if (seconds <= 10) {
      this.timerText.setColor('#ff5252');
    } else {
      this.timerText.setColor('#ffffff');
    }
  }

  private updateBalanceBar(balance: number): void {
    this.drawBalanceFill(balance);
  }

  private drawBalanceFill(balance: number): void {
    const barX = GAME_WIDTH - 300;
    const barY = HudScene.HUD_HEIGHT / 2 - HudScene.BAR_HEIGHT / 2;
    const fillWidth = (Math.max(0, Math.min(100, balance)) / 100) * HudScene.BAR_WIDTH;

    this.balanceBarFill.clear();

    // Color based on balance level
    let fillColor = 0x4caf50; // green
    if (balance < 30) {
      fillColor = 0xf44336; // red
    } else if (balance < 60) {
      fillColor = 0xff9800; // orange
    }

    this.balanceBarFill.fillStyle(fillColor, 1);
    if (fillWidth > 0) {
      this.balanceBarFill.fillRoundedRect(barX, barY, fillWidth, HudScene.BAR_HEIGHT, 4);
    }
  }

  private updateCombo(combo: number): void {
    if (combo > 0) {
      this.comboContainer.setVisible(true);
      this.comboText.setText(`🔥 ${combo}`);
    } else {
      this.comboContainer.setVisible(false);
    }
  }

  private updateObjective(state: GameState): void {
    const levelId = this.levelConfig.id;

    if (levelId === 1) {
      const target =
        this.levelConfig.objective.type === 'count' ? this.levelConfig.objective.target : 8;
      this.level1Text.setText(`${state.correctCaptures}/${target} 🍎`);
    } else if (levelId === 2) {
      // Vitamin C
      if (state.vitaminCCaught) {
        this.level2VitCText.setText('Vit C: ✓');
        this.level2VitCText.setColor('#69f0ae');
      } else {
        this.level2VitCText.setText('Vit C: ✗');
        this.level2VitCText.setColor('#ff8a80');
      }

      // Potassium
      if (state.potassiumCaught) {
        this.level2PotText.setText('Potasio: ✓');
        this.level2PotText.setColor('#69f0ae');
      } else {
        this.level2PotText.setText('Potasio: ✗');
        this.level2PotText.setColor('#ff8a80');
      }

      // Variety
      const variety = state.uniqueItems.length;
      const target =
        this.levelConfig.objective.type === 'combine' ? this.levelConfig.objective.variety : 5;
      this.level2VarText.setText(`Variedad: ${variety}/${target}`);
      if (variety >= target) {
        this.level2VarText.setColor('#69f0ae');
      } else {
        this.level2VarText.setColor('#ffffff');
      }
    } else if (levelId === 3) {
      const objective = this.levelConfig.objective;
      if (objective.type !== 'seasonal') return;

      const products = objective.products;
      for (let i = 0; i < products.length; i++) {
        const captured = state.checklist[products[i]] === true;
        if (this.level3Checks[i]) {
          this.level3Checks[i].setVisible(captured);
        }
      }
    }
  }

  private updatePowerup(state: GameState): void {
    if (state.powerupActive) {
      if (!this.powerupContainer.visible) {
        this.powerupContainer.setVisible(true);
        this.startPowerupPulse();
      }
      const remaining = Math.ceil(state.powerupTimeRemaining);
      this.powerupTimeText.setText(`${remaining}s`);
    } else {
      if (this.powerupContainer.visible) {
        this.powerupContainer.setVisible(false);
        this.stopPowerupPulse();
      }
    }
  }

  // ─── Power-up Pulse Animation ────────────────────────────────────────────────

  private startPowerupPulse(): void {
    if (this.powerupTween) return;

    const reduceMotion = this.registry.get('reduceMotion') as boolean;
    if (reduceMotion) return;

    this.powerupTween = this.tweens.add({
      targets: this.powerupDot,
      alpha: { from: 1, to: 0.3 },
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private stopPowerupPulse(): void {
    if (this.powerupTween) {
      this.powerupTween.destroy();
      this.powerupTween = null;
    }
    this.powerupDot.setAlpha(1);
  }
}
