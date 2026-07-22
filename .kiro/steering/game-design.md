# Game Design — Mecánicas, Niveles, Progresión y Reglas

## Regla central

> "No atrapás todo. Tomás decisiones."

El jugador NO debe obtener el mejor resultado atrapando todo lo que cae. Cada captura es una elección con consecuencias en puntaje, combo, precisión y balance.

## Controles

- **Desktop:** Flechas izquierda/derecha o A/D para mover al avatar horizontalmente.
- **Táctil:** Tocar/arrastrar en la mitad inferior de la pantalla para mover.
- **Pausa:** Tecla Escape o botón Pause en HUD.

## Elementos del juego

| Elemento | Descripción |
|----------|-------------|
| Producto correcto | Fruta o verdura que cumple la misión activa |
| Producto no solicitado | Fruta o verdura saludable pero no requerida por la misión |
| Producto deteriorado | Producto con visual de mal estado (manchas, color apagado) |
| Estrella Vita (power-up) | Reduce velocidad de caída al 28 % durante 3 segundos |
| Vidas | 3 por intento; se pierden con productos deteriorados |
| Temporizador | Cuenta regresiva por nivel |
| Puntaje | Puntos acumulados por capturas correctas |
| Combo | Se incrementa al alternar productos distintos consecutivos |
| Precisión | Ratio de capturas correctas / capturas totales |
| Balance | Penalizado por capturar productos deteriorados |
| Variedad | Cantidad de productos diferentes capturados |
| VitaScore | Métrica compuesta final (puntaje + precisión + variedad + combo máx) |

## Reglas de captura

| Acción | Efecto |
|--------|--------|
| Capturar producto correcto | +puntos, muestra nutriente, incrementa combo si es diferente al anterior |
| Capturar producto no solicitado | 0 puntos, NO resta vida, reduce precisión, corta combo |
| Capturar producto deteriorado | -1 vida, reduce precisión, reduce balance, corta combo |
| Activar Estrella Vita | Velocidad de caída × 0.28 durante 3 s |
| Producto cae sin capturar | Sin penalización directa (pero puede afectar objetivo) |

## Feedback educativo

Al capturar un producto correcto, se muestra un toast durante ~1.8 segundos:

```
[Nombre del producto] · [Nutriente destacado] · +[puntos]
```

Ejemplos:
- "Naranja · Vitamina C · +100"
- "Banana · Potasio · +100"
- "Brócoli · Fibra y vitamina C · +100"

En nivel 3, agregar indicador de estación: "Correcto para invierno".

## Niveles

### Nivel 1 — Reconocer

| Parámetro | Valor |
|-----------|-------|
| Duración | 60 segundos |
| Objetivo | Capturar 8 productos correctos en total |
| Repetidos | Permitidos |
| Penalización | Evitar productos deteriorados |
| Velocidad de caída | Base (la más lenta) |
| Spawn rate | Bajo — tiempo de reacción cómodo |
| Recompensa | Gorra Cítrica |

**Condición de victoria:** ≥ 8 productos correctos capturados Y ≥ 1 vida restante al terminar el tiempo.

**Condición de derrota:** Perder las 3 vidas O tiempo agotado sin alcanzar 8 capturas correctas.

### Nivel 2 — Combinar

| Parámetro | Valor |
|-----------|-------|
| Duración | 75 segundos |
| Objetivo | ≥ 1 producto con vitamina C, ≥ 1 con potasio, ≥ 5 productos diferentes |
| Combo | Aumenta al alternar productos distintos |
| Velocidad de caída | Media (incremento respecto a nivel 1) |
| Spawn rate | Medio — más productos en pantalla |
| Recompensa | Remera VitaBalance |

**Condición de victoria:** Cumplir los 3 sub-objetivos Y ≥ 1 vida restante.

**Condición de derrota:** Perder las 3 vidas O tiempo agotado sin completar sub-objetivos.

### Nivel 3 — Guardianes de las Estaciones

| Parámetro | Valor |
|-----------|-------|
| Duración | 90 segundos |
| Selección | Combinación estación actual → estación objetivo |
| Objetivo | Capturar una vez cada uno de los 5 productos requeridos de la estación objetivo |
| Penalización | Evitar productos de otras estaciones Y productos deteriorados |
| Velocidad de caída | Alta |
| Spawn rate | Alto — requiere selectividad rápida |
| Recompensa | Capa VitaHero |

**Combinaciones estacionales iniciales:**

| Estación actual | Estación objetivo |
|-----------------|-------------------|
| Primavera | Invierno |
| Invierno | Verano |
| Verano | Otoño |
| Otoño | Primavera |

**Condición de victoria:** Los 5 productos de la estación objetivo capturados (uno de cada uno) Y ≥ 1 vida restante.

**Condición de derrota:** Perder las 3 vidas O tiempo agotado sin completar la colección.

## Progresión y recompensas

- El avatar comienza sin prendas visibles.
- Al completar cada nivel se desbloquea la recompensa correspondiente.
- Las recompensas se aplican DESPUÉS de completar el nivel (no durante).
- El progreso se guarda en localStorage.
- Los niveles se desbloquean secuencialmente (2 requiere completar 1, 3 requiere completar 2).

| Nivel completado | Recompensa |
|------------------|------------|
| 1 — Reconocer | Gorra Cítrica |
| 2 — Combinar | Remera VitaBalance |
| 3 — Guardianes | Capa VitaHero |

## VitaScore (métrica compuesta)

Fórmula indicativa (sujeta a balanceo):

```
VitaScore = puntaje_base + (precisión × bonus_precision) + (variedad × bonus_variedad) + (combo_max × bonus_combo)
```

- Se calcula al finalizar el nivel (victoria o derrota).
- Se muestra en pantalla de resultado.
- Se envía al ranking si el jugador lo desea.

## Pause / Resume

- Disponible en cualquier momento durante un nivel.
- El temporizador se detiene.
- Los productos en caída se congelan.
- Se muestra menú con opciones: Continuar, Reiniciar, Salir al menú.

## Victoria y derrota

**Victoria:**
- Confeti animado.
- Recompensa desbloqueada con animación.
- VitaScore con detalle.
- Opción de enviar al ranking.
- Botón para siguiente nivel o menú.

**Derrota:**
- Mensaje motivacional (no punitivo).
- VitaScore parcial.
- Botón de reintentar o volver al menú.

## Spawn y dificultad

- Los productos caen desde posiciones aleatorias en el eje X.
- La distribución de productos correctos vs. no solicitados vs. deteriorados se define por nivel en configuración.
- La velocidad de caída aumenta progresivamente por nivel.
- El spawn rate se configura en `src/config/levels.ts`.
- Los productos deteriorados tienen una probabilidad configurable que nunca supera el 25 % del spawn total.

## Decisiones de diseño

| Decisión | Motivo |
|----------|--------|
| No penalizar con vida al capturar producto no solicitado | Evitar frustración en niños; la penalización es estratégica (precisión + combo) |
| Combo requiere alternar | Incentiva variedad, no repetición mecánica |
| 3 vidas fijas sin forma de recuperar | Mantiene tensión sin complejidad extra |
| Estrella Vita ralentiza al 28 % | Suficiente ayuda sin trivializar — el jugador aún debe elegir |
| Duración fija por nivel | Previsible para el jugador; evita partidas infinitas |
| Niveles secuenciales | Asegura comprensión progresiva de mecánicas |
