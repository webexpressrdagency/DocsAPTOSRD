// Isotipo (mapa con sombrero) dentro de una tarjeta blanca, junto al nombre de la app.
export function Marca({ subtitulo = 'Recepción de documentos', enTarjeta = false, href }) {
  const contenido = (
    <>
      <span className="marca-iso">
        <img src="/isotipo.png" alt="" width="34" height="34" />
      </span>
      <span className="marca-txt">
        <b>DocsAPTOSRD</b>
        <span>{subtitulo}</span>
      </span>
    </>
  );
  const clase = `marca${enTarjeta ? ' en-tarjeta' : ''}`;
  return href ? (
    <a className={clase} href={href}>{contenido}</a>
  ) : (
    <div className={clase}>{contenido}</div>
  );
}

// Logo completo (isotipo + ApartamentosRD) sobre fondo blanco, para pies y confirmaciones.
export function LogoCompleto({ className = '' }) {
  return <img className={className} src="/logo.png" alt="ApartamentosRD" />;
}
