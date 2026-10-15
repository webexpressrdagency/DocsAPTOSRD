import { COOKIE_ADMIN, claveCorrecta, tokenAdmin } from '@/lib/auth';

export async function POST(request) {
  const form = await request.formData();
  const url = new URL('/admin', request.url);
  if (!claveCorrecta(String(form.get('clave') || ''))) {
    url.searchParams.set('error', '1');
    return Response.redirect(url, 303);
  }
  const res = new Response(null, { status: 303, headers: { Location: url.toString() } });
  res.headers.append(
    'Set-Cookie',
    `${COOKIE_ADMIN}=${tokenAdmin()}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 12}`
  );
  return res;
}
