# Catálogos institucionales

El backend agrega de forma idempotente referencias base para Defensa, Bomberos, Socorro, Penitenciario y clientes Corporativos al iniciar. Los productos policiales preexistentes no se reasignan. Las nuevas referencias se almacenan con la institución correspondiente y solo aparecen a ese tenant.

Son referencias para iniciar una solicitud comercial, no ofertas vigentes: el precio queda en cero, el inventario en cero, y `metadatos.cotizacion_requerida` impide el checkout directo. La ficha solicita confirmar disponibilidad, especificaciones, certificaciones y precio con el cliente/proveedor. No se afirma que los productos estén en inventario ni que cumplan una norma sin validar la ficha técnica.

Las imágenes del catálogo se sirven desde `backend/img`. Se añadieron fotografías descargadas desde Unsplash para los fondos de Defensa, Bomberos, Socorro, Penitenciario y Corporativo:

- Defensa: https://images.unsplash.com/photo-1608396941316-ea89219bd56e — Filip Andrejevic, [Unsplash](https://unsplash.com/photos/men-in-green-and-brown-camouflage-uniform-1LTunOck3es).
- Bomberos: https://images.unsplash.com/photo-1575507371089-cd0a12c5aae9.
- Socorro: https://images.unsplash.com/photo-1501803524289-cf5cc17e4e67 — Neil Thomas, [Unsplash](https://unsplash.com/photos/a-rescue-from-a-helicopter-in-dinas-dinlle-from-the-water-hgIJfyEaQQQ).
- Penitenciario: https://images.unsplash.com/photo-1791469257164-f2a100f93630 — Dan Stephens, [Unsplash](https://unsplash.com/photos/stone-wall-with-barred-windows-32Yl7cAOqwQ).
- Corporativo: https://images.unsplash.com/photo-1497366216548-37526070297c.
- Licencia de Unsplash: https://unsplash.com/license

Las fotografías son ilustrativas, no certifican marca, modelo ni conformidad de un producto. Las imágenes existentes se reutilizan para los demás artículos hasta disponer de fotografía específica del fabricante.

## Inventario de referencias

El archivo [`catalogo-institucionales-referencias.csv`](catalogo-institucionales-referencias.csv) contiene las referencias activas de los cinco catálogos, con institución, nombre, categoría, precio registrado, estado del precio, disponibilidad e imagen de referencia. El inventario vigente contiene 523 referencias únicas: 154 de Bomberos, 96 de Socorro y Defensa Civil, 97 de Penitenciario, 88 de Defensa y 88 de Corporativo.

Los precios registrados en cero significan **por cotizar**, no productos gratuitos. La disponibilidad debe confirmarse. La ruta de imagen apunta a una foto ilustrativa compartida por categoría; no necesariamente representa el modelo exacto de cada referencia.
