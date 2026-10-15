'use client';

import { useMemo, useRef, useState } from 'react';
import { upload } from '@vercel/blob/client';
import {
  REQUISITOS,
  FORMAS_PAGO,
  TIPOS_PERMITIDOS,
  TAMANO_MAXIMO,
  validarDatos,
} from '@/lib/requisitos';
import { NOMBRES_OFICINA } from '@/lib/oficinas';
import { LogoCompleto } from './Marca';

const fmtTam = (b) => (b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`);

function nombreSeguro(nombre) {
  const punto = nombre.lastIndexOf('.');
  const ext = punto > 0 ? nombre.slice(punto + 1).toLowerCase().replace(/[^a-z0-9]/g, '') : '';
  const base = (punto > 0 ? nombre.slice(0, punto) : nombre)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'documento';
  return ext ? `${base}.${ext}` : base;
}

function nuevoId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

function ZonaArchivos({ req, archivos, onAgregar, onQuitar, progreso, bloqueado }) {
  const inputRef = useRef(null);
  const [over, setOver] = useState(false);
  const [aviso, setAviso] = useState('');

  function recibir(lista) {
    const ok = [];
    const rechazados = [];
    for (const f of lista) {
      if (!TIPOS_PERMITIDOS.includes(f.type)) rechazados.push(`${f.name}: use PDF, JPG o PNG`);
      else if (f.size > TAMANO_MAXIMO) rechazados.push(`${f.name}: supera 20 MB`);
      else ok.push(f);
    }
    setAviso(rechazados.join(' · '));
    if (ok.length) onAgregar(ok);
  }

  return (
    <div>
      <div
        className={`drop${over ? ' over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); if (!bloqueado) setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); if (!bloqueado) recibir([...e.dataTransfer.files]); }}
      >
        <small>Arrastre los archivos aquí o</small>
        <button type="button" className="btn-sec" disabled={bloqueado} onClick={() => inputRef.current?.click()}>
          {archivos.length ? 'Agregar otro archivo' : 'Seleccionar archivo'}
        </button>
        <input
          ref={inputRef}
          id={`archivo-${req.key}`}
          className="sr-only"
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          onChange={(e) => { recibir([...e.target.files]); e.target.value = ''; }}
          aria-label={`Archivos para: ${req.titulo}`}
          tabIndex={-1}
        />
      </div>
      {aviso && <div className="err" style={{ marginTop: 6 }}>{aviso}</div>}
      {archivos.length > 0 && (
        <ul className="archivos">
          {archivos.map((f, i) => {
            const p = progreso[`${req.key}:${i}`];
            return (
              <li key={`${f.name}-${f.size}-${i}`}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="nom" title={f.name}>{f.name}</div>
                  {p != null && <div className="barra-mini"><i style={{ width: `${p}%` }} /></div>}
                </div>
                <span className="meta">{fmtTam(f.size)}</span>
                {!bloqueado && (
                  <button type="button" className="x" aria-label={`Quitar ${f.name}`} onClick={() => onQuitar(i)}>×</button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function FormularioSolicitud() {
  const [empresa, setEmpresa] = useState({ oficina: '', razonSocial: '', rnc: '', proyecto: '' });
  const [contacto, setContacto] = useState({ correo: '', encargado: '', telefono: '' });
  const [pago, setPago] = useState({ porcentaje: '', forma: '', detalle: '' });
  const [archivos, setArchivos] = useState(() => Object.fromEntries(REQUISITOS.map((r) => [r.key, []])));
  const [declaracion, setDeclaracion] = useState(false);
  const [tocados, setTocados] = useState({});
  const [estado, setEstado] = useState('editando'); // editando | enviando | enviado
  const [progreso, setProgreso] = useState({});
  const [error, setError] = useState('');
  const [folio, setFolio] = useState('');

  const errores = useMemo(() => validarDatos({ empresa, contacto, pago }, NOMBRES_OFICINA), [empresa, contacto, pago]);
  const empresaOk = !errores.oficina && !errores.razonSocial && !errores.rnc;

  const completo = useMemo(() => {
    const c = {};
    for (const r of REQUISITOS) {
      if (r.tipo === 'archivo') c[r.key] = archivos[r.key].length > 0;
      if (r.tipo === 'contacto') c[r.key] = !errores.correo && !errores.encargado && !errores.telefono;
      if (r.tipo === 'pago') c[r.key] = !errores.porcentaje && !errores.forma && !errores.detalle;
    }
    return c;
  }, [archivos, errores]);

  const hechos = Object.values(completo).filter(Boolean).length;
  const listo = hechos === REQUISITOS.length && empresaOk && declaracion;
  const bloqueado = estado !== 'editando';

  const toca = (k) => setTocados((t) => ({ ...t, [k]: true }));
  const errDe = (k) => (tocados[k] || tocados.__todo ? errores[k] : null);

  async function enviar(e) {
    e.preventDefault();
    setTocados((t) => ({ ...t, __todo: true }));
    if (!listo) {
      setError('Faltan requisitos por completar. Revise los marcados como pendientes.');
      return;
    }
    setError('');
    setEstado('enviando');
    const id = nuevoId();
    try {
      const subidos = [];
      for (const r of REQUISITOS) {
        if (r.tipo !== 'archivo') continue;
        const lista = archivos[r.key];
        for (let i = 0; i < lista.length; i++) {
          const f = lista[i];
          const clave = `${r.key}:${i}`;
          setProgreso((p) => ({ ...p, [clave]: 0 }));
          const res = await upload(`solicitudes/${id}/${r.key}/${nombreSeguro(f.name)}`, f, {
            access: 'private',
            handleUploadUrl: '/api/upload',
            clientPayload: id,
            contentType: f.type,
            multipart: f.size > 8 * 1024 * 1024,
            onUploadProgress: ({ percentage }) => setProgreso((p) => ({ ...p, [clave]: Math.round(percentage) })),
          });
          setProgreso((p) => ({ ...p, [clave]: 100 }));
          subidos.push({ pathname: res.pathname, nombre: f.name });
        }
      }
      const resp = await fetch('/api/solicitud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, empresa, contacto, pago, archivos: subidos }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data.error || 'No se pudo registrar el expediente.');
      setFolio(data.folio);
      setEstado('enviado');
      window.scrollTo({ top: 0 });
    } catch (err) {
      setEstado('editando');
      setProgreso({});
      setError(`${err.message || 'Error de conexión.'} Revise su conexión e intente de nuevo; no hace falta volver a seleccionar los archivos.`);
    }
  }

  if (estado === 'enviado') {
    return (
      <main className="wrap">
        <div className="confirmacion bloque">
          <div className="bloque-body" style={{ padding: 28 }}>
            <LogoCompleto className="logo-confirmacion" />
            <div className="eyebrow">Expediente recibido</div>
            <div className="folio">{folio}</div>
            <p>
              Recibimos los documentos de <b>{empresa.razonSocial}</b>. Guarde este número de folio para
              cualquier consulta. Le contactaremos a <b>{contacto.correo}</b> si hace falta alguna corrección.
            </p>
            <p className="nota">Puede cerrar esta página.</p>
          </div>
        </div>
      </main>
    );
  }

  const cuerpo = (r) => {
    if (r.tipo === 'archivo') {
      return (
        <ZonaArchivos
          req={r}
          archivos={archivos[r.key]}
          progreso={progreso}
          bloqueado={bloqueado}
          onAgregar={(fs) => setArchivos((a) => ({ ...a, [r.key]: [...a[r.key], ...fs] }))}
          onQuitar={(i) => setArchivos((a) => ({ ...a, [r.key]: a[r.key].filter((_, j) => j !== i) }))}
        />
      );
    }
    if (r.tipo === 'contacto') {
      return (
        <div className="grid3">
          <div className="campo">
            <label htmlFor="correo">Correo electrónico</label>
            <input id="correo" className="input" type="email" autoComplete="email" disabled={bloqueado}
              value={contacto.correo} aria-invalid={!!errDe('correo')}
              onChange={(e) => setContacto({ ...contacto, correo: e.target.value })} onBlur={() => toca('correo')} />
            {errDe('correo') && <span className="err">{errDe('correo')}</span>}
          </div>
          <div className="campo">
            <label htmlFor="encargado">Persona encargada</label>
            <input id="encargado" className="input" autoComplete="name" disabled={bloqueado}
              value={contacto.encargado} aria-invalid={!!errDe('encargado')}
              onChange={(e) => setContacto({ ...contacto, encargado: e.target.value })} onBlur={() => toca('encargado')} />
            {errDe('encargado') && <span className="err">{errDe('encargado')}</span>}
          </div>
          <div className="campo">
            <label htmlFor="telefono">Número de contacto</label>
            <input id="telefono" className="input" type="tel" autoComplete="tel" placeholder="809-000-0000" disabled={bloqueado}
              value={contacto.telefono} aria-invalid={!!errDe('telefono')}
              onChange={(e) => setContacto({ ...contacto, telefono: e.target.value })} onBlur={() => toca('telefono')} />
            {errDe('telefono') && <span className="err">{errDe('telefono')}</span>}
          </div>
        </div>
      );
    }
    return (
      <div className="grid2">
        <div className="campo">
          <label htmlFor="porcentaje">Porcentaje (%)</label>
          <input id="porcentaje" className="input" type="number" inputMode="decimal" min="1" max="100" step="0.01" disabled={bloqueado}
            value={pago.porcentaje} aria-invalid={!!errDe('porcentaje')}
            onChange={(e) => setPago({ ...pago, porcentaje: e.target.value })} onBlur={() => toca('porcentaje')} />
          {errDe('porcentaje') && <span className="err">{errDe('porcentaje')}</span>}
        </div>
        <div className="campo">
          <label htmlFor="forma">Forma de pago</label>
          <select id="forma" className="input" disabled={bloqueado} value={pago.forma} aria-invalid={!!errDe('forma')}
            onChange={(e) => setPago({ ...pago, forma: e.target.value })} onBlur={() => toca('forma')}>
            <option value="">Seleccione…</option>
            {FORMAS_PAGO.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
          {errDe('forma') && <span className="err">{errDe('forma')}</span>}
        </div>
        <div className="campo span2">
          <label htmlFor="detalle">
            Detalle de pago <span className="opc">(opcional)</span>
          </label>
          <textarea id="detalle" className="input" disabled={bloqueado} placeholder="Ej.: 30 % de avance a la firma, el resto contra cubicaciones."
            value={pago.detalle} aria-invalid={!!errDe('detalle')}
            onChange={(e) => setPago({ ...pago, detalle: e.target.value })} onBlur={() => toca('detalle')} />
          {errDe('detalle') && <span className="err">{errDe('detalle')}</span>}
        </div>
      </div>
    );
  };

  return (
    <form className="wrap layout" onSubmit={enviar} noValidate>
      <div style={{ minWidth: 0 }}>
        <section className="bloque">
          <div className="bloque-head">
            <h2>Datos de la empresa</h2>
            <p>Identifican el expediente y definen qué oficina lo recibe.</p>
          </div>
          <div className="bloque-body grid2">
            <div className="campo span2">
              <label htmlFor="oficina">Oficina</label>
              <select id="oficina" className="input" disabled={bloqueado} value={empresa.oficina} aria-invalid={!!errDe('oficina')}
                onChange={(e) => setEmpresa({ ...empresa, oficina: e.target.value })} onBlur={() => toca('oficina')}>
                <option value="">Seleccione la oficina…</option>
                {NOMBRES_OFICINA.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
              {errDe('oficina') && <span className="err">{errDe('oficina')}</span>}
            </div>
            <div className="campo span2">
              <label htmlFor="razonSocial">Razón social</label>
              <input id="razonSocial" className="input" autoComplete="organization" disabled={bloqueado}
                value={empresa.razonSocial} aria-invalid={!!errDe('razonSocial')}
                onChange={(e) => setEmpresa({ ...empresa, razonSocial: e.target.value })} onBlur={() => toca('razonSocial')} />
              {errDe('razonSocial') && <span className="err">{errDe('razonSocial')}</span>}
            </div>
            <div className="campo">
              <label htmlFor="rnc">RNC</label>
              <input id="rnc" className="input" inputMode="numeric" placeholder="1-01-00000-0" disabled={bloqueado}
                value={empresa.rnc} aria-invalid={!!errDe('rnc')}
                onChange={(e) => setEmpresa({ ...empresa, rnc: e.target.value })} onBlur={() => toca('rnc')} />
              {errDe('rnc') && <span className="err">{errDe('rnc')}</span>}
            </div>
            <div className="campo">
              <label htmlFor="proyecto">Proyecto u obra <span className="opc">(opcional)</span></label>
              <input id="proyecto" className="input" disabled={bloqueado}
                value={empresa.proyecto} onChange={(e) => setEmpresa({ ...empresa, proyecto: e.target.value })} />
            </div>
          </div>
        </section>

        <section className="bloque" aria-labelledby="titulo-req">
          <div className="bloque-head">
            <h2 id="titulo-req">Requisitos obligatorios</h2>
            <p>Los diez son obligatorios para enviar el expediente.</p>
          </div>
          {REQUISITOS.map((r) => (
            <div key={r.key} id={`req-${r.key}`} className={`req${completo[r.key] ? ' ok' : ''}`}>
              <div className="req-n" aria-hidden="true">{String(r.n).padStart(2, '0')}</div>
              <div style={{ minWidth: 0 }}>
                <div className="req-top">
                  <h3>{r.titulo}</h3>
                  <span className={`pill ${completo[r.key] ? 'ok' : 'pend'}`}>{completo[r.key] ? 'Completo' : 'Pendiente'}</span>
                </div>
                {r.ayuda && <p className="req-ayuda">{r.ayuda}</p>}
              </div>
              <div className="req-cuerpo">{cuerpo(r)}</div>
            </div>
          ))}
        </section>
      </div>

      <aside className="aside">
        <div className="control">
          <div className="eyebrow">Control del expediente</div>
          <div className="contador" style={{ marginTop: 10 }}>
            <b>{hechos}</b><span>de {REQUISITOS.length} requisitos</span>
          </div>
          <div className="barra" role="progressbar" aria-valuemin={0} aria-valuemax={REQUISITOS.length} aria-valuenow={hechos}>
            <i style={{ width: `${(hechos / REQUISITOS.length) * 100}%` }} />
          </div>
          <ul className="lista-control">
            {REQUISITOS.map((r) => (
              <li key={r.key}>
                <a href={`#req-${r.key}`}>
                  <span className="n">{String(r.n).padStart(2, '0')}</span>
                  <span className="t" title={r.titulo}>{r.titulo}</span>
                  <span className={`chk${completo[r.key] ? ' ok' : ''}`} aria-label={completo[r.key] ? 'Completo' : 'Pendiente'} />
                </a>
              </li>
            ))}
          </ul>
          <label className="declaracion" htmlFor="declaracion">
            <input id="declaracion" type="checkbox" checked={declaracion} disabled={bloqueado}
              onChange={(e) => setDeclaracion(e.target.checked)} />
            <span>Declaro que los documentos entregados son auténticos y están vigentes.</span>
          </label>
          {!empresaOk && tocados.__todo && <div className="alerta mal">Complete los datos de la empresa.</div>}
          <button className="btn" type="submit" disabled={bloqueado || !listo}>
            {estado === 'enviando' ? 'Enviando documentos…' : 'Enviar expediente'}
          </button>
          {!listo && estado === 'editando' && (
            <p className="nota">
              {hechos < REQUISITOS.length
                ? `Faltan ${REQUISITOS.length - hechos} requisito${REQUISITOS.length - hechos === 1 ? '' : 's'}.`
                : !empresaOk ? 'Faltan los datos de la empresa.' : 'Marque la declaración para enviar.'}
            </p>
          )}
          {estado === 'enviando' && <p className="nota">No cierre esta página hasta ver el número de folio.</p>}
          {error && <div className="alerta mal" role="alert">{error}</div>}
        </div>
      </aside>
    </form>
  );
}
