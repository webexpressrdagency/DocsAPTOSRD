import { CLAVES_ARCHIVO, RE_ID, folioDe, soloDigitos, validarDatos, REQUISITOS } from '@/lib/requisitos';
import { guardarJSON, leerJSON, listarTodo } from '@/lib/datos';
import { NOMBRES_OFICINA } from '@/lib/oficinas';
import { notificarExpediente } from '@/lib/correo';

const corta = (v, n = 200) => String(v || '').trim().slice(0, n);

export async function POST(request) {
  let data;
  try {
    data = await request.json();
  } catch {
    return Response.json({ error: 'Solicitud no válida.' }, { status: 400 });
  }
  const { id, empresa = {}, contacto = {}, pago = {}, archivos = [] } = data || {};
  if (!RE_ID.test(String(id))) return Response.json({ error: 'Identificador no válido.' }, { status: 400 });

  const errores = validarDatos({ empresa, contacto, pago }, NOMBRES_OFICINA);
  if (Object.keys(errores).length) {
    return Response.json({ error: 'Hay campos incompletos.', errores }, { status: 400 });
  }

  if (await leerJSON(`solicitudes/${id}/solicitud.json`)) {
    return Response.json({ error: 'Este expediente ya fue enviado.' }, { status: 409 });
  }

  // Solo se aceptan archivos que realmente están en el almacenamiento.
  const subidos = await listarTodo(`solicitudes/${id}/`);
  const porRuta = new Map(subidos.map((b) => [b.pathname, b]));
  const nombres = new Map(
    (Array.isArray(archivos) ? archivos : []).map((a) => [String(a.pathname), corta(a.nombre, 160)])
  );

  const lista = [];
  for (const b of subidos) {
    const key = b.pathname.split('/')[2];
    if (!CLAVES_ARCHIVO.includes(key)) continue;
    lista.push({
      requisito: key,
      pathname: b.pathname,
      nombre: nombres.get(b.pathname) || b.pathname.split('/').pop(),
      tamano: b.size,
    });
  }

  const faltan = CLAVES_ARCHIVO.filter((k) => !lista.some((a) => a.requisito === k));
  if (faltan.length) {
    const titulos = faltan.map((k) => REQUISITOS.find((r) => r.key === k).n).join(', ');
    return Response.json({ error: `Faltan documentos de los requisitos ${titulos}.` }, { status: 400 });
  }

  const registro = {
    id,
    folio: folioDe(id),
    fecha: new Date().toISOString(),
    oficina: empresa.oficina,
    empresa: { razonSocial: corta(empresa.razonSocial), rnc: soloDigitos(empresa.rnc), proyecto: corta(empresa.proyecto) },
    contacto: { correo: corta(contacto.correo), encargado: corta(contacto.encargado), telefono: corta(contacto.telefono, 40) },
    pago: { porcentaje: Number(pago.porcentaje), forma: corta(pago.forma), impuestos: corta(pago.impuestos), detalle: corta(pago.detalle, 1000) },
    archivos: lista,
  };

  await guardarJSON(`solicitudes/${id}/solicitud.json`, registro);
  const notificacion = await notificarExpediente(registro, new URL(request.url).origin);
  await guardarJSON(`solicitudes/${id}/notificacion.json`, { ...notificacion, fecha: new Date().toISOString() });
  return Response.json({ folio: registro.folio });
}
