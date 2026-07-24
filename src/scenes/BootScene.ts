import Phaser from 'phaser';

/**
 * BootScene — First scene loaded by Phaser.
 * Initializes engine-level settings and immediately transitions to PreloadScene.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    // Enable keyboard input capture for game controls
    if (this.input.keyboard) {
      this.input.keyboard.addCapture([
        Phaser.Input.Keyboard.KeyCodes.LEFT,
        Phaser.Input.Keyboard.KeyCodes.RIGHT,
        Phaser.Input.Keyboard.KeyCodes.A,
        Phaser.Input.Keyboard.KeyCodes.D,
        Phaser.Input.Keyboard.KeyCodes.ESC,
        Phaser.Input.Keyboard.KeyCodes.ENTER,
        Phaser.Input.Keyboard.KeyCodes.TAB,
        Phaser.Input.Keyboard.KeyCodes.SPACE,
      ]);
    }

    // Immediately transition to PreloadScene
    this.scene.start('PreloadScene');
  }
}
