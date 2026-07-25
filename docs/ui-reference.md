# UI Reference — VitaBalance: Guardianes de las Estaciones

> This document was generated from the Figma Make prototype (App.reference.tsx) and screenshots.
> It serves as a visual and behavioral reference for implementing the Phaser 3 production game.
>
> **Source of truth priority:**
> 1. Steering documents (product, game-design, accessibility) — architecture and rules
> 2. Screenshots — visual identity, layout, and hierarchy
> 3. App.reference.tsx — texts, tokens, and component behavior only
>
> Do NOT import or reuse the React code in the Phaser application.

---

## 1. Screen Inventory

| # | Screen ID | Steering Scene | Purpose |
|---|-----------|----------------|---------|
| 1 | (none in prototype) | BootScene | Engine init, minimal logo |
| 2 | (none in prototype) | PreloadScene | Asset loading with progress bar |
| 3 | intro | MenuScene | Title, avatar, main CTA |
| 4 | mission-select | MenuScene (sub-state) | Level selection grid |
| 5 | objective | MenuScene (sub-state) | Pre-level briefing |
| 6 | gameplay | LevelScene + HudScene | Core game loop |
| 7 | (pause overlay) | PauseScene | Pause menu overlay |
| 8 | results (won) | VictoryScene | Victory results |
| 9 | results (lost) | GameOverScene | Defeat results |
| 10 | profile | (new — not in steering) | Avatar + progress |
| 11 | ranking | RankingScene | Leaderboard |
| 12 | howtoplay | (new — not in steering) | Tutorial/instructions |
| 13 | settings | (new — not in steering) | Accessibility + controls |

> **ASSUMPTION:** Profile, HowToPlay, and Settings screens add value and should be implemented
> as additional Phaser scenes. This requires updating the steering scene list. See Section 12.

---

## 2. Navigation Flow

```
BootScene → PreloadScene → MenuScene (intro)
                                │
                ┌───────────────┼────────────────┐
                ▼               ▼                ▼
          HowToPlay       MissionSelect      Settings
                                │
                                ▼
                          ObjectiveScreen
                                │
                                ▼
                     LevelScene + HudScene
                        │       │       │
                        ▼       ▼       ▼
                    PauseScene  Victory  GameOver
                    │   │   │     │        │
                    ▼   ▼   ▼     ▼        ▼
                 Resume Restart Menu  NextLevel  Retry/Menu
```

**Navigation rules (from prototype):**
- Intro → MissionSelect via "¡Jugar!" button
- Intro → HowToPlay via "Cómo jugar" button
- Intro → Settings via gear icon (top-right)
- MissionSelect → Objective via level card click (unlocked only)
- Objective → Gameplay via "¡Comenzar!" button
- Gameplay → Pause via Escape key or Pause button
- Pause → Resume / Restart / Menu
- Gameplay win → Victory (auto-transition after confetti)
- Gameplay lose → GameOver (auto-transition)
- Victory/GameOver → Continue (next level) or Repeat
- Top nav bar (visible in non-gameplay/non-intro screens): Profile, Ranking, Settings

**Back navigation:** Home icon (top-left) returns to parent screen.

---

## 3. Reusable UI Components

### 3.1 ActionButton (primary CTA)

- Shape: fully rounded (pill)
- Min size: 220×56 px
- Background: gradient (e.g., orange `#f97316` → `#ea580c`)
- Text: white, bold, Fredoka One, ~20px
- Icon: left-aligned (Play triangle, arrow, etc.)
- Shadow: colored glow matching button hue
- States: hover (brightness +10%), active (scale 95%), focus-visible (ring 4px)

### 3.2 SecondaryButton (outline)

- Shape: fully rounded (pill)
- Min size: (auto)×44 px
- Background: transparent or 18% fill of accent color
- Border: 2px solid accent color (green `#22c55e`)
- Text: white, bold, Nunito, ~16px
- Icon: left-aligned

### 3.3 IconButton (circular)

- Shape: circle
- Min size: 44×44 px
- Background: `rgba(255,255,255,0.1)`
- Border: 2px solid `rgba(255,255,255,0.2)`
- Icon: white, 20px
- Focus: focus-visible ring (4px, colored per context)

### 3.4 Card (level card, stat card, info card)

- Shape: rounded-2xl (16px radius)
- Background: semi-transparent accent (`{color}18` = 9% opacity)
- Border: 2px solid accent color
- Padding: 24px (large) or 12px (stat)
- Shadow: optional colored glow for active/unlocked cards

### 3.5 Toast (feedback message)

- Shape: rounded-2xl (16px radius)
- Background: solid accent color with 93% opacity
- Border: 2px solid same accent color
- Shadow: colored glow
- Text: two lines — title (Fredoka One, white, 14px bold) + subtitle (Nunito, white/90, 12px)
- Duration: ~1.8 seconds
- Animation: rise upward, fade out (respects reduce-motion)
- Max width: 220px

### 3.6 ProgressBar (balance, level progress)

- Container: rounded-full, height 10px, background `rgba(255,255,255,0.1)`
- Fill: rounded-full, colored by value (green >60%, yellow >30%, red ≤30%)
- Transition: width change over 300ms

### 3.7 Toggle (settings switch)

- Size: 52×28 px
- Track: rounded-full, off=`rgba(255,255,255,0.2)`, on=`#22c55e`
- Thumb: 20×20 white circle with shadow
- Role: `switch` with `aria-checked`

### 3.8 TopNavBar (non-gameplay screens)

- Height: ~48px
- Background: `rgba(13,27,42,0.97)` with bottom border 1px `rgba(255,255,255,0.07)`
- Left: logo text "🌿 VitaBalance" (Fredoka One, white, 18px)
- Right: IconButtons for Profile, Ranking, Settings
- Hidden during: intro screen and gameplay

---

## 4. Design Tokens

### 4.1 Colors

| Token | Hex | Usage |
|-------|-----|-------|
| bg-dark-primary | `#0d1b2a` | Main background base |
| bg-dark-secondary | `#1a2e45` | Gradient endpoint, menu bg |
| bg-dark-green | `#0d2a1a` | Intro gradient endpoint |
| bg-gameplay-top | `#0f2744` | Gameplay sky top |
| bg-gameplay-mid | `#0a3d1a` | Gameplay mid gradient |
| bg-gameplay-bottom | `#1a4a0a` | Gameplay ground area |
| green-primary | `#22c55e` | Level 1, success, balance positive |
| green-dark | `#16a34a` | Green border/hover |
| orange-primary | `#f97316` | Level 2, CTA buttons, score accent |
| orange-dark | `#ea580c` | Orange border/hover, cap color |
| purple-primary | `#7c3aed` | Level 3, cape color |
| purple-dark | `#6d28d9` | Purple border |
| yellow-highlight | `#eab308` | Stars, combo, VitaScore |
| yellow-light | `#fbbf24` | Cap details, star decorations |
| red-danger | `#ef4444` | Lives, damage flash, errors |
| blue-info | `#60a5fa` | Powerup glow, winter season |
| blue-light | `#93c5fd` | Powerup pulse secondary |
| white-full | `#ffffff` | Primary text |
| white-muted | `rgba(255,255,255,0.55)` | Secondary text, labels |
| white-dim | `rgba(255,255,255,0.35)` | Tertiary text, hints |
| white-ghost | `rgba(255,255,255,0.08)` | Subtle backgrounds |
| surface-card | `rgba(255,255,255,0.04)` | Locked/disabled card bg |
| surface-active | `rgba(255,255,255,0.1)` | Button bg, interactive surface |
| border-subtle | `rgba(255,255,255,0.08)` | Inactive borders |
| border-light | `rgba(255,255,255,0.18)` | Button borders |

### 4.2 Typography

| Token | Font Family | Weight | Size | Usage |
|-------|-------------|--------|------|-------|
| heading-xl | Fredoka One, cursive | 900 (black) | 48–56px | Game title |
| heading-lg | Fredoka One, cursive | 900 | 32–36px | Screen titles |
| heading-md | Fredoka One, cursive | 900 | 20–24px | Section headings |
| heading-sm | Fredoka One, cursive | 900 | 14–16px | Card titles, labels |
| body-lg | Nunito, sans-serif | 700 (bold) | 16–18px | Descriptions |
| body-md | Nunito, sans-serif | 700 | 14px | UI text, buttons |
| body-sm | Nunito, sans-serif | 700 | 12px | Captions, sub-labels |
| body-xs | Nunito, sans-serif | 400–700 | 10–11px | Hints, disclaimers |
| mono-md | Space Mono, monospace | 700 | 14px | Timer, scores, data |
| mono-sm | Space Mono, monospace | 400 | 12px | Keyboard shortcuts |

**Text shadows:** Headings on dark bg use colored glow (e.g., `0 4px 20px rgba(34,197,94,0.5)` for green).

### 4.3 Spacing

| Token | Value | Usage |
|-------|-------|-------|
| space-xs | 4px | Inline gaps |
| space-sm | 8px | Tight element gaps |
| space-md | 12px | Component internal padding |
| space-lg | 16px | Section gaps, card padding |
| space-xl | 24px | Large card padding, section spacing |
| space-2xl | 32px | Game margin (MARGIN constant) |
| space-3xl | 48px | Major section separation |

### 4.4 Borders

| Token | Value | Usage |
|-------|-------|-------|
| radius-full | 9999px | Buttons, pills, progress bars |
| radius-2xl | 16px | Cards, toasts, overlays |
| radius-xl | 12px | Tags, badges |
| border-width-default | 1px | Subtle borders, stat cards |
| border-width-accent | 2px | Active cards, buttons, focus rings |

### 4.5 Shadows

| Token | Value | Usage |
|-------|-------|-------|
| shadow-button | `0 6px 24px {color}55` | Primary CTA buttons |
| shadow-card | `0 4px 24px {color}38` | Active level cards |
| shadow-toast | `0 4px 20px {color}77` | Feedback toasts |
| shadow-avatar | `drop-shadow(0 8px 32px rgba(34,197,94,0.4))` | Avatar on menus |
| shadow-glow | `0 0 32px {color}` | VitaScore display, headings |

---

## 5. Gameplay HUD Structure

The HUD is a separate overlay scene (HudScene) that runs parallel to the LevelScene.

### Layout (from screenshot 04_gameplay_level1)

```
┌─────────────────────────────────────────────────────────────────────┐
│ HUD BAR (fixed top, dark bg with bottom border)                     │
│                                                                     │
│ Row 1: [★ Score] [♥♥♥] [⏱ 48s] [Balance ████████████] [x2!] [🍏 2/8] [⏸]│
│                                                                     │
│ Row 2 (Level 2 only): [○ Vitamina C] [○ Potasio] [○ Variedad 0/5]  │
│ Row 2 (Level 3 only): [Canasta: 🍊name ✓ 🥦name ...]               │
└─────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────┐
│ GAME CANVAS (scaled to fit, dark green gradient bg)                 │
│                                                                     │
│   [Falling items with rotation]                                     │
│                                                                     │
│   [Feedback toast — floats above avatar]                            │
│                                                                     │
│   [Avatar at bottom — moves horizontally]                           │
│                                                                     │
│   [Ground strip with green gradient border-top]                     │
└─────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────┐
│ TOUCH CONTROLS (outside scaled area, always at viewport bottom)     │
│ [◀ Left]                                            [▶ Right]       │
└─────────────────────────────────────────────────────────────────────┘
```

### HUD Elements Detail

| Element | Visual | Behavior |
|---------|--------|----------|
| Score | Star icon + number in orange pill | Increments on correct catch |
| Lives | 3 heart icons, filled red or empty | Decrements on spoiled catch |
| Timer | Clock icon + seconds in pill | Counts down, turns red at ≤10s |
| Balance | Labeled bar, color changes by % | Green >60%, yellow >30%, red ≤30% |
| Combo | Orange-yellow gradient pill "x{n}!" | Appears only when combo ≥2 |
| Powerup | Blue pill with star + countdown | Visible only when active |
| Progress (L1) | Green pill "🍏 2/8" | Correct count / goal |
| Pause | Icon button (pause bars) | Top-right, opens PauseScene |

---

## 6. UI Differences Between Levels 1, 2, and 3

### Level 1 — Reconocer

| Aspect | Detail |
|--------|--------|
| HUD Row 2 | Progress counter "🍏 {caught}/8" |
| Background | Green-tinted dark gradient (`#0f2744` → `#0a3d1a` → `#1a4a0a`) |
| Accent color | Green `#22c55e` |
| Objective card | Single goal: "Recolectá 8 productos frescos" |
| Spawn types | correct, spoiled, powerup (no wrong-season) |
| Falling speed | Base (slowest): 1.6 base + random 0–1.0 |
| Spawn interval | 1.3 seconds |

### Level 2 — Combinar

| Aspect | Detail |
|--------|--------|
| HUD Row 2 | Three checkable objectives: Vitamina C, Potasio, Variedad {n}/5 |
| Background | Same green gradient (prototype); could use orange tint for identity |
| Accent color | Orange `#f97316` |
| Objective card | Multi-goal: "Vitamina C + Potasio + 5 productos diferentes" |
| Spawn types | correct (with vitaminC/potassium flags), spoiled, wrong-season, powerup |
| Falling speed | Medium: 2.2 base + random 0–1.0 |
| Spawn interval | 0.95 seconds |
| Unique tracker | uniqueItems array; combo only increments on different item |

### Level 3 — Guardianes de las Estaciones

| Aspect | Detail |
|--------|--------|
| HUD Row 2 | Seasonal product checklist (5 items with emoji, name, checkmark) |
| Background | Season-specific gradient (varies by combination) |
| Accent color | Purple `#7c3aed` |
| Objective card | Season context: "Estás en: {from}" → "Canasta para: {to}" + 5 products listed |
| Spawn types | correct (season target), wrong-season (other seasons), spoiled, powerup |
| Falling speed | Fast: 2.8 base + random 0–1.0 |
| Spawn interval | 0.72 seconds |
| Win condition | All 5 checklist items captured (one of each) |
| Seasonal backgrounds | 4 gradient palettes defined per season combination |

### Spawn probability distribution (all levels)

| Type | Probability |
|------|-------------|
| correct | 52% |
| spoiled | 18% |
| wrong-season / not-solicited | 18% |
| powerup (Estrella Vita) | 12% |

> **Note:** Steering says spoiled never exceeds 25% of total spawn — prototype uses 18%, which complies.

---

## 7. Avatar and Outfit Progression

### Avatar structure (SVG-based in prototype)

The avatar is a cartoon character composed of layered parts:

| Part | Description |
|------|-------------|
| Head | Circle, skin tone `#fde68a` |
| Eyes | Dark circles with white highlights |
| Smile | Curved stroke path |
| Cheeks | Orange ellipses at 50% opacity |
| Body | Ellipse, changes color by outfit |
| Arms | Rotated ellipses, same color as body |
| Legs | Blue ellipses (`#60a5fa`) |

### Outfit states (cumulative)

| Outfit Level | Trigger | Visual Change |
|--------------|---------|---------------|
| 0 — Base | Start of game | Green body (`#4ade80`), brown hair visible |
| 1 — Gorra Cítrica | Complete Level 1 | Orange cap (`#ea580c`) with yellow pom-pom, hair hidden |
| 2 — Remera VitaBalance | Complete Level 2 | Body turns orange (`#f97316`), "VB" text on chest |
| 3 — Capa VitaHero | Complete Level 3 | Purple cape (`#7c3aed`) behind body, gold star on cape |

### Avatar animation

| Animation | Behavior | Respect reduce-motion |
|-----------|----------|----------------------|
| Bob (idle) | translateY 0→-7px, 0.7s alternate infinite | Disabled when reduce-motion |
| Bob (menu) | translateY 0→-7px, 1.2s alternate infinite | Disabled when reduce-motion |
| Gameplay movement | Horizontal translation at 14px/frame | Always active (functional) |

### Avatar sizing

| Context | Size |
|---------|------|
| Gameplay | 64×64 px |
| Intro screen | 110×110 px |
| Results screen | 80×80 px |
| Profile screen | 110×110 px (animated) |
| Results reward card | 56×56 px |

> **ASSUMPTION:** In Phaser, the avatar will be implemented as a sprite sheet or composed game objects,
> not as inline SVG. The visual proportions and color scheme should match the prototype reference.

---

## 8. Feedback Messages and Animations

### Toast feedback (during gameplay)

| Capture type | Toast color | Title format | Subtitle format |
|--------------|-------------|--------------|-----------------|
| Correct | Green `#22c55e` | "{emoji} {name} · {nutrient}" | "+{points}" or "+{points} · Variedad +1" |
| Correct (L3) | Green `#22c55e` | "{emoji} {name} · {nutrient}" | "+{points} · ✓ {seasonName}" |
| Spoiled | Red `#ef4444` | "{name}" | "Producto en mal estado · -1 vida" |
| Wrong-season/not-solicited | Orange `#f97316` | "{name}" | "No corresponde a esta misión" |
| Powerup | Yellow `#eab308` | "⭐ Estrella Vita" | "Caída lenta · 3s" |

**Toast behavior:**
- Position: above avatar, clamped to game bounds (min 80px from edges)
- Duration: 1.8 seconds (matches steering)
- Animation: rise 76px upward with scale bounce, fade out
- Stacking: multiple toasts offset vertically (12px each)
- Reduce-motion: no animation, static display at 95% opacity

### Screen flash (damage)

- Trigger: catching spoiled item
- Visual: full-screen red overlay at 28% opacity
- Duration: 350ms ease-out fade
- Reduce-motion: disabled entirely

### Confetti (victory)

- Trigger: win condition met
- Pieces: 36 colored shapes (circles and rectangles)
- Colors: orange, green, yellow, purple, blue, pink (cycling)
- Animation: fall from top with rotation over 2–3.5s
- Reduce-motion fallback: static emoji row "🎉🌟🎊✨🏆" centered

### Item animations (falling products)

| Property | Behavior |
|----------|----------|
| Fall | Linear downward at speed × 60 × dt |
| Rotation | Continuous rotation at random speed (-2.5 to +2.5 deg/frame) |
| Size | 44–58px random per item |
| Spoiled filter | `saturate(0.25) brightness(0.65)` + opacity 0.65 |
| Powerup glow | Radial gradient pulse + `drop-shadow(0 0 10px #60a5fa)` |

### Powerup active state

- All items slow to 28% speed for 3 seconds
- HUD shows blue pulsing indicator with countdown
- Pulse animation: box-shadow oscillates (6px → 22px → 6px blue glow)

### UI micro-animations

| Element | Animation |
|---------|-----------|
| Floating bg emojis (intro) | Slow vertical float + slight rotation, 3–6s cycle |
| Star decorations (intro) | Twinkle scale 0.8→1.2, 1.5–3s |
| Combo pill appear | Implied scale transition |
| Button press | scale(0.95) on active |
| Win overlay emoji | Bob animation (same as avatar) |

---

## 9. Pause, Victory, Defeat, and Results States

### Pause overlay (PauseScene)

- Trigger: Escape key or Pause button
- Background: black at 78% opacity + `backdrop-filter: blur(6px)`
- Title: "⏸ Pausa" (Fredoka One, white, 30px)
- Three buttons stacked vertically:
  1. "Continuar" — green `#22c55e`, Play icon
  2. "Reiniciar" — orange `#f97316`, RotateCcw icon
  3. "Menú principal" — purple `#7c3aed`, Home icon
- Buttons: pill shape, 220×52px min, colored glow shadow
- Game state: timer stopped, items frozen in place

### Victory overlay (in-game, before transition)

- Trigger: win condition met
- Background: black at 65% opacity + `backdrop-filter: blur(4px)`
- Confetti effect active (or fallback emojis)
- Large emoji "🎉" with bob animation
- Title: "¡Misión Cumplida!" (Fredoka One, white, 36px, green glow shadow)
- Subtitle: "Canasta completada · Procesando resultados..." (Nunito, green, 18px)
- Auto-transition to Results screen after ~2.8 seconds

### Results screen (VictoryScene / GameOverScene)

**Header area:**
- Avatar (80px) with green glow filter
- Title: "¡Resultados!" (victory) or "Tiempo agotado" (defeat)
- Star rating: 1–3 stars (gold filled or gray empty)
  - 3 stars: 0 errors
  - 2 stars: 1–3 errors
  - 1 star: 4+ errors

**VitaScore display:**
- Label: "VitaScore" (white/55, Nunito, 14px)
- Value: large number (Fredoka One, yellow, 48px) with gold glow

**Stats grid (2×4 on desktop, responsive):**

| Stat | Color |
|------|-------|
| Balance (%) | Green |
| Precisión (%) | Orange |
| Variedad (count) | Purple |
| Tiempo extra (s) | Yellow |
| Errores (count) | Red |
| Combo máx (x{n}) | Blue |
| Puntuación (total) | Orange |
| Estrellas (★/☆) | Yellow |

**Reward card (victory only):**
- Gradient gold/orange background
- Border: 2px yellow
- Content: reward emoji + "¡Prenda desbloqueada!" + reward name + mini avatar

**Educational section: "Lo que aprendiste"**
- Title: Fredoka One, white, 18px
- Grid: 1×3 (responsive) info cards
- Each card: emoji icon + bold title + descriptive text (age-appropriate)
- Content varies by level (see App.reference.tsx `learnCards`)

**Action buttons:**
- "Continuar" — orange pill, ChevronRight icon (goes to next level or mission select)
- "Repetir" — green outline pill, RotateCcw icon (replays same level)

---

## 10. Responsive Behavior

### Game canvas scaling strategy

| Property | Value |
|----------|-------|
| Logical resolution | 1280 × 520 px |
| Scale mode | FIT (maintain aspect ratio) |
| Scale formula | `min(containerWidth / 1280, containerHeight / 520, 1)` |
| Centering | Offset X/Y to center in available space |
| Minimum playable viewport | 640 × 360 px (steering requirement) |

### Breakpoint behavior

| Viewport | Behavior |
|----------|----------|
| Desktop (≥1280px wide) | Canvas at 1:1 or slightly scaled down |
| Tablet (1024×768) | Canvas scaled to ~80%, touch controls visible |
| Mobile horizontal (640×360) | Canvas significantly scaled, touch controls prominent |

### Touch controls

- Position: fixed at bottom of viewport wrapper, OUTSIDE scaled game area
- Size: 64×64 px circular buttons
- Opacity: 80% (semi-transparent to not obscure gameplay)
- Touch action: `none` (prevent scroll interference)
- Always visible on touch devices (no media query hiding in prototype)

### Responsive text and UI

- HUD labels marked `hidden sm:block` for smallest viewports (balance label)
- Level 3 checklist item names: `hidden sm:inline` (show emoji only on mobile)
- Stats grid: `grid-cols-2 sm:grid-cols-4`
- Educational cards: `grid-cols-1 sm:grid-cols-3`
- Buttons and tooltips: flex-wrap for narrow screens

### Safe areas

- Game area margins: 32px left/right (MARGIN constant)
- Vertical safe zone indicators: subtle 2px lines at margins
- Feedback toast clamped: min 80px from left edge, max (GAME_W - 80px) from right

> **ASSUMPTION:** Phaser Scale Manager `FIT` or `RESIZE` mode will replicate this behavior.
> Touch controls will be DOM overlays or Phaser UI elements outside the scaled scene.

---

## 11. WCAG AA Accessibility Requirements

### Implemented in prototype (verified)

| Requirement | Implementation |
|-------------|----------------|
| Min touch target 44×44 px | All buttons enforce `minWidth: 44, minHeight: 44` |
| Focus-visible indicator | `focus-visible:ring-4` with colored ring on all interactive elements |
| Keyboard navigation | Arrow keys + A/D for gameplay, Escape for pause |
| aria-label on icon buttons | "Configuración", "Pausa", "Mover izquierda", "Mover derecha", "Perfil", "Ranking" |
| aria-label on lives | `Vidas: ${gs.lives}` |
| aria-label on stars | `${stars} estrellas` |
| role="switch" on toggle | Settings reduce-motion toggle with `aria-checked` |
| prefers-reduced-motion | Global CSS override disables all animations; confetti shows static fallback |
| Spoiled items differentiated | Visual filter (desaturated + dim) + form distortion (per steering) |
| No flash >3/sec | Damage flash is single 350ms pulse, no repeated flashing |

### Required by steering but NOT visible in prototype (must implement)

| Requirement | Status |
|-------------|--------|
| Tab order in menus | MISSING — prototype relies on click/tap only for menus |
| Focus trap in overlays | MISSING — pause overlay has no focus management |
| No color-only information | PARTIALLY MET — combo and powerup use text+color; lives use shape (heart) + fill |
| 4.5:1 contrast ratio check | NEEDS VERIFICATION — white on dark blue likely passes; yellow on dark needs testing |
| Text min 16px equivalent | Smallest text is 10-12px (hints, disclaimers) — may need increase |
| Instructions before level start | MET — objective screen shows goal clearly |
| Non-punitive messaging | PARTIALLY MET — "Tiempo agotado" could be more encouraging |

### Accessibility settings (from Settings screen)

The Settings screen provides:
1. **Reduce motion toggle** — disables animations globally
2. **Keyboard controls reference** — visible in Settings
3. **Accessibility info block** — states: "Contraste mínimo AA · Botones ≥44px · Foco visible · Navegación por teclado · Etiquetas accesibles"

> **MISSING (steering "Mejoras opcionales"):** Volume control not present in prototype.
> Steering lists "volumen" as a localStorage setting. Should be added to Settings screen.

---

## 12. Differences and Conflicts Between Prototype and Steering Documents

> **Rule:** When there is a conflict, the steering documents are the source of truth.
> Changes to steering require explicit approval before implementation.

### Critical conflicts

| # | Topic | Prototype says | Steering says | Resolution |
|---|-------|---------------|---------------|------------|
| 1 | Boot/Preload scenes | Not present | Required (BootScene, PreloadScene) | **Add them.** Steering is correct — Phaser needs asset preloading. |
| 2 | Victory vs Defeat screens | Single "results" screen with conditional content | Separate VictoryScene and GameOverScene | **Follow steering.** Implement as two distinct scenes with shared layout but different messaging. |
| 3 | VitaScore formula | `(score×0.35) + (balance×2) + (precision×1.5) + (uniqueItems×25)` — omits combo_max | `puntaje_base + (precisión × bonus) + (variedad × bonus) + (combo_max × bonus)` | **Follow steering.** Include combo_max in formula. Prototype formula can inform weight tuning. |
| 4 | Defeat message | "Tiempo agotado" (neutral) | "Mensaje motivacional, no punitivo" | **Follow steering.** Use encouraging messages like "¡Buen intento! Cada partida te acerca más." |
| 5 | Spoiled feedback text | "Producto en mal estado" | "¡Ese no estaba bien!" or similar (short, non-punitive) | **Follow steering.** Use friendlier tone. |
| 6 | Wrong-season category | Exists as explicit `wrong-season` type | Only defines: correct, not-solicited, deteriorated | **Reconcile.** "Wrong-season" in L3 maps to "not-solicited" in steering. Same behavior: 0 points, reduces precision, cuts combo, no life loss. Use steering terminology internally. |

### Minor conflicts

| # | Topic | Prototype says | Steering says | Resolution |
|---|-------|---------------|---------------|------------|
| 7 | Product: Limón | Present in Level 1 items | Not in educational-content product table | **Add to products.ts** with verified nutrient info, or remove from L1. Needs team confirmation. |
| 8 | Products: Pomelo, Puerro, Papa, Pepino, Lechuga, Arvejas, Uva | Used in Level 3 seasonal configs | Not all in educational-content table | **Extend products.ts** with verified data. Steering allows this — table is "indicativa". |
| 9 | Level 3 point value | 150 points per correct item | Steering doesn't specify per-level point values | **Acceptable.** Prototype adds differentiation. Document in levels.ts config. |
| 10 | Level 3 seasonal combinations | Primavera→Invierno, Invierno→Verano, Verano→Otoño, Otoño→Primavera (random) | Same combinations listed, but implies fixed per-session (not random) | **Follow prototype.** Random selection adds replayability. Document in levels.ts. |

### Additions in prototype not in steering (proposed new scenes)

| Screen | Recommendation |
|--------|----------------|
| Profile (avatar + progress) | **Add as ProfileScene.** Valuable for progression visibility. |
| HowToPlay (tutorial tips) | **Add as HowToPlayScene.** Needed for onboarding. |
| Settings (accessibility + controls) | **Add as SettingsScene.** Required for reduce-motion toggle (steering mandates this). |

> **Proposed steering update:** Add ProfileScene, HowToPlayScene, and SettingsScene to the scene list
> in `structure.md`. Do not apply until approved.

### Missing information (not in prototype or steering)

| Item | Status |
|------|--------|
| Volume/audio control UI | Not in prototype; steering mentions localStorage for volume preference |
| "Acerca de" screen with disclaimers | Steering (educational-content) requires nutritional disclaimers somewhere |
| Alias input for ranking submission | Steering mentions anonymous alias; prototype shows placeholder ranking with no input |
| Confetti particles in Phaser | Prototype uses CSS keyframes; Phaser will need particle emitter |
| Asset file names and sprite dimensions | Not specified — to be defined during implementation |
| Exact font loading strategy for Phaser | Fredoka One + Nunito + Space Mono need WebFont loading in PreloadScene |

---

## Appendix: File References

| File | Role |
|------|------|
| `docs/references/figma-make/App.reference.tsx` | Behavioral and content reference (DO NOT import) |
| `docs/references/figma-make/screenshots/01_Home.png` | Intro/Menu visual reference |
| `docs/references/figma-make/screenshots/02_mission_select.png` | Level selection visual reference |
| `docs/references/figma-make/screenshots/03_objective_level1.png` | Pre-level briefing visual reference |
| `docs/references/figma-make/screenshots/04_gameplay_level1.png` | Gameplay + HUD visual reference |
| `docs/references/figma-make/screenshots/05_results.png` | Results/GameOver visual reference |
| `docs/references/figma-make/screenshots/06_settings.png` | Settings visual reference |
