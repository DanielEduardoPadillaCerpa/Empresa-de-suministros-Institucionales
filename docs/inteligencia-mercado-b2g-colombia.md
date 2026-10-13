# Inteligencia comercial B2G — Colombia

**Corte de datos:** consulta ejecutada el 12 de octubre de 2026; la última fecha de firma observada en el conjunto consultado fue el 11 de octubre de 2026. Las cifras son un indicador de contratación registrada, no un presupuesto apropiable ni una proyección de ventas.

## Resumen ejecutivo

La consulta al conjunto oficial **SECOP II — Contratos Electrónicos** en Datos Abiertos Colombia reportó, para contratos con fecha de firma entre el 1 de enero y el 12 de octubre de 2026, un valor sumado de **COP 679.587.715.210.811,52 (aprox. COP 679,59 billones)**, **893.808 registros** y **3.256 NIT de entidades compradoras**.

La cifra es un **proxy bruto del mercado público registrado en SECOP II para todos los sectores y objetos contractuales**, no el TAM de dotación, seguridad, rescate o instrumentación. Puede incluir contratos plurianuales, diferentes modalidades y registros de cobertura heterogénea. Para estimar el mercado objetivo se debe filtrar por códigos UNSPSC de producto, región, entidad y estado contractual, deduplicar acuerdos/órdenes y contrastar valores con los documentos del proceso. No se anualiza el corte parcial: la estacionalidad y la publicación tardía sesgarían esa extrapolación.

**Consulta reproducible (Socrata):**

```text
https://www.datos.gov.co/resource/jbjy-vk9h.json?$select=sum(valor_del_contrato)%20as%20contratacion_2026_cop,count(*)%20as%20contratos,count(distinct%20nit_entidad)%20as%20entidades&$where=fecha_de_firma%20between%20%272026-01-01T00:00:00%27%20and%20%272026-10-12T23:59:59%27
```

## Mapeo institucional de referencia

Muestra de unidades potenciales compradoras, no un censo ni certificación de su estado contractual. Las ubicaciones identifican sedes o áreas de operación; confirmar estructura, jurisdicción, directorio vigente y competencia presupuestal antes de prospectar o contratar.

| Vertical | Nombre de la entidad/unidad | Ubicación/región | Tipo de producto |
|---|---|---|---|
| Fuerza Pública — Ejército | Primera División / Brigada 1 | Tunja y Boyacá | Ambos |
| Fuerza Pública — Ejército | Segunda División / Brigadas 2 y 5 | Santa Marta; Santander y nororiente | Ambos |
| Fuerza Pública — Ejército | Tercera División / Brigada 3 | Popayán y suroccidente | Ambos |
| Fuerza Pública — Ejército | Cuarta División / Brigada 7 | Villavicencio y Orinoquía | Ambos |
| Fuerza Pública — Ejército | Quinta División / Brigadas 6 y 13 | Ibagué; Bogotá y centro | Ambos |
| Fuerza Pública — Ejército | Sexta División / Brigadas 12 y 27 | Florencia; Mocoa y sur amazónico | Ambos |
| Fuerza Pública — Ejército | Séptima División / Brigadas 4, 11 y 17 | Medellín; Montería; Urabá | Ambos |
| Fuerza Pública — Ejército | Octava División / Brigadas 16 y 18 | Yopal; Arauca y Casanare | Ambos |
| Fuerza Pública — Armada | Fuerza Naval del Caribe | Cartagena y litoral Caribe | Ambos |
| Fuerza Pública — Armada | Fuerza Naval del Pacífico | Bahía Málaga/Buenaventura y litoral Pacífico | Ambos |
| Fuerza Pública — Armada | Fuerza Naval del Sur | Leguízamo y cuenca amazónica | Ambos |
| Fuerza Pública — Armada | DIMAR — capitanías de puerto | Caribe, Pacífico, San Andrés y zona fluvial | Ambos |
| Fuerza Pública — Fuerza Aeroespacial | CACOM 1 | Puerto Salgar, Cundinamarca | Ambos |
| Fuerza Pública — Fuerza Aeroespacial | CACOM 2 | Apiay, Meta | Ambos |
| Fuerza Pública — Fuerza Aeroespacial | CACOM 3 | Malambo, Atlántico | Ambos |
| Fuerza Pública — Fuerza Aeroespacial | CACOM 4 | Melgar, Tolima | Ambos |
| Fuerza Pública — Fuerza Aeroespacial | CACOM 5 | Rionegro, Antioquia | Ambos |
| Fuerza Pública — Fuerza Aeroespacial | CACOM 6 | Tres Esquinas, Caquetá | Ambos |
| Policía Nacional | DEANT / Departamento de Policía Antioquia | Medellín y municipios de Antioquia | Ambos |
| Policía Nacional | DEBOL / Departamento de Policía Bolívar | Cartagena y Bolívar | Ambos |
| Policía Nacional | DEVAL / Departamento de Policía Valle | Cali y Valle del Cauca | Ambos |
| Policía Nacional | MEBOG / Policía Metropolitana de Bogotá | Bogotá D. C. | Ambos |
| Policía Nacional | MEVAL / Policía Metropolitana del Valle de Aburrá | Medellín y área metropolitana | Ambos |
| Bomberos — oficial | Cuerpo Oficial de Bomberos de Bogotá | Bogotá D. C. | Ambos |
| Bomberos — oficial | Departamento Administrativo de Gestión del Riesgo y Bomberos de Medellín | Medellín, Antioquia | Ambos |
| Bomberos — oficial | Cuerpo de Bomberos Voluntarios de Cali | Cali, Valle del Cauca | Ambos |
| Bomberos — voluntario | Cuerpo de Bomberos Voluntarios de Cartagena | Cartagena, Bolívar | Ambos |
| Bomberos — voluntario | Cuerpo de Bomberos Voluntarios de Bucaramanga | Bucaramanga, Santander | Ambos |
| Bomberos — voluntario | Cuerpo de Bomberos Voluntarios de Pasto | Pasto, Nariño | Ambos |
| Socorro — penitenciario | INPEC — Regional Central | Bogotá D. C. y centro del país | Ambos |
| Socorro — penitenciario | INPEC — Regional Occidente | Cali y suroccidente | Ambos |
| Socorro — penitenciario | INPEC — Regional Norte | Barranquilla y Caribe | Ambos |
| Socorro — penitenciario | INPEC — Regional Oriente | Bucaramanga y nororiente | Ambos |
| Socorro — penitenciario | INPEC — Regional Viejo Caldas | Manizales y Eje Cafetero | Ambos |
| Socorro — penitenciario | INPEC — Regional Noroeste | Medellín y Antioquia | Ambos |
| Socorro — Defensa Civil | Seccional Bogotá D. C. | Bogotá D. C. | Ambos |
| Socorro — Defensa Civil | Seccionales Antioquia, Valle del Cauca y Santander | Medellín, Cali y Bucaramanga; nodos regionales | Ambos |
| Socorro — Defensa Civil | Seccionales Atlántico, Bolívar y Nariño | Barranquilla, Cartagena y Pasto | Ambos |

**Bomberos:** la tabla identifica ejemplos de cuerpos oficiales y voluntarios; no certifica que cada cuerpo esté reportado/activo en el registro DNBC a la fecha del corte. La verificación debe hacerse contra el directorio/registro vigente de la Dirección Nacional de Bomberos de Colombia y la autoridad territorial.

## Códigos UNSPSC candidatos

Los códigos siguientes son clases/familias de ocho dígitos observadas en la columna `codigo_de_categoria_principal` del conjunto SECOP II; se seleccionaron como punto de partida para prendas, protección y respuesta a incendios. El prefijo `V1.` es propio del registro publicado y se omite en la columna para lectura. **No se deben copiar automáticamente al RUP:** confirmar descripción oficial, versión UNSPSC activa y el commodity exacto de ocho dígitos en el clasificador vigente de Colombia Compra Eficiente para cada bien ofertado.

| Código UNSPSC (8 dígitos) | Línea de compra a revisar en el clasificador vigente | Frecuencia observada en SECOP II (2024–corte 2026) |
|---|---|---:|
| 46191601 | Extintores / equipos para control de incendio | 646 |
| 53102700 | Uniformes | 324 |
| 46191600 | Protección y respuesta contra incendio | 172 |
| 53101500 | Pantalones y prendas inferiores | 169 |
| 53102710 | Artículos específicos de uniformidad | 168 |
| 53111602 | Calzado / botas de dotación | 121 |
| 53101600 | Camisas y prendas superiores | 119 |
| 53102900 | Accesorios de vestir y uniformidad | 109 |
| 46181500 | Indumentaria y protección personal | 107 |
| 46181600 | Calzado de protección | 38 |

Frecuencias obtenidas agrupando esos códigos entre el 1 de enero de 2024 y el corte de consulta, con búsquedas textuales de prendas, calzado, rescate, bomberos, extintores, chalecos, guantes, cascos, botas y protección en la descripción del proceso. Son **indicadores de aparición, no conteos de compras de cada artículo ni valores contratados**. Ampliar la búsqueda a instrumentación, comunicaciones, navegación y rescate antes de dimensionar el TAM completo.

## Marcos técnicos y canal de compra

| Área | Requisitos de planeación y verificación |
|---|---|
| Bomberos — ropa de protección y EPP | Definir el riesgo y tarea (incendio estructural, aproximación, forestal, rescate técnico); especificar conjunto compatible, ensayos/certificados y trazabilidad de fabricante/lote conforme a la edición vigente de las normas NFPA aplicables (p. ej., NFPA 1970 para conjuntos de protección/SCBA y NFPA 2500 para operaciones y equipos de rescate técnico). Incluir tallaje, mantenimiento, inspección, vida útil, capacitación y repuestos. No aceptar “cumple NFPA” sin identificar norma, edición, alcance y evidencia del producto. |
| Policía Nacional | Utilizar la especificación técnica, ficha de homologación y protocolo de aceptación vigentes de la Policía Nacional para cada referencia (uniformes, calzado, protección balística, radios o instrumentación). Describir materiales, medidas, color, desempeño, ensayos, marcación, garantía, compatibilidad y muestreo; no sustituir el estándar institucional por una descripción comercial genérica. Para elementos sujetos a autorización/control, verificar el régimen y la habilitación aplicables antes de ofertar. |
| Acuerdo Marco de Precios / TVEC | Confirmar que exista un AMP vigente que cubra el bien, entidad habilitada, catálogo y condiciones. La entidad sigue el instrumento y sus documentos: planea la necesidad, revisa cobertura y fichas, configura la solicitud/cotización cuando corresponda, compara conforme a las reglas del AMP, emite la orden de compra, acepta y supervisa la entrega. Verificar topes, cobertura, precio, garantías, tiempos, vigencia y reglas de selección; no asumir que toda dotación está cubierta ni usar el AMP fuera de su objeto. |
| UNSPSC / RUP | Clasificar experiencia y bienes por el código exacto y versión vigente del clasificador de Colombia Compra Eficiente; registrar el nivel de producto exigido por la regulación/convocatoria, sin deducirlo solamente de palabras clave del SECOP. |

## Fuentes y límites

- Datos Abiertos Colombia, conjunto **SECOP II — Contratos Electrónicos**, identificador Socrata `jbjy-vk9h`: [API del conjunto](https://www.datos.gov.co/resource/jbjy-vk9h.json).
- Colombia Compra Eficiente, [Clasificador de Bienes y Servicios UNSPSC](https://www.colombiacompra.gov.co/archivos/glosario/clasificador-de-bienes-y-servicios): versión colombiana traducida; consultar el catálogo descargable para descripciones y códigos vigentes.
- [Dirección Nacional de Bomberos de Colombia](https://dnbc.gov.co/): verificar registro y naturaleza actual de cada cuerpo.
- [Policía Nacional — directorio institucional](https://www.policia.gov.co/directorio/departamentos-policia): confirmar departamentos y unidades vigentes.
- [Colombia Compra Eficiente](https://www.colombiacompra.gov.co/): consultar los Acuerdos Marco y reglas de la Tienda Virtual del Estado Colombiano vigentes al iniciar cada proceso.

Esta ficha de inteligencia es una línea base reproducible, no sustituye estudios de mercado, estudios previos, validación de proveedores ni asesoría jurídica/técnica.
