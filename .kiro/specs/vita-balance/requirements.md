# Requirements Document

## Introduction

VitaBalance: Guardianes de las Estaciones es un videojuego web arcade y educativo donde niños y niñas de 8 a 12 años mueven horizontalmente un avatar para recolectar frutas y verduras según la misión del nivel. El juego enseña sobre nutrición y estacionalidad a través de 3 niveles con dificultad progresiva, un sistema de puntaje compuesto (VitaScore), personalización del avatar por logros y un ranking global anónimo.

## Glossary

- **Game_Engine**: Motor de juego Phaser 3 que gestiona el ciclo de actualización, renderizado y entrada del usuario.
- **Player_Avatar**: Personaje controlable por el jugador que se mueve horizontalmente en la parte inferior de la pantalla de juego.
- **Product**: Elemento que cae desde la parte superior de la pantalla y puede ser capturado por el Player_Avatar.
- **Correct_Product**: Producto que cumple la misión activa del nivel actual.
- **Unsolicited_Product**: Producto saludable que no es requerido por la misión activa.
- **Spoiled_Product**: Producto visualmente deteriorado (manchas, color apagado, forma distorsionada).
- **Estrella_Vita**: Power-up que reduce la velocidad de caída de todos los productos al 28% durante 3 segundos.
- **VitaScore**: Métrica compuesta final calculada como: score × 0.35 + balance × 2 + variety × 25 + comboMax × bonusCombo. Los coeficientes se almacenan como constantes configurables en `src/config/scoring.ts`.
- **Combo**: Contador que se incrementa al capturar productos distintos consecutivos y se reinicia al capturar un Spoiled_Product o Unsolicited_Product.
- **Precision**: Ratio de capturas correctas dividido por capturas totales.
- **Balance**: Métrica penalizada por la captura de Spoiled_Products.
- **Variety**: Cantidad de productos diferentes capturados durante un nivel.
- **Spawn_System**: Sistema que genera productos en posiciones aleatorias del eje X en la parte superior de la pantalla.
- **HUD**: Interfaz superpuesta durante el juego que muestra puntaje, vidas, temporizador, balance, combo y progreso.
- **Toast**: Notificación flotante temporal (~1.8s) que muestra información educativa al capturar un Correct_Product.
- **Ranking_Service**: Servicio backend (API Gateway + Lambda + DynamoDB) que almacena y consulta la tabla de posiciones global.
- **localStorage_Service**: Servicio de persistencia local para progreso del jugador y configuraciones.
- **Scene**: Pantalla o estado del juego gestionado por Phaser (Boot, Preload, Menu, Level, HUD, Pause, Victory, GameOver, Ranking, Profile, HowToPlay, Settings).
- **Season**: Período estacional (Verano, Otoño, Invierno, Primavera) con productos asociados según la región central de Argentina.
- **Audio_System**: Sistema que gestiona la reproducción de música de fondo, efectos de sonido (SFX) y controles de volumen.
- **ProfileScene**: Pantalla que muestra el avatar, VitaScore acumulado, progreso de niveles, colección de insignias y apodo del jugador.

## Requirements

### Requirement 1: Core Gameplay Loop

**User Story:** As a player, I want to move my avatar horizontally to catch falling products, so that I can complete level missions by making strategic decisions about which products to capture.

#### Acceptance Criteria

1. WHEN the player presses left/right arrow keys or A/D keys, THE Player_Avatar SHALL move horizontally within the game bounds at a speed of 14 pixels per frame.
2. WHEN the player touches or drags on the lower half of the screen on a touch device, THE Player_Avatar SHALL move horizontally toward the touch position.
3. WHEN the Player_Avatar overlaps with a falling Product, THE Collision_System SHALL register a capture event and remove the Product from the screen.
4. WHEN a Product falls below the bottom of the game area without being captured, THE Spawn_System SHALL remove it from the scene without applying any penalty to the player.
5. WHILE a level is active, THE Spawn_System SHALL generate products at random horizontal positions from the top of the game area according to the configured spawn rate and probability distribution for the current level.
6. THE Spawn_System SHALL distribute product types with the following probabilities: 52% Correct_Product, 18% Spoiled_Product, 18% Unsolicited_Product, and 12% Estrella_Vita.
7. WHILE a level is active, THE Game_Engine SHALL apply gravity to all falling products at the configured speed for the current level, with a random variance of 0 to 1.0 added to the base speed.

### Requirement 2: Scoring and Metrics

**User Story:** As a player, I want to earn points and see my performance metrics, so that I understand how well I'm making nutritional decisions and can improve my score.

#### Acceptance Criteria

1. WHEN the Player_Avatar captures a Correct_Product, THE Scoring_System SHALL add the configured point value to the player's score.
2. WHEN the Player_Avatar captures a Correct_Product that is different from the previously captured product, THE Scoring_System SHALL increment the Combo counter by one.
3. WHEN the Player_Avatar captures a Spoiled_Product or Unsolicited_Product, THE Scoring_System SHALL reset the Combo counter to zero.
4. WHEN the Player_Avatar captures any Product, THE Scoring_System SHALL recalculate Precision as the ratio of correct captures to total captures.
5. WHEN the Player_Avatar captures a Spoiled_Product, THE Scoring_System SHALL reduce the Balance metric.
6. WHEN the Player_Avatar captures a Correct_Product not previously captured in the current session, THE Scoring_System SHALL increment the Variety counter by one.
7. WHEN a level ends, THE Scoring_System SHALL calculate VitaScore using the formula: `VitaScore = score × 0.35 + balance × 2 + variety × 25 + comboMax × bonusCombo`, where all coefficients (0.35, 2, 25, bonusCombo) are defined as configurable constants in `src/config/scoring.ts`.
8. THE Scoring_System SHALL read all VitaScore formula coefficients from the configuration module, allowing balance adjustments without modifying scoring logic code.

### Requirement 3: Lives and Damage

**User Story:** As a player, I want a limited number of lives that create tension, so that I must be careful about which products I catch.

#### Acceptance Criteria

1. WHEN a level begins, THE Game_Engine SHALL initialize the player with 3 lives.
2. WHEN the Player_Avatar captures a Spoiled_Product, THE Game_Engine SHALL reduce the player's lives by one.
3. WHEN the Player_Avatar captures a Spoiled_Product, THE Game_Engine SHALL display a red screen flash at 28% opacity for 350 milliseconds.
4. WHEN the player's lives reach zero, THE Game_Engine SHALL immediately end the level and transition to the GameOverScene.
5. WHEN the Player_Avatar captures an Unsolicited_Product, THE Game_Engine SHALL NOT reduce the player's lives.

### Requirement 4: Power-Up (Estrella Vita)

**User Story:** As a player, I want to activate a power-up that slows down falling products temporarily, so that I can make better decisions when the screen gets crowded.

#### Acceptance Criteria

1. WHEN the Player_Avatar captures an Estrella_Vita, THE Game_Engine SHALL reduce the fall speed of all active products to 28% of their current speed for 3 seconds.
2. WHILE the Estrella_Vita effect is active, THE HUD SHALL display a blue pulsing indicator with a countdown showing remaining seconds.
3. WHEN the Estrella_Vita effect expires, THE Game_Engine SHALL restore all products to their normal fall speed.
4. WHILE the Estrella_Vita effect is active, THE Game_Engine SHALL apply the speed reduction to newly spawned products as well.

### Requirement 5: Level 1 — Reconocer

**User Story:** As a player, I want to complete a basic recognition level, so that I can learn the mechanics and identify fresh products.

#### Acceptance Criteria

1. WHEN Level 1 begins, THE Game_Engine SHALL set the timer to 60 seconds, the base fall speed to 1.6, and the spawn interval to 1.3 seconds.
2. WHEN the player captures 8 or more Correct_Products AND the timer reaches zero with at least 1 life remaining, THE Objective_System SHALL trigger the VictoryScene.
3. WHEN the timer reaches zero AND the player has fewer than 8 correct captures, THE Objective_System SHALL trigger the GameOverScene.
4. WHEN Level 1 is completed successfully, THE Progress_System SHALL unlock Level 2 and award the "Gorra Cítrica" avatar item.
5. WHILE Level 1 is active, THE HUD SHALL display a progress indicator showing the count of correct captures out of 8.

### Requirement 6: Level 2 — Combinar

**User Story:** As a player, I want to complete a combination challenge, so that I can learn about different vitamins and the importance of variety.

#### Acceptance Criteria

1. WHEN Level 2 begins, THE Game_Engine SHALL set the timer to 75 seconds, the base fall speed to 2.2, and the spawn interval to 0.95 seconds.
2. WHEN the player captures at least 1 product with vitamin C, at least 1 product with potassium, AND at least 5 different products, with at least 1 life remaining when the timer reaches zero, THE Objective_System SHALL trigger the VictoryScene.
3. WHEN the timer reaches zero AND the player has not fulfilled all three sub-objectives, THE Objective_System SHALL trigger the GameOverScene.
4. WHEN Level 2 is completed successfully, THE Progress_System SHALL unlock Level 3 and award the "Remera VitaBalance" avatar item.
5. WHILE Level 2 is active, THE HUD SHALL display three checkable objective indicators: Vitamina C, Potasio, and Variedad with current count out of 5.

### Requirement 7: Level 3 — Guardianes de las Estaciones

**User Story:** As a player, I want to complete a seasonal challenge, so that I can learn which products are available in each season.

#### Acceptance Criteria

1. WHEN Level 3 begins, THE Game_Engine SHALL randomly select a seasonal combination (Primavera→Invierno, Invierno→Verano, Verano→Otoño, or Otoño→Primavera), set the timer to 90 seconds, the base fall speed to 2.8, and the spawn interval to 0.72 seconds.
2. WHEN the player captures all 5 required products from the target season (one of each), with at least 1 life remaining, THE Objective_System SHALL trigger the VictoryScene.
3. WHEN the timer reaches zero AND the player has not captured all 5 target season products, THE Objective_System SHALL trigger the GameOverScene.
4. WHEN Level 3 is completed successfully, THE Progress_System SHALL award the "Capa VitaHero" avatar item.
5. WHILE Level 3 is active, THE HUD SHALL display a seasonal product checklist showing which of the 5 target products have been captured.

### Requirement 8: Educational Feedback

**User Story:** As a player, I want to see brief nutritional information when I catch correct products, so that I learn about vitamins and nutrients in a fun way.

#### Acceptance Criteria

1. WHEN the Player_Avatar captures a Correct_Product, THE Toast SHALL display the product name, its highlighted nutrient, and the points earned for approximately 1.8 seconds.
2. WHEN the Player_Avatar captures a Spoiled_Product, THE Toast SHALL display a short non-punitive message such as "¡Ese no estaba bien!" for approximately 1.8 seconds.
3. WHEN the Player_Avatar captures an Unsolicited_Product, THE Toast SHALL display the product name and a message indicating it does not correspond to the current mission for approximately 1.8 seconds.
4. THE Toast SHALL position itself above the Player_Avatar, clamped to at least 80 pixels from the game area edges.
5. WHEN multiple captures occur in rapid succession, THE Toast SHALL stack vertically with 12 pixels of offset between messages.

### Requirement 9: Avatar Progression

**User Story:** As a player, I want my avatar to visually evolve as I complete levels, so that I feel rewarded and motivated to keep playing.

#### Acceptance Criteria

1. THE Player_Avatar SHALL start with a base appearance (green body, no accessories) when no levels have been completed.
2. WHEN Level 1 is completed, THE Player_Avatar SHALL display the "Gorra Cítrica" (orange cap with yellow pom-pom) in all subsequent scenes.
3. WHEN Level 2 is completed, THE Player_Avatar SHALL additionally display the "Remera VitaBalance" (orange body with "VB" text) in all subsequent scenes.
4. WHEN Level 3 is completed, THE Player_Avatar SHALL additionally display the "Capa VitaHero" (purple cape with gold star) in all subsequent scenes.
5. THE Progress_System SHALL persist unlocked avatar items to localStorage so they remain available across browser sessions.

### Requirement 10: Pause and Resume

**User Story:** As a player, I want to pause the game at any time without losing progress, so that I can take breaks or attend to other things.

#### Acceptance Criteria

1. WHEN the player presses the Escape key or taps the Pause button during gameplay, THE Game_Engine SHALL freeze the timer, all falling products, and the Player_Avatar.
2. WHILE the game is paused, THE PauseScene SHALL display three options: "Continuar" (resume), "Reiniciar" (restart level), and "Menú principal" (return to menu).
3. WHEN the player selects "Continuar", THE Game_Engine SHALL restore the game state exactly as it was before pausing.
4. WHEN the player selects "Reiniciar", THE Game_Engine SHALL reset the current level to its initial state.
5. WHEN the player selects "Menú principal", THE Game_Engine SHALL discard the current game session and navigate to the MenuScene.

### Requirement 11: Victory and Defeat Screens

**User Story:** As a player, I want to see my results after completing or failing a level, so that I understand my performance and feel motivated to improve.

#### Acceptance Criteria

1. WHEN a level is won, THE VictoryScene SHALL display confetti animation, star rating (3 stars for 0 errors, 2 for 1–3 errors, 1 for 4+ errors), VitaScore, detailed stats (Balance, Precisión, Variedad, Tiempo extra, Errores, Combo máx, Puntuación, Estrellas), the unlocked reward, and an educational "Lo que aprendiste" section.
2. WHEN a level is lost, THE GameOverScene SHALL display a motivational non-punitive message, partial VitaScore, and stats.
3. WHEN a level is won, THE VictoryScene SHALL offer buttons to "Continuar" (proceed to next level or mission select) and "Repetir" (replay the same level).
4. WHEN a level is lost, THE GameOverScene SHALL offer buttons to "Reintentar" (replay same level) and "Menú" (return to menu).
5. WHEN the player wishes to submit a score to the ranking from the VictoryScene or GameOverScene, THE Game_Engine SHALL display an alias input field where the player enters a nickname before submission.
6. THE Game_Engine SHALL NOT submit the score to the Ranking_Service until the player has entered a valid alias (1–16 characters, alphanumeric and spaces only).
7. THE localStorage_Service SHALL persist the player's nickname so it is pre-filled on subsequent score submissions.

### Requirement 12: Global Ranking

**User Story:** As a player, I want to see a global leaderboard and submit my score with an anonymous alias, so that I can compare my performance with other players.

#### Acceptance Criteria

1. WHEN the player submits a score, THE Ranking_Service SHALL store the alias, VitaScore, precision, variety, and timestamp in DynamoDB using the partition key `RANKING#<level>` and sort key `<timestamp>#<alias>`.
2. WHEN the player views the ranking screen, THE Ranking_Service SHALL retrieve and display the top scores for the selected level ordered by VitaScore descending.
3. THE Ranking_Service SHALL require only an anonymous alias (no real name, email, or password) to submit a score.
4. IF the Ranking_Service API is unavailable, THEN THE Game_Engine SHALL continue operating without interruption and display a non-intrusive message indicating the ranking is temporarily unavailable.

### Requirement 13: Navigation and Menus

**User Story:** As a player, I want clear navigation between game screens, so that I can easily access levels, settings, and other features.

#### Acceptance Criteria

1. WHEN the game finishes loading, THE MenuScene SHALL display the game title, the Player_Avatar with current outfit, a "¡Jugar!" button, a "Cómo jugar" button, and a settings icon.
2. WHEN the player selects "¡Jugar!", THE MenuScene SHALL navigate to the MissionSelect sub-state showing level cards for all 3 levels.
3. WHILE on the MissionSelect screen, THE Game_Engine SHALL display locked levels as visually disabled and prevent interaction with them.
4. WHEN the player selects an unlocked level, THE Game_Engine SHALL navigate to the ObjectiveScreen showing the level goal description and a "¡Comenzar!" button.
5. WHILE on non-gameplay and non-intro screens, THE Game_Engine SHALL display a top navigation bar with icons for Profile, Ranking, and Settings.

### Requirement 14: Responsive Design and Scaling

**User Story:** As a player, I want the game to work on desktop, tablet, and mobile devices in landscape orientation, so that I can play on any device.

#### Acceptance Criteria

1. THE Game_Engine SHALL use a logical resolution of 1280×520 pixels with a FIT scale mode that maintains aspect ratio.
2. THE Game_Engine SHALL support viewports from a minimum of 640×360 pixels up to 1920×1080 pixels.
3. WHILE on a touch-enabled device, THE Game_Engine SHALL display touch control buttons (left/right) of at least 64×64 pixels at the bottom of the viewport.
4. THE Game_Engine SHALL scale text, HUD elements, and interactive components proportionally so that all interactive elements maintain a minimum touch target of 44×44 pixels.

### Requirement 15: Accessibility

**User Story:** As a player with diverse abilities, I want the game to be accessible, so that I can enjoy it regardless of motor, visual, or cognitive differences.

#### Acceptance Criteria

1. THE Game_Engine SHALL support full keyboard navigation: arrow keys and A/D for gameplay, Tab for menu navigation, Enter for selection, and Escape for pause/back.
2. THE Game_Engine SHALL display a visible focus indicator (ring of at least 4 pixels) on all interactive elements when navigated via keyboard.
3. WHEN the operating system has `prefers-reduced-motion: reduce` enabled, THE Game_Engine SHALL disable confetti, reduce falling animations to simple transitions, and disable decorative floating elements.
4. THE Game_Engine SHALL ensure all text has a contrast ratio of at least 4.5:1 against its background and all large text has at least 3:1.
5. THE Game_Engine SHALL differentiate Spoiled_Products from normal products using form distortion and texture patterns in addition to color changes, ensuring information is not conveyed by color alone.
6. WHEN the game displays screen flash on damage, THE Game_Engine SHALL limit it to a single pulse of 350 milliseconds and never flash more than 3 times per second.
7. THE SettingsScene SHALL provide a "Reducir movimiento" toggle that enables reduced-motion mode regardless of operating system settings.

### Requirement 16: Data-Driven Configuration

**User Story:** As a developer, I want game parameters defined in configuration files, so that balance adjustments can be made without modifying game logic.

#### Acceptance Criteria

1. THE Game_Engine SHALL load product definitions (name, emoji, nutrient, season, point value, vitamin flags) from a typed configuration module at `src/config/products.ts`.
2. THE Game_Engine SHALL load season definitions (season name, months, associated products) from a typed configuration module at `src/config/seasons.ts`.
3. THE Game_Engine SHALL load level definitions (duration, speed, spawn rate, spawn probabilities, objectives, reward) from a typed configuration module at `src/config/levels.ts`.
4. THE Game_Engine SHALL load VitaScore formula coefficients from a typed configuration module at `src/config/scoring.ts`.
5. WHEN a configuration value is modified, THE Game_Engine SHALL reflect the change without requiring modifications to scene or system code.

### Requirement 17: Local Persistence

**User Story:** As a player, I want my progress and settings saved locally, so that I can resume where I left off without needing an account.

#### Acceptance Criteria

1. WHEN a level is completed successfully, THE localStorage_Service SHALL persist the updated progress (levels completed, avatar items unlocked) immediately.
2. WHEN the player changes a setting (reduced-motion, music on/off, volume), THE localStorage_Service SHALL persist the preference immediately.
3. WHEN the game loads, THE localStorage_Service SHALL restore previously saved progress and settings.
4. IF localStorage is unavailable or corrupted, THEN THE Game_Engine SHALL start with default settings and empty progress without displaying an error to the player.
5. THE localStorage_Service SHALL persist the player's chosen nickname so it is pre-filled on subsequent score submissions.

### Requirement 18: Scene Lifecycle and Asset Loading

**User Story:** As a player, I want the game to load quickly and transition smoothly between screens, so that I have a fluid experience.

#### Acceptance Criteria

1. WHEN the game starts, THE BootScene SHALL initialize the Phaser engine and immediately transition to PreloadScene.
2. WHILE assets are loading, THE PreloadScene SHALL display a progress bar showing the percentage of assets loaded.
3. WHEN all assets are loaded, THE PreloadScene SHALL transition to the MenuScene.
4. THE PreloadScene SHALL load all required web fonts (Fredoka One, Nunito, Space Mono) before transitioning.
5. WHEN transitioning between scenes, THE Game_Engine SHALL dispose of unused scene resources to prevent memory leaks.

### Requirement 19: HowToPlay and Settings Screens

**User Story:** As a new player, I want to learn how to play before starting, and as any player, I want to configure accessibility and audio options.

#### Acceptance Criteria

1. WHEN the player selects "Cómo jugar" from the MenuScene, THE Game_Engine SHALL navigate to the HowToPlayScene displaying control instructions, game objectives overview, and product type explanations.
2. WHEN the player navigates to the SettingsScene, THE Game_Engine SHALL display a "Reducir movimiento" toggle, a music on/off toggle, a volume control, keyboard control reference, and an accessibility information block.
3. WHEN the player toggles "Reducir movimiento", THE SettingsScene SHALL immediately apply the setting and persist it via localStorage_Service.
4. THE SettingsScene SHALL display the nutritional disclaimer: "La información nutricional es orientativa y educativa. No reemplaza el consejo de un profesional de la salud."

### Requirement 20: Profile Screen

**User Story:** As a player, I want to view my profile with my avatar, scores, and collected rewards, so that I can track my overall progress and feel a sense of accomplishment.

#### Acceptance Criteria

1. WHEN the player navigates to the ProfileScene, THE Game_Engine SHALL display the Player_Avatar at its current outfit level with an animated idle bob.
2. THE ProfileScene SHALL display the player's accumulated VitaScore total, total points earned across all sessions, and the player's nickname.
3. THE ProfileScene SHALL display the current outfit name and a visual representation of all avatar items (locked and unlocked) in a badge/outfit collection grid.
4. THE ProfileScene SHALL display level progression status for all 3 levels, indicating which are completed (checkmark), which is the next available (highlighted), and which are locked.
5. IF the player has not yet set a nickname, THE ProfileScene SHALL display a default placeholder text "Jugador" and allow the player to set their nickname from the profile.
6. THE ProfileScene SHALL persist the player's nickname to localStorage via the localStorage_Service.

### Requirement 21: Audio System

**User Story:** As a player, I want background music and sound effects that enhance the gameplay experience, so that the game feels lively and engaging.

#### Acceptance Criteria

1. WHEN a level begins, THE Audio_System SHALL play background music that loops continuously until the level ends or the player navigates away.
2. WHEN the Player_Avatar captures a Correct_Product, THE Audio_System SHALL play a positive sound effect (cheerful chime).
3. WHEN the Player_Avatar captures a Spoiled_Product, THE Audio_System SHALL play a distinct negative sound effect (low buzz or warning tone).
4. WHEN the Player_Avatar captures an Unsolicited_Product, THE Audio_System SHALL play a neutral sound effect distinct from both the positive and negative sounds.
5. WHEN a level is won, THE Audio_System SHALL play a victory fanfare sound.
6. WHEN a level is lost, THE Audio_System SHALL play a gentle game-over sound (non-punitive, not harsh).
7. THE SettingsScene SHALL provide a music on/off toggle that enables or disables background music playback.
8. THE SettingsScene SHALL provide a volume slider or control that adjusts the master volume for both music and SFX.
9. WHEN the player changes the music toggle or volume level, THE Audio_System SHALL apply the change immediately and THE localStorage_Service SHALL persist the preference.
10. WHEN the game loads, THE Audio_System SHALL restore the previously saved music and volume settings from localStorage.

### Requirement 22: Level Progression and Unlock

**User Story:** As a player, I want levels to unlock sequentially, so that I learn game mechanics progressively and feel a sense of achievement.

#### Acceptance Criteria

1. WHEN the game starts for the first time, THE Progress_System SHALL have only Level 1 unlocked and Levels 2 and 3 locked.
2. WHEN Level 1 is completed successfully (victory condition met), THE Progress_System SHALL unlock Level 2.
3. WHEN Level 2 is completed successfully (victory condition met), THE Progress_System SHALL unlock Level 3.
4. THE Progress_System SHALL NOT allow the player to start a locked level regardless of navigation method.
5. THE Progress_System SHALL persist unlock status to localStorage so that unlocked levels remain available across browser sessions.
6. THE MissionSelect screen SHALL visually distinguish locked levels (grayed out, lock icon, non-interactive) from unlocked levels (colored, interactive, showing reward).
