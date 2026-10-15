import { esAdmin } from '@/lib/auth';
import { guardarJSON, leerJSON } from '@/lib/datos';
import { ESTADOS, RE_ID } from '@/lib/requisitos';

export async function POST(request) {
  if (!(await esAdmin())) return new Response('No autorizado', { status: 401 });
  const form = await request.formData();
  const id = String(form.get('id') || '');
  const estado = String(form.get('estado') || '');
  const nota = String(form.get('nota') || '').slice(0, 2000);
  if (!RE_ID.test(id) || !ESTADOS.includes(estado)) return new Response('Datos no válidos', { status: 400 });
  if (!(await leerJSON(`solicitudes/${id}/solicitud.json`))) return new Response('No encontrado', { status: 404 });
  await guardarJSON(`solicitudes/${id}/estado.json`, { estado, nota, fecha: new Date().toISOString() });
  const url = new URL(`/admin/${id}`, request.url);
  url.searchParams.set('guardado', '1');
  return Response.redirect(url, 303);
}
