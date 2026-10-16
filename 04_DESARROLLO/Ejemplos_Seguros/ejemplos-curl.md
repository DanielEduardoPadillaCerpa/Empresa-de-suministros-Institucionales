# Ejemplos de solicitudes con curl (datos ficticios)

| Campo | Valor |
|---|---|
| ID documental | DOC-04-EJE-01 |
| Versión | 1.0 |
| Estado | BORRADOR — PENDIENTE DE VALIDACIÓN |
| Fecha de generación | 2026-10-16 |
| Responsable | PENDIENTE DE ASIGNACIÓN |
| Evidencia base | rama `feature/verificacion-seguridad`, commit `4742737` |

## Propósito

Ilustrar el uso de la API en desarrollo local. Los marcadores `<…>` deben reemplazarse por valores obtenidos en su propio entorno; **no** son valores reales.

## Alcance

**[OBS]** No ejecutados en la auditoría. Sintaxis bash (en PowerShell use `curl.exe` y comillas dobles escapadas). Base: `BASE=http://localhost:8081`.

## 1. Registro (UC-001, REQ-F-001)

```bash
curl -s $BASE/api/auth/registro/tipos              # tipos y campos por institución
curl -s $BASE/api/auth/captcha                     # {"id":"…","svg":"<svg…>"}: resolver la suma visualmente
curl -s -X POST $BASE/api/auth/registro \
  -H 'Content-Type: application/json' \
  --data @registro-solicitud.ejemplo.json          # quitar antes la clave _comentario
# Esperado: 202 {"ok":true,"estado":"solicitud_recibida",…} (idéntico aunque el correo exista)
```

## 2. Aprobación por un administrador (UC-002, REQ-F-004)

```bash
curl -s $BASE/api/admin/solicitudes/contador -H "Authorization: Bearer <ACCESS_TOKEN_ADMIN>"
curl -s "$BASE/api/admin/solicitudes?estado=pendiente" -H "Authorization: Bearer <ACCESS_TOKEN_ADMIN>"
curl -s -X POST $BASE/api/admin/solicitudes/<ID>/aprobar \
  -H "Authorization: Bearer <ACCESS_TOKEN_ADMIN>" -H 'Content-Type: application/json' \
  -d '{"confirmar": true}'                          # confirmar solo si el resultado no es "coincide"
curl -s -X POST $BASE/api/admin/solicitudes/<ID>/rechazar \
  -H "Authorization: Bearer <ACCESS_TOKEN_ADMIN>" -H 'Content-Type: application/json' \
  -d '{"motivo": "El NIT no corresponde a la entidad declarada."}'
```

## 3. Inicio de sesión con MFA (UC-003, REQ-F-005/006)

```bash
curl -s -X POST $BASE/api/auth/login -H 'Content-Type: application/json' \
  -d '{"correo":"juan.rodriguez@suministros-prueba.test","password":"<CONTRASENA>","captchaId":"<ID>","captchaRespuesta":"<SUMA>"}'
# 202 {"mfaRequired":true,"challengeId":"<64 hex>","expiresIn":300,"correoEnmascarado":"ju****@…"}

curl -s -X POST $BASE/api/auth/mfa/verificar -H 'Content-Type: application/json' \
  -d '{"challengeId":"<CHALLENGE_ID>","code":"<6 DIGITOS DE MAILPIT O CONSOLA>"}'
# 200 {"token":"<ACCESS_TOKEN>","refreshToken":"<REFRESH_TOKEN>",…}

curl -s -X POST $BASE/api/auth/refresh -H 'Content-Type: application/json' -d '{"refreshToken":"<REFRESH_TOKEN>"}'
curl -s -X POST $BASE/api/auth/logout  -H 'Content-Type: application/json' -d '{"refreshToken":"<REFRESH_TOKEN>"}'
```

## 4. Catálogo (UC-007)

```bash
curl -s $BASE/api/productos                                   # visitante: vitrina sin precio ni stock
curl -s "$BASE/api/productos?categoria_id=1" -H "Authorization: Bearer <ACCESS_TOKEN>"
curl -s $BASE/api/productos/999999 -i                         # 404 (inexistente u oculto: misma respuesta)
```

## 5. Checkout y pago simulado (UC-009)

```bash
curl -s -X POST $BASE/api/checkout \
  -H "Authorization: Bearer <ACCESS_TOKEN>" -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: ejemplo-clave-0000000001' \
  --data @checkout.ejemplo.json                    # quitar antes la clave _comentario
# 201 {"pedido_id":…}; repetir con la misma clave y el mismo cuerpo devuelve 200 con el mismo pedido

curl -s -X POST $BASE/api/pagos/dev/simular-webhook \
  -H "Authorization: Bearer <ACCESS_TOKEN>" -H 'Content-Type: application/json' -d '{"pedido_id": <PEDIDO_ID>}'
# Resultado decidido en el servidor por los centavos: .01 rechaza, .02 pendiente, .03 timeout, resto aprueba

curl -s $BASE/api/pagos/<PEDIDO_ID>/estado -H "Authorization: Bearer <ACCESS_TOKEN>"
curl -s "$BASE/api/comprobantes/<PEDIDO_ID>?format=pdf" -H "Authorization: Bearer <ACCESS_TOKEN>" -o comprobante.pdf
```

## 6. Pruebas negativas sugeridas (seguridad)

```bash
curl -s -X POST $BASE/api/pedidos -H "Authorization: Bearer <ACCESS_TOKEN>" -i     # 410 retirado
curl -s $BASE/api/clientes -H "Authorization: Bearer <ACCESS_TOKEN_CLIENTE>" -i      # 403
curl -s $BASE/api/reportes/mensual -i                                              # 200 SIN sesión: BUG-001
curl -s -X POST $BASE/api/auth/registro -H 'Content-Type: application/json' \
  -d '{"rol":"admin"}' -i                                                          # 400 captcha/validación
```

## 7. Endpoints de máquina (solo con secretos de su entorno)

```bash
curl -s $BASE/api/automatizaciones/resumen-diario -H "x-automation-token: <N8N_W2_DAILY_SUMMARY_TOKEN>"
curl -s -X POST $BASE/api/automatizaciones/pedidos/expirar -H "x-automation-token: <N8N_W4_EXPIRY_TOKEN>"
```

## Referencias

- [README.md](README.md) · [../08_CONTRATOS_Y_ENDPOINTS_DE_API.md](../08_CONTRATOS_Y_ENDPOINTS_DE_API.md)
- [../../05_PRUEBAS/06_PRUEBAS_DE_SEGURIDAD.md](../../05_PRUEBAS/06_PRUEBAS_DE_SEGURIDAD.md)
