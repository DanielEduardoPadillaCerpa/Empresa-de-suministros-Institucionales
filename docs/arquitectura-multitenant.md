# Arquitectura multi-institución

## Identidad y aislamiento

- `backend/src/tenancy.js` mantiene la lista cerrada de instituciones y el mapa de dominios.
- La institución se resuelve al emitir el JWT tras MFA; los tokens renovados vuelven a incluirla. La sesión del navegador no decide el ámbito.
- Cuentas con dominios no mapeados (incluidos correos personales) quedan en `corporativo`. Actualizar el mapa únicamente después de verificar los dominios institucionales oficiales y el flujo de MFA.
- `productos.institucion_id` segmenta cada referencia. La migración deja los productos existentes en `policia`, que corresponde al catálogo anterior. El administrador debe reclasificarlos antes de publicar las otras verticales; solo los productos asignados `general` son compartidos.
- Listado, detalle, asistente de catálogo y checkout aplican el mismo ámbito. El checkout valida otra vez la institución dentro de la transacción; los parámetros de URL del navegador no otorgan acceso.
- Visitantes reciben nombre e imagen pública, pero no precio, inventario, restricciones ni metadatos técnicos. Los productos ajenos a la institución responden como no encontrados.

## Panel administrativo y apariencia

El panel de productos permite asignar cada ficha a Policía, Defensa, Bomberos, Socorro, Penitenciario, Corporativo o General. `frontend/css/tenant-ui.css` comparte la paleta por institución en el landing, catálogo, detalle y paneles. Usa degradados/patrones locales y no descarga fotografías de terceros ni expone secretos en estilos.

## Automatización n8n

`n8n/workflows/W10-contexto-institucional.json` es un subflujo importable que normaliza el dominio/identificador y contiene el nodo Switch. Es deliberadamente **inactivo y no conectado** hasta importarlo y llamarlo desde una automatización autenticada en la instancia n8n. El repositorio no dispone de una sesión/API de n8n verificable para importarlo o activarlo. El subflujo devuelve el nombre de la variable de entorno configurada, nunca el valor de un token; los tokens reales deben permanecer como secretos del servidor y nunca enviarse al navegador.

W5 (MFA) y W9 (comprobantes) permanecen sin cambios. La autenticación multi-institución del portal opera con JWT firmado por el backend y no depende de dichos flujos de correo.

## Solicitudes y normatividad

`POST /api/atencion/solicitudes` valida el NIT, correo, clasificación y criticidad; limita envíos por IP y cifra NIT/correo con el mecanismo de cifrado ya utilizado por la aplicación. La pantalla exige autorización de tratamiento de datos. `frontend/leyes.html` presenta referencias oficiales y un resumen informativo, no asesoría jurídica.
