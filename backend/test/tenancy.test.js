const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  resolverInstitucion,
  institucionValida,
  productoVisibleParaInstitucion,
  datosPublicosInvitado
} = require('../src/tenancy');

describe('segmentación institucional', () => {
  const dominios = [
    ['agente@policia.gov.co', 'policia'],
    ['funcionario@ejercito.mil.co', 'defensa'],
    ['usuario@armada.mil.co', 'defensa'],
    ['usuario@fac.mil.co', 'defensa'],
    ['bombero@dnbc.gov.co', 'bomberos'],
    ['voluntario@defensacivil.gov.co', 'socorro'],
    ['funcionario@inpec.gov.co', 'penitenciario'],
    ['usuario@gmail.com', 'corporativo']
  ];
  dominios.forEach(([correo, esperado]) => {
    it(`resuelve ${correo} como ${esperado}`, () => {
      assert.equal(resolverInstitucion(correo), esperado);
    });
  });

  it('solo acepta identificadores de tenant conocidos', () => {
    assert.equal(institucionValida('bomberos'), true);
    assert.equal(institucionValida('tenant-desconocido'), false);
  });

  it('un producto general es visible en todos los catálogos, no así uno de otro tenant', () => {
    assert.equal(productoVisibleParaInstitucion('general', 'bomberos'), true);
    assert.equal(productoVisibleParaInstitucion('policia', 'bomberos'), false);
    assert.equal(productoVisibleParaInstitucion('bomberos', 'bomberos'), true);
  });

  it('la respuesta de invitado no expone precio, inventario, restricción ni metadatos', () => {
    const producto = datosPublicosInvitado({
      id: 4,
      nombre: 'Equipo',
      precio: '150000.00',
      cantidad_disponible: 12,
      metadatos: { tallas: ['M'] },
      restringido: true
    });
    assert.deepEqual(producto, {
      id: 4,
      nombre: 'Equipo',
      precio: null,
      cantidad_disponible: null,
      metadatos: null,
      restringido: false,
      requiere_login: true
    });
  });
});
