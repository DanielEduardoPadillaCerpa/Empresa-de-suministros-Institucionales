const INSTITUCIONES = Object.freeze({
  policia: {
    nombre: 'Policía Nacional',
    dominio: 'policia.gov.co',
    catalogo: 'index.html?vertical=policia',
    tema: 'policia'
  },
  defensa: {
    nombre: 'Defensa y Fuerza Pública',
    dominio: null,
    catalogo: 'index.html?vertical=defensa',
    tema: 'defensa'
  },
  bomberos: {
    nombre: 'Bomberos',
    dominio: 'dnbc.gov.co',
    catalogo: 'index.html?vertical=bomberos',
    tema: 'bomberos'
  },
  socorro: {
    nombre: 'Defensa Civil y Socorro',
    dominio: 'defensacivil.gov.co',
    catalogo: 'index.html?vertical=socorro',
    tema: 'socorro'
  },
  penitenciario: {
    nombre: 'Sistema penitenciario',
    dominio: 'inpec.gov.co',
    catalogo: 'index.html?vertical=penitenciario',
    tema: 'penitenciario'
  },
  corporativo: {
    nombre: 'Corporativo',
    dominio: null,
    catalogo: 'index.html?vertical=corporativo',
    tema: 'corporativo'
  },
  general: {
    nombre: 'Catálogo general',
    dominio: null,
    catalogo: 'index.html',
    tema: 'general'
  }
});

const DOMINIOS_INSTITUCIONALES = Object.freeze({
  'policia.gov.co': 'policia',
  'policia.mil.co': 'policia',
  'ejercito.mil.co': 'defensa',
  'armada.mil.co': 'defensa',
  'fac.mil.co': 'defensa',
  'dimar.mil.co': 'defensa',
  'mindefensa.gov.co': 'defensa',
  'dnbc.gov.co': 'bomberos',
  'bomberos.gov.co': 'bomberos',
  'defensacivil.gov.co': 'socorro',
  'defensacivil.org.co': 'socorro',
  'inpec.gov.co': 'penitenciario'
});

const INSTITUCIONES_VALIDAS = new Set(Object.keys(INSTITUCIONES));

function resolverInstitucion(correo) {
  const dominio = String(correo || '').trim().toLowerCase().split('@').pop();
  return DOMINIOS_INSTITUCIONALES[dominio] || 'corporativo';
}

function institucionValida(institucionId) {
  return typeof institucionId === 'string' && INSTITUCIONES_VALIDAS.has(institucionId);
}

function productoVisibleParaInstitucion(productoInstitucion, institucionUsuario) {
  return productoInstitucion === 'general' || productoInstitucion === institucionUsuario;
}

function datosPublicosInvitado(producto) {
  const { precio, cantidad_disponible, metadatos, restringido, ...datosPublicos } = producto;
  return {
    ...datosPublicos,
    precio: null,
    cantidad_disponible: null,
    metadatos: null,
    restringido: false,
    requiere_login: true
  };
}

module.exports = {
  INSTITUCIONES,
  INSTITUCIONES_VALIDAS,
  institucionValida,
  resolverInstitucion,
  productoVisibleParaInstitucion,
  datosPublicosInvitado
};
