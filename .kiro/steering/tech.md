# Tech — Stack, Arquitectura y Servicios AWS

## Stack frontend

| Tecnología | Rol |
|------------|-----|
| TypeScript | Lenguaje principal — tipado estricto |
| Phaser 3 | Motor de juego 2D (WebGL / Canvas fallback) |
| Vite | Bundler y dev server |
| Vitest | Pruebas unitarias |

## Stack backend / cloud

| Servicio AWS | Rol | Justificación |
|--------------|-----|---------------|
| AWS Amplify Hosting | Deploy estático del build de Vite | CI/CD integrado, HTTPS, dominio temporal gratis |
| Amazon API Gateway (HTTP API) | Endpoint REST para ranking | Bajo costo, throttling integrado, CORS nativo |
| AWS Lambda (Node.js 20+) | Lógica de ranking (GET / POST) | Sin servidor, pago por uso, escalado automático |
| Amazon DynamoDB | Almacén de ranking | Latencia baja, modelo key-value ideal para leaderboard |

## Persistencia

| Dato | Almacén | Motivo |
|------|---------|--------|
| Configuración local (volumen, reduce-motion) | localStorage | No requiere red; preferencia del dispositivo |
| Progreso local (niveles completados, recompensas) | localStorage | Rápido; sin necesidad de cuenta |
| Ranking global | DynamoDB vía API Gateway + Lambda | Persistencia entre dispositivos; compartido entre jugadores |

### Modelo de datos — Ranking (DynamoDB)

```
PK: RANKING#<level>
SK: <timestamp>#<alias>
Attributes: alias (string), vitaScore (number), precision (number), variety (number), createdAt (ISO string)
```

- Acceso mediante alias anónimo (el jugador elige un apodo).
- No se solicita nombre real, edad ni correo.
- No se utiliza login con contraseña.

## Principios de arquitectura

1. **Data-driven** — Productos, estaciones, niveles y misiones se definen en archivos de configuración JSON/TS, no hardcodeados en escenas.
2. **Separación de capas** — Dominio (reglas del juego), Presentación (escenas y sprites de Phaser), Servicios externos (API, localStorage).
3. **Desacoplamiento de AWS** — La lógica del juego no importa ni referencia servicios AWS directamente. Se comunica mediante una capa de servicios con interfaz abstracta.
4. **Object pooling** — Reutilizar sprites de productos para evitar GC spikes en dispositivos de gama baja.
5. **Escenas separadas** — Cada pantalla es una escena Phaser independiente (Boot, Preload, Menu, Level1, Level2, Level3, HUD, GameOver, Victory, Ranking).
6. **Sistemas reutilizables** — Spawn, colisiones, scoring, objetivos, progreso y audio se implementan como módulos independientes de la escena.

## Restricciones

- No utilizar frameworks UI adicionales (React, Vue) — la UI se construye con objetos Phaser o DOM mínimo.
- No utilizar WebSockets — el ranking es REST con polling manual o fetch on-demand.
- No utilizar servicios AWS fuera de los listados — evitar scope creep.
- El build debe producir un bundle estático desplegable en Amplify sin servidor custom.

## Entorno de desarrollo

- Node.js >= 20 LTS.
- pnpm como package manager (rápido, eficiente en disco).
- ESLint + Prettier para estilo.
- Vite en modo development con HMR.
- Variables de entorno para endpoint de API (`VITE_API_URL`).
