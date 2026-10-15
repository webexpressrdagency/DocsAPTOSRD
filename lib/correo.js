import nodemailer from 'nodemailer';
import { destinatariosPara } from '@/lib/oficinas';
import { REQUISITOS } from '@/lib/requisitos';

const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function transporte() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  const port = Number(SMTP_PORT) || 587;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

// Envía el aviso de un expediente nuevo. Nunca lanza: devuelve { enviado, error }.
export async function notificarExpediente(s, origen) {
  try {
    const t = transporte();
    if (!t) return { enviado: false, error: 'Faltan las variables SMTP_HOST, SMTP_USER y SMTP_PASS.' };
    const dest = destinatariosPara(s.oficina);
    if (!dest) return { enviado: false, error: `Oficina no reconocida: ${s.oficina}` };

    const enlace = `${origen}/admin/${s.id}`;
    const porReq = REQUISITOS.filter((r) => r.tipo === 'archivo')
      .map((r) => `${r.n}. ${r.titulo}: ${s.archivos.filter((a) => a.requisito === r.key).length} archivo(s)`);

    const texto = [
      `Nuevo expediente ${s.folio}`,
      '',
      `Oficina: ${s.oficina}`,
      `Empresa: ${s.empresa.razonSocial} (RNC ${s.empresa.rnc})`,
      s.empresa.proyecto ? `Proyecto: ${s.empresa.proyecto}` : null,
      `Contacto: ${s.contacto.encargado} · ${s.contacto.correo} · ${s.contacto.telefono}`,
      `Pago: ${s.pago.porcentaje} % · ${s.pago.forma}${s.pago.detalle ? ` (${s.pago.detalle})` : ''}`,
      '',
      ...porReq,
      '',
      `Ver documentos (requiere contraseña del panel): ${enlace}`,
    ].filter((l) => l !== null).join('\n');

    const fila = (k, v) => `<tr><td style="padding:4px 12px 4px 0;color:#586570">${esc(k)}</td><td style="padding:4px 0"><b>${esc(v)}</b></td></tr>`;
    const html = `
<div style="font-family:system-ui,Segoe UI,Arial,sans-serif;font-size:14px;color:#15202a;max-width:560px">
  <img src="${esc(origen)}/logo.png" alt="ApartamentosRD" height="56" style="display:block;margin:0 0 18px;height:56px;width:auto" />
  <p style="font:600 12px monospace;letter-spacing:.1em;text-transform:uppercase;color:#586570;margin:0">DocsAPTOSRD · Nuevo expediente</p>
  <h2 style="margin:6px 0 16px;font-family:monospace">${esc(s.folio)}</h2>
  <table style="border-collapse:collapse">
    ${fila('Oficina', s.oficina)}
    ${fila('Empresa', s.empresa.razonSocial)}
    ${fila('RNC', s.empresa.rnc)}
    ${s.empresa.proyecto ? fila('Proyecto', s.empresa.proyecto) : ''}
    ${fila('Contacto', `${s.contacto.encargado} · ${s.contacto.telefono}`)}
    ${fila('Correo', s.contacto.correo)}
    ${fila('Pago', `${s.pago.porcentaje} % · ${s.pago.forma}`)}
  </table>
  <p style="margin:16px 0 6px;color:#586570">Documentos recibidos</p>
  <ul style="margin:0;padding-left:18px">${porReq.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>
  <p style="margin:20px 0"><a href="${esc(enlace)}" style="background:#2154ab;color:#fff;padding:11px 18px;border-radius:12px;text-decoration:none;font-weight:600">Abrir expediente</a></p>
  <p style="color:#586570;font-size:12px">Los documentos no se adjuntan por seguridad. Se abren desde el panel con contraseña.</p>
</div>`;

    await t.sendMail({
      from: process.env.MAIL_FROM || `DocsAPTOSRD <${process.env.SMTP_USER}>`,
      to: dest.to,
      cc: dest.cc,
      replyTo: s.contacto.correo,
      subject: `[${s.oficina}] Nuevo expediente ${s.folio} · ${s.empresa.razonSocial}`,
      text: texto,
      html,
    });
    return { enviado: true };
  } catch (e) {
    return { enviado: false, error: String(e?.message || e).slice(0, 300) };
  }
}
