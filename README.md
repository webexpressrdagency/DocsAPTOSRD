# DocsAPTOSRD

Formulario público para recibir el expediente de 10 requisitos obligatorios, con panel
administrativo protegido por contraseña. Next.js 15 + Vercel Blob (almacenamiento privado).

## Desplegar en Vercel
1. Suba esta carpeta a un repositorio de GitHub e impórtelo en Vercel (equipo WebExpress).
2. En el proyecto: Storage → Create → Blob → acceso **Private** → conectar al proyecto
   (esto crea la variable BLOB_READ_WRITE_TOKEN).
3. Settings → Environment Variables → `ADMIN_PASSWORD` = la contraseña del panel.
4. Correo (SMTP del buzón que enviará los avisos): `SMTP_HOST`, `SMTP_PORT` (587 por defecto),
   `SMTP_USER`, `SMTP_PASS` y, opcional, `MAIL_FROM` (ej. `DocsAPTOSRD <legal@apartamentosrd.com.do>`).
5. Redeploy.

## Correos por oficina
Cada expediente envía un aviso a legal@ y duediligence@, con copia al director de la oficina elegida
y a Ventas@. Destinatarios y oficinas en `lib/oficinas.js`. Los documentos no van adjuntos;
el correo trae un enlace al panel. Si el envío falla, el expediente se guarda igual y el panel lo indica.

## Rutas
- `/`        formulario para las empresas
- `/admin`   panel: lista de expedientes, filtros por estado, detalle con ver/descargar archivos

## Cambiar la lista de requisitos
Edite `lib/requisitos.js`. El formulario, la validación y el panel se actualizan solos.
