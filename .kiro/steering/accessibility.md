# Accessibility — Requisitos de Accesibilidad (WCAG 2.1 AA)

## Objetivo

VitaBalance debe ser jugable y navegable por la mayor cantidad posible de usuarios, incluyendo personas con discapacidades motoras, visuales y cognitivas leves. Se apunta al cumplimiento de WCAG 2.1 nivel AA en los aspectos aplicables a un videojuego web.

> Nota: La validación completa de accesibilidad requiere pruebas manuales con tecnologías de asistencia y revisión experta.

## Requisitos obligatorios

### Entrada / Controles

| Requisito | Detalle |
|-----------|---------|
| Teclado completo | Toda la funcionalidad accesible con teclado (flechas, Enter, Escape, Tab) |
| Controles táctiles | Área de toque ≥ 44 × 44 px (WCAG 2.5.5 nivel AAA adoptado como mínimo interno) |
| Foco visible | Indicador de foco claro en todos los elementos interactivos de menú |
| Sin gestos complejos | No requerir gestos multi-punto ni basados en trayectoria |
| Tab order lógico | Navegación por Tab sigue orden visual en menús y pantallas de resultado |

### Visual / Contraste

| Requisito | Detalle |
|-----------|---------|
| Contraste AA | Texto y controles con ratio ≥ 4.5:1 (normal) o ≥ 3:1 (grande/bold) |
| No solo color | La información nunca se comunica únicamente mediante color (usar forma, icono o texto adicional) |
| Productos deteriorados | Diferenciados por forma/textura además de color (manchas visibles, forma distorsionada) |
| Texto legible | Tamaño mínimo de fuente equivalente a 16 px en resolución base |

### Movimiento / Animación

| Requisito | Detalle |
|-----------|---------|
| Reducir movimiento | Respetar `prefers-reduced-motion`: desactivar confeti, reducir animaciones de caída a transiciones simples |
| Sin parpadeo | Ningún elemento parpadea más de 3 veces por segundo |
| Avatar siempre visible | El avatar y los objetos activos permanecen dentro del viewport |

### Temporal / Cognitivo

| Requisito | Detalle |
|-----------|---------|
| Tiempo de lectura | El feedback educativo (toast) permanece ~1.8 s — tiempo suficiente para lectura a edad objetivo |
| Pausa disponible | El juego puede pausarse en cualquier momento sin perder progreso |
| Instrucciones claras | Cada nivel muestra su objetivo antes de iniciar |
| Mensajes no punitivos | Los mensajes de derrota son motivacionales, sin culpar al jugador |

### Responsive / Dispositivos

| Requisito | Detalle |
|-----------|---------|
| Escalado responsive | Funciona en desktop (1920×1080), tablet (1024×768) y móvil horizontal (≥ 640×360) |
| Phaser Scale Manager | Usar modo `FIT` o `RESIZE` con bounds mínimos |
| Elementos dentro del área segura | Nada crítico queda fuera del viewport o bajo notch/barra de navegación |

## Implementación técnica

### Helper de accesibilidad (`src/utils/accessibility.ts`)

Responsabilidades:
- Detectar `prefers-reduced-motion` y exponer flag global.
- Detectar `prefers-color-scheme` (futuro, no MVP).
- Proveer función para verificar contraste programáticamente (opcional).
- Gestionar focus trap en menús si se usa DOM overlay.

### Botón accesible (`src/ui/Button.ts`)

- Área mínima 44 × 44 px.
- Indicador de foco visible (outline o glow).
- Label textual siempre presente (no depender solo del icono).
- Estado hover/active diferenciado.

### Menús

- Navegables con Tab y Enter.
- Foco inicial en la opción primaria al abrir.
- Escape cierra overlay o vuelve atrás.

## Mejoras opcionales (post-MVP)

- Narración por voz del feedback educativo.
- Alto contraste como opción en Settings.
- Velocidad de juego configurable como opción de accesibilidad.
- Subtítulos para efectos de audio.
- Modo daltónico con paleta alternativa.

## Verificación

- Probar navegación completa con teclado (sin mouse).
- Verificar contraste con herramientas automáticas (Lighthouse, axe).
- Probar con `prefers-reduced-motion: reduce` activo.
- Verificar en viewport mínimo (640×360).
- Verificar que los toasts se leen en el tiempo indicado a velocidad de lectura infantil (~120 palabras/min).

## Referencia

- WCAG 2.1: https://www.w3.org/TR/WCAG21/
- Game Accessibility Guidelines: https://gameaccessibilityguidelines.com/
