#!/usr/bin/env node
// Arma ./dist con SOLO los archivos publicos de la tienda (lista cerrada) y verifica el resultado.
// Lo usa Workers Builds como "Build command". No necesita dependencias (Node 18+).
// Si algo no permitido aparece en dist, el build FALLA y no se despliega nada.
import { readdirSync, statSync, mkdirSync, copyFileSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { join, extname, relative, sep } from 'node:path';
import { createHash } from 'node:crypto';

const ROOT = process.cwd();
const DIST = join(ROOT, 'dist');

// 1) Archivos sueltos de la raiz que SI son publicos
const ROOT_FILES = ['index.html', 'favicon.ico', 'robots.txt', 'sitemap.xml', 'site.webmanifest', 'script.js', 'styles.css', 'locations.js'];
// 2) Imagenes de la tienda
const ASSET_EXT = new Set(['.webp', '.png', '.jpg', '.jpeg', '.avif', '.gif', '.svg', '.ico']);
// 3) Paginas de producto: carpetas de primer nivel con nombre tipo slug que tengan index.html (solo se copia index.html)
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const NOT_PRODUCT = new Set(['assets', 'scripts', 'cloudflare', 'dist', 'node_modules', 'docs', 'doc', 'test', 'tests', 'private', 'backup', 'backups', 'respaldos', 'src', 'tools', 'herramientas']);
// 4) Archivos propios de Cloudflare
const CF_FILES = [['cloudflare/_headers', '_headers'], ['cloudflare/404.html', '404.html']];

// Verificacion final
const ALLOWED_EXT = new Set(['.html', '.css', '.js', '.ico', '.txt', '.xml', '.webmanifest', ...ASSET_EXT]);
const DENY = [/\.md$/i, /\.py$/i, /\.sh$/i, /\.ps1$/i, /\.mjs$/i, /\.ts$/i, /\.json$/i, /\.jsonc$/i, /\.toml$/i, /\.ya?ml$/i,
  /\.bak$/i, /\.sql$/i, /\.age$/i, /dump/i, /\.env/i, /\.log$/i, /\.zip$/i, /\.tar/i, /\.gz$/i, /\.pem$/i, /\.key$/i,
  /\.map$/i, /(^|\/)\./, /CNAME$/, /wrangler/i, /README/i, /node_modules/, /secret/i, /password/i, /backup/i, /respaldo/i];

const fail = (m) => { console.error('ERROR: ' + m); process.exit(1); };
const copy = (src, dst) => { mkdirSync(join(dst, '..'), { recursive: true }); copyFileSync(src, dst); };

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST);
for (const f of ROOT_FILES) { if (!existsSync(join(ROOT, f))) fail(`falta ${f}`); copy(join(ROOT, f), join(DIST, f)); }
const walk = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
for (const p of walk(join(ROOT, 'assets'))) {
  const rel = relative(ROOT, p).split(sep).join('/');
  if (ASSET_EXT.has(extname(p).toLowerCase()) && !rel.split('/').some((s) => s.startsWith('.'))) copy(p, join(DIST, rel));
}
const products = [];
for (const n of readdirSync(ROOT)) {
  const p = join(ROOT, n);
  if (statSync(p).isDirectory() && SLUG.test(n) && !NOT_PRODUCT.has(n) && existsSync(join(p, 'index.html'))) {
    copy(join(p, 'index.html'), join(DIST, n, 'index.html')); products.push(n);
  }
}
for (const [s, d] of CF_FILES) { if (!existsSync(join(ROOT, s))) fail(`falta ${s}`); copy(join(ROOT, s), join(DIST, d)); }

// Verificacion
const files = walk(DIST).map((p) => relative(DIST, p).split(sep).join('/')).sort();
for (const f of files) {
  if (f === '_headers') continue;
  if (!ALLOWED_EXT.has(extname(f).toLowerCase())) fail(`extension no permitida en dist: ${f}`);
  if (DENY.some((r) => r.test(f))) fail(`archivo no permitido en dist: ${f}`);
}
// Cada URL del sitemap debe existir como pagina publicada
const locs = [...readFileSync(join(DIST, 'sitemap.xml'), 'utf8').matchAll(/<loc>https:\/\/enmytrendsrd\.com(\/[^<]*)<\/loc>/g)].map((m) => m[1]);
for (const l of locs) { const f = (l.endsWith('/') ? l + 'index.html' : l).slice(1); if (!files.includes(f)) fail(`el sitemap apunta a ${l} pero no esta en dist`); }
let total = 0;
for (const f of files) {
  const b = readFileSync(join(DIST, f)); total += b.length;
  console.log(`${createHash('sha256').update(b).digest('hex')}  ${b.length.toString().padStart(7)}  /${f}`);
}
console.log(`\nOK: ${files.length} archivos publicos (${(total / 1024).toFixed(0)} KiB). Productos: ${products.join(', ')}. Sitemap: ${locs.length} URL verificadas.`);
