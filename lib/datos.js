import { get, list, put } from '@vercel/blob';

export async function leerJSON(pathname) {
  try {
    const r = await get(pathname, { access: 'private', useCache: false });
    if (!r || r.statusCode !== 200) return null;
    return await new Response(r.stream).json();
  } catch {
    return null;
  }
}

export async function guardarJSON(pathname, data) {
  return put(pathname, JSON.stringify(data, null, 2), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

export async function listarTodo(prefix) {
  const blobs = [];
  let cursor;
  do {
    const r = await list({ prefix, cursor, limit: 1000 });
    blobs.push(...r.blobs);
    cursor = r.hasMore ? r.cursor : undefined;
  } while (cursor);
  return blobs;
}

export async function listarSolicitudes() {
  const blobs = await listarTodo('solicitudes/');
  const ids = blobs
    .filter((b) => b.pathname.endsWith('/solicitud.json'))
    .map((b) => b.pathname.split('/')[1]);
  const registros = await Promise.all(ids.map((id) => leerSolicitud(id)));
  return registros.filter(Boolean).sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
}

export async function leerSolicitud(id) {
  const [sol, estado, notificacion] = await Promise.all([
    leerJSON(`solicitudes/${id}/solicitud.json`),
    leerJSON(`solicitudes/${id}/estado.json`),
    leerJSON(`solicitudes/${id}/notificacion.json`),
  ]);
  if (!sol) return null;
  return { ...sol, estado: estado?.estado || 'Recibida', nota: estado?.nota || '', estadoFecha: estado?.fecha || null, notificacion };
}
