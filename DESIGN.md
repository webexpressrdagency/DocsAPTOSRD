# DocsAPTOSRD · Sistema de diseño

Tomado del login de Apartamentos RD Reuniones. Una sola apariencia (azul de marca), sin modo oscuro.

## Color
| Token | Valor | Uso |
|---|---|---|
| --bg-a / --bg-b / --bg-c | #2a5fbf → #1a4790 → #184489 | Fondo: degradado a 160° |
| --surface | #d1e1fc | Tarjetas (borde blanco 85 %, sombra azul marino) |
| --surface-2 | #f1f6fe | Campos, zonas de carga, filas de archivo |
| --ink | #12233d | Títulos y texto |
| --muted / --faint | #4a5a72 / #8a97ab | Texto secundario / placeholder |
| --accent | #1f52a6 | Subtítulos en caps, pasos completados, enlaces |
| --btn-a → --btn-b | #3871e2 → #2154ab | Botón principal (degradado 135°) |

## Forma y tipo
- Tarjetas: radio 22 px. Campos y botones: radio 14 px. Isotipo: tarjeta blanca de 52 px, radio 16 px.
- Tipografía: Inter (texto), IBM Plex Mono (folio, números, etiquetas).

## Marca
- `public/isotipo.png`: mapa con sombrero. Va en tarjeta blanca junto a "DocsAPTOSRD" (componente `Marca`).
- `public/logo.png`: logo completo ApartamentosRD, solo sobre fondo claro (pie, confirmación, correo).
- `app/icon.png` y `app/apple-icon.png`: ícono de pestaña y de pantalla de inicio.
