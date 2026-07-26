import Phaser from 'phaser';
import type { RankingEntry } from '../types/api.types';
import type { LocalRankingEntry } from '../types/game.types';
import { Button } from '../ui/Button';
import { RankingService } from '../services/ranking-service';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';

/**
 * RankingScene — Global ranking leaderboard screen.
 *
 * Fetches and displays top scores for a selected level from RankingService.
 * Provides level selector tabs, a table-like layout, and a back button.
 *
 * @see Requirements 12.1–12.4
 */
export class RankingScene extends Phaser.Scene {
  private selectedLevel: 1 | 2 | 3 = 1;
  private tabButtons: Button[] = [];
  private entriesContainer!: Phaser.GameObjects.Container;
  private loadingText!: Phaser.GameObjects.Text;

  // Keyboard navigation
  private focusableElements: Button[] = [];
  private focusIndex = 0;

  constructor() {
    super({ key: 'RankingScene' });
  }

<<<<<<< HEAD
  init(data?: { level?: 1 | 2 | 3 }): void {
    this.selectedLevel = data?.level ?? 1;
=======
  init(data?: { level?: number }): void {
    const rawLevel = data?.level;
    if (rawLevel === 1 || rawLevel === 2 || rawLevel === 3) {
      this.selectedLevel = rawLevel;
    } else {
      this.selectedLevel = 1;
    }
    this.tabButtons = [];
    this.focusableElements = [];
    this.focusIndex = 0;
>>>>>>> 0c944d18c8a21c693c142ee2347134fc3eac066f
  }

  create(): void {
    // ── Background ──
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0d1b2a);

    // ── Title ──
    this.add.text(GAME_WIDTH / 2, 32, 'Ranking Global', {
      fontFamily: 'Fredoka One, Nunito, sans-serif',
      fontSize: '26px',
      color: '#ffd700',
      align: 'center',
    }).setOrigin(0.5, 0.5);

    // ── Level Tabs ──
    this.createLevelTabs();

    // ── Table Header ──
    this.createTableHeader();

    // ── Entries Container ──
    this.entriesContainer = this.add.container(0, 0);

    // ── Loading Text ──
    this.loadingText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Cargando...', {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '18px',
      color: '#aaaaaa',
      align: 'center',
    }).setOrigin(0.5, 0.5);
    this.loadingText.setVisible(false);

    // ── Back Button ──
    const backBtn = new Button(this, {
      x: 80,
      y: GAME_HEIGHT - 40,
      text: '← Volver',
      color: '#607D8B',
      width: 120,
      height: 44,
      fontSize: 14,
      onClick: () => this.scene.start('MenuScene'),
    });
    this.focusableElements.push(backBtn);

    // ── Keyboard Navigation ──
    this.setupKeyboardNavigation();

    // ── Initial fetch ──
    this.fetchRanking();
  }

  // ─── Level Tabs ──────────────────────────────────────────────────────────────

  private createLevelTabs(): void {
    const tabLabels = ['Nivel 1', 'Nivel 2', 'Nivel 3'];
    const tabY = 72;
    const tabWidth = 120;
    const tabSpacing = 140;
    const startX = GAME_WIDTH / 2 - tabSpacing;

    tabLabels.forEach((label, index) => {
      const level = (index + 1) as 1 | 2 | 3;
      const isActive = level === this.selectedLevel;

      const btn = new Button(this, {
        x: startX + index * tabSpacing,
        y: tabY,
        text: label,
        color: isActive ? '#4CAF50' : '#37474F',
        width: tabWidth,
        height: 36,
        fontSize: 14,
        onClick: () => this.selectLevel(level),
      });

      this.tabButtons.push(btn);
      this.focusableElements.push(btn);
    });
  }

  private selectLevel(level: 1 | 2 | 3): void {
    if (level === this.selectedLevel) return;

    this.selectedLevel = level;
    this.updateTabHighlights();
    this.fetchRanking();
  }

  private updateTabHighlights(): void {
    // Remove focus from all elements BEFORE destroying tabs
    const backBtn = this.focusableElements[this.focusableElements.length - 1];
    this.focusableElements.forEach((btn) => btn.setFocused(false));
    this.focusableElements = [];

    // Destroy old tabs and recreate them with updated colors
    this.tabButtons.forEach((btn) => btn.destroy());
    this.tabButtons = [];

    this.createLevelTabs();

    // Re-add back button
    if (backBtn) {
      this.focusableElements.push(backBtn);
    }

    // Reset focus
    this.focusIndex = 0;
    if (this.focusableElements.length > 0) {
      this.focusableElements[0].setFocused(true);
    }
  }

  // ─── Table Header ────────────────────────────────────────────────────────────

  private createTableHeader(): void {
    const headerY = 108;
    const columns = this.getColumnPositions();

    const headers = [
      { text: '#', x: columns.rank },
      { text: 'Alias', x: columns.alias },
      { text: 'VitaScore', x: columns.vitaScore },
      { text: 'Precisión', x: columns.precision },
      { text: 'Variedad', x: columns.variety },
    ];

    headers.forEach(({ text, x }) => {
      this.add.text(x, headerY, text, {
        fontFamily: 'Fredoka One, Nunito, sans-serif',
        fontSize: '13px',
        color: '#88bbdd',
        align: 'center',
      }).setOrigin(0.5, 0.5);
    });

    // Separator line
    const gfx = this.add.graphics();
    gfx.lineStyle(1, 0x334455, 1);
    gfx.lineBetween(GAME_WIDTH * 0.15, headerY + 14, GAME_WIDTH * 0.85, headerY + 14);
  }

  private getColumnPositions() {
    return {
      rank: GAME_WIDTH * 0.2,
      alias: GAME_WIDTH * 0.35,
      vitaScore: GAME_WIDTH * 0.52,
      precision: GAME_WIDTH * 0.67,
      variety: GAME_WIDTH * 0.82,
    };
  }

  // ─── Data Fetching ───────────────────────────────────────────────────────────

  private async fetchRanking(): Promise<void> {
    // Clear existing entries
    this.entriesContainer.removeAll(true);

    // Show local rankings IMMEDIATELY (no waiting for network)
    const localEntries = RankingService.getLocalRankings(this.selectedLevel);

    if (localEntries.length > 0) {
      const localAsRanking: RankingEntry[] = localEntries.map((e) => ({
        alias: e.alias,
        vitaScore: e.vitaScore,
        precision: e.precision,
        variety: e.variety,
        createdAt: e.createdAt,
      }));
      this.displayEntries(localAsRanking);
    } else {
      this.loadingText.setVisible(true);
    }

    // Then fetch remote in background and merge
    try {
      const remoteEntries = await RankingService.getTopScores(this.selectedLevel, 10);

      // Merge remote and local entries
      const merged = this.mergeRankings(remoteEntries, localEntries);

      this.loadingText.setVisible(false);
      this.entriesContainer.removeAll(true);

      if (merged.length === 0) {
        this.showEmptyState();
      } else {
        this.displayEntries(merged);
      }
    } catch {
      // Remote fetch failed — local data is already displayed, nothing more to do
      this.loadingText.setVisible(false);

      if (localEntries.length === 0) {
        this.showEmptyState();
      }
    }
  }

  /**
   * Merges remote and local ranking entries, avoiding duplicates.
   * A local entry is considered a duplicate if a remote entry has the same alias
   * and vitaScore. Result is sorted by vitaScore descending, limited to 10.
   */
  private mergeRankings(remote: RankingEntry[], local: LocalRankingEntry[]): RankingEntry[] {
    // Start with remote entries
    const merged: RankingEntry[] = [...remote];

    // Add local entries that aren't already in remote
    for (const localEntry of local) {
      const isDuplicate = remote.some(
        (r) => r.alias === localEntry.alias && r.vitaScore === localEntry.vitaScore,
      );
      if (!isDuplicate) {
        merged.push({
          alias: localEntry.alias,
          vitaScore: localEntry.vitaScore,
          precision: localEntry.precision,
          variety: localEntry.variety,
          createdAt: localEntry.createdAt,
        });
      }
    }

    // Sort by vitaScore descending and take top 10
    merged.sort((a, b) => b.vitaScore - a.vitaScore);
    return merged.slice(0, 10);
  }

  // ─── Display Entries ─────────────────────────────────────────────────────────

  private displayEntries(entries: RankingEntry[]): void {
    const columns = this.getColumnPositions();
    const startY = 138;
    const rowHeight = 32;

    entries.forEach((entry, index) => {
      const y = startY + index * rowHeight;
      const rank = index + 1;

      // Alternate row background for readability
      if (index % 2 === 0) {
        const rowBg = this.add.graphics();
        rowBg.fillStyle(0x1a2a3a, 0.5);
        rowBg.fillRect(GAME_WIDTH * 0.15, y - 12, GAME_WIDTH * 0.7, rowHeight);
        this.entriesContainer.add(rowBg);
      }

      // Rank
      const rankText = this.add.text(columns.rank, y, `${rank}`, {
        fontFamily: 'Nunito, sans-serif',
        fontSize: '14px',
        color: rank <= 3 ? '#ffd700' : '#cccccc',
        fontStyle: 'bold',
        align: 'center',
      }).setOrigin(0.5, 0.5);
      this.entriesContainer.add(rankText);

      // Alias
      const aliasText = this.add.text(columns.alias, y, entry.alias, {
        fontFamily: 'Nunito, sans-serif',
        fontSize: '14px',
        color: '#ffffff',
        align: 'center',
      }).setOrigin(0.5, 0.5);
      this.entriesContainer.add(aliasText);

      // VitaScore
      const scoreText = this.add.text(columns.vitaScore, y, `${entry.vitaScore}`, {
        fontFamily: 'Nunito, sans-serif',
        fontSize: '14px',
        color: '#44ff88',
        fontStyle: 'bold',
        align: 'center',
      }).setOrigin(0.5, 0.5);
      this.entriesContainer.add(scoreText);

      // Precision
      const precisionText = this.add.text(columns.precision, y, `${entry.precision.toFixed(1)}%`, {
        fontFamily: 'Nunito, sans-serif',
        fontSize: '14px',
        color: '#aaccff',
        align: 'center',
      }).setOrigin(0.5, 0.5);
      this.entriesContainer.add(precisionText);

      // Variety
      const varietyText = this.add.text(columns.variety, y, `${entry.variety}`, {
        fontFamily: 'Nunito, sans-serif',
        fontSize: '14px',
        color: '#dddddd',
        align: 'center',
      }).setOrigin(0.5, 0.5);
      this.entriesContainer.add(varietyText);
    });
  }

  // ─── Empty State ─────────────────────────────────────────────────────────────

  private showEmptyState(): void {
    const emptyText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      'No hay puntajes registrados para este nivel.\n¡Sé el primero!',
      {
        fontFamily: 'Nunito, sans-serif',
        fontSize: '16px',
        color: '#888888',
        align: 'center',
      },
    ).setOrigin(0.5, 0.5);
    this.entriesContainer.add(emptyText);
  }

  // ─── Keyboard Navigation ─────────────────────────────────────────────────────

  private setupKeyboardNavigation(): void {
    this.input.keyboard?.on('keydown-TAB', (event: KeyboardEvent) => {
      event.preventDefault();
      this.cycleFocus(event.shiftKey ? -1 : 1);
    });

    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.start('MenuScene');
    });

    // Set initial focus
    if (this.focusableElements.length > 0) {
      this.focusableElements[0].setFocused(true);
    }
  }

  private cycleFocus(direction: number): void {
    if (this.focusableElements.length === 0) return;

    this.focusableElements[this.focusIndex]?.setFocused(false);

    this.focusIndex += direction;
    if (this.focusIndex < 0) {
      this.focusIndex = this.focusableElements.length - 1;
    } else if (this.focusIndex >= this.focusableElements.length) {
      this.focusIndex = 0;
    }

    this.focusableElements[this.focusIndex]?.setFocused(true);
  }
}
