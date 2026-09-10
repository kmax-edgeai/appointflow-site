# appointflow.edge-ai.tech

Sitio público de **AppointFlow**, nombre comercial de Edge Comunicación E.I.R.L. (RUC 20603861371).

Sitio estático, sin build ni dependencias: HTML, una hoja de estilos y un archivo JS sin librerías.
Se publica con GitHub Pages desde la rama `main`.

```
index.html            portada
privacidad/           política de privacidad (Ley N.° 29733 · D.S. N.° 016-2024-JUS)
terminos/             términos del servicio
cookies/              política de cookies
assets/styles.css     sistema visual completo
assets/app.js         interacciones (demo del asistente, agenda, navegación)
CNAME                 dominio propio
```

## Desarrollo

No hay build. Abre `index.html`, o sirve la carpeta:

```bash
python3 -m http.server 4000
```

## Notas

- La política de privacidad y los términos son un borrador informado; requieren revisión
  de un abogado peruano en protección de datos antes de considerarse definitivos.
- Sin analítica ni píxeles de terceros: por eso no hay banner de consentimiento.
- No se usan logotipos ni íconos de Meta o WhatsApp. La atribución de marca va en el pie.
