// Lista de requisitos obligatorios del expediente. El orden y la numeración
// son los de la lista oficial; cambiar aquí cambia el formulario y el panel.
export const REQUISITOS = [
  { key: 'rnc', n: 1, titulo: 'Certificación RNC actualizada', tipo: 'archivo', ayuda: 'Certificación emitida por la DGII, con fecha reciente.' },
  { key: 'identidad', n: 2, titulo: 'Cédula o pasaporte del gerente y de los socios', tipo: 'archivo', ayuda: 'Un documento por persona. En la cédula, ambos lados.' },
  { key: 'mercantil', n: 3, titulo: 'Registro Mercantil actualizado', tipo: 'archivo', ayuda: 'Expedido por la Cámara de Comercio y Producción, vigente.' },
  { key: 'asamblea', n: 4, titulo: 'Asamblea General Ordinaria', tipo: 'archivo', ayuda: 'Acta de la última asamblea, debidamente registrada.' },
  { key: 'contacto', n: 5, titulo: 'Correo electrónico, persona encargada y número de contacto', tipo: 'contacto' },
  { key: 'titulo', n: 6, titulo: 'Título de terreno', tipo: 'archivo', ayuda: 'Certificado de título completo, todas las páginas.' },
  { key: 'obras', n: 7, titulo: 'No objeción de Obras Públicas', tipo: 'archivo', ayuda: 'Ministerio de Obras Públicas y Comunicaciones (MOPC).' },
  { key: 'ayuntamiento', n: 8, titulo: 'No objeción del Ayuntamiento', tipo: 'archivo', ayuda: 'Del ayuntamiento del municipio donde se ubica la obra.' },
  { key: 'ambiente', n: 9, titulo: 'No objeción de Medio Ambiente', tipo: 'archivo', ayuda: 'Ministerio de Medio Ambiente y Recursos Naturales.' },
  { key: 'pago', n: 10, titulo: 'Porcentaje y forma de pago', tipo: 'pago' },
];

export const CLAVES_ARCHIVO = REQUISITOS.filter((r) => r.tipo === 'archivo').map((r) => r.key);

export const FORMAS_PAGO = ['Cheque', 'Transferencia'];
export const IMPUESTOS = ['Impuestos incluidos', 'Más impuestos'];

export const ESTADOS = ['Recibida', 'En revisión', 'Con observaciones', 'Aprobada', 'Rechazada'];

export const TIPOS_PERMITIDOS = ['application/pdf', 'image/jpeg', 'image/png'];
export const TAMANO_MAXIMO = 20 * 1024 * 1024; // 20 MB por archivo

export const RE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export const RE_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function soloDigitos(v) {
  return String(v || '').replace(/\D/g, '');
}

export function folioDe(id) {
  return 'EXP-' + id.replace(/-/g, '').slice(0, 8).toUpperCase();
}

// Valida los campos de texto del expediente. Devuelve un objeto de errores
// (vacío si todo está bien). Se usa igual en el navegador y en el servidor.
export function validarDatos({ empresa = {}, contacto = {}, pago = {} }, oficinas = []) {
  const e = {};
  if (!oficinas.includes(empresa.oficina)) e.oficina = 'Seleccione la oficina que le atiende.';
  if (!String(empresa.razonSocial || '').trim()) e.razonSocial = 'Escriba la razón social.';
  const rnc = soloDigitos(empresa.rnc);
  if (rnc.length !== 9 && rnc.length !== 11) e.rnc = 'El RNC tiene 9 dígitos (11 si es cédula).';
  if (!RE_CORREO.test(String(contacto.correo || '').trim())) e.correo = 'Escriba un correo válido.';
  if (!String(contacto.encargado || '').trim()) e.encargado = 'Indique la persona encargada.';
  if (soloDigitos(contacto.telefono).length < 10) e.telefono = 'El número debe tener al menos 10 dígitos.';
  const p = Number(pago.porcentaje);
  if (!(p > 0 && p <= 100)) e.porcentaje = 'Indique un porcentaje entre 1 y 100.';
  if (!FORMAS_PAGO.includes(pago.forma)) e.forma = 'Elija la forma de pago.';
  if (!IMPUESTOS.includes(pago.impuestos)) e.impuestos = 'Indique si los impuestos están incluidos.';
  return e;
}

export function claseEstado(e) {
  return { Recibida: 'recibida', 'En revisión': 'revision', 'Con observaciones': 'observaciones', Aprobada: 'aprobada', Rechazada: 'rechazada' }[e] || 'recibida';
}
