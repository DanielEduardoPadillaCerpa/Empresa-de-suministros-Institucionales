# Conversor de la documentación a Word

| Campo | Valor |
|---|---|
| ID documental | DOC-04-SH-WORD |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |

## Propósito

Generar la versión Word (`.docx`) de cada documento Markdown de las carpetas `00_GESTION_DEL_PROYECTO` a `07_MANTENIMIENTO_Y_SOPORTE`. El `.md` es la fuente editable (Git registra sus cambios y GitHub lo muestra); el `.docx` es la versión de entrega. Cada vez que se edita un `.md`, se vuelve a generar su `.docx`.

## Qué hace

- Un `.docx` por documento, en la misma carpeta y con el mismo nombre.
- Página carta con márgenes de 1", encabezado con el título y pie con "Página X de Y".
- Títulos, listas, casillas de verificación, tablas con fila de encabezado repetida y bloques de código.
- Los enlaces a otros documentos apuntan a su `.docx`.
- Los identificadores (`REQ-F-001`, `TC-104`, `BUG-012`…) usan guion no separable para no partirse.
- Los documentos con tablas muy anchas se generan en horizontal.
- Los diagramas Mermaid se dibujan con Google Chrome y se insertan como imagen. Si en una página vertical se verían pequeños, van en una página propia horizontal; si en carta quedarían por debajo del 50 % de su tamaño, en una página doble carta (11 × 17").

## Uso

Requisitos: Node.js 18 o superior y Google Chrome (otra ruta: variable `CHROME_PATH`).

```bash
cd 04_DESARROLLO/Scripts_y_Herramientas/convertir-a-word
npm install            # solo la primera vez
npm run convertir      # todos los documentos
node md2docx.mjs ../../.. 02_ANALISIS/03_PROCESOS_DEL_NEGOCIO.md   # uno solo
```

Los diagramas ya dibujados se guardan en `cache-diagramas/` (excluida de Git) y solo se vuelven a dibujar los que cambian.

## Verificación realizada (2026-10-16)

- Los 127 documentos se generaron sin errores y los 50 diagramas se dibujaron.
- Cada `.docx` se abrió con Microsoft Word y se exportó a PDF; se revisaron visualmente páginas de la matriz de trazabilidad, el modelo entidad-relación, el diagrama de componentes, los procesos del negocio, los endpoints de la API y la lista de verificación.

## Limitaciones

- Los diagramas son imágenes: para cambiarlos se edita el bloque Mermaid del `.md` y se vuelve a convertir.
- Editar directamente el `.docx` no actualiza el `.md`; si se edita el Word, los cambios se pierden en la siguiente conversión.
