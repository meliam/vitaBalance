# 🥦 VitaBalance: Guardianes de las Estaciones

**Videojuego web arcade educativo donde niños de 8 a 12 años toman decisiones nutricionales capturando frutas y verduras de estación.**

[Reportar bug](https://github.com/meliam/vitaBalance/issues/new?labels=bug) · [Solicitar feature](https://github.com/meliam/vitaBalance/issues/new?labels=feature)

---

## Tabla de contenidos

- [Quick start](#quick-start)
- [Status](#status)
- [What's included](#whats-included)
- [Bugs and feature requests](#bugs-and-feature-requests)
- [Contributing](#contributing)
- [Creators](#creators)
- [Thanks](#thanks)
- [Copyright and license](#copyright-and-license)

## Quick start

Cloná el repositorio e instalá las dependencias:

1. **Clonar el repo**
   ```bash
   git clone https://github.com/meliam/vitaBalance.git
   cd vitaBalance
   ```

2. **Instalar dependencias**
   ```bash
   pnpm install
   ```

3. **Iniciar el servidor de desarrollo**
   ```bash
   pnpm dev
   ```
   Abrí http://localhost:3000 en tu navegador.

4. **Build para producción**
   ```bash
   pnpm build
   ```
   El output se genera en `dist/` listo para deploy en AWS Amplify.

5. **Correr tests**
   ```bash
   pnpm test
   ```

## Status

![Build](https://img.shields.io/badge/build-passing-brightgreen)
![Tests](https://img.shields.io/badge/tests-112%20passing-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)
![Phaser](https://img.shields.io/badge/Phaser-3.90.0-blueviolet)
![License](https://img.shields.io/badge/license-MIT-green)

| Métrica | Estado |
|---------|--------|
| Build sin errores | ✅ |
| Tests unitarios | 112/112 passing |
| Property-based tests | 7 propiedades validadas |
| Accesibilidad WCAG AA | ✅ Keyboard, contrast, reduced-motion |
| Responsive | 640×360 → 1920×1080 |

## What's included

Estructura del proyecto:

```
vitaBalance/
├── .kiro/
│   ├── specs/             # Spec-driven development docs
│   └── steering/          # Reglas de contexto permanente
├── docs/
│   └── game-design-one-pager.md
├── public/
│   └── assets/
│       ├── sprites/       # Sprites de productos y avatar
│       ├── ui/            # Iconos y botones
│       ├── audio/         # SFX y música
│       └── fonts/         # Web fonts
├── src/
│   ├── main.ts            # Entry point — instancia Phaser
│   ├── config/
│   │   ├── game-config.ts # Configuración Phaser (escala, escenas)
│   │   ├── products.ts    # Catálogo data-driven de productos
│   │   ├── seasons.ts     # Mapeo estaciones → productos
│   │   ├── levels.ts      # Definición de niveles y misiones
│   │   └── scoring.ts     # Coeficientes VitaScore
│   ├── scenes/
│   │   ├── BootScene.ts
│   │   ├── PreloadScene.ts
│   │   ├── MenuScene.ts
│   │   ├── LevelScene.ts
│   │   ├── HudScene.ts
│   │   ├── PauseScene.ts
│   │   ├── VictoryScene.ts
│   │   ├── GameOverScene.ts
│   │   ├── RankingScene.ts
│   │   ├── ProfileScene.ts
│   │   ├── HowToPlayScene.ts
│   │   └── SettingsScene.ts
│   ├── systems/
│   │   ├── scoring-system.ts
│   │   ├── objective-system.ts
│   │   ├── spawn-system.ts
│   │   ├── progress-system.ts
│   │   ├── collision-system.ts
│   │   └── audio-system.ts
│   ├── entities/
│   │   ├── Player.ts
│   │   ├── Product.ts
│   │   └── PowerUp.ts
│   ├── ui/
│   │   ├── Button.ts
│   │   ├── Toast.ts
│   │   ├── Toggle.ts
│   │   └── ConfettiEffect.ts
│   ├── services/
│   │   ├── ranking-service.ts
│   │   ├── storage-service.ts
│   │   └── api-client.ts
│   ├── utils/
│   │   ├── math-helpers.ts
│   │   ├── accessibility.ts
│   │   └── constants.ts
│   └── types/
│       ├── game.types.ts
│       └── api.types.ts
├── tests/
│   └── unit/              # Vitest — sistemas y lógica de dominio
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

## Bugs and feature requests

¿Encontraste un bug o tenés una idea? Por favor primero leé las [guías de issues](https://github.com/meliam/vitaBalance/issues) y buscá issues existentes y cerrados. Si tu problema o idea no está contemplado, [abrí un nuevo issue](https://github.com/meliam/vitaBalance/issues/new).

## Contributing

Por favor leé nuestras guías de contribución. Incluyen instrucciones para abrir issues, estándares de código y notas de desarrollo.

Además, todo el código TypeScript debe seguir los estándares definidos en `.eslintrc.cjs` y `.prettierrc`.

Las preferencias de editor están disponibles en la configuración del proyecto para uso fácil en editores comunes. Leé más y descargá plugins en https://editorconfig.org/.

## Creators

**Meliam**

- https://github.com/meliam

## Thanks

- AWS Amplify por el hosting estático con CI/CD integrado.
- Phaser 3 por el motor de juego 2D que hace posible este proyecto.
- Kiro por el desarrollo spec-driven y la asistencia de IA.
- fast-check por el framework de property-based testing.

## Copyright and license

Code and documentation copyright 2025-2026 the authors. Code released under the [MIT License](LICENSE).

Enjoy 🤘
