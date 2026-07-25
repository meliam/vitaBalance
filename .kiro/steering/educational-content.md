# Educational Content — Contenido Educativo

## Principios

1. **Informar sin prescribir** — Mostrar propiedades nutricionales destacadas sin dar recomendaciones médicas.
2. **Una propiedad por producto** — Cada producto tiene un nutriente o beneficio principal que se muestra al capturarlo.
3. **Datos verificables** — Solo incluir información que el equipo pueda respaldar con fuentes públicas confiables.
4. **Regional** — La guía de estacionalidad corresponde principalmente a la zona central de Argentina y Buenos Aires.
5. **Lenguaje accesible** — Redacción comprensible para niños de 8 a 12 años.

## Disclaimers obligatorios

Incluir en pantalla de inicio o sección "Acerca de":

- "La información nutricional es orientativa y educativa. No reemplaza el consejo de un profesional de la salud."
- "La disponibilidad estacional se basa en la zona central de Argentina y Buenos Aires. Puede variar según la provincia y el clima."

## Lo que NO hacer

- No inventar estadísticas nutricionales.
- No incluir porcentajes de ingesta diaria sin especificar porción y fuente.
- No afirmar que un producto "cura" o "previene" enfermedades.
- No utilizar datos generados por IA sin verificación del equipo.
- No incluir marcas comerciales.

## Formato del feedback educativo

```
[Nombre del producto] · [Propiedad destacada] · +[puntos]
```

La propiedad destacada es un texto corto (≤ 5 palabras) que resalta un nutriente o beneficio:

| Producto | Propiedad destacada | Estación principal |
|----------|--------------------|--------------------|
| Naranja | Vitamina C | Invierno |
| Banana | Potasio | Todo el año |
| Brócoli | Fibra y vitamina C | Otoño / Invierno |
| Frutilla | Vitamina C y antioxidantes | Primavera |
| Espinaca | Hierro y ácido fólico | Otoño / Invierno |
| Zanahoria | Vitamina A (betacaroteno) | Todo el año |
| Manzana | Fibra | Otoño |
| Tomate | Licopeno y vitamina C | Verano |
| Kiwi | Vitamina C y fibra | Otoño / Invierno |
| Sandía | Hidratación y licopeno | Verano |
| Durazno | Vitamina A y fibra | Verano |
| Mandarina | Vitamina C | Invierno |
| Choclo | Fibra y energía | Verano |
| Zapallo | Vitamina A y fibra | Otoño |
| Pera | Fibra y potasio | Verano / Otoño |

> Esta tabla es indicativa. Los datos finales deben ser confirmados por el equipo con fuentes confiables antes de incluirlos en `src/config/products.ts`.

## Estacionalidad

La estacionalidad se define para la región central de Argentina (Buenos Aires, Córdoba, Santa Fe, Mendoza).

| Estación | Meses (hemisferio sur) |
|----------|----------------------|
| Verano | Diciembre — Febrero |
| Otoño | Marzo — Mayo |
| Invierno | Junio — Agosto |
| Primavera | Septiembre — Noviembre |

### Productos por estación (indicativos)

**Primavera:** Frutilla, espárrago, arveja.

**Verano:** Tomate, sandía, durazno, choclo, melón.

**Otoño:** Manzana, pera, zapallo, uva, kiwi.

**Invierno:** Naranja, mandarina, brócoli, espinaca, kiwi.

**Todo el año:** Banana, zanahoria, papa.

> La asignación definitiva se realiza en `src/config/seasons.ts`. Productos "todo el año" pueden aparecer en cualquier nivel pero no cuentan como producto de estación objetivo.

## Productos deteriorados

Los productos deteriorados son versiones visualmente alteradas de productos normales:
- Manchas oscuras.
- Color apagado o grisáceo.
- Forma ligeramente distorsionada.

No se les asigna propiedad educativa. El feedback al capturarlos es:
- "¡Ese no estaba bien!" o similar (mensaje corto, no punitivo).

## Fuentes sugeridas para verificación

- Ministerio de Salud de la Nación Argentina — Guías Alimentarias.
- INTA (Instituto Nacional de Tecnología Agropecuaria) — información de estacionalidad.
- Mercado Central de Buenos Aires — calendario de frutas y verduras.

> No citar estas fuentes en el juego a menos que se verifique la información textual contra ellas.
