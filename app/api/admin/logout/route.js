import { COOKIE_ADMIN } from '@/lib/auth';

export async function POST(request) {
  const res = new Response(null, { status: 303, headers: { Location: new URL('/admin', request.url).toString() } });
  res.headers.append('Set-Cookie', `${COOKIE_ADMIN}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
  return res;
}
