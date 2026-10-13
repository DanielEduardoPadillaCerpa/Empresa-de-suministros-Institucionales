# Matriz normativa — Suministros Institucionales (Colombia)

> **Aviso importante.** Este documento es **investigación documental**, no asesoría jurídica. Resume normas consultadas en fuentes oficiales o de amplio uso el **2026-10-13** y las traduce a requisitos técnicos de la plataforma. Antes de vender artículos restringidos, publicar políticas legales o contratar con entidades públicas, un **abogado colombiano** (idealmente con experiencia en contratación estatal, seguridad privada y protección de datos) debe validar estas conclusiones. Las vigencias se verificaron según la fecha de actualización de cada página; pudo haber cambios posteriores.

**Fecha de consulta de todas las fuentes:** 2026-10-13.
**Fuente principal:** Secretaría General del Senado, base documental "Leyes desde 1992 - Vigencia expresa y control de constitucionalidad" (las páginas consultadas dicen *"Última actualización: 30 de septiembre de 2026 – Diario Oficial No. 53.636"*). La versión HTTPS del sitio rechazó la conexión; se consultó por HTTP con la misma ruta. Los decretos únicos reglamentarios se consultaron en el Gestor Normativo de Función Pública.

## Convenciones

| Campo | Significado |
|---|---|
| **Tipo** | `OBLIGACIÓN LEGAL` (la norma lo exige expresamente) · `BUENA PRÁCTICA` (no se exige, pero reduce el riesgo o facilita probar el cumplimiento) · `POLÍTICA COMERCIAL` (decisión preventiva propia de la empresa) |
| **Certeza** | Alto = texto oficial leído y aplicable de forma directa · Medio = texto leído, pero su aplicación al caso es interpretable, o solo hubo fuente secundaria · Bajo = no se confirmó el texto ni el alcance |
| **Modelo** | `estado_verificacion`, `tipo_institucion`, `productos.institucion_id` + instituciones elegibles, `productos.restringido`, autorización de restringidos por cuenta, `productos.revision_legal` (`no_requerida`/`pendiente`/`aprobada`/`bloqueada`) |

---

## 1. Protección de datos personales

### 1.1 Autorización, deber de informar y prueba

| Campo | Detalle |
|---|---|
| Norma | Ley 1581 de 2012, arts. 4, 9, 12 y 17; Decreto 1377 de 2013, arts. 4, 5, 7 y 8 (compilado en el Decreto 1074 de 2015, Parte 2, Título 2, **Capítulo 25**, arts. 2.2.2.25.x) |
| Fuente | http://www.secretariasenado.gov.co/senado/basedoc/ley_1581_2012.html · https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=53646 · https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=76608 (Cap. 25 confirmado) |
| Vigencia | Vigente (Senado, actualizado al 30-09-2026). Según Función Pública, el Decreto 1377 fue derogado parcialmente por el Decreto 1081 de 2015, y su contenido está compilado en el Decreto 1074 de 2015 |
| Obligación | Pedir la autorización **previa, expresa e informada** del titular por un medio que pueda consultarse después (art. 9). Al pedirla, informar la finalidad, el carácter facultativo de las respuestas sobre datos sensibles, los derechos del titular y la identificación y contacto del responsable (art. 12). Guardar copia de la autorización (art. 17 lit. b; D.1377 art. 8). Recoger solo los datos pertinentes y adecuados para la finalidad (D.1377 art. 4) |
| Afecta | Registro de todas las cuentas (datos del funcionario: nombre, cargo, correo, teléfono y documentos) |
| Evidencia que debe conservarse | Versión del texto de autorización y de la política aceptada, fecha y hora, IP o agente de usuario, id de usuario y casillas marcadas |
| Consecuencia técnica | Tabla `consentimientos` (usuario, tipo, versión del texto, hash, timestamp, ip). Bloquear el envío del registro (`borrador`→`pendiente`) si falta la autorización general. No hacer obligatorios campos que no se necesitan |
| Tipo / certeza / abogado | OBLIGACIÓN LEGAL · Alto · Sí, para redactar los textos |

### 1.2 Datos sensibles y antecedentes judiciales

| Campo | Detalle |
|---|---|
| Norma | Ley 1581 arts. 5 y 6; Decreto 1377 art. 6; **Decreto-Ley 19 de 2012, arts. 93 y 94** |
| Fuente | Ley 1581 (Senado, URL arriba) · http://www.secretariasenado.gov.co/senado/basedoc/decreto_0019_2012_pr002.html |
| Vigencia | Vigentes (Senado, 30-09-2026) |
| Obligación | Los datos sensibles (art. 5: origen racial, opinión política, salud, biométricos, etc.) solo pueden tratarse con **autorización explícita** (art. 6 lit. a). El titular debe saber que no está obligado a darlos, y ninguna actividad puede condicionarse a que los entregue (D.1377 art. 6). **El D-L 19/2012 art. 93 suprimió el certificado judicial: *"ninguna persona está obligada a presentar un documento que certifique sus antecedentes judiciales para trámites con entidades de derecho público o privado"*. El art. 94 permite que los particulares los consulten en línea** |
| Afecta | Campo opcional "número de consulta de antecedentes"; cualquier foto de documento de identidad con datos biométricos |
| Evidencia que debe conservarse | Consentimiento separado y específico para ese dato, con su fecha; registro de quién lo consultó |
| Consecuencia técnica | El campo debe ser **siempre opcional**, con una casilla de consentimiento aparte y sin marcar por defecto. **No se puede exigir para aprobar** la cuenta ni para vender restringidos (si se quiere verificar antecedentes, que lo haga el administrador de cumplimiento en la consulta en línea de la Policía, dejando constancia). Cifrar el campo y restringir su acceso al rol de cumplimiento |
| Tipo / certeza / abogado | OBLIGACIÓN LEGAL (opcionalidad y no condicionamiento) · Alto para el D-L 19 art. 93. **No verificado** si los antecedentes judiciales son "dato sensible" en sentido estricto según el art. 5; se recomienda tratarlos con el estándar reforzado · Sí |

### 1.3 Política de tratamiento, aviso de privacidad y derechos

| Campo | Detalle |
|---|---|
| Norma | Ley 1581 art. 17 (deberes); D.1377 arts. 13 (políticas), 14 y 15 (aviso de privacidad, contenido mínimo), 16 (conservar el modelo del aviso), 23 (persona o área responsable de atender los derechos), 26 y 27 (responsabilidad demostrada) |
| Fuente | Las del punto 1.1 |
| Vigencia | Vigentes |
| Obligación | Publicar una política de tratamiento; mostrar un aviso de privacidad cuando no se pueda poner la política a disposición; guardar el modelo del aviso; designar a un responsable de las consultas y reclamos; ser capaz de demostrar a la SIC las medidas adoptadas |
| Afecta | Toda la operación |
| Evidencia que debe conservarse | Versiones fechadas de la política y del aviso; bitácora de consultas y reclamos de titulares con sus fechas de respuesta |
| Consecuencia técnica | Página `/privacidad` versionada; enlace en el registro y en el pie de página; formulario de solicitudes del titular (acceso, rectificación, supresión, revocatoria) con número de radicado |
| Tipo / certeza / abogado | OBLIGACIÓN LEGAL · Alto · Sí |

### 1.4 Seguridad, Registro Nacional de Bases de Datos (RNBD) y transferencias

| Campo | Detalle |
|---|---|
| Norma | Ley 1581 art. 4 lit. g (seguridad), art. 25 (RNBD) y art. 26 (transferencia internacional); Decreto 1074 de 2015, art. 2.2.2.26.1.2 (quiénes deben inscribirse); D.1377 arts. 24 y 25 (transmisión y contrato con encargados) |
| Fuente | Ley 1581 (Senado) · Decreto 1074 en Función Pública (i=76608) |
| Vigencia | Vigentes |
| Obligación | Aplicar medidas técnicas, humanas y administrativas de seguridad. **Inscribir las bases en el RNBD solo si** el responsable es una sociedad o entidad sin ánimo de lucro con **activos totales superiores a 100.000 UVT** o una persona jurídica de naturaleza pública (art. 2.2.2.26.1.2). Antes de transferir datos a países sin un nivel adecuado de protección se necesita autorización expresa u otra excepción (art. 26). Si el hosting está en el exterior, se trata de una **transmisión** y exige un contrato con el encargado (D.1377 art. 25) |
| Afecta | La infraestructura (hosting, correo, almacenamiento de documentos) |
| Evidencia que debe conservarse | Constancia de inscripción en el RNBD (si aplica), contratos con encargados y matriz de controles de seguridad |
| Consecuencia técnica | Cifrar en reposo los documentos subidos; controlar el acceso por rol; registrar accesos en una bitácora; definir plazos de retención |
| Tipo / certeza / abogado | OBLIGACIÓN LEGAL · Alto (norma) / Medio (si la empresa supera el umbral depende de sus activos) · Sí |

---

## 2. Protección al consumidor y comercio electrónico (Ley 1480 de 2011)

### 2.1 ¿Aplica a ventas B2B y B2G?

| Campo | Detalle |
|---|---|
| Norma | Ley 1480 art. 2 (objeto: *"relaciones de consumo"*) y art. 5 num. 3 (consumidor: *"toda persona natural o jurídica que, como destinatario final, adquiera… para la satisfacción de una necesidad propia, privada, familiar o doméstica y empresarial cuando no esté ligada intrínsecamente a su actividad económica"*) |
| Fuente | http://www.secretariasenado.gov.co/senado/basedoc/ley_1480_2011.html |
| Vigencia | Vigente, con las modificaciones de la Ley 2439 de 2024 (D.O. 52.975 del 19-12-2024) |
| Análisis | **Depende del caso.** (a) Una empresa que compra dotación o EPP para su propio uso (no para revender) y cuya actividad no está ligada intrínsecamente a esos bienes **puede ser consumidora**: por ejemplo, una clínica que compra un DEA para su sede. (b) Una empresa que revende o que usa el bien como insumo de su actividad principal (por ejemplo, una empresa de seguridad que compra grilletes) probablemente no lo es. (c) Las **entidades estatales** compran mediante un contrato estatal regido por la Ley 80 de 1993 y la Ley 1150 de 2007. **No se verificó** doctrina de la SIC que defina si una entidad pública puede ser consumidora |
| Consecuencia técnica | Para no depender de esa calificación caso a caso: **aplicar el art. 50 a todos los compradores** (BUENA PRÁCTICA) y mostrar textos de retracto y garantía orientados a consumidores solo a `tipo_institucion = corporativo` |
| Tipo / certeza / abogado | Interpretación · **Medio** · **Sí** |

### 2.2 Deberes del proveedor en línea (art. 50, literales b, g y h modificados por la Ley 2439 de 2024)

| Campo | Detalle |
|---|---|
| Norma | Ley 1480 arts. 49, 50, 51 (reversión del pago) y 47 (retracto, modificado por la Ley 2439 de 2024, art. 3) |
| Fuente | http://www.secretariasenado.gov.co/senado/basedoc/ley_1480_2011_pr001.html · http://www.secretariasenado.gov.co/senado/basedoc/ley_2439_2024.html |
| Obligación (si aplica) | a) Mostrar permanentemente la razón social, el **NIT**, la dirección de notificación judicial, el teléfono y el correo. b) Dar información veraz y suficiente del producto, incluidas sus **restricciones de uso**, el plazo de validez de la oferta y la disponibilidad. c) Indicar los medios de pago, el tiempo de entrega, el retracto y el **precio total con impuestos** y el envío por separado. d) Publicar las condiciones generales del contrato; mostrar un **resumen del pedido antes de confirmar**; que la aceptación sea **expresa, inequívoca y verificable**; enviar **acuse de recibo a más tardar al día calendario siguiente**. e) **Conservar en soporte duradero la prueba de la relación comercial** (identidad, voluntad, pago y entrega) *"por el mismo tiempo que se deben guardar los documentos de comercio"*. f) Contar con seguridad en las transacciones. g) Ofrecer un canal de PQR con radicado, fecha y hora. h) Entregar en el plazo pactado o, si no se pactó, en máximo 30 días calendario. Parágrafo: incluir un enlace visible a la SIC. Retracto: 5 días hábiles en ventas a distancia (art. 47) |
| Evidencia que debe conservarse | Captura o versión de la ficha y el precio al momento de la compra; resumen aceptado; acuse enviado; comprobante de pago y de entrega; PQR |
| Consecuencia técnica | La tabla `pedidos` guarda una copia inmutable del precio, la descripción y la versión de los términos; paso de confirmación explícita; correo de acuse automático; módulo de PQR con radicado; pie de página con NIT y enlace a la SIC |
| Tipo / certeza / abogado | OBLIGACIÓN LEGAL frente a consumidores; BUENA PRÁCTICA frente a entidades · Alto (texto) / Medio (aplicación) · Sí, para redactar los términos |

### 2.3 Garantía legal

| Campo | Detalle |
|---|---|
| Norma | Ley 1480 arts. 7 y 8 (garantía legal; a falta de término fijado, **1 año para productos nuevos**) |
| Fuente | http://www.secretariasenado.gov.co/senado/basedoc/ley_1480_2011.html |
| Obligación | Responder por la calidad, idoneidad y seguridad del producto (frente a consumidores). En las ventas B2B y B2G rigen las condiciones del contrato o de la orden de compra. El régimen del Código de Comercio para la garantía comercial **no se verificó** en esta consulta |
| Consecuencia técnica | Campo `garantia_meses` y `ficha_tecnica_url` por producto; mostrarlos en la ficha y en el pedido |
| Tipo / certeza / abogado | OBLIGACIÓN LEGAL (consumidor) · Alto / Medio · Opcional |

---

## 3. Mensajes de datos, aceptación electrónica y firma

| Campo | Detalle |
|---|---|
| Norma | Ley 527 de 1999: art. 5 (validez jurídica), 6 (escrito), 7 (firma), 8 y 9 (original e integridad), 10 y 11 (valor como prueba), 12 (conservación), 14 (formación del contrato por mensaje de datos). Decreto 2364 de 2012, compilado en el Decreto 1074 de 2015, **Capítulo 47** (firma electrónica, art. 2.2.2.47.1 y ss.) |
| Fuente | http://www.secretariasenado.gov.co/senado/basedoc/ley_0527_1999.html · Decreto 1074, Función Pública (i=76608) |
| Vigencia | Vigentes (algunos artículos sobre entidades de certificación fueron modificados por el Decreto 19 de 2012) |
| Obligación | No es una obligación de la plataforma, pero es el fundamento para que la **aceptación en línea** (clic en "acepto", confirmación del pedido o de la autorización) tenga valor jurídico y probatorio. Para conservar mensajes de datos, la información debe seguir siendo accesible, conservar su formato e indicar su origen, destino, fecha y hora (art. 12) |
| Evidencia que debe conservarse | Bitácora de aceptaciones con su sello de tiempo, hash del documento aceptado, usuario autenticado y método de autenticación |
| Consecuencia técnica | Bitácora de eventos de solo escritura (*append-only*); hash SHA-256 de los PDF subidos y de los términos aceptados; las cuentas aprobadas usan un correo institucional verificado (mecanismo de firma electrónica simple acordado en los términos) |
| Tipo / certeza / abogado | BUENA PRÁCTICA con base legal · Alto · No (salvo que se quiera firma digital certificada) |

---

## 4. Contratación estatal (compradores públicos)

| Campo | Detalle |
|---|---|
| Norma | Ley 80 de 1993: art. 2 (entidades estatales), arts. 39 y 41 (contrato por escrito, perfeccionamiento). Ley 1150 de 2007, art. 2: num. 2 lit. a (bienes de características técnicas uniformes → subasta inversa o **acuerdos marco**), lit. j (bienes no uniformes por acuerdo marco, Ley 2195 de 2022), num. 4 lit. d (contratación directa en el **sector Defensa** cuando se necesita reserva), num. 5 (**mínima cuantía**, modificado por la Ley 2069 de 2020: invitación pública de al menos 1 día hábil, se elige el menor precio y la aceptación junto con la oferta constituye el contrato); art. 16 (entidades exceptuadas del sector Defensa). Decreto 1082 de 2015: art. 2.2.1.2.1.2.7 (las entidades sometidas al Estatuto **están obligadas** a comprar mediante los Acuerdos Marco de Colombia Compra Eficiente, con implementación gradual por la **Tienda Virtual del Estado Colombiano – TVEC**); art. 2.2.1.2.1.5.2 (procedimiento de mínima cuantía) y 2.2.1.2.1.5.3 (compras en "grandes almacenes") |
| Fuente | http://www.secretariasenado.gov.co/senado/basedoc/ley_0080_1993.html · http://www.secretariasenado.gov.co/senado/basedoc/ley_1150_2007.html · https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=77653 |
| Vigencia | Vigentes con sus modificaciones (Senado, 30-09-2026; Función Pública, consulta del 13-10-2026) |
| Obligación / implicación | **La tienda privada no reemplaza el proceso de contratación.** Una entidad pública (Policía, Mindefensa, INPEC/USPEC, bomberos oficiales, alcaldías) solo puede obligarse mediante la modalidad que corresponda: acuerdo marco o TVEC si el bien está en el catálogo, mínima cuantía publicada en el SECOP, selección abreviada, etc. Un "pedido" hecho en la plataforma por un funcionario **no es un contrato estatal**; a lo sumo sirve como **solicitud de cotización** o como oferta para responder a una invitación del SECOP. Excepciones: los bomberos voluntarios, la Cruz Roja y otras ESAL **no son entidades estatales** (salvo que manejen recursos públicos con reglas propias, lo cual no se verificó), y algunas entidades de Defensa tienen régimen exceptuado (art. 16) |
| Evidencia que debe conservarse | Número del proceso SECOP o de la orden de compra TVEC, acto de aceptación de la oferta y certificado de disponibilidad presupuestal (CDP) si la entidad lo entrega |
| Consecuencia técnica | Para `tipo_institucion` ∈ {policia, defensa, penitenciario} y bomberos oficiales: el flujo de compra termina en una **"solicitud de cotización / proforma"**, no en un pago inmediato. El pedido pasa a "confirmado" solo cuando se registran el `numero_proceso_secop` o `orden_compra_tvec` y el soporte de aceptación. Campo `naturaleza_juridica` (publica / privada / ESAL) en la cuenta. Los textos no deben sugerir que la compra en la web cumple el Estatuto |
| Tipo / certeza / abogado | OBLIGACIÓN LEGAL (para la entidad compradora; para el vendedor, el riesgo es la nulidad o el no pago) · Alto · **Sí** |

---

## 5. Uniformes, insignias y prendas de uso privativo

| Campo | Detalle |
|---|---|
| Norma | **Código Penal (Ley 599 de 2000), art. 346** *"Utilización ilegal de uniformes e insignias"*: *"El que sin permiso de autoridad competente importe, fabrique, transporte, almacene, distribuya, compre, **venda, suministre**, sustraiga, porte o utilice prendas, uniformes, insignias o medios de identificación reales, **similares o semejantes** a los de uso privativo de la fuerza pública o de los organismos de seguridad del Estado, incurrirá en prisión de cuarenta y ocho (48) a ciento ocho (108) meses y multa de 66.66 a 1.500 SMLMV"*. Las penas fueron aumentadas por la Ley 890 de 2004, art. 14, y la Ley 1908 de 2018, art. 7, añadió un agravante en zonas PDET. **Decreto 356 de 1994, art. 103, parágrafo 2**: *"Los almacenes o industrias que provean uniformes, no podrán fabricar ni comercializar prendas iguales a las de la Fuerza Pública, que generen confusión en la ciudadanía…"* |
| Fuente | http://www.secretariasenado.gov.co/senado/basedoc/ley_0599_2000_pr013.html · http://www.secretariasenado.gov.co/senado/basedoc/decreto_0356_1994_pr002.html · Ley 599 en Función Pública (i=6388) |
| Vigencia | Vigente (Senado, 30-09-2026) |
| **Corrección al brief** | El texto oficial **no muestra ninguna modificación del art. 346 por la Ley 1453 de 2011**: se revisó el texto de esa ley y no menciona el art. 346. Las únicas notas de modificación son las de la Ley 890 de 2004 (penas) y la Ley 1908 de 2018 (parágrafo) |
| Obligación | Vender o suministrar uniformes, insignias o medios de identificación de la Fuerza Pública (Fuerzas Militares y Policía Nacional) **sin permiso de la autoridad competente** es un delito, y también lo es venderlos a un comprador legítimo si el vendedor no tiene ese permiso. **No se verificó** qué autoridad expide el permiso, ni el trámite, ni si existe un registro de fabricantes o proveedores autorizados (el PDF del reglamento de uniformes de la Policía no se pudo leer). Se encontró un concepto de la DIAN (062605 de 2009) que cita el Decreto 695 de 1983 con una lista de bienes "de uso privativo" (uniformes, prendas, morrales, **chalecos**, calzado), pero en un contexto **tributario** |
| Otras instituciones | **Bomberos**: Ley 1575 de 2012, art. 4 par. 2 y art. 38 (el nombre, los emblemas, las insignias y los uniformes de los bomberos no pueden ser usados por ninguna otra persona o entidad) y art. 18 par. 2 (las brigadas industriales no pueden usar esos distintivos). **INPEC**: **no verificado** si el Cuerpo de Custodia es un "organismo de seguridad del Estado" para efectos del art. 346. **Defensa Civil y Cruz Roja**: no se verificó una norma específica sobre sus emblemas en esta consulta |
| Evidencia que debe conservarse | Permiso o contrato de la autoridad competente que habilite al vendedor; orden de la entidad con su especificación; acta de entrega a un funcionario designado |
| Consecuencia técnica | Prendas con diseño, camuflado, insignias o distintivos institucionales: `restringido = true`, `revision_legal = pendiente` hasta que exista el permiso del vendedor, y solo la institución dueña del distintivo es elegible. No mostrarlas a `corporativo`. Las prendas genéricas (camiseta interior lisa, botas, chaqueta térmica sin distintivos) **no** deben bloquearse |
| Tipo / certeza / abogado | OBLIGACIÓN LEGAL (penal) · **Alto** en el texto / **Bajo** sobre el permiso y el trámite · **Sí, obligatorio** |

---

## 6. Armas, accesorios y protección balística

| Campo | Detalle |
|---|---|
| Norma | Decreto 2535 de 1993: art. 1 (ámbito: armas, municiones, explosivos **y sus accesorios**; excluye las destinadas a la Fuerza Pública), art. 2 (*"Sólo el Gobierno puede … fabricar y comercializar armas, municiones, explosivos…"*), art. 3 (los particulares necesitan permiso para poseer o portar partes, piezas y accesorios), **art. 15** (accesorios prohibidos, de uso privativo de la Fuerza Pública: *"miras infrarrojas, laséricas o de ampliación lumínica, los silenciadores…"*). Ley 1119 de 2006 (actualiza permisos y multas del D.2535; **no se encontró** ninguna mención a blindaje o chalecos). Decreto 356 de 1994, **art. 80**: la Supervigilancia *"autorizará la utilización de elementos o instalaciones blindadas para la prestación de servicios de vigilancia y seguridad privada"* |
| Fuente | http://www.secretariasenado.gov.co/senado/basedoc/decreto_2535_1993.html · http://www.secretariasenado.gov.co/senado/basedoc/ley_1119_2006.html · http://www.secretariasenado.gov.co/senado/basedoc/decreto_0356_1994_pr002.html · Resolución Supervigilancia 20224440029777 de 2022 (características técnicas del blindaje), encontrada como PDF en la Rama Judicial: `https://sidn.ramajudicial.gov.co/SIDN/NORMATIVA/TEXTOS_COMPLETOS/8_RESOLUCIONES/RESOLUCIONES 2022/SVSP Resolución 20224440029777 de 2022 (Características Técnicas de los diferentes tipos de Blindaje).pdf` (apareció en la búsqueda; **no se leyó**) |
| Vigencia | D.2535 y D.356 vigentes con modificaciones (Senado, 30-09-2026). Resolución de 2022: **no verificada** |
| Hallazgos | (1) **No se encontró ninguna norma** que clasifique los chalecos o placas balísticas como "armas" o "accesorios" del D.2535. (2) La Supervigilancia autoriza el **uso** de blindajes por los servicios de vigilancia (art. 80). **No se verificó** si existe un registro o autorización para **comercializar** blindaje personal ni para venderlo a particulares. (3) Las fuentes comerciales que afirman que el chaleco es "de uso privativo" **no citan una norma**. (4) La linterna "montaje compatible con arma larga" **no** es una mira del art. 15, pero su régimen como "accesorio" no está confirmado |
| Consecuencia técnica | Chalecos y placas balísticas: `restringido = true`, `revision_legal = pendiente` (política preventiva). Compradores: policía y defensa (con soporte de su proceso), penitenciario (custodia), y corporativo **solo** si es un servicio de vigilancia con **licencia vigente de Supervigilancia** y autorización de blindaje. Linterna con montaje en arma: `restringido = true`, `revision_legal = pendiente`. No vender armas, municiones, miras ni silenciadores (fuera del catálogo; está bien así) |
| Tipo / certeza / abogado | POLÍTICA COMERCIAL preventiva sobre una base legal incompleta · **Bajo/Medio** · **Sí, obligatorio** |

---

## 7. Seguridad privada (compradores corporativos y el propio vendedor)

| Campo | Detalle |
|---|---|
| Norma | Decreto-Ley 356 de 1994: art. 3 (los servicios solo se prestan con **licencia o credencial de la Supervigilancia**); art. 4 num. 7 y art. 2 (incluyen la *"fabricación, instalación, comercialización y utilización de equipos para vigilancia y seguridad privada"*); **art. 52** (quien **comercialice** equipos del art. 53 **debe registrarse ante la Supervigilancia**); **art. 53** (equipos sujetos a control: detección de armas; visión o escucha remotos; detección o interferencia de comunicaciones; seguridad bancaria; **"equipos o elementos ofensivos… fabricados para causar amenaza, lesión o muerte"**; prevención de actos terroristas); **art. 55** (registro de compradores: nombre, documento, dirección, teléfono y actividad, más una tarjeta de usuario); **art. 57** (informar a la Supervigilancia y reportar **trimestralmente**; la Supervigilancia puede suspender la venta); art. 85 (licencia de 10 años, modificado por el D-L 2106 de 2019); art. 91 (sanciones a quien contrate servicios sin licencia) |
| Fuente | http://www.secretariasenado.gov.co/senado/basedoc/decreto_0356_1994.html · …/decreto_0356_1994_pr001.html · …/decreto_0356_1994_pr002.html |
| Vigencia | Vigente con modificaciones (D-L 2106 de 2019, D. 19 de 2012) — Senado, 30-09-2026 |
| Implicación | (a) **Compradores**: una empresa de vigilancia que compre equipo táctico o de blindaje debe aportar su **licencia de funcionamiento vigente** (verificable). (b) **El vendedor**: si algún producto del catálogo encaja en el art. 53 (por ejemplo bodycam o baliza GPS como "visión o escucha remotos", o grilletes o cizalla como "elementos ofensivos"), **podría** tener que registrarse ante la Supervigilancia y llevar el registro de compradores. **No se verificó** el reglamento que desarrolla los arts. 52-57 ni el criterio actual de la Supervigilancia |
| Evidencia que debe conservarse | Licencia de la Supervigilancia (número, resolución, vigencia y modalidad); registro de compradores según el art. 55 |
| Consecuencia técnica | Subtipo `corporativo.seguridad_privada` con documento obligatorio "Licencia Supervigilancia" y `fecha_vencimiento`; si vence, se revoca automáticamente la autorización de restringidos. Exportar el registro de compradores de productos marcados `regimen = supervigilancia_art53` |
| Tipo / certeza / abogado | OBLIGACIÓN LEGAL (licencia del comprador: Alto; registro del vendedor: **Medio/Bajo** según el producto) · **Sí** |

---

## 8. Bomberos y organismos de socorro

| Campo | Detalle |
|---|---|
| Norma | Ley 1575 de 2012: art. 2 (servicio público esencial prestado por cuerpos oficiales, voluntarios y aeronáuticos), art. 5 (la Dirección Nacional de Bomberos, DNBC, es una unidad administrativa especial adscrita al Mininterior), **art. 18** (clases: **oficiales** creados por concejos; **voluntarios** como asociaciones sin ánimo de lucro con personería de la gobernación; **aeronáuticos** a cargo de los explotadores de aeropuertos y vigilados por la Aerocivil), arts. 20-21 (creación y certificación de idoneidad ante la junta departamental), art. 4 par. 2 y art. 38 (uso exclusivo de nombre, emblemas y uniformes). Ley 1523 de 2012, art. 8 (el Sistema Nacional de Gestión del Riesgo lo integran entidades públicas, entidades privadas con y sin ánimo de lucro, y la comunidad) |
| Fuente | http://www.secretariasenado.gov.co/senado/basedoc/ley_1575_2012.html · http://www.secretariasenado.gov.co/senado/basedoc/ley_1523_2012.html |
| Vigencia | Vigentes (Senado, 30-09-2026) |
| Implicación | El `tipo_institucion = bomberos` debe distinguir el subtipo: un cuerpo **oficial** contrata por el Estatuto (punto 4); uno **voluntario** es una ESAL de derecho privado (pide certificado de existencia y representación o personería de la gobernación, y el certificado de la junta); uno **aeronáutico** es el explotador del aeropuerto (puede ser privado). Defensa Civil y Cruz Roja: **no se verificó** su naturaleza jurídica exacta en esta consulta |
| Evidencia que debe conservarse | Personería o acto de creación; certificado de cumplimiento o idoneidad de la junta departamental (si se puede obtener); designación del funcionario |
| Consecuencia técnica | Campo `subtipo` (oficial / voluntario / aeronautico). Prendas con emblema de bomberos: solo elegibles para `bomberos` (`restringido = true`, sin bloqueo legal pendiente si hay autorización del cuerpo comprador) |
| Tipo / certeza / abogado | OBLIGACIÓN LEGAL (uso de emblemas) / POLÍTICA (verificación del subtipo) · Alto · Recomendable |

---

## 9. Elementos de protección personal (EPP)

| Campo | Detalle |
|---|---|
| Norma | Decreto 1072 de 2015, art. 2.2.4.6.24 num. 5 y par. 1 (el **empleador** suministra EPP que cumplan las disposiciones legales vigentes, sin costo para el trabajador); Resolución 2400 de 1979, arts. 176-178 (dotación de EPP conforme a las normas aprobadas) |
| Fuente | Solo **fuentes secundarias** (documentos institucionales que citan esos artículos); **no se leyó el texto oficial** en esta consulta, así que no se cita una URL oficial. Debe verificarse en SUIN-Juriscol o en el Gestor Normativo de Función Pública |
| Vigencia | No verificada en esta consulta |
| Implicación para el vendedor | La obligación es del **empleador comprador**, no del vendedor. Al vendedor le conviene entregar **ficha técnica y certificado de conformidad o norma técnica** (EN, ANSI, NFPA, NTC) para que el comprador demuestre que cumple. **No se verificó** si existe un reglamento técnico colombiano obligatorio para cada clase de EPP (por ejemplo, calzado de seguridad, cascos o arneses para alturas) |
| Consecuencia técnica | Campos `norma_tecnica` y `certificado_url` por producto. Los EPP son `restringido = false` y `revision_legal = no_requerida` |
| Tipo / certeza / abogado | BUENA PRÁCTICA · Medio · No |

---

## 10. Facturación, conservación y garantías

| Campo | Detalle |
|---|---|
| Norma | **Factura electrónica**: Resolución DIAN 000165 de 2023 (D.O. 52.567 del 02-11-2023), que según fuentes secundarias **deroga la Resolución 000042 de 2020**; modificada por las Resoluciones 008 y 119 de 2024. **Conservación**: Código de Comercio art. 60 (libros y papeles, **10 años**); **Ley 962 de 2005, art. 28** (10 años desde el último asiento, *"en papel o en cualquier medio técnico, magnético o electrónico que garantice su reproducción exacta"*); Ley 1480 art. 50 lit. e (prueba de la transacción por el mismo tiempo) |
| Fuente | http://www.secretariasenado.gov.co/senado/basedoc/codigo_comercio_pr001.html · http://www.secretariasenado.gov.co/senado/basedoc/ley_0962_2005.html · Res. 165/2023 (copia del normograma MinTIC: https://normograma.mintic.gov.co/docs/pdf/resolucion_dian_0165_2023.pdf, **no abierta**) |
| Vigencia | C.Co. y Ley 962: vigentes (Senado). Res. 165/2023: **vigencia no confirmada** en una fuente primaria |
| Obligación | Expedir factura electrónica de venta validada por la DIAN (si el vendedor es facturador obligado); conservar facturas, pedidos, soportes de entrega y evidencias por **10 años** |
| Consecuencia técnica | Integración con un proveedor tecnológico autorizado o software DIAN; guardar CUFE y XML por pedido. Política de retención: pedidos, aceptaciones y documentos de verificación ligados a ventas por **10 años**. Los datos personales que no estén ligados a ventas se suprimen cuando termine su finalidad (equilibrio con el D.1377 art. 11) |
| Tipo / certeza / abogado | OBLIGACIÓN LEGAL · Alto (conservación) / Medio (resolución DIAN vigente) · Contador o revisor fiscal |

---

## 11. Productos con régimen sanitario o metrológico especial

| Producto del catálogo | Norma | Fuente | Hallazgo | Certeza | Consecuencia técnica |
|---|---|---|---|---|---|
| DEA, tensiómetro, estetoscopio, kit de oxigenoterapia, inmovilizadores, torniquete, agente hemostático, parche torácico | Decreto 4725 de 2005 (registro sanitario, permiso de comercialización y vigilancia de dispositivos médicos — INVIMA) | https://www.invima.gov.co/biblioteca/decreto-4725-2005-registros-sanitarios-dispositivos-medicos (ficha INVIMA, no se leyó el texto completo) | Se exige registro sanitario o permiso de comercialización INVIMA para comercializarlos. **No se verificó** el artículo exacto ni la clase de riesgo de cada producto. El oxígeno como gas medicinal podría tener un régimen adicional (**no verificado**) | Medio | `revision_legal = pendiente` hasta registrar el **número de registro sanitario INVIMA** en la ficha; luego `aprobada`. `restringido = false` |
| Kit de detección de drogas (salival) | Decreto 3770 de 2004 (reactivos de diagnóstico in vitro; registro sanitario INVIMA; modificado por el D.581 de 2017) | https://normograma.invima.gov.co/normograma/docs/pdf/decreto_3770_2004.pdf (encontrado, no abierto) | Si es un reactivo IVD sobre una muestra humana, necesita registro sanitario. **No se verificó** si se relaciona con el Fondo Nacional de Estupefacientes (un kit sin sustancias controladas probablemente no, pero **no verificado**) | Bajo/Medio | `restringido = true` (uso de autoridad), `revision_legal = pendiente` |
| Alcoholímetro digital evidencial | Resolución SIC 88919 de 2017 (reglamento técnico metrológico para alcohosensores; modificada en 2020 y 2022) | https://sedeelectronica.sic.gov.co/sites/default/files/normatividad/RTM_Alcohosensores.pdf (fuente secundaria y borradores) | Existe un régimen de metrología legal (evaluación de la conformidad y verificación periódica). **No se confirmó** la vigencia actual | Bajo | `revision_legal = pendiente` hasta tener el certificado de conformidad |
| Cinemómetro láser | No se encontró la norma | — | **No verificado** | Bajo | `revision_legal = pendiente`, `restringido = true` |
| Sonómetro | No se encontró la norma | — | **No verificado** | Bajo | `no_requerida` (uso general), salvo que se venda como "evidencial" |

---

## 12. Lo que NO se pudo verificar (requiere abogado o consulta a la autoridad)

1. **Qué autoridad otorga el "permiso" del art. 346 del Código Penal** para fabricar o vender uniformes e insignias de la Fuerza Pública, el trámite y si existe un registro de proveedores autorizados (Policía o Mindefensa). El reglamento de uniformes de la Policía (PDF en policia.gov.co) no se pudo leer.
2. Si la **Ley 1453 de 2011** tuvo alguna incidencia en el art. 346 (según el texto oficial, no lo modificó).
3. Régimen de **comercialización de chalecos y placas balísticas** a particulares y a empresas de vigilancia; contenido de la Resolución Supervigilancia 20224440029777 de 2022.
4. Si el vendedor debe **registrarse ante la Supervigilancia** (D.356 arts. 52-57) por vender bodycams, balizas GPS, grilletes, cizallas o fundas.
5. Si el **Cuerpo de Custodia del INPEC** es un "organismo de seguridad del Estado" para efectos del art. 346.
6. Si las **entidades públicas** pueden ser "consumidoras" según la Ley 1480 (doctrina de la SIC).
7. Vigencia de la **Res. DIAN 165 de 2023** como norma actual de facturación, y de la **Res. SIC 88919 de 2017** (alcohosensores); norma de **cinemómetros**.
8. Artículo exacto del **D. 4725 de 2005** y clase de riesgo de cada dispositivo médico; régimen de los **kits de oxígeno** y de las pruebas de drogas.
9. Texto oficial del **Decreto 1072 de 2015 (art. 2.2.4.6.24)** y de la **Res. 2400 de 1979**; existencia de reglamentos técnicos obligatorios para los EPP.
10. Si los **equipos de radio** (TETRA con cifrado) requieren homologación o permisos MinTIC o CRC que deba verificar el vendedor.
11. Si los **antecedentes judiciales** son un dato sensible (art. 5 de la Ley 1581).
12. Naturaleza jurídica exacta de la **Defensa Civil** y de la **Cruz Roja** y su régimen de compras.
