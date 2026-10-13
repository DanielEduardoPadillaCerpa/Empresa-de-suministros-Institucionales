# Política de verificación de identidad y vínculo institucional

Vigente desde la migración `002_verificacion_en_compra` (2026-10-13). Las fuentes disponibles y sus límites están en [VIABILIDAD_SIGEP_DATOS_ABIERTOS.md](VIABILIDAD_SIGEP_DATOS_ABIERTOS.md).

## 1. Cuándo se verifica

- **No** al registrarse. La cuenta nace activa para el uso general.
- **Sí** cuando la persona quiere comprar o ver productos restringidos de su institución, o cuando su verificación venció.
- Además, **cada compra** con productos restringidos exige un código enviado al correo. Ese código autentica la operación; no es una tercera verificación de identidad.

## 2. Definiciones

- **Falso positivo.** El sistema considera autorizada a una persona que no cumple los requisitos (por ejemplo, alguien con un certificado falso).
- **Falso negativo.** El sistema considera no autorizada a una persona que sí cumple (por ejemplo, un policía que no aparece en SIGEP).
- **Sin resolver.** Ni confirmado ni rechazado. Siempre lo resuelve una persona; nunca una regla automática.

## 3. Comprobaciones y métodos por categoría

| Categoría | 1. Vínculo (documental, revisor A) | 2. Canal independiente | Entidad (auxiliar) | Justificación de la independencia |
|---|---|---|---|---|
| Policía | Oficio o certificado laboral cotejado con la cédula registrada | Correo `@policia.gov.co` / `@policia.mil.co` con código recibido, **o** confirmación del área de talento humano o logística por canal oficial, registrada por el revisor B | CHIP `5c7g-ptic` por NIT de la unidad | El buzón lo administra la institución, no el solicitante; la confirmación oficial la obtiene otra persona por otra vía |
| Fuerzas Militares y Defensa | Igual | Dominios `.mil.co` y `mindefensa.gov.co`, o confirmación oficial | CHIP | Igual |
| Bomberos | Acto de reconocimiento o certificado + vínculo | `@dnbc.gov.co` / `@bomberos.gov.co` o confirmación del comandante por oficio | CHIP (oficiales) o RUES ESAL (voluntarios); si no aparece, se revisa manualmente con el certificado de la DNBC | No hay registro público nacional de bomberos ni de sus miembros |
| Socorro (Defensa Civil, Cruz Roja) | Acreditación de la seccional + vínculo | Dominio de la Defensa Civil o confirmación de la seccional | CHIP o RUES (ESAL) | Igual |
| Penitenciario | Vínculo | `@inpec.gov.co` / `@uspec.gov.co` o confirmación oficial | CHIP | Igual |
| Empresas (incluida vigilancia privada) | Certificado de existencia + licencia de Supervigilancia + vínculo | Confirmación de la empresa por el teléfono o correo que figura en su certificado, registrada por el revisor B | RUES `c82u-588k` (matrícula ACTIVA y renovada) | RUES no prueba la licencia ni el vínculo de la persona: por eso la licencia se revisa como documento |

No se presentan como "dos verificaciones" dos consultas a la misma fuente. El componente `entidad` es **auxiliar**: prueba que la entidad existe, no que la persona pertenece a ella.

## 4. Tabla de decisión (implementada en `decidirSolicitud()`)

| Vínculo | Canal | Entidad | Estado de la solicitud | ¿Se puede aprobar? |
|---|---|---|---|---|
| confirmado | confirmado | confirmado | `requiere_revision` (lista para decidir) | **Sí**, si vínculo y canal los registraron personas distintas |
| confirmado | confirmado (misma persona que el vínculo) | confirmado | `requiere_revision` | No (`misma_persona_en_ambas_comprobaciones`) |
| cualquiera | cualquiera | con un `no_coincide` | `requiere_revision` | No; lo revisa una persona (rechazo con motivo o pedido de información) |
| cualquiera | cualquiera | con un `ambiguo`, `respuesta_invalida` o `datos_insuficientes` | `requiere_revision` | No; se registra una comprobación manual o se pide información |
| cualquiera | cualquiera | con un `fuente_no_disponible` (sin no coincidencias) | `fuente_no_disponible` | No; se reintenta hasta 5 veces y luego se puede verificar manualmente |
| alguno `pendiente` (sin otros problemas) | | | `en_curso` | No |

Reglas que el servidor hace cumplir:

1. **Ninguna combinación aprueba ni rechaza automáticamente.** La aprobación y el rechazo siempre los decide una persona con `verificacion.decidir`, y el rechazo exige motivo.
2. n8n solo puede escribir el componente `entidad`. Un `verified: true`, otro componente o un campo extra se rechazan (400).
3. La confirmación institucional exige una referencia (oficio, radicado o canal). La revisión manual de la entidad también.
4. Ausencia en un registro público = `datos_insuficientes`, nunca `no_coincide`. No equivale a fraude.
5. Tras un rechazo el titular puede corregir y reenviar hasta 3 veces. Después lo atiende soporte.
6. Una solicitud sin decisión expira a los 30 días y la cuenta pasa a `requiere_informacion` (no a rechazada).
7. Una verificación aprobada vence a los 365 días (`VERIFICACION_VIGENCIA_DIAS`). Al vencer, la cuenta conserva el uso general y pierde los restringidos hasta renovarla.
8. Suspender una cuenta cancela sus solicitudes activas, revoca sus autorizaciones de compra y cierra sus sesiones.

## 5. Controles contra falsos positivos

- Dos comprobaciones de fuentes distintas, con cuatro ojos cuando ambas son humanas.
- Documento de identidad normalizado e índice HMAC. Si el mismo documento aparece en otra cuenta, se avisa al revisor (`otrasCuentasMismoDocumento`).
- Los nombres no se comparan de forma aproximada: el revisor coteja el documento con la evidencia. Ninguna coincidencia parcial de nombres cuenta como prueba.
- La autorización de compra va ligada al usuario, al cliente, al contenido del carrito y a una solicitud aprobada. Es de un solo uso y dura 15 minutos.
- Las respuestas de n8n se validan con HMAC propio, ventana de 5 minutos, nonce único, esquema estricto y correspondencia con una comprobación que esperaba ese resultado.
- Las cuentas sintéticas de prueba no pueden comprar en producción.

## 6. Controles contra falsos negativos

- Que una persona no esté en SIGEP, RUES o CHIP no la rechaza.
- Si la fuente cae, se reintenta y existe una vía manual.
- El titular puede corregir sus datos y reenviar.
- La persona del equipo ve cada comprobación con su fuente y su referencia.
- La comunicación al titular dice "en revisión", no "no coincide": no se revela qué fuente falló, para no facilitar la enumeración.

## 7. Datos que **no** se recogen

- Biometría (dato sensible, art. 5 de la Ley 1581).
- Placa policial.
- Antecedentes judiciales: el registro mínimo dejó de pedirlos y el campo `numeroConsultaAntecedentes` ya no se acepta.
- Documentos completos hacia n8n.
- Datos de RUES distintos de los de la entidad: se consulta con `$select` limitado.

## 8. Métricas

No hay datos etiquetados reales, así que **no se declara ninguna tasa de exactitud**. Las pruebas automatizadas verifican el comportamiento de cada combinación (ver [MATRIZ_FALSOS_POSITIVOS_NEGATIVOS.md](MATRIZ_FALSOS_POSITIVOS_NEGATIVOS.md)). Cuando haya operación real se podrá medir, sin guardar datos personales adicionales:

- la proporción de solicitudes rechazadas que luego se aprueban tras corregirse (indicador de falsos negativos);
- las aprobaciones revocadas por fraude (indicador de falsos positivos);
- las solicitudes expiradas sin decisión.
