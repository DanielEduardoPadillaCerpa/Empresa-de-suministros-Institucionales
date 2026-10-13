# Matriz de elegibilidad de productos — Suministros Institucionales

> **Aviso.** Esta clasificación es una **propuesta operativa** basada en la investigación documental de [`MATRIZ_NORMATIVA_COLOMBIA.md`](./MATRIZ_NORMATIVA_COLOMBIA.md), consultada el 2026-10-13. **No es asesoría jurídica.** Donde no se confirmó un requisito legal se recomienda una **política preventiva** (marcada como `POLÍTICA`), que bloquea solo la venta de lo sensible sin frenar los productos de uso general. Un abogado debe validar la lista antes de aprobar (`revision_legal = aprobada`) cualquier artículo restringido.

**Fuentes del catálogo analizadas:** `backend/src/db.js` (`PRODUCTOS_SEED`: 47 productos sin institución, en la práctica el catálogo táctico y policial; `PRODUCTOS_INSTITUCIONALES_SEED` y `PRODUCTOS_INSTITUCIONALES_ADICIONALES_SEED`) y `docs/catalogo-institucionales-referencias.csv` (523 referencias: bomberos 154, corporativo 88, defensa 88, penitenciario 97, socorro y Defensa Civil 96).

## 1. Reglas generales del modelo

| Regla | Valor recomendado | Base |
|---|---|---|
| Ver precios y comprar | Solo `estado_verificacion = aprobado` | POLÍTICA (control de identidad institucional) |
| Producto `restringido = true` | Exige además la **autorización de restringidos** por cuenta, otorgada por el administrador de cumplimiento, con documento soporte y fecha de vencimiento | POLÍTICA; en uniformes, la base legal es el CP art. 346 |
| `revision_legal = pendiente` o `bloqueada` | **No se puede vender** (ni agregar al carrito ni cotizar); el producto se muestra como "disponible solo bajo verificación" | POLÍTICA preventiva |
| `revision_legal = aprobada` | Solo después de un concepto escrito del abogado o de que se registre el permiso o certificado (INVIMA, Supervigilancia, autoridad de uniformes) en la ficha del producto | POLÍTICA |
| Compradores públicos (policia, defensa, penitenciario, bomberos oficiales) | El pedido es una **solicitud de cotización**; solo se confirma con el número del proceso SECOP, la orden de compra TVEC o la aceptación de la oferta | Ley 1150 art. 2; Decreto 1082 de 2015, art. 2.2.1.2.1.2.7 |
| Productos de uso general | `restringido = false`, `revision_legal = no_requerida`, `institucion_id = general` o la vertical, con elegibilidad amplia | — |
| Antecedentes judiciales | **Nunca** son requisito para aprobar ni para autorizar restringidos | D-L 19 de 2012, art. 93 |

### Documentos base por tipo de comprador

| tipo_institucion | Documentos mínimos (registro) | Documentos adicionales para restringidos |
|---|---|---|
| `policia` | Certificado laboral o acto de designación; correo `@policia.gov.co` (verificar dominio) | Oficio de la unidad compradora que identifique la necesidad; número de proceso o de orden |
| `defensa` | Certificado laboral o acto de designación; correo institucional (`.mil.co` / `.gov.co`) | Igual que policía |
| `penitenciario` | Certificado laboral o acto de designación INPEC/USPEC/establecimiento | Igual; para prendas de custodia, el oficio de la dependencia de dotación |
| `bomberos` | Oficial: acto de designación. Voluntario: personería jurídica o certificado de existencia y representación, y RUT. Aeronáutico: certificado de existencia y representación del explotador | Certificado de la junta departamental (si existe) para prendas con emblema |
| `socorro` | Certificado de existencia y representación o acto de creación, y RUT; designación | — (no se proponen restringidos propios) |
| `corporativo` | Certificado de existencia y representación, RUT y autorización del representante legal | **Seguridad privada:** licencia de funcionamiento de la Supervigilancia vigente (número, resolución, modalidad y fecha de vencimiento) |

---

## 2. Clases de producto

### C1. Uso general (oficina, archivo, papelería, comunicaciones básicas)

| Campo | Recomendación |
|---|---|
| Ejemplos reales | Resma de papel tamaño carta; Carpetas y cajas de archivo; Kit de escritura y papelería; Pizarra de coordinación para puesto de mando; Teléfono IP de escritorio; Diadema para atención telefónica; Megáfono portátil para evacuación; Radio portátil para coordinación; Libro de registro de novedades |
| Compradores elegibles | Todos |
| Evidencia | Solo la cuenta aprobada |
| Permisos a verificar | Ninguno. Radios: **no verificado** si el comprador necesita un permiso de espectro (es su responsabilidad; avisarlo en la ficha) |
| Quién autoriza | No aplica |
| Valores | `restringido=false` · `revision_legal=no_requerida` · `institucion_id=general` (o la vertical) + elegibles: todas |

### C2. Herramientas y suministros operativos

| Campo | Recomendación |
|---|---|
| Ejemplos reales | Hacha plana de bombero; Barreta Halligan para apertura y rescate; Martillo de emergencia con rompevidrios; Navaja de rescate; Herramienta multifunción táctica; Pala plegable de campaña; Motosierra para brigada forestal; Pértiga dieléctrica de rescate; Kit de anclajes MOLLE; Morral de campaña modular; Cantimplora de campaña; Binoculares para observación de campo; GPS portátil para navegación de campo |
| Compradores elegibles | Todos, según la vertical (las herramientas forestales y de rescate interesan sobre todo a bomberos y socorro, pero no hay razón legal para excluir a otros) |
| Evidencia | Cuenta aprobada |
| Permisos | Ninguno identificado |
| Valores | `restringido=false` · `revision_legal=no_requerida` · elegibles: vertical principal + `corporativo` + `socorro` |

### C3. Elementos de protección personal (EPP)

| Campo | Recomendación |
|---|---|
| Ejemplos reales | Guantes anticorte y antipinchazo; Gafas tácticas de protección; Casco de seguridad industrial para obra; Arnés para trabajo seguro en alturas; Línea de vida y accesorios certificados; Respirador reutilizable para mantenimiento; Protección auditiva tipo copa; Chaquetón estructural para bombero; Equipo de respiración autónoma para bombero; Traje de protección química encapsulado; Botas con puntera de protección para taller; Chaleco de alta visibilidad; **Gafas de protección balística para servicio** (protección ocular contra impacto: no es blindaje corporal) |
| Compradores elegibles | Todos |
| Evidencia | Cuenta aprobada |
| Permisos | Ninguno para el comprador. El vendedor debe tener **ficha técnica y certificado de norma** (EN/ANSI/NFPA/NTC) en la ficha (BUENA PRÁCTICA; el empleador debe dar EPP "que cumplan las disposiciones legales", según el D.1072 art. 2.2.4.6.24, texto no verificado en fuente primaria) |
| Valores | `restringido=false` · `revision_legal=no_requerida` · elegibles: todas |

### C4. Emergencia, rescate y primeros auxilios no regulados

| Campo | Recomendación |
|---|---|
| Ejemplos reales | Manguera de ataque contra incendios; Boquilla de niebla para manguera; Escalera de extensión para bomberos; Cuerda semiestática para rescate vertical; Trípode para rescate en espacios confinados; Detector portátil multigás para espacios confinados; Cámara termográfica para búsqueda y rescate; Motobomba portátil para inundaciones; Camilla tipo canastilla para rescate; Manta térmica para atención de víctimas; Cono vial reflectivo; Cinta de señalización para acordonamiento; Extintor portátil para vehículo de respuesta |
| Compradores elegibles | Todos |
| Valores | `restringido=false` · `revision_legal=no_requerida` · elegibles: todas |

### C4-bis. Dispositivos médicos (registro sanitario INVIMA)

| Campo | Recomendación |
|---|---|
| Ejemplos reales | Desfibrilador externo automático (y sus variantes "para sede" y "para respuesta"); Tensiómetro digital para enfermería; Estetoscopio para atención primaria; Kit de oxigenoterapia portátil; Kit de oxígeno portátil para brigada; Torniquete táctico (tipo CAT); Agente hemostático (gasa); Parche torácico oclusivo; Inmovilizador cervical para atención prehospitalaria |
| Compradores elegibles | Todos (no hay una restricción por comprador identificada) |
| Evidencia | Del **producto**, no del comprador: número de registro sanitario o permiso de comercialización INVIMA vigente (D. 4725 de 2005; artículo exacto no verificado) |
| Quién autoriza | El administrador de catálogo registra el número INVIMA y luego el de cumplimiento aprueba |
| Valores | `restringido=false` · `revision_legal=pendiente` **solo hasta registrar el número INVIMA** → `aprobada` · elegibles: todas. Oxígeno: régimen como gas medicinal **no verificado** (consultar) |

### C5. Uniformes y prendas institucionales

Se distinguen dos grupos:

| Subclase | Ejemplos reales | Criterio |
|---|---|---|
| **C5a. Prenda genérica** (sin camuflado ni patrón ni distintivos oficiales) | Camiseta interior de dotación; Botas de campaña; Botas tácticas antideslizantes; Chaqueta térmica para clima frío; Polo técnico antibacterial; Pantalón táctico de dotación; Cinturón interior/exterior de dotación; Uniforme de servicio para personal administrativo (corporativo) | `restringido=false` · `revision_legal=no_requerida` · elegibles: vertical + `corporativo`. Condición: la ficha debe decir "sin distintivos institucionales" |
| **C5b. Prenda con diseño reglamentario, camuflado o patrón de la Fuerza Pública o de organismos de seguridad** | Uniforme operativo — tela ripstop ("reglamentario"); Uniforme de campaña institucional; Uniforme de campaña para clima cálido; Uniforme de campaña para clima frío; Camisa de campaña de manga larga; Pantalón de campaña reforzado; Gorra de campaña institucional; Chaqueta impermeable de campaña; Impermeable de campaña de dos piezas; Uniforme de servicio para personal de custodia; Uniforme de servicio institucional (penitenciario) | CP art. 346: vender o suministrar prendas "reales, similares o semejantes" de uso privativo **sin permiso de autoridad competente** es delito; D.356 art. 103 par. 2 lo prohíbe a almacenes e industrias. **El permiso del vendedor no está verificado** |

| Campo (C5b) | Recomendación |
|---|---|
| Compradores elegibles | Solo la institución dueña del uniforme: `defensa` para el camuflado de campaña; `policia` para el uniforme reglamentario policial; `penitenciario` para la custodia (INPEC: **no verificado** si aplica el art. 346; se aplica la política igual). **Nunca** `corporativo` ni `socorro` |
| Evidencia | Del comprador: designación del funcionario de dotación y oficio o especificación técnica de la entidad. **Del vendedor**: permiso o contrato de la autoridad competente (pendiente de identificar) |
| Quién autoriza | El administrador de cumplimiento (autorización de restringidos), una vez el abogado confirme la habilitación del vendedor |
| Valores | `restringido=true` · `revision_legal=pendiente` (pasa a `aprobada` solo con el permiso del vendedor documentado) · `institucion_id` = vertical dueña · sin elegibles extra |

### C6. Insignias, emblemas y medios de identificación

| Campo | Recomendación |
|---|---|
| Ejemplos reales | Kit de sellos institucionales ("con escudo de la unidad"); Talonario de comparendos (x50) ("formato oficial vigente"); Chaleco de identificación para puesto de mando (socorro); prendas con emblema de bomberos (no hay un producto específico en la semilla) |
| Base | CP art. 346 ("insignias o medios de identificación"); Ley 1575 art. 4 par. 2 y art. 38 (emblemas de bomberos, uso exclusivo). Los formatos oficiales (comparendos) **no se verificaron**: riesgo de uso indebido de un documento público |
| Compradores elegibles | Solo la entidad titular del escudo o formato, y solo con un oficio que autorice la personalización |
| Valores | Sellos con escudo y talonario de comparendos: `restringido=true` · `revision_legal=pendiente` · `institucion_id=policia` (comparendos) o la vertical. El chaleco de identificación genérico de socorro (sin emblema oficial): `restringido=false` |

### C7. Artículos sujetos a autorización (táctico, contención y balístico)

| Producto real | Motivo | Compradores elegibles | Evidencia y permiso | restringido | revision_legal |
|---|---|---|---|---|---|
| Chaleco balístico y anticuchillo | Blindaje; D.356 art. 80 (uso por vigilancia autorizado por la Supervigilancia); comercialización **no verificada** | policia, defensa, penitenciario; corporativo **solo** como vigilancia con licencia de la Supervigilancia | Proceso o orden pública; licencia de la Supervigilancia y autorización de blindaje | true | **pendiente** |
| Placas balísticas traumáticas | Igual | Igual | Igual | true | **pendiente** |
| Chaleco portaequipo modular | Táctico; "chalecos" figuran en una lista de bienes de uso privativo (D.695/1983, citado por la DIAN en un contexto tributario); compatible con placas | policia, defensa, penitenciario; corporativo-vigilancia | Igual | true | **pendiente** |
| Linterna operativa recargable ("montaje compatible con arma larga") | Posible "accesorio" de arma (D.2535 arts. 1 y 3); no es una mira del art. 15 | policia, defensa | Proceso público | true | **pendiente** (o vender la versión sin montaje para arma como C4) |
| Funda de pistola nivel III; Portacargadores dobles | Accesorios de porte de arma; régimen **no verificado** | policia, defensa, penitenciario, corporativo-vigilancia | Licencia de la Supervigilancia o proceso público | true | no_requerida (POLÍTICA) |
| Grilletes metálicos de bisagra; Lazos de retención plásticos (x50); Portagrilletes técnico; Llave universal de grilletes | Elementos de retención; posible "elemento ofensivo" del D.356 art. 53 num. 5 (**no verificado**) | policia, defensa, penitenciario; corporativo-vigilancia | Igual | true | **pendiente** para grilletes y lazos; no_requerida para el portagrilletes; la llave universal pasa a `true` (riesgo de fuga) |
| Tahalí portadefensa | Accesorio para defensa o bastón (las armas menos letales tienen su propio régimen: Ley 2197 y D.1563 de 2022, **no analizado**) | policia, penitenciario, corporativo-vigilancia | Igual | true | no_requerida |
| Casco de protección urbana (visera antidisturbios) | Equipo de control de multitudes | policia, defensa, penitenciario | Proceso público | true | no_requerida (POLÍTICA) |
| Cizalla portátil de apertura forzada ("entradas tácticas") | Uso de autoridad; posible "elemento ofensivo" (no verificado) | policia, defensa | Proceso público | true | no_requerida (POLÍTICA). Las cizallas de **rescate vehicular** de bomberos y socorro son C2 (`false`) |
| Cámara corporal (Bodycam); Baliza de localización GPS | Posibles "equipos de visión o escucha remotos" (D.356 art. 53 num. 2, **no verificado**); tratamiento de datos a cargo del comprador | policia, defensa, penitenciario, corporativo | Cuenta aprobada | false | **pendiente** hasta que el abogado confirme si el vendedor debe registrarse ante la Supervigilancia (art. 52) |

### C8. Régimen por confirmar (metrología, reactivos, telecomunicaciones)

| Producto real | Norma probable | Valores |
|---|---|---|
| Alcoholímetro digital evidencial | Res. SIC 88919 de 2017 (alcohosensores, vigencia no confirmada) | `restringido=true` (uso de autoridad de tránsito o policía) · `revision_legal=pendiente` · elegibles: policia (y entidades de tránsito si se crean) |
| Cinemómetro láser de tránsito | Metrología legal SIC (**no verificado**) | `restringido=true` · `pendiente` · policia |
| Kit de detección de drogas (salival) | D. 3770 de 2004 (reactivos IVD, INVIMA) | `restringido=true` · `pendiente` · policia, defensa, penitenciario |
| Sonómetro digital | Ninguna identificada | `false` · `no_requerida` · todas |
| Radio portátil digital (TETRA) ("con encriptación") | Homologación y espectro MinTIC/CRC (**no verificado**) | `false` · `no_requerida`; ficha con la advertencia "el comprador debe contar con los permisos de espectro" |
| Kit de revelado de huellas; Linterna forense UV (Luz de Wood); Kit de bolsas de evidencia; Testigos métricos numerados; Kit de recolección de ADN | Ninguna identificada; uso de policía judicial | `false` · `no_requerida` · elegibles: policia, defensa + corporativo (laboratorios). Opcional como POLÍTICA: limitar a autoridades |

---

## 3. Lista para aplicar (nombres exactos del catálogo)

### 3.1 Marcar `restringido = true` y `revision_legal = pendiente`

Se justifican por una norma con texto verificado cuya aplicación o permiso no está confirmado (CP 346, D.356, D.2535) o por un régimen sanitario o metrológico sin evidencia en la ficha:

```
Chaleco balístico y anticuchillo
Placas balísticas traumáticas
Chaleco portaequipo modular
Linterna operativa recargable            (solo la de PRODUCTOS_SEED con "montaje compatible con arma larga")
Grilletes metálicos de bisagra
Lazos de retención plásticos (x50)
Uniforme operativo — tela ripstop
Uniforme de campaña institucional
Uniforme de campaña para clima cálido
Uniforme de campaña para clima frío
Camisa de campaña de manga larga
Pantalón de campaña reforzado
Gorra de campaña institucional
Chaqueta impermeable de campaña
Impermeable de campaña de dos piezas
Uniforme de servicio para personal de custodia
Uniforme de servicio institucional        (vertical penitenciario)
Kit de sellos institucionales
Talonario de comparendos (x50)
Alcoholímetro digital evidencial
Cinemómetro láser de tránsito
Kit de detección de drogas (salival)
```

> Atención: hay varios productos llamados "Linterna operativa recargable" y muchas fichas reutilizan esa imagen. Aplique el cambio por **id** al registro de `PRODUCTOS_SEED` (categoría "Equipo táctico"), no a todas las linternas.

### 3.2 Marcar `restringido = true` con `revision_legal = no_requerida` (POLÍTICA, sin bloqueo legal)

```
Funda de pistola nivel III
Portacargadores dobles
Portagrilletes técnico
Tahalí portadefensa
Casco de protección urbana
Cizalla portátil de apertura forzada
Llave universal de grilletes              (hoy está en false en la semilla)
```

### 3.3 Mantener `restringido = false` con `revision_legal = pendiente` solo hasta registrar el número INVIMA

```
Desfibrilador externo automático
Desfibrilador externo automático para sede
Desfibrilador externo automático para respuesta
Kit de oxigenoterapia portátil
Kit de oxígeno portátil para brigada
Tensiómetro digital para enfermería
```

(El resto de los dispositivos médicos de C4-bis se puede dejar en `no_requerida` y registrar el número INVIMA a medida que se cargue la ficha; si el negocio prefiere un control total, aplíqueles la misma regla.)

### 3.4 Pendientes de concepto (sin bloqueo de compra recomendado por ahora)

`Cámara corporal (Bodycam)` y `Baliza de localización GPS`: `restringido=false`. Pasarlos a `revision_legal=pendiente` **solo** si el abogado concluye que el D.356 arts. 52-57 aplica al vendedor.

---

## 4. Flujo recomendado de aprobación de un restringido

1. La cuenta está en `aprobado` y su `tipo_institucion` está entre los elegibles del producto.
2. El comprador solicita la autorización de restringidos y sube el soporte (designación u oficio; licencia de la Supervigilancia si es corporativo-vigilancia).
3. El administrador de cumplimiento verifica (dominio del correo, NIT con DV en el RUES o el RUT, vigencia de la licencia) y otorga la autorización con `vence_en` y el alcance (lista de clases: `balistico`, `uniformes`, `retencion`, `metrologia`).
4. El producto debe tener `revision_legal = aprobada`. Si sigue `pendiente`, la compra se bloquea aunque el comprador tenga autorización.
5. Si es una entidad pública, el pedido queda como cotización hasta que se registre el número SECOP o TVEC.
6. Guardar en la bitácora: quién autorizó, qué documento revisó (hash), cuándo y hasta cuándo. Conservar 10 años (Ley 962 de 2005, art. 28).
