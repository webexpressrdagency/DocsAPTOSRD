// Oficinas y destinatarios. Cambiar aquí cambia el formulario y los correos.
export const DESTINATARIOS_FIJOS = ['legal@apartamentosrd.com.do', 'duediligence@apartamentosrd.com.do'];
export const COPIA_SIEMPRE = ['Ventas@apartamentosrd.com.do'];

export const OFICINAS = [
  { nombre: 'Punta Cana', director: 'Juan Carlos Mora', correo: 'puntacana@apartamentosrd.com.do' },
  { nombre: 'Santo Domingo', director: 'Morelia Otazo', correo: 'morelia@apartamentosrd.com.do' },
  { nombre: 'Santiago', director: 'Pamely Hernández', correo: 'pamely@apartamentosrd.com.do' },
  { nombre: 'Santo Domingo Este', director: 'Yamela de La Paz', correo: 'ydelapaz@apartamentosrd.com.do' },
];

export const NOMBRES_OFICINA = OFICINAS.map((o) => o.nombre);

export function destinatariosPara(oficina) {
  const o = OFICINAS.find((x) => x.nombre === oficina);
  if (!o) return null;
  return {
    to: DESTINATARIOS_FIJOS,
    cc: [o.correo, ...COPIA_SIEMPRE],
  };
}
