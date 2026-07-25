# Structure — Estructura del Proyecto

## Convenciones generales

- Carpetas en `kebab-case`.
- Archivos TypeScript en `kebab-case.ts` (módulos) o `PascalCase.ts` (clases/escenas).
- Un archivo por responsabilidad principal.
- Barrel exports (`index.ts`) solo en carpetas con ≥ 3 módulos públicos.

## Estructura de carpetas objetivo

```
vitaBalance/
├── .kiro/
│   ├── steering/          # Archivos de contexto permanente
│   ├── hooks/             # Hooks de agente
│   └── specs/             # Specs de features
├── docs/
│   └── game-design-one-pager.md
├── public/
│   ├── assets/
│   │   ├── sprites/       # Spritesheet y atlas de productos, avatar, power-ups
│   │   ├── ui/            # Iconos, botones, fondos de menú
│   │   ├── audio/         # SFX y música (formatos web: ogg, mp3)
│   │   └── fonts/         # Fuentes (si se usan bitmap fonts)
│   └── favicon.ico
├── src/
│   ├── main.ts            # Entry point — crea instancia Phaser
│   ├── config/
│   │   ├── game-config.ts       # Configuración de Phaser (escala, escenas, etc.)
│   │   ├── products.ts          # Catálogo data-driven de productos
│   │   ├── seasons.ts           # Mapeo estaciones → productos
│   │   └── levels.ts            # Definición de misiones y parámetros por nivel
│   ├── scenes/
│   │   ├── BootScene.ts
│   │   ├── PreloadScene.ts
│   │   ├── MenuScene.ts
│   │   ├── LevelScene.ts        # Escena genérica parametrizada por nivel
│   │   ├── HudScene.ts          # Overlay paralelo (puntaje, vidas, timer)
│   │   ├── PauseScene.ts
│   │   ├── VictoryScene.ts
│   │   ├── GameOverScene.ts
│   │   └── RankingScene.ts
│   ├── systems/
│   │   ├── spawn-system.ts      # Generación de productos con pools
│   │   ├── collision-system.ts  # Detección de captura / miss
│   │   ├── scoring-system.ts    # Cálculo de puntos, combo, precisión, balance
│   │   ├── objective-system.ts  # Evaluación de condiciones de victoria
│   │   ├── progress-system.ts   # Recompensas y desbloqueo de niveles
│   │   └── audio-system.ts      # Gestión de SFX y música
│   ├── entities/
│   │   ├── Player.ts            # Avatar del jugador
│   │   ├── Product.ts           # Sprite de producto (pool member)
│   │   └── PowerUp.ts           # Estrella Vita
│   ├── ui/
│   │   ├── Button.ts            # Botón accesible reutilizable
│   │   ├── Toast.ts             # Feedback educativo flotante
│   │   └── ConfettiEffect.ts    # Efecto de victoria
│   ├── services/
│   │   ├── ranking-service.ts   # Interfaz abstracta + implementación API
│   │   ├── storage-service.ts   # Wrapper de localStorage
│   │   └── api-client.ts        # Fetch wrapper con retry y error handling
│   ├── utils/
│   │   ├── math-helpers.ts
│   │   ├── accessibility.ts     # Helpers de accesibilidad (prefers-reduced-motion, etc.)
│   │   └── constants.ts
│   └── types/
│       ├── game.types.ts        # Interfaces de dominio (Product, Season, Level, Score)
│       └── api.types.ts         # Tipos de request/response del ranking
├── tests/
│   ├── unit/                    # Vitest — sistemas y lógica de dominio
│   └── smoke/                   # Pruebas de flujo principal (happy path)
├── infra/                       # (Opcional) IaC para backend — SAM o CDK
│   └── template.yaml
├── index.html                   # Shell HTML para Vite
├── vite.config.ts
├── tsconfig.json
├── package.json
├── .eslintrc.cjs
├── .prettierrc
├── .gitignore
└── README.md
```

## Reglas de dependencia entre capas

```
scenes/ → systems/ → config/, types/
scenes/ → entities/
scenes/ → ui/
services/ → types/
systems/ ✗ services/   (los sistemas NO importan servicios directamente)
scenes/ → services/    (las escenas orquestan la comunicación con servicios)
```

**Motivo:** Mantener la lógica del juego testeable sin dependencias de red o cloud.

## Notas

- `infra/` es opcional; puede gestionarse desde la consola AWS o Amplify CLI si el tiempo apremia.
- Los assets se almacenan en `public/assets/` para que Vite los sirva estáticamente sin procesamiento.
- Los archivos de configuración en `src/config/` exportan objetos tipados, no JSON plano, para aprovechar autocompletado y validación en tiempo de compilación.
