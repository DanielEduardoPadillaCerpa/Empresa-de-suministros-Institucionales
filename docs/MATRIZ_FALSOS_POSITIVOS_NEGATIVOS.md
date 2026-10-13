# Matriz de falsos positivos y falsos negativos

Cada fila es un escenario de error posible. Para cada uno se indica el control y la prueba que lo cubre. **FP** significa autorizar a quien no debe; **FN**, bloquear a quien sí debe. Las pruebas citadas se ejecutaron el 2026-10-13 (ver [RESULTADOS_PRUEBAS.md](RESULTADOS_PRUEBAS.md)).

| # | Escenario | Riesgo | Respuesta del sistema | Prueba |
|---|---|---|---|---|
| 1 | Alguien se registra declarando "Policía" | FP | La declaración no es acreditación: no ve ni compra restringidos | `compra-verificada` 1–3; `verificacion` B |
| 2 | Certificado laboral falso | FP | El revisor A lo coteja con el documento; además hace falta un canal independiente confirmado por otra persona o un buzón institucional | `verificacion-compra.test` (tabla de decisión); `compra-verificada` "cuatro ojos" |
| 3 | El mismo revisor registra ambas comprobaciones | FP | Se rechaza (409) y la tabla no permite aprobar | `compra-verificada` "cuatro ojos"; prueba unitaria `misma_persona` |
| 4 | Respuesta de n8n falsificada (`verified: true`, otra firma, otro componente, otra fuente) | FP | 401/400; no cambia nada | `compra-verificada` 10 |
| 5 | Respuesta de n8n repetida | FP | Nonce duplicado → 409 | `compra-verificada` 10b |
| 6 | Respuesta de n8n antigua | FP | `consultadoEn` de más de 15 min o firma de más de 5 min → 400/401 | `compra-verificada` 10 |
| 7 | Autorización de compra reutilizada (mismo pedido, otro carrito, otro usuario, vencida) | FP | 403 `no_vigente`, `carrito_distinto` o `no_corresponde` | `compra-verificada` 11 |
| 8 | Verificación vencida | FP | Los restringidos desaparecen y la compra exige renovar | `compra-verificada` 11b |
| 9 | Cuenta suspendida con token vigente | FP | 401 en la siguiente petición y autorizaciones revocadas | `compra-verificada` 13; `verificacion` I |
| 10 | Se cambia el id de producto, el precio o la institución en la petición | FP | El servidor reevalúa todo desde MySQL | `verificacion` E, L; `compra-verificada` 14 |
| 11 | Un administrador limitado se concede permisos | FP | 403; solo el superadministrador concede permisos reservados | `compra-verificada` 15; `verificacion` H |
| 12 | Una cuenta de prueba compra en producción | FP | 403 `CUENTA_DE_PRUEBA` | `compra-verificada` 9.3 |
| 13 | Policía o militar que no aparece en SIGEP | FN | No se consulta SIGEP; se usa evidencia documental más el canal institucional | Diseño ([VIABILIDAD](VIABILIDAD_SIGEP_DATOS_ABIERTOS.md)) |
| 14 | Entidad legítima que no aparece en RUES ni en CHIP (por ejemplo, bomberos voluntarios) | FN | `datos_insuficientes` → revisión manual con referencia y aprobación | `compra-verificada` 7 |
| 15 | La fuente pública no responde | FN | `fuente_no_disponible`, reintentos y luego vía manual; mientras tanto no autoriza | `compra-verificada` 9 |
| 16 | La fuente responde algo ambiguo (por ejemplo, matrícula activa sin renovar) | FN/FP | `ambiguo` → revisión humana; no aprueba ni rechaza solo | `compra-verificada` 8; `verificacion-compra.test` W11 |
| 17 | El titular escribe la cédula con puntos o ceros | FN | Normalización: el mismo número da el mismo índice | Prueba unitaria de normalización |
| 18 | Error humano al rechazar | FN | Motivo obligatorio y hasta 3 reenvíos tras corregir | `compra-verificada` "no coincidencia confirmada" |
| 19 | Solicitud olvidada | FN | Expira a los 30 días y pasa a `requiere_informacion`, no a rechazada | `procesarMantenimiento` (revisión de código; sin prueba de reloj) |
| 20 | Código de compra mal escrito | FN | 5 intentos; luego se pide otro | `compra-verificada` 6 |

## Tasas medidas

No se miden tasas reales: no existen datos etiquetados legítimos. No se afirma ninguna precisión. Ver la sección 8 de [POLITICA_VERIFICACION_IDENTIDAD.md](POLITICA_VERIFICACION_IDENTIDAD.md).
