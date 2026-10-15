import { get } from '@vercel/blob';
import { esAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  if (!(await esAdmin())) return new Response('No autorizado', { status: 401 });
  const url = new URL(request.url);
  const p = url.searchParams.get('p') || '';
  const nombre = (url.searchParams.get('n') || p.split('/').pop()).replace(/["\r\n]/g, '');
  if (!/^solicitudes\/[0-9a-f-]{36}\/[a-z]+\/[A-Za-z0-9._-]+$/.test(p)) {
    return new Response('Ruta no válida', { status: 400 });
  }
  const r = await get(p, { access: 'private' });
  if (!r || r.statusCode !== 200) return new Response('No encontrado', { status: 404 });
  const modo = url.searchParams.get('descargar') ? 'attachment' : 'inline';
  return new Response(r.stream, {
    headers: {
      'Content-Type': r.blob.contentType,
      'Content-Disposition': `${modo}; filename*=UTF-8''${encodeURIComponent(nombre)}`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
