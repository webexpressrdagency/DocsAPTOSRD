import crypto from 'node:crypto';
import { cookies } from 'next/headers';

export const COOKIE_ADMIN = 'expediente_admin';

export function tokenAdmin() {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return null;
  return crypto.createHmac('sha256', pw).update('recepcion-documentos-admin-v1').digest('hex');
}

export function claveCorrecta(intento) {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw || typeof intento !== 'string') return false;
  const a = crypto.createHash('sha256').update(intento).digest();
  const b = crypto.createHash('sha256').update(pw).digest();
  return crypto.timingSafeEqual(a, b);
}

export async function esAdmin() {
  const esperado = tokenAdmin();
  if (!esperado) return false;
  const valor = (await cookies()).get(COOKIE_ADMIN)?.value;
  if (!valor || valor.length !== esperado.length) return false;
  return crypto.timingSafeEqual(Buffer.from(valor), Buffer.from(esperado));
}
