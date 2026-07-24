import type { AudioSettings } from '../types/game.types';

/**
 * AudioSystem — Wraps Phaser.Sound to manage background music and SFX.
 * Respects musicEnabled toggle and volume level from AudioSettings.
 */
export class AudioSystem {
  private scene: Phaser.Scene | null = null;
  private currentMusic: Phaser.Sound.BaseSound | null = null;
  private musicEnabled = true;
  private volume = 0.7;

  /**
   * Initialize the audio system with a Phaser scene and settings.
   * Restores previously saved music and volume preferences.
   */
  init(scene: Phaser.Scene, settings: AudioSettings): void {
    this.scene = scene;
    this.musicEnabled = settings.musicEnabled;
    this.volume = Math.max(0, Math.min(1, settings.volume));

    // Apply volume to the sound manager immediately
    this.scene.sound.volume = this.volume;
  }

  /**
   * Play background music that loops continuously.
   * Respects the musicEnabled toggle — does nothing if music is disabled.
   * Stops any currently playing music before starting new track.
   */
  playMusic(key: string): void {
    if (!this.scene) return;

    // Stop existing music before playing new track
    this.stopMusic();

    if (!this.musicEnabled) return;

    this.currentMusic = this.scene.sound.add(key, {
      loop: true,
      volume: this.volume,
    });
    this.currentMusic.play();
  }

  /**
   * Stop currently playing background music.
   */
  stopMusic(): void {
    if (this.currentMusic) {
      this.currentMusic.stop();
      this.currentMusic.destroy();
      this.currentMusic = null;
    }
  }

  /**
   * Play a one-shot sound effect at the current volume level.
   */
  playSFX(key: string): void {
    if (!this.scene) return;

    this.scene.sound.play(key, { volume: this.volume });
  }

  /**
   * Set master volume for both music and SFX.
   * Clamps value to [0, 1] range.
   * Applies change immediately to playing music and the sound manager.
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));

    if (this.scene) {
      this.scene.sound.volume = this.volume;
    }

    // Update currently playing music volume directly
    if (this.currentMusic && 'volume' in this.currentMusic) {
      (this.currentMusic as Phaser.Sound.WebAudioSound).setVolume(this.volume);
    }
  }

  /**
   * Enable or disable background music playback.
   * When disabled, stops any currently playing music immediately.
   * When enabled, does not auto-play — caller must invoke playMusic().
   */
  setMusicEnabled(enabled: boolean): void {
    this.musicEnabled = enabled;

    if (!enabled) {
      this.stopMusic();
    }
  }
}
