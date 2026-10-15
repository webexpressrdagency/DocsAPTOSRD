import FormularioSolicitud from './FormularioSolicitud';
import { Marca, LogoCompleto } from './Marca';

export default function Page() {
  return (
    <>
      <header className="masthead">
        <div className="wrap">
          <div>
            <Marca />
            <h1>Entrega de expediente</h1>
            <p>
              Complete los diez requisitos del expediente. El envío se habilita cuando todos estén
              completos. Formatos aceptados: PDF, JPG o PNG, hasta 20 MB por archivo.
            </p>
          </div>
        </div>
      </header>
      <FormularioSolicitud />
      <footer className="wrap pie">
        <span className="logo-tarjeta"><LogoCompleto /></span>
        <p>Departamento de Cumplimiento · Apartamentos RD</p>
      </footer>
    </>
  );
}
