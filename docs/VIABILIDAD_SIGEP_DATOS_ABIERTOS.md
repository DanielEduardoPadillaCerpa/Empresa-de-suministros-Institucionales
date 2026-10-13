# Viabilidad: SIGEP II, datos.gov.co y fuentes alternativas

Fecha de consulta: **2026-10-13**. Todas las pruebas son llamadas reales (curl o navegador), sin credenciales, sin evadir CAPTCHAs y sin consultar personas. Donde algo no pudo comprobarse, se indica.

## Conclusión

**Ninguna fuente pública y autorizada permite comprobar, a partir de un número de cédula, que una persona es miembro activo de la Policía, las Fuerzas Militares, el INPEC, un cuerpo de bomberos, la Defensa Civil o la Cruz Roja.**

Lo que sí se puede automatizar sin convenio es validar la **entidad**: que existe, cuál es su NIT y en qué estado está. La vinculación de la persona se prueba con evidencia documental emitida por la institución y se confirma por un canal institucional independiente (ver [POLITICA_VERIFICACION_IDENTIDAD.md](POLITICA_VERIFICACION_IDENTIDAD.md)).

## Clasificación por fuente

| Fuente | Qué contiene | Acceso | Prueba realizada (2026-10-13) | Clasificación |
|---|---|---|---|---|
| **SIGEP II**, directorio de servidores (https://www.funcionpublica.gov.co/es/sigep2, buscador `dafpIndexerBHV/hvSigep`) | Hojas de vida de servidores públicos civiles y contratistas | Solo web. Busca por nombre, institución o ciudad; **no busca por número de documento**. Sin API para terceros: los servicios son autenticados para el talento humano de cada entidad | Portal y buscador: HTTP 200. El formulario solo tiene `query` y filtros. No se ejecutaron búsquedas de personas | **No apta para verificar identidad individual.** No disponible para integración automatizada comprobada |
| Cobertura de SIGEP para uniformados | El personal militar y policial **no se carga** en SIGEP (reserva, sentencia C-872 de 2003, según un plan de monitoreo SIGEP de la FAC de 2023); solo el personal civil | — | Indicio coherente: en `h8rs-jxum` la Policía figura con 2.618 servidores y el Ejército con 4.497 (planta civil) | Una ausencia en SIGEP **no indica fraude** |
| **Caracterización del Empleo Público** (`h8rs-jxum`) | 44 columnas **agregadas por entidad** (código SIGEP, nombre, NIT, orden, sector, conteos por género, edad y educación, salario promedio). 4.150 filas, corte junio de 2026 | API SODA pública, CC BY-SA 4.0 | `GET /resource/h8rs-jxum.json?$limit=3` → 200; metadatos `/api/views/h8rs-jxum.json` → 200; actualizado el 2026-08-19. Hay NIT en "NULL", NIT con el DV pegado y nombres con sufijo " 1" | **No apta para verificar identidad individual.** Parcialmente útil como lista secundaria de entidades |
| **Manual del desarrollador** CO_417 | SoQL, `$limit` por defecto de 1.000 y tokens de aplicación | PDF público | Descarga 200 (3,0 MB). Los límites de tasa no están en el manual; según dev.socrata.com, sin token el cupo es compartido por IP y con `X-App-Token` no hay limitación salvo abuso | Apta como documentación |
| **RUES** (`c82u-588k`, Confecámaras) | 9,4 millones de matrículas: razón social, NIT, DV, estado de la matrícula, último año renovado, CIIU. **También contiene datos personales** (personas naturales, representante legal) | API SODA pública, mensual (datos al 2026-10-02) | `?nit=890903938&$select=razon_social,nit,digito_verificacion,estado_matricula,ultimo_ano_renovado` → 200, ACTIVA, renovado en 2026 | **Apta y accesible** para validar la existencia y el estado de **personas jurídicas**. Se consulta solo por NIT y con `$select` limitado a columnas no personales |
| **CHIP** (`5c7g-ptic`, Contaduría) | Entidades públicas con NIT (formato `NIT:DV`), razón social, ciudad. Corte semestral; último periodo 2026 enero–marzo, 4.020 entidades | API SODA pública | `?$where=upper(razon_social) like '%POLIC%' AND a_o='2026'` → 200, "800141397:5 Policía Nacional - Dirección Logística y Financiera" | **Apta y accesible** para validar entidades públicas por NIT |
| Directorio de entidades (`kqut-4h4r`, MinTIC) | 7.331 entidades con código SIGEP y ubicación; **sin NIT** | API SODA pública | `?c_digo_entidad_sigep=8110` → 200 (Dirección Nacional de Bomberos) | Parcialmente útil (sin NIT) |
| Establecimientos de reclusión (`24zf-4cfu`, INPEC) | 126 establecimientos, datos a 2025-07-31 | API SODA | 200 | Parcialmente útil (no tiene NIT ni personas) |
| Bomberos voluntarios del Valle (`pbkp-84gb`) | 104 cuerpos, datos de 2018 publicados en 2021 | API SODA | 200 | No apta (desactualizado, un solo departamento) |
| **Supervigilancia** (licencias de vigilancia) | No hay dataset en datos.gov.co. La web publica un PDF de "servicios vigentes" fechado el 08/04/2025 | Solo PDF | Página 200; PDF desactualizado (en abril de 2026 se suspendieron 31 licencias) | **Pendiente de autorización o información oficial** (pedir el certificado de licencia o el listado por derecho de petición). El CIIU 8010 en RUES **no equivale** a tener licencia |
| **Dirección Nacional de Bomberos** (RUE, certificados del Decreto 638 de 2016) | Registro nacional de cuerpos de bomberos | No hay listado público ni dataset nacional | bomberos.gov.co y dnbc.gov.co no respondieron | **Pendiente de autorización o información oficial** |
| **Registraduría** (vigencia de cédula) | Consulta web con fecha de expedición y CAPTCHA; validación automatizada solo por convenio (ANI) | Convenio | `certvigenciacedula.registraduria.gov.co` → 403 | **Pendiente de autorización** (convenio). La web no es apta para automatizar |
| **DIAN** (RUT) | Estado del RUT | Web | muisca.dian.gov.co: timeout | Pendiente de información oficial |
| Policía y Fuerzas Militares | No existe un servicio público para verificar si alguien es miembro activo (reserva legal) | — | Búsqueda sin resultados | **No apta**; solo oficio y confirmación por canal oficial |
| Antecedentes (Policía, Procuraduría, Contraloría) | Ausencia de antecedentes o sanciones; no prueban identidad ni pertenencia | Web con CAPTCHA (no verificado aquí) | Policía y Contraloría 200; Procuraduría sin respuesta | No apta para la finalidad; no se consulta |
| PEP (`3qxn-uc22`) | Personas expuestas políticamente (finalidad SARLAFT) | API SODA | Solo `count(*)` (37.597) | No apta: su finalidad es otra |

## Decisiones que se toman a partir de este informe

1. **No se integra SIGEP II.** No hay endpoint autorizado, no busca por documento y no cubre a los uniformados. No se construye ningún scraper.
2. **No se valida la cédula contra la Registraduría** hasta que exista un convenio. El sistema captura la cédula cifrada para vincular la evidencia documental con la persona y detectar duplicados, **no para verificarla contra una fuente oficial**.
3. **Se automatiza la comprobación de la entidad** desde n8n con datos abiertos, solo por NIT y sin datos personales:
   - personas jurídicas privadas → RUES `c82u-588k` (`estado_matricula = ACTIVA`, renovación del año actual o el anterior);
   - entidades públicas → CHIP `5c7g-ptic` (NIT presente en los dos últimos cortes).
   El resultado es una **comprobación auxiliar de la entidad**: no prueba que la persona pertenezca a ella.
4. **La vinculación de la persona** se prueba con evidencia documental revisada por una persona (comprobación 1). Además se exige un canal independiente (comprobación 2): el control de un buzón del dominio institucional, o una confirmación de la institución por un canal oficial registrada por **otra** persona del equipo.
5. Se recomienda usar un token de aplicación de datos.gov.co (`X-App-Token`) en producción para no compartir el cupo por IP.

## Pendientes externos

- Convenio con la Registraduría (ANI) si el negocio quiere validar la cédula de forma automática.
- Certificados o listados vigentes de Supervigilancia (licencias) y de la DNBC (cuerpos de bomberos).
- Revisión jurídica del tratamiento (ver [TRATAMIENTO_DATOS_PERSONALES.md](TRATAMIENTO_DATOS_PERSONALES.md)).
