import { handleUpload } from '@vercel/blob/client';
import { head } from '@vercel/blob';
import { CLAVES_ARCHIVO, RE_ID, TAMANO_MAXIMO, TIPOS_PERMITIDOS } from '@/lib/requisitos';

const RE_RUTA = new RegExp(`^solicitudes/([0-9a-f-]{36})/(${CLAVES_ARCHIVO.join('|')})/[A-Za-z0-9._-]{1,100}$`);

async function yaFinalizada(id) {
  try {
    await head(`solicitudes/${id}/solicitud.json`);
    return true;
  } catch {
    return false;
  }
}

export async function POST(request) {
  const body = await request.json();
  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const m = RE_RUTA.exec(pathname);
        if (!m || !RE_ID.test(m[1]) || clientPayload !== m[1]) {
          throw new Error('Ruta de archivo no válida.');
        }
        if (await yaFinalizada(m[1])) {
          throw new Error('Este expediente ya fue enviado.');
        }
        return {
          allowedContentTypes: TIPOS_PERMITIDOS,
          maximumSizeInBytes: TAMANO_MAXIMO,
          addRandomSuffix: true,
        };
      },
    });
    return Response.json(json);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
