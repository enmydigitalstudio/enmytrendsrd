# Alojamiento en Cloudflare Workers (Static Assets)

- **Qué se publica:** solo `dist/`, que arma `scripts/build-dist.mjs` con una lista cerrada:
  - los archivos públicos de la raíz;
  - las imágenes de `assets/`;
  - el `index.html` de cada carpeta de producto;
  - `cloudflare/_headers` y `cloudflare/404.html`.

  El build falla si aparece algo no permitido (`.md`, `.py`, `.sh`, `.json`, `.sql`, `.age`, respaldos, archivos ocultos, `CNAME`, `wrangler`…) o si el sitemap apunta a una página que no existe.
- **Quién publica:** Workers Builds, **solo** desde `main`. Las compilaciones de otras ramas están desactivadas.
  - Build command: `node scripts/build-dist.mjs`
  - Deploy command: `npx wrangler@4.162.0 deploy`
  - Root directory: `/`
- **Cómo se aprueba un cambio:** rama, luego Pull Request revisado, luego merge a `main`. `main` tiene una regla que obliga a pasar por Pull Request y bloquea el push directo y el force-push.
- **Agregar un producto:**
  1. Crear la carpeta `slug/index.html` y sus fotos en `assets/`.
  2. Agregar la URL a `sitemap.xml`.
  3. Abrir el Pull Request.
- **Revertir una publicación:** en Workers & Pages, abrir `enmytrendsrd`, ir a **Deployments**, en la versión buena tocar **⋯** y luego **Rollback**. Después, revertir el commit en `main` con un Pull Request, para que el siguiente merge no vuelva a publicar el error.
- **Cambio de dominio:** ver `cloudflare/CUTOVER.md`.
