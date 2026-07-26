# Bugfix Requirements Document

## Introduction

El sistema de ranking del juego VitaBalance actualmente solo envía los resultados a una API remota (`RankingService.submit()`). Si la API no está disponible, el puntaje se pierde. No existe persistencia local de rankings en localStorage, no hay control de envío duplicado (el jugador puede enviar la misma partida varias veces), y no se limita la cantidad de registros almacenados por nivel.

Este bugfix implementa persistencia local de rankings en localStorage para que los resultados se guarden de forma confiable en el dispositivo, se conserven solo los mejores 10 registros por nivel, y se impida el envío duplicado de una misma sesión de juego. Todo sin modificar la lógica actual del juego (scoring, niveles, objetivos, controles, etc.).

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN el jugador hace click en "Enviar al ranking" en VictoryScene o GameOverScene THEN el sistema solo envía el resultado a la API remota y no persiste nada en localStorage

1.2 WHEN la API remota no está disponible o falla THEN el sistema muestra un toast de error y el resultado de la partida se pierde permanentemente sin opción de recuperación

1.3 WHEN el jugador hace click en "Enviar al ranking" múltiples veces en la misma sesión de juego THEN el sistema permite enviar la misma partida repetidamente sin ningún control de duplicación

1.4 WHEN el jugador navega a RankingScene THEN el sistema solo muestra datos obtenidos de la API remota y no dispone de datos locales como fallback

1.5 WHEN se acumulan más de 10 registros de ranking para un nivel THEN el sistema no aplica ningún límite ni descarta los registros con menor puntaje

### Expected Behavior (Correct)

2.1 WHEN el jugador hace click en "Enviar al ranking" en VictoryScene o GameOverScene THEN el sistema SHALL guardar el resultado en localStorage de forma persistente, además de intentar enviarlo a la API remota

2.2 WHEN la API remota no está disponible o falla THEN el sistema SHALL igualmente guardar el resultado en localStorage y mostrar confirmación de que el puntaje fue registrado localmente

2.3 WHEN el jugador hace click en "Enviar al ranking" habiendo ya enviado la partida actual THEN el sistema SHALL impedir el envío duplicado y mostrar un mensaje indicando que ya fue registrado

2.4 WHEN el jugador finaliza una partida (victoria o derrota) y envía su resultado THEN el sistema SHALL mostrar el ranking local correspondiente al nivel que acaba de jugar (nivel 1 muestra ranking de nivel 1, nivel 2 muestra ranking de nivel 2, nivel 3 muestra ranking de nivel 3)

2.5 WHEN el jugador navega a RankingScene desde el menú THEN el sistema SHALL mostrar los datos de ranking almacenados en localStorage, permitiendo cambiar entre niveles (solo los niveles desbloqueados son visibles)

2.6 WHEN se guarda un nuevo registro de ranking y ya existen 10 o más registros para ese nivel THEN el sistema SHALL conservar únicamente los 10 registros con mayor VitaScore, descartando los demás

### Unchanged Behavior (Regression Prevention)

3.1 WHEN el jugador juega un nivel THEN el sistema SHALL CONTINUE TO calcular el VitaScore con la misma fórmula y lógica de scoring existente

3.2 WHEN el jugador ingresa un alias en el campo de texto THEN el sistema SHALL CONTINUE TO validar el alias con las mismas reglas (1–16 caracteres alfanuméricos y espacios)

3.3 WHEN el jugador completa o pierde un nivel THEN el sistema SHALL CONTINUE TO mostrar las pantallas VictoryScene o GameOverScene con la misma información y layout actuales

3.4 WHEN el jugador navega entre escenas (Reintentar, Menú, Continuar) THEN el sistema SHALL CONTINUE TO funcionar con las mismas transiciones de escena actuales

3.5 WHEN el jugador guarda progreso, configuración o perfil THEN el sistema SHALL CONTINUE TO usar las mismas claves y estructura de localStorage existentes sin interferencia

3.6 WHEN la sesión de juego tiene una puntuación inferior a todos los top 10 existentes para ese nivel THEN el sistema SHALL CONTINUE TO permitir el registro (la limitación de top 10 se aplica al almacenamiento, no al envío)
