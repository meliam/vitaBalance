# Requirements Document

## Introduction

Después de que el jugador hace clic en "Enviar al ranking" en la VictoryScene o GameOverScene, el juego debe mostrar la tabla de ranking correspondiente al nivel que acaba de jugar. Actualmente, el botón envía el puntaje pero solo muestra un toast de confirmación. Esta feature agrega la navegación automática a la vista de ranking filtrada por el nivel jugado, permitiendo al jugador ver su posición en el contexto del leaderboard.

## Glossary

- **VictoryScene**: Escena de Phaser mostrada cuando el jugador completa un nivel exitosamente.
- **GameOverScene**: Escena de Phaser mostrada cuando el jugador pierde todas las vidas o se agota el tiempo sin completar el objetivo.
- **RankingScene**: Escena de Phaser que muestra la tabla de ranking global con puntajes obtenidos desde la API remota.
- **Submit_Button**: Botón "Enviar al ranking" presente en VictoryScene y GameOverScene que ejecuta el envío del puntaje.
- **Ranking_Table**: Vista tabular dentro de RankingScene que muestra las entradas del ranking para un nivel específico.
- **RankingService**: Servicio que gestiona la comunicación con la API de ranking y el almacenamiento local de puntajes.
- **Level**: Nivel del juego (1, 2 o 3) que el jugador acaba de terminar.
- **Toast**: Componente de feedback flotante que muestra mensajes temporales al jugador.

## Requirements

### Requirement 1: Navegación al ranking tras envío exitoso

**User Story:** Como jugador, quiero ver la tabla de ranking del nivel que acabo de jugar después de enviar mi puntaje, para conocer mi posición entre los demás jugadores.

#### Acceptance Criteria

1. WHEN the Submit_Button is clicked in VictoryScene and the remote ranking submission resolves without error, THE VictoryScene SHALL transition to RankingScene passing the played Level (1, 2, or 3) as a scene parameter.
2. WHEN the Submit_Button is clicked in GameOverScene and the remote ranking submission resolves without error, THE GameOverScene SHALL transition to RankingScene passing the played Level (1, 2, or 3) as a scene parameter.
3. WHEN RankingScene is started with a Level parameter (1, 2, or 3) received from VictoryScene or GameOverScene, THE RankingScene SHALL set the corresponding level tab as active and fetch and display the Ranking_Table filtered by that Level without requiring additional user interaction.
4. IF RankingScene is started without a Level parameter or with an invalid value, THEN THE RankingScene SHALL default to displaying Level 1 rankings.

### Requirement 2: Navegación al ranking tras envío con fallo de red

**User Story:** Como jugador, quiero ver la tabla de ranking incluso si el envío remoto falla, para poder ver los puntajes existentes del nivel que acabo de jugar.

#### Acceptance Criteria

1. WHEN the "Enviar al ranking" button is clicked in VictoryScene and RankingService.saveLocal() succeeds, THE VictoryScene SHALL transition to RankingScene within 2 seconds, passing the played level (1, 2, or 3) so that it is pre-selected in the level tabs, regardless of whether RankingService.submit() succeeds or fails.
2. WHEN the "Enviar al ranking" button is clicked in GameOverScene and RankingService.saveLocal() succeeds, THE GameOverScene SHALL transition to RankingScene within 2 seconds, passing the played level (1, 2, or 3) so that it is pre-selected in the level tabs, regardless of whether RankingService.submit() succeeds or fails.
3. IF RankingService.saveLocal() fails (e.g., localStorage is full or unavailable) when the "Enviar al ranking" button is clicked, THEN THE scene SHALL display a toast indicating that the score could not be saved and SHALL NOT transition to RankingScene.
4. WHEN RankingScene is launched with a pre-selected level parameter, THE RankingScene SHALL initialize with that level's tab active and display the corresponding ranking entries (remote or local) without requiring manual tab selection.

### Requirement 3: Retraso de transición para lectura del toast

**User Story:** Como jugador, quiero tener tiempo de leer el mensaje de confirmación antes de que cambie la pantalla, para entender que mi puntaje fue enviado correctamente.

#### Acceptance Criteria

1. WHEN the ranking submission completes (success or failure) in VictoryScene, THE VictoryScene SHALL display the confirmation Toast and disable all navigation buttons for 2000 milliseconds before automatically transitioning to RankingScene.
2. WHEN the ranking submission completes (success or failure) in GameOverScene, THE GameOverScene SHALL display the confirmation Toast and disable all navigation buttons for 2000 milliseconds before automatically transitioning to RankingScene.
3. WHILE the transition delay is active, IF the player presses a navigation key (Tab, Escape) or taps a disabled button, THEN THE system SHALL ignore the input and keep the scene unchanged until the delay elapses.
4. IF the scene is destroyed or interrupted before the 2000-millisecond delay elapses, THEN THE system SHALL cancel the pending transition and not navigate to RankingScene.

### Requirement 4: Botón de retorno desde RankingScene

**User Story:** Como jugador, quiero poder volver a la pantalla de resultados o al menú desde el ranking, para continuar jugando o revisar mis estadísticas.

#### Acceptance Criteria

1. WHEN the RankingScene is opened from VictoryScene or GameOverScene, THE RankingScene SHALL display a back button labeled "← Volver" with a minimum touch target of 44 × 44 pixels that transitions to MenuScene when activated.
2. THE RankingScene SHALL maintain level tab navigation with one tab per level (Nivel 1, Nivel 2, Nivel 3) so the player can view rankings for any level after arriving from a result screen.
3. WHEN the RankingScene receives a level parameter from the calling scene, THE RankingScene SHALL set the corresponding level tab as the initially selected tab and fetch rankings for that level.
4. WHEN the player presses the Escape key while RankingScene is active, THE RankingScene SHALL transition to MenuScene.

### Requirement 5: No navegación si el envío es bloqueado por validación

**User Story:** Como jugador, si mi alias es inválido o ya envié el puntaje, no quiero que la pantalla cambie, para poder corregir el error sin perder mi contexto.

#### Acceptance Criteria

1. IF the alias validation fails (alias is empty, longer than 16 characters, or contains non-alphanumeric/non-space characters), THEN THE VictoryScene SHALL remain on the current screen and display the validation error Toast without transitioning to RankingScene.
2. IF the alias validation fails, THEN THE GameOverScene SHALL remain on the current screen and display the validation error Toast without transitioning to RankingScene.
3. IF the submission is blocked by deduplication (in-memory `submitted` flag is true OR RankingService.isAlreadySubmitted(matchId) returns true), THEN THE VictoryScene SHALL remain on the current screen and display the deduplication Toast without transitioning.
4. IF the submission is blocked by deduplication, THEN THE GameOverScene SHALL remain on the current screen and display the deduplication Toast without transitioning.

### Requirement 6: Accesibilidad en la transición

**User Story:** Como jugador que navega con teclado, quiero que la transición al ranking mantenga una experiencia accesible, para poder interactuar con la tabla de ranking sin obstáculos.

#### Acceptance Criteria

1. WHEN the RankingScene is loaded after a submission transition, THE RankingScene SHALL set keyboard focus on the first interactive element in the tab order (the first level-selector tab).
2. THE RankingScene SHALL allow navigation back to MenuScene using the Escape key from any focus state within the scene.
3. THE RankingScene SHALL allow cycling keyboard focus through all interactive elements (level-selector tabs and back button) using the Tab key, wrapping from the last element back to the first and vice versa with Shift+Tab.
4. WHEN an interactive element has keyboard focus and the user presses Enter, THE RankingScene SHALL activate that element (selecting a level tab or navigating back).
