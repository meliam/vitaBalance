# Quality — Testing, CI y Calidad de Código

## Filosofía

Código limpio, estable y testeable. En un hackathon el tiempo es escaso, por lo que se prioriza:

1. Tests unitarios de la lógica de dominio (scoring, objetivos, spawn).
2. Un smoke test del flujo principal (boot → menú → nivel 1 → victoria).
3. Linting y formateo automáticos.
4. Build sin errores como gate mínimo.

## Testing

### Unit tests (Vitest)

| Qué testear | Ubicación | Prioridad |
|--------------|-----------|-----------|
| scoring-system (puntos, combo, precisión, balance, VitaScore) | `tests/unit/scoring-system.test.ts` | Alta |
| objective-system (condiciones de victoria/derrota por nivel) | `tests/unit/objective-system.test.ts` | Alta |
| spawn-system (distribución, probabilidades) | `tests/unit/spawn-system.test.ts` | Media |
| progress-system (desbloqueo, recompensas) | `tests/unit/progress-system.test.ts` | Media |
| Helpers (math, accessibility) | `tests/unit/utils.test.ts` | Baja |

**Convenciones:**
- Archivos de test con sufijo `.test.ts`.
- Estructura `describe` / `it` con nombres en español o inglés consistente.
- Mocks explícitos para dependencias externas (localStorage, fetch).
- No mockear Phaser directamente — testear solo lógica pura.

### Smoke tests

| Flujo | Descripción |
|-------|-------------|
| Happy path nivel 1 | Boot → Preload → Menu → Level1 → capturar 8 → Victoria |
| Derrota nivel 1 | Boot → Level1 → perder 3 vidas → GameOver |

**Herramienta sugerida:** Playwright o un test script simple que valide que el juego carga sin errores de consola y alcanza la escena MenuScene.

> Si el tiempo no alcanza para smoke tests automatizados, documentar el flujo como checklist manual.

## Linting y formateo

| Herramienta | Configuración | Propósito |
|-------------|---------------|-----------|
| ESLint | `.eslintrc.cjs` con `@typescript-eslint` | Detectar errores y malas prácticas |
| Prettier | `.prettierrc` | Formateo consistente (tabs/spaces, trailing comma, etc.) |

**Reglas ESLint clave:**
- `no-explicit-any`: warn (preferir tipos explícitos).
- `no-unused-vars`: error.
- `consistent-type-imports`: warn.
- Sin reglas de estilo redundantes con Prettier.

**Prettier defaults sugeridos:**
```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

## Scripts en package.json

```json
{
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview",
  "lint": "eslint src/ --ext .ts",
  "format": "prettier --write src/",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

## CI mínimo (GitHub Actions)

```yaml
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build
```

**Gate:** El PR no se mergea si lint, test o build fallan.

## Calidad de código — Principios

1. **Un archivo, una responsabilidad** — No mezclar sistemas en un solo archivo.
2. **Funciones pequeñas y puras** — La lógica de scoring y objetivos debe ser testeable sin Phaser.
3. **Tipado estricto** — `tsconfig.json` con `strict: true`. Evitar `any`.
4. **Nombres descriptivos** — Variables y funciones en inglés técnico. Comentarios y textos de UI en español.
5. **Sin código muerto** — No dejar funciones comentadas o imports sin usar.
6. **Configuración externalizada** — Valores numéricos de balanceo (velocidad, duración, probabilidades) en `src/config/`, no inline.
7. **Error handling** — Fetch al ranking con try/catch y fallback silencioso (el juego no se rompe si la API falla).

## Métricas objetivo (aspiracional)

| Métrica | Target |
|---------|--------|
| Build sin errores | 100 % |
| Tests unitarios passing | 100 % |
| Cobertura de sistemas core | ≥ 80 % |
| Lighthouse Performance | ≥ 70 (con assets optimizados) |
| 0 errores de consola en runtime | Sí |

## Mejoras opcionales (post-MVP)

- Pre-commit hook con lint-staged.
- Bundle size budget (< 500 KB gzip sin assets).
- Playwright smoke tests automatizados en CI.
- Lighthouse CI como check.
