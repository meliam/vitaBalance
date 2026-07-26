# Local Ranking Submit Bugfix Design

## Overview

El sistema actual de ranking solo envía resultados a la API remota. Si la API falla, el puntaje se pierde. Además, no hay protección contra envíos duplicados de la misma partida. Este bugfix agrega persistencia local en localStorage para los resultados del ranking (top 10 por nivel, ordenados por vitaScore descendente), implementa deduplicación por ID único de partida, y preserva el envío remoto existente. La implementación se integra en la capa de servicios sin modificar la lógica del juego (scoring, objetivos, progreso).

## Glossary

- **Bug_Condition (C)**: La condición que dispara el bug — cuando el jugador envía al ranking y el resultado no se persiste localmente, o cuando se permite enviar la misma partida múltiples veces
- **Property (P)**: El comportamiento deseado — el resultado se guarda en localStorage (top 10 por nivel) y se impide el doble envío de la misma partida
- **Preservation**: El envío remoto a la API, la navegación de escenas, el cálculo de VitaScore, y toda la UI existente deben permanecer sin cambios
- **RankingService**: Servicio en `src/services/ranking-service.ts` que actualmente solo envía a la API remota vía POST /rankings
- **StorageService**: Servicio en `src/services/storage-service.ts` que wrappea localStorage con clave `vitabalance_save` para progreso, settings y perfil
- **matchId**: Identificador único generado por partida para prevenir envíos duplicados
- **LocalRankingEntry**: Registro individual almacenado localmente con alias, vitaScore, precision, variety, level y matchId

## Bug Details

### Bug Condition

El bug se manifiesta cuando el jugador hace clic en "Enviar al ranking" al finalizar una partida. El `RankingService.submit()` solo ejecuta un POST a la API remota sin guardar copia local, y no existe mecanismo de deduplicación que impida múltiples envíos de la misma partida.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { action: 'submitRanking', submission: RankingSubmission, matchId: string }
  OUTPUT: boolean

  LET localRankings = getLocalRankings(input.submission.level)
  LET alreadySubmitted = localRankings.some(entry => entry.matchId === input.matchId)

  RETURN input.action === 'submitRanking'
         AND (NOT resultPersistedLocally(input.submission, input.matchId)
              OR alreadySubmitted)
END FUNCTION
```

### Examples

- **Sin persistencia local**: El jugador completa nivel 1, obtiene vitaScore 850, envía al ranking. Si la API falla, el puntaje se pierde completamente. Esperado: el resultado queda guardado en localStorage independientemente del estado de la API.
- **Envío duplicado**: El jugador hace clic en "Enviar al ranking" dos veces en la misma pantalla de resultado. Actualmente se envían dos POST idénticos a la API. Esperado: el segundo clic muestra un mensaje de "ya registrado" y no se guarda ni envía nuevamente.
- **Exceso de registros**: Tras muchas partidas, se acumulan más de 10 registros para un nivel. Esperado: solo se conservan los 10 mejores por vitaScore descendente.
- **API disponible**: El jugador envía al ranking y la API responde correctamente. Esperado: se guarda localmente Y se envía a la API (ambos comportamientos coexisten).

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- El envío remoto a la API (POST /rankings) debe seguir funcionando exactamente como antes
- El cálculo de VitaScore por `scoring-system` no se modifica
- La actualización de progreso (niveles completados, recompensas) vía `progress-system` y `StorageService` permanece igual
- La navegación de escenas (Continuar, Repetir, Reintentar, Menú) no se altera
- La validación de alias (1-16 chars, alfanumérico + espacios) permanece igual
- Los controles de teclado y mouse en VictoryScene/GameOverScene siguen respondiendo correctamente
- La pantalla RankingScene sigue mostrando datos de la API remota

**Scope:**
Todas las interacciones que NO involucran el clic en "Enviar al ranking" deben ser completamente inalteradas. Esto incluye:
- Movimiento del jugador durante el nivel
- Captura de productos y cálculo de puntos
- Pausa/resume
- Navegación entre escenas
- Configuración de audio y accesibilidad
- Guardado de progreso y perfil existente

## Hypothesized Root Cause

Basado en el análisis del código actual, los problemas se originan en:

1. **Ausencia de capa de persistencia local para rankings**: `RankingService.submit()` solo ejecuta `fetchWithRetry('/rankings', ...)` sin ninguna escritura a localStorage. No existe infraestructura para almacenar rankings localmente.

2. **Sin generación de ID único por partida**: Las escenas VictoryScene y GameOverScene no generan un identificador único al inicio de cada resultado. Sin matchId no hay forma de detectar si un resultado ya fue enviado.

3. **Sin estado de envío en la escena**: `handleSubmitRanking()` no rastrea si ya se ejecutó exitosamente. El botón "Enviar al ranking" puede ser clickeado múltiples veces sin restricción.

4. **Estructura de datos limitada**: `SaveData` no incluye un campo para rankings locales, y no existe una clave separada en localStorage para este propósito.

## Correctness Properties

Property 1: Bug Condition - Persistencia local y deduplicación del ranking

_For any_ input donde el jugador hace clic en "Enviar al ranking" con un alias válido y un matchId único (no enviado previamente), la función fixed `handleSubmitRanking` SHALL guardar el resultado en localStorage asociado al nivel, mantener solo los top 10 por vitaScore descendente, y marcar el matchId como enviado para impedir duplicados.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Comportamiento remoto y navegación sin cambios

_For any_ input que NO sea un clic en "Enviar al ranking" (navegación, controles de juego, cálculo de puntaje, guardado de progreso), la función fixed SHALL producir exactamente el mismo comportamiento que el código original, preservando el envío remoto a la API, la lógica de scoring, y toda la interacción de UI existente.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

Asumiendo que nuestro análisis de causa raíz es correcto:

**File**: `src/types/game.types.ts`

**Specific Changes**:
1. **Agregar interface `LocalRankingEntry`**: Definir el tipo para cada entrada de ranking local con campos: alias, level, vitaScore, precision, variety, matchId, createdAt.
2. **Agregar interface `LocalRankingData`**: Estructura que mapea cada nivel a un array de `LocalRankingEntry`.

---

**File**: `src/services/ranking-service.ts`

**Function**: `submit` y nuevos métodos estáticos

**Specific Changes**:
1. **Agregar constante `LOCAL_RANKING_KEY`**: Clave separada de localStorage (`vitabalance_rankings`) para no contaminar el SaveData existente.
2. **Agregar método `saveLocal(entry, matchId)`**: Persiste el resultado localmente, ordena por vitaScore desc, y trunca a 10 por nivel.
3. **Agregar método `isAlreadySubmitted(matchId)`**: Verifica si un matchId ya existe en los rankings locales.
4. **Agregar método `getLocalRankings(level)`**: Retorna los rankings locales para un nivel dado.
5. **Modificar flujo de `submit()`**: Agregar parámetro opcional `matchId`, ejecutar `saveLocal` antes del envío remoto, mantener el POST a la API como está.

---

**File**: `src/scenes/VictoryScene.ts`

**Function**: `init`, `handleSubmitRanking`

**Specific Changes**:
1. **Generar matchId en `init()`**: Crear un ID único basado en `Date.now() + Math.random()` al entrar a la escena de resultado.
2. **Agregar flag `submitted`**: Variable booleana que impide múltiples envíos del mismo resultado.
3. **Modificar `handleSubmitRanking()`**: Verificar `submitted` y `isAlreadySubmitted(matchId)` antes de proceder. Llamar a `saveLocal` + `submit` remoto. Mostrar toast diferenciado si ya fue enviado o si solo quedó local.

---

**File**: `src/scenes/GameOverScene.ts`

**Function**: `init`, `handleSubmitRanking`

**Specific Changes**:
1. **Mismas modificaciones que VictoryScene**: Generar matchId, agregar flag submitted, modificar handleSubmitRanking con la misma lógica de deduplicación y persistencia local.

## Testing Strategy

### Validation Approach

La estrategia de testing sigue un enfoque de dos fases: primero, demostrar el bug en código sin corregir (los resultados no se persisten localmente y se permiten duplicados), luego verificar que el fix funciona correctamente y preserva el comportamiento existente.

### Exploratory Bug Condition Checking

**Goal**: Demostrar que el código actual NO persiste resultados localmente y permite envíos duplicados. Confirmar o refutar el análisis de causa raíz.

**Test Plan**: Escribir tests que invoquen `RankingService.submit()` y `handleSubmitRanking()` en las escenas, verificando que localStorage no contiene rankings después del envío. Ejecutar estos tests sobre el código SIN corregir para observar fallas.

**Test Cases**:
1. **Sin persistencia local**: Llamar a `RankingService.submit()` con datos válidos y verificar que localStorage NO contiene el resultado (fallará en código corregido, pasará en código sin corregir)
2. **Duplicado permitido**: Llamar a `handleSubmitRanking()` dos veces seguidas y verificar que ambas ejecuciones proceden sin bloqueo (fallará en código corregido)
3. **Sin límite de registros**: Simular 15 envíos para el mismo nivel y verificar que no se aplica límite de 10 (fallará en código corregido)

**Expected Counterexamples**:
- `localStorage.getItem('vitabalance_rankings')` retorna `null` después de un envío exitoso
- Posibles causas: no existe lógica de escritura local en `RankingService`, no existe clave de localStorage para rankings

### Fix Checking

**Goal**: Verificar que para todos los inputs donde la condición del bug se cumple, la función corregida produce el comportamiento esperado.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := handleSubmitRanking_fixed(input)
  ASSERT resultPersistedLocally(input.submission, input.matchId)
  ASSERT localRankingsForLevel(input.level).length <= 10
  ASSERT localRankingsAreSortedByVitaScoreDesc(input.level)
  ASSERT duplicateSubmissionBlocked(input.matchId)
END FOR
```

### Preservation Checking

**Goal**: Verificar que para todos los inputs donde la condición del bug NO se cumple, la función corregida produce el mismo resultado que la función original.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT handleSubmitRanking_original(input) = handleSubmitRanking_fixed(input)
  ASSERT remoteAPICallMade(input) = remoteAPICallMade_fixed(input)
  ASSERT navigationBehavior_original(input) = navigationBehavior_fixed(input)
END FOR
```

**Testing Approach**: Se recomienda property-based testing para la verificación de preservación porque:
- Genera automáticamente muchos casos de test sobre el dominio de inputs
- Detecta edge cases que tests manuales podrían omitir
- Provee garantías fuertes de que el comportamiento no cambió para inputs no relacionados al bug

**Test Plan**: Observar comportamiento del código SIN corregir para envíos remotos y navegación, luego escribir property-based tests que capturen ese comportamiento.

**Test Cases**:
1. **Preservación de envío remoto**: Verificar que `fetchWithRetry('/rankings', ...)` se sigue llamando con los mismos parámetros después del fix
2. **Preservación de navegación**: Verificar que los botones Continuar/Repetir/Reintentar/Menú siguen navegando a las escenas correctas
3. **Preservación de validación de alias**: Verificar que alias inválidos siguen siendo rechazados con el mismo criterio
4. **Preservación de guardado de perfil**: Verificar que el nickname se sigue guardando en el perfil

### Unit Tests

- Test de `saveLocal()`: verificar escritura correcta a localStorage con datos válidos
- Test de ordenamiento: verificar que los rankings se ordenan por vitaScore desc
- Test de truncado: verificar que solo se conservan 10 registros por nivel
- Test de `isAlreadySubmitted()`: verificar detección correcta de matchId duplicado
- Test de generación de matchId: verificar unicidad en múltiples invocaciones
- Test de alias inválido: verificar que no se guarda localmente si el alias es inválido
- Test de localStorage no disponible: verificar que el juego no se rompe

### Property-Based Tests

- Generar submissions aleatorias (alias, level, vitaScore variados) y verificar que los rankings locales siempre tienen ≤ 10 entries y están ordenados por vitaScore desc
- Generar secuencias aleatorias de envíos con matchIds repetidos y verificar que nunca se almacenan duplicados
- Generar inputs que NO son envíos de ranking y verificar que el estado de localStorage de rankings no cambia

### Integration Tests

- Test de flujo completo: nivel → victoria → ingresar alias → enviar → verificar localStorage y API call
- Test de flujo con API caída: enviar → API falla → verificar que localStorage tiene el resultado y el toast informa guardado local
- Test de re-entrada a escena: enviar → navegar → volver → verificar que no se puede re-enviar la misma partida
