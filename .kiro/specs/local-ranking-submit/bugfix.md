# Bugfix Requirements Document

## Introduction

Al finalizar cada partida (victoria o derrota), el jugador puede ingresar un alias y hacer clic en "Enviar al ranking", pero el resultado solo se envía a la API remota. Si la API no está disponible, el puntaje se pierde. Además, no existe protección contra envíos duplicados de la misma partida, ni límite de registros almacenados. Este bugfix agrega persistencia local en localStorage para los resultados del ranking, conservando solo los mejores 10 por nivel, e impidiendo el envío duplicado de una misma partida. Todo sin modificar la lógica actual del juego.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN el jugador hace clic en "Enviar al ranking" al finalizar una partida THEN el sistema solo envía el resultado a la API remota sin guardar una copia persistente en localStorage

1.2 WHEN la API remota no está disponible o falla THEN el sistema pierde el resultado del jugador sin ningún respaldo local

1.3 WHEN el jugador hace clic en "Enviar al ranking" múltiples veces en la misma pantalla de resultado THEN el sistema permite enviar el mismo resultado repetidamente sin restricción

1.4 WHEN se acumulan más de 10 resultados para un mismo nivel THEN el sistema no limita la cantidad de registros almacenados (no hay almacenamiento local actualmente, pero el requisito es que si existiera, debería tener este límite)

### Expected Behavior (Correct)

2.1 WHEN el jugador hace clic en "Enviar al ranking" con un alias válido THEN el sistema SHALL guardar el resultado de forma persistente en localStorage asociado al nivel correspondiente

2.2 WHEN se guarda un resultado en localStorage y ya existen 10 o más registros para ese nivel THEN el sistema SHALL conservar únicamente los mejores 10 registros ordenados por vitaScore descendente, descartando el resto

2.3 WHEN el jugador intenta enviar el ranking de una partida que ya fue enviada previamente THEN el sistema SHALL impedir el envío duplicado y mostrar una notificación informando que ya se registró ese resultado

2.4 WHEN el jugador hace clic en "Enviar al ranking" con un alias válido THEN el sistema SHALL también intentar enviar el resultado a la API remota (comportamiento actual preservado)

2.5 WHEN la API remota falla pero el guardado local fue exitoso THEN el sistema SHALL informar al jugador que su resultado quedó guardado localmente

### Unchanged Behavior (Regression Prevention)

3.1 WHEN el jugador navega a la pantalla de ranking (RankingScene) THEN el sistema SHALL CONTINUE TO mostrar los puntajes obtenidos de la API remota (si está disponible)

3.2 WHEN el jugador completa o pierde un nivel THEN el sistema SHALL CONTINUE TO calcular el VitaScore correctamente sin modificaciones en scoring-system

3.3 WHEN el jugador completa un nivel THEN el sistema SHALL CONTINUE TO actualizar el progreso (niveles completados, recompensas) mediante progress-system y StorageService

3.4 WHEN el jugador interactúa con la interfaz de VictoryScene o GameOverScene (navegación, alias input, botones) THEN el sistema SHALL CONTINUE TO responder correctamente a los controles de teclado y mouse

3.5 WHEN el jugador usa el botón "Continuar", "Repetir", "Reintentar" o "Menú" THEN el sistema SHALL CONTINUE TO navegar a la escena correspondiente sin interferencia del nuevo sistema de ranking local
