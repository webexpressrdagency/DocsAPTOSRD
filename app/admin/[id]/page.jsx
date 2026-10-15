import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { esAdmin } from '@/lib/auth';
import { leerSolicitud } from '@/lib/datos';
import { ESTADOS, REQUISITOS, RE_ID, claseEstado } from '@/lib/requisitos';
import { Marca } from '../../Marca';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Expediente · DocsAPTOSRD' };

const fmtFecha = (iso) =>
  new Date(iso).toLocaleString('es-DO', { timeZone: 'America/Santo_Domingo', dateStyle: 'long', timeStyle: 'short' });
const fmtTam = (b) => (b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`);

export default async function Detalle({ params, searchParams }) {
  if (!(await esAdmin())) redirect('/admin');
  const { id } = await params;
  const sp = await searchParams;
  if (!RE_ID.test(id)) notFound();
  const s = await leerSolicitud(id);
  if (!s) notFound();

  const enlace = (a, descargar) =>
    `/api/admin/archivo?p=${encodeURIComponent(a.pathname)}&n=${encodeURIComponent(a.nombre)}${descargar ? '&descargar=1' : ''}`;

  return (
    <>
      <header className="masthead">
        <div className="wrap">
          <div>
            <Marca subtitulo="Panel" href="/admin" />
            <div className="eyebrow"><Link href="/admin">← Expedientes</Link></div>
            <h1 style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>{s.folio}</h1>
            <p>{s.oficina} · {s.empresa.razonSocial} · recibido el {fmtFecha(s.fecha)}</p>
          </div>
          <span className={`estado ${claseEstado(s.estado)}`}>{s.estado}</span>
        </div>
      </header>
      <main className="wrap layout">
        <div style={{ minWidth: 0 }}>
          <section className="bloque">
            <div className="bloque-head"><h2>Datos de la empresa</h2></div>
            <div className="bloque-body">
              <dl className="dl">
                <dt>Oficina</dt><dd>{s.oficina}</dd>
                <dt>Razón social</dt><dd>{s.empresa.razonSocial}</dd>
                <dt>RNC</dt><dd style={{ fontFamily: 'var(--mono)' }}>{s.empresa.rnc}</dd>
                <dt>Proyecto u obra</dt><dd>{s.empresa.proyecto || '—'}</dd>
              </dl>
            </div>
          </section>

          <section className="bloque">
            <div className="bloque-head"><h2>Requisitos</h2></div>
            {REQUISITOS.map((r) => {
              const docs = s.archivos.filter((a) => a.requisito === r.key);
              return (
                <div key={r.key} className="req ok">
                  <div className="req-n">{String(r.n).padStart(2, '0')}</div>
                  <div style={{ minWidth: 0 }}><h3>{r.titulo}</h3></div>
                  <div className="req-cuerpo">
                    {r.tipo === 'archivo' && (
                      <ul className="archivos" style={{ marginTop: 0 }}>
                        {docs.map((a) => (
                          <li key={a.pathname}>
                            <span className="nom" title={a.nombre}>{a.nombre}</span>
                            <span className="meta">{fmtTam(a.tamano)}</span>
                            <span className="acciones-archivo">
                              <a href={enlace(a)} target="_blank" rel="noopener">Ver</a>
                              <a href={enlace(a, true)}>Descargar</a>
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {r.tipo === 'contacto' && (
                      <dl className="dl">
                        <dt>Correo</dt><dd>{s.contacto.correo}</dd>
                        <dt>Persona encargada</dt><dd>{s.contacto.encargado}</dd>
                        <dt>Teléfono</dt><dd>{s.contacto.telefono}</dd>
                      </dl>
                    )}
                    {r.tipo === 'pago' && (
                      <dl className="dl">
                        <dt>Porcentaje</dt><dd>{s.pago.porcentaje} %</dd>
                        <dt>Forma de pago</dt><dd>{s.pago.forma}</dd>
                        <dt>Detalle</dt><dd style={{ whiteSpace: 'pre-wrap' }}>{s.pago.detalle || '—'}</dd>
                      </dl>
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        </div>

        <aside className="aside">
          <form className="control" method="post" action="/api/admin/estado">
            <div className="eyebrow">Revisión</div>
            <input type="hidden" name="id" value={s.id} />
            <div className="campo" style={{ marginTop: 12 }}>
              <label htmlFor="estado">Estado</label>
              <select id="estado" name="estado" className="input" defaultValue={s.estado}>
                {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div className="campo" style={{ marginTop: 12 }}>
              <label htmlFor="nota">Observaciones internas</label>
              <textarea id="nota" name="nota" className="input" defaultValue={s.nota} placeholder="Ej.: El Registro Mercantil está vencido." />
            </div>
            <button className="btn" type="submit" style={{ marginTop: 14 }}>Guardar revisión</button>
            {sp?.guardado && <div className="alerta bien">Revisión guardada.</div>}
            {s.notificacion && !s.notificacion.enviado && (
              <div className="alerta mal">El aviso por correo no se envió: {s.notificacion.error}</div>
            )}
            {s.estadoFecha && <p className="nota">Última actualización: {fmtFecha(s.estadoFecha)}</p>}
          </form>
        </aside>
      </main>
    </>
  );
}
