/* Enmy Trends RD · Tienda v15: una página por producto */
'use strict';

// Número de WhatsApp del negocio en formato internacional, sin "+" ni guiones (wa.me)
const WHATSAPP_NUMBER = '18296540649'; // +1 (829) 654-0649

/* ---------- Catálogo (fuente única del front) ----------
 * El HTML trae el mismo texto y precio como respaldo si JS no carga.
 * OJO: <title>, meta description, og:*, twitter:* y JSON-LD de cada página NO se actualizan solos.
 * v15: cada página de producto fija su producto con <body data-producto="...">. La portada no tiene formulario.
 * El servidor de crear-pedido (v20) admite producto_id led-auto-rgb (1499),
 * parlante-rgb-micro (1299) y masajeador-facial (1199). El navegador NUNCA envía el precio:
 * el servidor lo calcula.
 */
const PRODUCTS = {
  'led-auto-rgb': {
    id: 'led-auto-rgb',
    name: 'Cinta LED para carro 3 m',
    orderName: 'Cinta LED para carro (3 metros)',
    sku: 'TLC-001',
    price: 1499,
    summaryMeta: '3 metros · envío incluido',
    stickyMeta: 'Cinta LED · Envío incluido',
    photo: '/assets/cinta-led-carro-interior.webp',
    photoW: 800,
    photoH: 638
  },
  'parlante-rgb-micro': {
    id: 'parlante-rgb-micro',
    name: 'Mini parlante Bluetooth RGB con micrófono',
    orderName: 'Mini parlante Bluetooth RGB con micrófono (karaoke)',
    sku: 'MPM-001',
    price: 1299,
    summaryMeta: 'Con micrófono · envío incluido',
    stickyMeta: 'Parlante RGB · Envío incluido',
    photo: '/assets/parlante-rgb-01.webp',
    photoW: 788,
    photoH: 800
  },
  'masajeador-facial': {
    id: 'masajeador-facial',
    name: 'Masajeador facial de microcorriente',
    orderName: 'Masajeador facial de microcorriente',
    sku: 'MAS-001',
    price: 1199,
    summaryMeta: 'Color rosado · envío incluido',
    stickyMeta: 'Masajeador · Envío incluido',
    photo: '/assets/masajeador-01.webp',
    photoW: 800,
    photoH: 624
  }
};
const PRODUCT_IDS = Object.keys(PRODUCTS);
// Producto de la página: lo fija <body data-producto="..."> (solo en las páginas de producto)
const PAGE_PRODUCT_ID = (document.body && PRODUCTS[document.body.dataset.producto]) ? document.body.dataset.producto : null;
const DEFAULT_PRODUCT_ID = PAGE_PRODUCT_ID || 'led-auto-rgb';
const CURRENCY = 'RD$';
const formatPrice = (n) => `${CURRENCY}${n.toLocaleString('en-US')}`;

let selectedProductId = DEFAULT_PRODUCT_ID;
const currentProduct = () => PRODUCTS[selectedProductId] || PRODUCTS[DEFAULT_PRODUCT_ID];

/* ---------- Configuración de pedidos ----------
 * ORDERS_ENABLED          → true solo cuando la Edge Function `crear-pedido` esté probada y abierta en el servidor.
 * WHATSAPP_ORDERS_ENABLED → true para recibir pedidos enviándolos por WhatsApp (sin backend).
 * Con ambos en false los pedidos están CERRADOS: el formulario queda desactivado y no recoge datos.
 * Prueba interna del formulario y del resumen: abrir la página con ?demo=1 (no envía ni guarda nada).
 */
const ORDERS_ENABLED = true;
const WHATSAPP_ORDERS_ENABLED = false;
// URL pública de la Edge Function (no es un secreto). Solo se usa si ORDERS_ENABLED = true.
const ORDER_ENDPOINT = 'https://kavacbwosbjuaokflplm.supabase.co/functions/v1/crear-pedido';
// Site key PÚBLICA de Cloudflare Turnstile del dominio de producción (se configura al crear el widget).
// Vacía = el widget no se muestra y no se carga ningún script de Cloudflare. Nunca poner aquí la secret key.
const TURNSTILE_SITE_KEY = '0x4AAAAAAF6qQcdUZtt49bAr';
// Perfil de Instagram de la tienda. ÚNICO lugar donde se configura.
// Vacío = el enlace de Instagram del pie NO se muestra. Formato: 'https://www.instagram.com/USUARIO/'
const INSTAGRAM_URL = '';
const INSTAGRAM_URL_RE = /^https:\/\/(www\.)?instagram\.com\/[A-Za-z0-9._]{1,30}\/?$/;

// Catálogo provincia → municipios (locations.js, copia del de la Edge Function)
const LOCATIONS = window.LOCATIONS || {};
const PROVINCIAS = Object.keys(LOCATIONS);
// Límites iguales a los del servidor y a los CHECK de la base de datos
const LIMITS = { nombre: [3, 100], direccion: [8, 250], referencia: [0, 200] };
// El servidor rechaza los signos < > y los caracteres de control en los textos
const FORBIDDEN_CHARS = /[<>\u0000-\u001f\u007f]/;

/** Normaliza un teléfono dominicano a 10 dígitos (8091234567) o devuelve null. */
function normalizeDRPhone(raw) {
  let d = String(raw || '').replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('1')) d = d.slice(1);
  return /^(809|829|849)\d{7}$/.test(d) ? d : null;
}
const prettyPhone = (d) => `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;

function getFormData(form) {
  const f = new FormData(form);
  // Igual que el servidor: normaliza a NFC y quita espacios al principio y al final (además une espacios repetidos)
  const clean = (k) => String(f.get(k) || '').normalize('NFC').replace(/\s+/g, ' ').trim();
  // v15: sin selector; el producto es siempre el de la página (data-producto del <body>)
  const producto_id = PAGE_PRODUCT_ID || selectedProductId;
  return {
    nombre: clean('nombre'),
    whatsapp: clean('whatsapp'),
    provincia: clean('provincia'),
    municipio: clean('municipio'),
    direccion: clean('direccion'),
    referencia: clean('referencia'),
    producto_id
  };
}

/** Devuelve { valid, errors, data } con mensajes amigables. */
function validateOrder(data) {
  const errors = {};
  if (!PRODUCTS[data.producto_id]) errors.producto_id = 'Elige un producto.';
  if (data.nombre.length < LIMITS.nombre[0] || !/\s/.test(data.nombre)) errors.nombre = 'Escribe tu nombre y apellido.';
  else if (data.nombre.length > LIMITS.nombre[1]) errors.nombre = `Máximo ${LIMITS.nombre[1]} caracteres.`;
  const phone = normalizeDRPhone(data.whatsapp);
  if (!data.whatsapp) errors.whatsapp = 'Necesitamos tu WhatsApp para confirmar el pedido.';
  else if (!phone) errors.whatsapp = 'Revisa el número: deben ser 10 dígitos y empezar con 809, 829 u 849.';
  if (!PROVINCIAS.includes(data.provincia)) errors.provincia = 'Selecciona tu provincia.';
  if (!(LOCATIONS[data.provincia] || []).includes(data.municipio)) errors.municipio = 'Selecciona tu municipio.';
  if (data.direccion.length < LIMITS.direccion[0]) errors.direccion = 'Escribe tu dirección con sector, calle y número, para que el mensajero te encuentre.';
  else if (data.direccion.length > LIMITS.direccion[1]) errors.direccion = `Máximo ${LIMITS.direccion[1]} caracteres.`;
  // Referencia: opcional (vacía es válida), máximo 200 caracteres tras recortar espacios, sin < > ni caracteres de control
  if (data.referencia.length > LIMITS.referencia[1]) errors.referencia = `La referencia admite máximo ${LIMITS.referencia[1]} caracteres (tiene ${data.referencia.length}).`;
  ['nombre', 'direccion', 'referencia'].forEach((k) => {
    if (!errors[k] && FORBIDDEN_CHARS.test(data[k])) errors[k] = k === 'referencia' ? 'Quita los signos < y > de la referencia.' : 'Quita los signos < y >.';
  });
  return { valid: Object.keys(errors).length === 0, errors, data: { ...data, whatsapp: phone || data.whatsapp } };
}

/** Mensaje de pedido listo para WhatsApp. */
function buildWhatsAppMessage(data) {
  const p = PRODUCTS[data.producto_id] || currentProduct();
  const lines = [
    '¡Hola, Enmy Trends RD! Quiero hacer este pedido:',
    '',
    `• Producto: ${p.orderName}`,
    `• Precio: ${formatPrice(p.price)} (envío incluido, pago al recibir)`,
    '',
    `• Nombre: ${data.nombre}`,
    `• WhatsApp: ${normalizeDRPhone(data.whatsapp) ? prettyPhone(normalizeDRPhone(data.whatsapp)) : data.whatsapp}`,
    `• Provincia: ${data.provincia}`,
    `• Municipio: ${data.municipio}`,
    `• Dirección: ${data.direccion}`
  ];
  if (data.referencia) lines.push(`• Referencia: ${data.referencia}`);
  return lines.join('\n');
}
const whatsAppUrl = (text) => `https://wa.me/${WHATSAPP_NUMBER}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

/** Clave de idempotencia (UUID v4, la función la exige en ese formato). */
function newIdempotencyKey() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** Cuerpo exacto que acepta el servidor (campos extra → 400). El precio lo fija el servidor. */
function buildOrderPayload(data, captchaToken, idempotencyKey) {
  return {
    nombre_cliente: data.nombre,
    telefono: data.whatsapp, // 10 dígitos; el servidor lo normaliza a +1XXXXXXXXXX
    provincia: data.provincia,
    municipio: data.municipio,
    direccion: data.direccion,
    referencia: data.referencia,
    producto_id: data.producto_id,
    cantidad: 1,
    captcha_token: captchaToken,
    idempotency_key: idempotencyKey
  };
}

/**
 * Envía el pedido a la Edge Function `crear-pedido`. El navegador NO escribe directo en la base de datos.
 * Con ORDERS_ENABLED = false sale de inmediato sin hacer ninguna petición (la función, además,
 * tiene su propio interruptor ORDERS_ENABLED en el servidor y responde 503 si no es 'true').
 * - Misma idempotencyKey para el mismo pedido: si el cliente vuelve a enviar los mismos datos, no se duplica.
 * - Sin reintentos automáticos: el token de Turnstile es de un solo uso; el cliente reintenta a mano.
 * @returns {Promise<{ok:boolean, enabled:boolean, status?:number, error?:string}>}
 */
async function submitOrder(data, captchaToken, idempotencyKey) {
  if (!ORDERS_ENABLED || !ORDER_ENDPOINT) return { ok: false, enabled: false };
  if (!captchaToken) return { ok: false, enabled: true, error: 'Completa la verificación de seguridad.' };
  try {
    const res = await fetch(ORDER_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(buildOrderPayload(data, captchaToken, idempotencyKey)),
      credentials: 'omit', cache: 'no-store',
      // Sin respuesta en 20 s → error genérico; el reintento manual usa la misma clave (no duplica)
      signal: typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(20000) : undefined
    });
    if (res.status === 201) return { ok: true, enabled: true, status: 201 };
    const body = await res.json().catch(() => ({}));
    // Solo los 400 (validación), 409 (misma clave con otros datos) y 429 (demasiados intentos) traen un mensaje pensado para el cliente
    const showable = [400, 409, 429].includes(res.status) && typeof body.error === 'string';
    return { ok: false, enabled: true, status: res.status, error: showable ? body.error : '' };
  } catch {
    return { ok: false, enabled: true, error: '' };
  }
}

function initGalleries() {
  document.querySelectorAll('[data-gallery]').forEach((gal) => {
    const main = gal.querySelector('[data-gallery-main]');
    if (!main) return;
    gal.querySelectorAll('[data-gallery-thumb]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const src = btn.getAttribute('data-src');
        if (!src) return;
        main.src = src;
        const w = btn.getAttribute('data-width');
        const h = btn.getAttribute('data-height');
        if (w) main.width = Number(w);
        if (h) main.height = Number(h);
        const alt = btn.getAttribute('data-alt');
        if (alt) main.alt = alt;
        gal.querySelectorAll('[data-gallery-thumb]').forEach((b) => {
          if (b === btn) b.setAttribute('aria-current', 'true');
          else b.removeAttribute('aria-current');
        });
      });
    });
  });
}

/* ---------- UI ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const yearEl0 = document.getElementById('year');
  if (yearEl0) yearEl0.textContent = new Date().getFullYear();
  // Instagram: solo se muestra si INSTAGRAM_URL está configurada y tiene un formato válido
  const igItem = document.getElementById('instagram-item');
  const igLink = document.getElementById('instagram-link');
  if (igItem && igLink && INSTAGRAM_URL_RE.test(INSTAGRAM_URL)) { igLink.href = INSTAGRAM_URL; igItem.hidden = false; }
  // Todos los enlaces de contacto por WhatsApp (preguntas) usan el número central, siempre visibles
  document.querySelectorAll('a.wa-link').forEach((a) => { a.href = whatsAppUrl(''); });
  initGalleries();

  const form = document.getElementById('order-form');
  // Portada (catálogo): no hay formulario. Los enlaces viejos de la página de la cinta (#producto) van a su página.
  if (!form || !PAGE_PRODUCT_ID) {
    if (location.hash === '#producto') location.replace('/cinta-led/');
    return;
  }
  const btn = document.getElementById('submit-btn');
  let sending = false; // declarado antes de selectProduct (evita ReferenceError con pedidos abiertos)
  const preview = document.getElementById('state-preview');
  const success = document.getElementById('state-success');
  const previewList = document.getElementById('preview-list');
  const previewWa = document.getElementById('preview-wa');
  const provSel = document.getElementById('f-provincia');
  const munSel = document.getElementById('f-municipio');

  const summaryPhoto = document.getElementById('summary-photo');
  const summaryName = document.getElementById('summary-name');
  const summaryMeta = document.getElementById('summary-meta');
  const summaryPrice = document.getElementById('summary-price');
  const stickyPrice = document.getElementById('sticky-price');
  const stickyMeta = document.getElementById('sticky-meta');

  function selectProduct(id, { scroll } = {}) {
    if (!PRODUCTS[id]) return;
    selectedProductId = id;
    const p = currentProduct();
    if (summaryPhoto) {
      summaryPhoto.src = p.photo;
      summaryPhoto.width = p.photoW;
      summaryPhoto.height = p.photoH;
    }
    if (summaryName) summaryName.textContent = p.name;
    if (summaryMeta) summaryMeta.textContent = p.summaryMeta;
    if (summaryPrice) summaryPrice.textContent = formatPrice(p.price);
    if (stickyPrice) stickyPrice.textContent = formatPrice(p.price);
    if (stickyMeta) stickyMeta.textContent = p.stickyMeta;
    if (MODE === 'orders' && btn) {
      SUBMIT_LABEL = `Confirmar mi pedido · ${formatPrice(p.price)}`;
      if (!sending) btn.textContent = SUBMIT_LABEL;
    }
    if (scroll) {
      const target = document.getElementById(MODE === 'closed' && !DEMO_PARAM ? 'orders-closed' : 'pedido');
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // Modo de pedidos
  const DEMO_PARAM = new URLSearchParams(location.search).get('demo') === '1';
  const MODE = ORDERS_ENABLED ? 'orders' : WHATSAPP_ORDERS_ENABLED ? 'whatsapp' : DEMO_PARAM ? 'demo' : 'closed';
  const fields = document.getElementById('order-fields');
  const closedNotice = document.getElementById('orders-closed');
  const waNotice = document.getElementById('wa-notice');
  const foot = document.getElementById('form-foot');
  const submitError = document.getElementById('submit-error');
  const COPY = {
    orders:  { btn: `Confirmar mi pedido · ${formatPrice(currentProduct().price)}`, foot: 'Pagas al recibir. Te escribiremos por WhatsApp para confirmar antes de despachar.' },
    whatsapp:{ btn: 'Revisar y enviar por WhatsApp', foot: 'Pagas al recibir. Te confirmamos por WhatsApp antes de despachar.' },
    demo:    { btn: 'Ver resumen (demostración)', foot: 'Modo demostración interno: no se envía ni se guarda nada.' },
    closed:  { btn: 'Pedidos muy pronto', foot: 'Los pedidos en línea abren muy pronto.' }
  }[MODE];
  let SUBMIT_LABEL = COPY.btn;
  btn.textContent = SUBMIT_LABEL;
  foot.textContent = COPY.foot;
  fields.disabled = MODE === 'closed';
  closedNotice.hidden = MODE !== 'closed';
  waNotice.hidden = MODE !== 'whatsapp';
  previewWa.hidden = MODE !== 'whatsapp'; // código listo, se activa con WHATSAPP_ORDERS_ENABLED = true
  // Botones de llamada a la acción. El HTML trae los textos del modo cerrado (seguro sin JS);
  // solo cuando los pedidos están abiertos (orders / whatsapp) pasan a "Pedir ahora".
  const ORDERS_OPEN = MODE === 'orders' || MODE === 'whatsapp';
  const CTA_OPEN = {
    nav:     { href: '#pedido', long: 'Pedir' },
    hero:    { href: '#pedido', long: 'Pedir ahora · Paga al recibir', short: 'Pedir ahora' },
    spec:    { href: '#pedido', long: 'Pedir ahora', short: 'Pedir ahora' },
    sticky:  { href: '#pedido', long: 'Pedir ahora · Paga al recibir', short: 'Pedir ahora' },
    product: { href: '#pedido', long: 'Pedir', short: 'Pedir' }
  };
  if (MODE === 'demo') {
    // Prueba interna: el aviso está oculto, así que los botones van al formulario
    document.querySelectorAll('a[href="#orders-closed"]').forEach((el) => el.setAttribute('href', '#pedido'));
  }
  if (ORDERS_OPEN) {
    document.querySelectorAll('[data-cta]').forEach((a) => {
      const c = CTA_OPEN[a.dataset.cta];
      if (!c) return;
      a.setAttribute('href', c.href);
      const l = a.querySelector('.cta-long'), sh = a.querySelector('.cta-short');
      if (l) { l.textContent = c.long; if (sh) sh.textContent = c.short || c.long; } else a.textContent = c.long;
    });
  }
  if (MODE === 'whatsapp') {
    document.getElementById('preview-eyebrow').textContent = 'Último paso';
    document.getElementById('preview-title').textContent = 'Revisa y envía tu pedido';
    document.getElementById('preview-note').textContent = 'Al tocar el botón se abre WhatsApp con tu pedido y tus datos. Te lo confirmamos por mensaje antes de despachar y pagas al recibir.';
  } else if (MODE === 'demo') {
    document.getElementById('preview-eyebrow').textContent = 'DEMOSTRACIÓN';
    document.getElementById('preview-note').textContent = 'Esto es una demostración interna: este pedido no se envió ni se guardó. Los pedidos abren muy pronto.';
  }

  selectProduct(PAGE_PRODUCT_ID);

  document.querySelectorAll('[data-select-product]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('data-select-product');
      if (!PRODUCTS[id]) return;
      e.preventDefault();
      selectProduct(id, { scroll: true });
    });
  });

  // Municipio dependiente de la provincia (mismo catálogo que valida la función)
  const fillMunicipios = () => {
    const list = LOCATIONS[provSel.value] || [];
    const first = new Option(list.length ? 'Selecciona tu municipio' : 'Elige primero tu provincia', '', true, true);
    first.disabled = true;
    munSel.replaceChildren(first, ...list.map((m) => new Option(m, m)));
  };
  provSel.addEventListener('change', fillMunicipios);
  fillMunicipios();

  // Cloudflare Turnstile: solo con pedidos reales abiertos y site key configurada (nada se carga si no)
  let turnstileId = null;
  const tsSlot = document.getElementById('turnstile-slot');
  if (MODE === 'orders' && TURNSTILE_SITE_KEY) {
    tsSlot.hidden = false;
    window.onTurnstileLoad = () => {
      turnstileId = window.turnstile.render(tsSlot, { sitekey: TURNSTILE_SITE_KEY, action: 'crear-pedido', language: 'es' });
    };
    const sc = document.createElement('script');
    sc.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit';
    sc.async = true; sc.defer = true;
    document.head.appendChild(sc);
  }
  const captchaToken = () => (window.turnstile && turnstileId !== null ? window.turnstile.getResponse(turnstileId) || '' : '');
  const resetCaptcha = () => { if (window.turnstile && turnstileId !== null) window.turnstile.reset(turnstileId); };
  // Misma clave mientras los datos no cambien (doble clic / reenvío tras error de red)
  let lastKey = null, lastSig = '';

  const showErrors = (errors, keys = ['nombre', 'whatsapp', 'provincia', 'municipio', 'direccion', 'referencia']) => {
    keys.forEach((k) => {
      const input = form.elements[k];
      const err = document.getElementById(`e-${k}`);
      if (!input || !err) return;
      const field = input.closest('.field');
      if (errors[k]) {
        err.textContent = errors[k];
        if (field) field.classList.add('invalid');
        input.setAttribute('aria-invalid', 'true');
      } else {
        err.textContent = '';
        if (field) field.classList.remove('invalid');
        input.removeAttribute('aria-invalid');
      }
    });
  };

  // Mientras el cliente corrige un campo con error, lo revalida (solo ese campo, sin mover el resto)
  const recheck = (e) => {
    const t = e.target;
    if (!t.name || !t.closest('.field.invalid')) return;
    showErrors(validateOrder(getFormData(form)).errors, [t.name]);
  };
  form.addEventListener('input', recheck);
  form.addEventListener('change', recheck);

  const renderPreview = (data) => {
    const p = PRODUCTS[data.producto_id] || currentProduct();
    const rows = [
      ['Producto', p.orderName], ['Total', `${formatPrice(p.price)} · envío incluido`],
      ['Nombre', data.nombre], ['WhatsApp', prettyPhone(data.whatsapp)], ['Provincia', data.provincia],
      ['Municipio', data.municipio], ['Dirección', data.direccion]
    ];
    if (data.referencia) rows.push(['Referencia', data.referencia]);
    previewList.replaceChildren(...rows.flatMap(([k, v]) => {
      const dt = document.createElement('dt'); dt.textContent = k;
      const dd = document.createElement('dd'); dd.textContent = v;
      return [dt, dd];
    }));
    previewWa.href = whatsAppUrl(buildWhatsAppMessage(data));
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (sending) return;
    const raw = getFormData(form);
    const { valid, errors, data } = validateOrder(raw);
    showErrors(errors);
    if (!valid) {
      const first = form.querySelector('[aria-invalid="true"]');
      if (first) first.focus();
      return;
    }
    if (MODE === 'closed') return; // nunca se procesan datos con los pedidos cerrados
    sending = true; btn.disabled = true; btn.textContent = 'Procesando…'; submitError.textContent = '';
    try {
      if (MODE === 'orders') {
        const sig = JSON.stringify(data);
        if (sig !== lastSig) { lastSig = sig; lastKey = newIdempotencyKey(); }
        const res = await submitOrder(data, captchaToken(), lastKey);
        if (res.ok) { form.hidden = true; success.hidden = false; success.focus(); }
        else {
          submitError.textContent = res.error || 'No pudimos registrar tu pedido. Inténtalo de nuevo o escríbenos por WhatsApp.';
          resetCaptcha(); // el token es de un solo uso
        }
      } else {
        form.hidden = true; renderPreview(data); preview.hidden = false; preview.focus();
      }
    } finally {
      sending = false; btn.disabled = false; btn.textContent = SUBMIT_LABEL;
    }
  });

  document.getElementById('preview-edit').addEventListener('click', () => {
    preview.hidden = true; form.hidden = false; form.elements.nombre.focus();
  });

  // Barra fija: se oculta cuando el formulario está en pantalla
  const bar = document.getElementById('sticky-bar');
  const orderSection = document.getElementById('pedido');
  if (bar && orderSection && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      bar.classList.toggle('is-hidden', entry.isIntersecting);
      bar.setAttribute('aria-hidden', entry.isIntersecting ? 'true' : 'false');
      bar.querySelector('a').tabIndex = entry.isIntersecting ? -1 : 0;
    }, { threshold: 0.12 }).observe(orderSection);
  }
});
