# VitaBalance: Guardianes de las Estaciones — Game Design One Pager

## Concepto

VitaBalance es un videojuego web arcade y educativo donde niños y niñas de 8 a 12 años mueven horizontalmente un avatar infantil para recolectar frutas y verduras según la misión del nivel.

**Regla central:** "No atrapás todo. Tomás decisiones."

El jugador debe elegir productos correctos, buscar variedad, evitar productos en mal estado y mantener precisión y balance. No se recompensa la captura indiscriminada.

---

## Audiencia

- Niños y niñas de 8 a 12 años.
- Idioma: español rioplatense.
- Plataformas: desktop, tablet y móvil horizontal.

---

## Pilares de diseño

| Pilar | Descripción |
|-------|-------------|
| Decisión | Cada captura tiene consecuencias — elegir es la mecánica central |
| Progresión | Tres niveles con objetivos distintos y dificultad escalonada |
| Educación | Feedback nutricional breve y no prescriptivo al capturar correctamente |
| Accesibilidad | WCAG 2.1 AA — teclado, táctil, contraste, reduce-motion |

---

## Loop de juego (30 segundos)

1. Productos caen desde arriba en posiciones aleatorias.
2. El jugador mueve el avatar horizontalmente.
3. Al capturar un producto correcto: +puntos, toast educativo, combo sube.
4. Al capturar uno no solicitado: sin puntos, precisión baja, combo se corta.
5. Al capturar uno deteriorado: -1 vida, balance y precisión bajan.
6. Al final del tiempo se evalúa la condición de victoria.

---

## Niveles

### Nivel 1 — Reconocer (60 s)
- Capturar 8 productos correctos (repetidos permitidos).
- Evitar productos deteriorados.
- Velocidad baja, spawn rate bajo.
- Recompensa: Gorra Cítrica.

### Nivel 2 — Combinar (75 s)
- Capturar ≥ 1 con vitamina C, ≥ 1 con potasio, ≥ 5 diferentes.
- Combo aumenta al alternar productos distintos.
- Velocidad media.
- Recompensa: Remera VitaBalance.

### Nivel 3 — Guardianes de las Estaciones (90 s)
- Estación actual → estación objetivo (ej: Primavera → Invierno).
- Capturar los 5 productos de la estación objetivo (uno de cada uno).
- Evitar productos de otras estaciones y deteriorados.
- Velocidad alta.
- Recompensa: Capa VitaHero.

---

## Métricas del jugador

| Métrica | Cálculo |
|---------|---------|
| Puntaje | Suma de puntos por capturas correctas |
| Combo | Se incrementa al capturar productos distintos consecutivos |
| Precisión | Capturas correctas / capturas totales |
| Balance | Penalizado por capturas de productos deteriorados |
| Variedad | Cantidad de productos diferentes capturados |
| VitaScore | Compuesta: puntaje + precisión + variedad + combo máximo |

---

## Elementos especiales

| Elemento | Efecto |
|----------|--------|
| Estrella Vita | Reduce velocidad de caída al 28 % durante 3 s |
| Producto deteriorado | -1 vida, corta combo, reduce precisión y balance |
| Producto no solicitado | 0 puntos, corta combo, reduce precisión (NO resta vida) |

---

## Progresión del avatar

El avatar comienza sin prendas. Al completar cada nivel:

| Nivel | Recompensa cosmética |
|-------|---------------------|
| 1 | Gorra Cítrica |
| 2 | Remera VitaBalance |
| 3 | Capa VitaHero |

Niveles secuenciales: cada uno requiere completar el anterior.

---

## Feedback educativo

Al capturar un producto correcto, toast de ~1.8 s:

```
Naranja · Vitamina C · +100
Banana · Potasio · +100
Brócoli · Fibra y vitamina C · +100
```

Información orientativa, sin recomendaciones médicas. Datos basados en la región central de Argentina.

---

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Motor | Phaser 3 (TypeScript) |
| Bundler | Vite |
| Testing | Vitest + smoke tests |
| Hosting | AWS Amplify |
| API | Amazon API Gateway + AWS Lambda |
| DB | Amazon DynamoDB (ranking) |
| Local | localStorage (progreso, config) |

---

## Arquitectura clave

- **Data-driven:** Productos, estaciones y niveles en archivos de configuración.
- **Desacoplada:** La lógica del juego no depende de AWS directamente.
- **Sistemas reutilizables:** Spawn, colisiones, scoring, objetivos, progreso, audio.
- **Object pooling:** Reutilización de sprites para rendimiento.

---

## Accesibilidad (resumen)

- Teclado y táctil completo.
- Contraste AA (≥ 4.5:1).
- Controles ≥ 44 × 44 px.
- Respeta `prefers-reduced-motion`.
- No comunica información solo por color.
- Responsive: 640×360 a 1920×1080.
- Pausa disponible en todo momento.

---

## Fuera de alcance (MVP)

Tienda, monedas, multijugador, chat, más de 3 niveles, personalización libre, login con contraseña, Bedrock, RDS, EC2, recomendaciones nutricionales personalizadas, IA generativa en runtime.

---

## Diferenciación vs. catch game tradicional

| Catch genérico | VitaBalance |
|----------------|-------------|
| Atrapar todo suma | Atrapar todo penaliza precisión |
| Sin objetivo claro | Misión específica por nivel |
| Sin feedback | Feedback educativo por captura |
| Dificultad = velocidad | Dificultad = criterio de selección + velocidad |
| Sin progresión narrativa | Avatar evoluciona con recompensas |
| Un solo modo | 3 niveles con mecánicas distintas |

---

## Entregables del hackathon

1. Repositorio público en GitHub.
2. README con setup, arquitectura y decisiones.
3. URL de demo en AWS Amplify.
4. Video demostrativo.
5. Documentación de diseño en `docs/`.
6. Steering y specs en `.kiro/`.
