# Product — VitaBalance: Guardianes de las Estaciones

## Visión

VitaBalance es un videojuego web arcade y educativo donde niños y niñas toman decisiones nutricionales mientras capturan frutas y verduras.  
La regla central es: **"No atrapás todo. Tomás decisiones."**

## Audiencia principal

- Niños y niñas de 8 a 12 años.
- Idioma: español rioplatense.
- Región de referencia educativa: zona central de Argentina y Buenos Aires.

## Objetivos del hackathon (AWS + Kiro)

| Objetivo | Criterio de éxito |
|----------|-------------------|
| Game design progresivo | 3 niveles con dificultad escalonada y condiciones de victoria distintas |
| Diferenciación del catch game genérico | Mecánicas de precisión, variedad, combo y balance |
| Software funcional y publicado | URL pública accesible vía AWS Amplify Hosting |
| Spec-Driven Development con Kiro | Specs, steering y hooks documentados en `.kiro/` |
| Servicios AWS justificados | API Gateway + Lambda + DynamoDB para ranking; Amplify para hosting |
| Alcance reducido y estabilidad | MVP de 3 niveles sin features fuera de alcance |
| Accesibilidad AA | Cumplimiento verificable según `.kiro/steering/accessibility.md` |
| Repositorio público | GitHub con README, demo y video final |

## Alcance del MVP

### Obligatorio

- Tres niveles jugables (Reconocer, Combinar, Guardianes de las Estaciones).
- Sistema de puntaje: puntos, combo, precisión, balance, variedad, VitaScore.
- Feedback educativo en cada captura correcta.
- Power-up Estrella Vita.
- Tres vidas por intento.
- Ranking persistente con alias anónimo (sin login).
- Progreso del avatar (recompensas cosméticas por nivel).
- Pause / Resume.
- Responsive: desktop, tablet y móvil horizontal.
- Accesibilidad AA.
- Confeti al completar misión.

### Fuera de alcance (futuro)

- Tienda, monedas, multijugador, chat.
- Más de tres niveles.
- Personalización libre del avatar.
- Login con contraseña / datos personales.
- Bedrock, RDS, EC2.
- Recomendaciones nutricionales personalizadas.
- Generación de contenido con IA en runtime.

## Entregables finales

1. Repositorio público en GitHub.
2. README con instrucciones de setup, arquitectura y decisiones.
3. URL de demo desplegada en AWS Amplify.
4. Video demostrativo del juego.
5. Documentación de diseño en `docs/`.
