import Link from 'next/link';
import { esAdmin } from '@/lib/auth';
import { listarSolicitudes } from '@/lib/datos';
import { ESTADOS, claseEstado } from '@/lib/requisitos';
import { Marca } from '../Marca';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Panel · DocsAPTOSRD' };


const fmtFecha = (iso) =>
  new Date(iso).toLocaleString('es-DO', { timeZone: 'America/Santo_Domingo', dateStyle: 'medium', timeStyle: 'short' });

function Login({ error }) {
  return (
    <main className="wrap">
      <form className="login bloque" method="post" action="/api/admin/login">
        <div className="bloque-head" style={{ paddingTop: 24 }}>
          <Marca enTarjeta subtitulo="Panel" />
          <h2 style={{ marginTop: 22, fontSize: 26, fontWeight: 800 }}>Iniciar sesión</h2>
          <p>Ingresa la contraseña para ver los expedientes.</p>
        </div>
        <div className="bloque-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="campo">
            <label htmlFor="clave">Contraseña</label>
            <input id="clave" name="clave" type="password" className="input" autoComplete="current-password" required autoFocus />
          </div>
          {error && <div className="alerta mal">Contraseña incorrecta.</div>}
          <button className="btn" type="submit">Entrar</button>
        </div>
      </form>
    </main>
  );
}

export default async function Admin({ searchParams }) {
  const sp = await searchParams;
  if (!(await esAdmin())) return <Login error={sp?.error} />;

  const filtro = ESTADOS.includes(sp?.estado) ? sp.estado : '';
  const todas = await listarSolicitudes();
  const solicitudes = filtro ? todas.filter((s) => s.estado === filtro) : todas;
  const conteo = Object.fromEntries(ESTADOS.map((e) => [e, todas.filter((s) => s.estado === e).length]));

  return (
    <>
      <header className="masthead">
        <div className="wrap">
          <div>
            <Marca subtitulo="Panel" />
            <h1>Expedientes recibidos</h1>
            <p>{todas.length} expediente{todas.length === 1 ? '' : 's'} en total.</p>
          </div>
          <form method="post" action="/api/admin/logout">
            <button className="btn-sec" type="submit">Cerrar sesión</button>
          </form>
        </div>
      </header>
      <main className="wrap" style={{ paddingBlock: '24px 64px' }}>
        <nav className="admin-bar" style={{ marginBottom: 16 }} aria-label="Filtrar por estado">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link className="btn-sec" href="/admin" aria-current={!filtro ? 'page' : undefined}
              style={!filtro ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : undefined}>
              Todos ({todas.length})
            </Link>
            {ESTADOS.map((e) => (
              <Link key={e} className="btn-sec" href={`/admin?estado=${encodeURIComponent(e)}`}
                aria-current={filtro === e ? 'page' : undefined}
                style={filtro === e ? { borderColor: 'var(--accent)', color: 'var(--accent)', textDecoration: 'none' } : { textDecoration: 'none' }}>
                {e} ({conteo[e]})
              </Link>
            ))}
          </div>
        </nav>
        <div className="tabla-wrap">
          {solicitudes.length === 0 ? (
            <div className="vacio">
              {todas.length === 0
                ? 'Todavía no hay expedientes. Aparecerán aquí en cuanto alguien envíe el formulario.'
                : 'No hay expedientes con este estado.'}
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Folio</th><th>Fecha</th><th>Oficina</th><th>Empresa</th><th>RNC</th><th>Contacto</th><th>Pago</th><th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {solicitudes.map((s) => (
                  <tr key={s.id}>
                    <td className="mono"><Link href={`/admin/${s.id}`}>{s.folio}</Link></td>
                    <td className="mono">{fmtFecha(s.fecha)}</td>
                    <td>{s.oficina}</td>
                    <td><b>{s.empresa.razonSocial}</b>{s.empresa.proyecto && <div style={{ color: 'var(--muted)', fontSize: 13 }}>{s.empresa.proyecto}</div>}</td>
                    <td className="mono">{s.empresa.rnc}</td>
                    <td>{s.contacto.encargado}<div style={{ color: 'var(--muted)', fontSize: 13 }}>{s.contacto.correo}</div></td>
                    <td>{s.pago.porcentaje} %<div style={{ color: 'var(--muted)', fontSize: 13 }}>{s.pago.forma}</div></td>
                    <td><span className={`estado ${claseEstado(s.estado)}`}>{s.estado}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </>
  );
}
