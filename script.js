'use strict';
/* EcoHuella · Lógica. Sin red y sin almacenamiento: todo vive en variables. */

const CATS = [
  { k: 'transporte', n: 'Transporte', a: 'el transporte', c: 'var(--c-transporte)' },
  { k: 'energia', n: 'Energía', a: 'la energía', c: 'var(--c-energia)' },
  { k: 'alimentacion', n: 'Alimentación', a: 'la alimentación', c: 'var(--c-alimentacion)' },
  { k: 'consumo', n: 'Consumo', a: 'el consumo', c: 'var(--c-consumo)' }
];
const REF = { transporte: 1.1, energia: 0.7, alimentacion: 0.9, consumo: 0.5 }; // referencia: 3.2 t

/* Opciones: [id, título, subtítulo, valor]. Rango: [min, max, paso, inicial, unidad] */
const PASOS = [
  { k: 'transporte', t: 'Transporte', i: 'Cómo te mueves en una semana normal.', campos: [
    { id: 'modo', s: 'Medio', l: 'Medio de transporte principal', o: [
      ['auto', 'Auto particular', 'Gasolina o diésel', .19], ['moto', 'Moto', '', .10],
      ['bus', 'Bus o colectivo', '', .09], ['metro', 'Metro o tren', '', .04], ['activo', 'Bici o a pie', 'Sin emisiones', 0]] },
    { id: 'dias', s: 'Frecuencia', l: '¿Cuántos días a la semana lo usas?', o: [
      ['1', '1 a 2 días', '', 1.5], ['2', '3 a 4 días', '', 3.5], ['3', '5 a 6 días', '', 5.5], ['4', 'Los 7 días', '', 7]] },
    { id: 'dist', s: 'Distancia', l: 'Distancia aproximada por día', r: [0, 100, 5, 15, ' km'], h: 'Suma ida y vuelta. Si no usas transporte motorizado, no importa el valor.' },
    { id: 'avion', s: 'Vuelos al año', l: 'Viajes en avión al año', o: [
      ['0', 'Ninguno', '', 0], ['1', '1 o 2', '', .5], ['2', '3 o más', '', 1.5]] }
  ] },
  { k: 'energia', t: 'Energía', i: 'Uso de electricidad en tu hogar.', campos: [
    { id: 'consumo', s: 'Consumo eléctrico', l: 'Consumo mensual aproximado', h: 'Si tienes tu recibo de luz, úsalo como referencia.', o: [
      ['0', 'Bajo', 'Menos de 120 kWh', .3], ['1', 'Medio', '120 a 250 kWh', .6], ['2', 'Alto', '250 a 400 kWh', 1.05], ['3', 'Muy alto', 'Más de 400 kWh', 1.65]] },
    { id: 'equipos', s: 'Apagado de equipos', l: '¿Apagas los equipos que no usas?', o: [
      ['siempre', 'Casi siempre', '', .85], ['aveces', 'A veces', '', 1], ['nunca', 'Casi nunca', '', 1.15]] },
    { id: 'clima', s: 'Climatización', l: 'Uso de aire acondicionado o calefacción', o: [
      ['nunca', 'Casi nunca', '', 0], ['aveces', 'A veces', '', .15], ['mucho', 'Con frecuencia', '', .4]] }
  ] },
  { k: 'alimentacion', t: 'Alimentación', i: 'Tus hábitos generales de comida.', campos: [
    { id: 'dieta', s: 'Dieta', l: 'Tu alimentación habitual', o: [
      ['vegana', 'Sin productos animales', '', 1], ['vegetariana', 'Vegetariana', 'Sin carne', 1.4],
      ['moderada', 'Carne algunos días', '', 2], ['alta', 'Carne casi todos los días', '', 2.8]] },
    { id: 'desperdicio', s: 'Desperdicio', l: 'Comida que se desecha en casa', o: [
      ['poco', 'Muy poca', '', .95], ['medio', 'Algo', '', 1], ['mucho', 'Bastante', '', 1.12]] }
  ] },
  { k: 'consumo', t: 'Consumo', i: 'Cómo compras y qué haces con tus residuos.', campos: [
    { id: 'ropa', s: 'Compras', l: 'Compras de ropa y artículos nuevos', o: [
      ['rara', 'Rara vez', '', .3], ['mensual', 'Una vez al mes', '', .7], ['semanal', 'Cada semana', '', 1.3]] },
    { id: 'electro', s: 'Electrónicos al año', l: 'Dispositivos electrónicos que compras al año', o: [
      ['0', 'Ninguno', '', 0], ['1', '1 o 2', '', .3], ['2', '3 o más', '', .7]] },
    { id: 'reciclaje', s: 'Reciclaje', l: '¿Separas tus residuos para reciclar?', o: [
      ['siempre', 'Siempre', '', .9], ['aveces', 'A veces', '', 1], ['nunca', 'Casi nunca', '', 1.08]] }
  ] }
];

const RECS = [
  { id: 't1', c: 'transporte', t: 'Agrupa y reduce tus viajes', d: 'Reduce desplazamientos innecesarios y agrupa tus viajes cuando sea posible.', f: .1 },
  { id: 't2', c: 'transporte', t: 'Cambia a transporte público', d: 'Sustituye algunos trayectos en auto o moto por bus, metro o tren.', f: .3, w: r => r.modo === 'auto' || r.modo === 'moto' },
  { id: 't3', c: 'transporte', t: 'Camina o usa bici en trayectos cortos', d: 'Los recorridos de pocos kilómetros son los más fáciles de hacer sin motor.', f: .1, w: r => r.modo !== 'activo' && +r.dist <= 20 },
  { id: 't4', c: 'transporte', t: 'Reduce los viajes en avión', d: 'Prioriza destinos cercanos o alternativas terrestres cuando sea posible.', f: .25, w: r => r.avion !== '0' },
  { id: 'e1', c: 'energia', t: 'Apaga lo que no usas', d: 'Reduce el uso innecesario de equipos eléctricos y apágalos cuando no los utilices.', f: .1 },
  { id: 'e2', c: 'energia', t: 'Usa la climatización con moderación', d: 'Ajusta la temperatura y ventila antes de encender aire o calefacción.', f: .2, w: r => r.clima !== 'nunca' },
  { id: 'e3', c: 'energia', t: 'Cambia a iluminación LED', d: 'Consume menos y dura más. Desconecta también los cargadores que no uses.', f: .08 },
  { id: 'a1', c: 'alimentacion', t: 'Incorpora días sin carne', d: 'Sustituir algunas comidas con carne por legumbres, huevos o verduras reduce emisiones de forma notable.', f: .2, w: r => r.dieta === 'alta' || r.dieta === 'moderada' },
  { id: 'a2', c: 'alimentacion', t: 'Planifica tus compras', d: 'Haz una lista y aprovecha las sobras para desperdiciar menos comida.', f: .1, w: r => r.desperdicio !== 'poco' },
  { id: 'a3', c: 'alimentacion', t: 'Prioriza alimentos locales y de temporada', d: 'Suelen necesitar menos transporte y almacenamiento.', f: .06 },
  { id: 'c1', c: 'consumo', t: 'Compra solo lo necesario', d: 'Antes de comprar, repara o reutiliza lo que ya tienes.', f: .2, w: r => r.ropa !== 'rara' },
  { id: 'c2', c: 'consumo', t: 'Alarga la vida de tus dispositivos', d: 'Repáralos y véndelos o dónalos en lugar de cambiarlos seguido.', f: .2, w: r => r.electro !== '0' },
  { id: 'c3', c: 'consumo', t: 'Separa tus residuos', d: 'Clasifica papel, plástico y vidrio para reciclar.', f: .08, w: r => r.reciclaje !== 'siempre' },
  { id: 'c4', c: 'consumo', t: 'Elige productos duraderos', d: 'Prefiere segunda mano o productos con garantía y larga vida útil.', f: .1 }
];

const RETOS = [
  { id: 'r1', c: 'transporte', t: 'Reto de 7 días', d: 'Reducir desplazamientos innecesarios.', n: 7 },
  { id: 'r2', c: 'energia', t: 'Reto de 7 días', d: 'Apagar los equipos que no estés usando.', n: 7 },
  { id: 'r3', c: 'alimentacion', t: 'Reto de 5 días', d: 'Hacer al menos una comida al día sin carne.', n: 5 },
  { id: 'r4', c: 'consumo', t: 'Reto de 7 días', d: 'Evitar compras que no sean necesarias.', n: 7 },
  { id: 'r5', c: 'consumo', t: 'Reto de 3 días', d: 'Separar tus residuos reciclables.', n: 3 }
];

const LOGROS = [
  ['calculo', 'calc', 'Primer cálculo', 'Calcula tu huella por primera vez.', () => calculos.length >= 1],
  ['meta', 'target', 'Primera meta', 'Fija tu meta de reducción.', () => meta.fijada],
  ['reto', 'flag', 'Primer reto completado', 'Completa todos los días de un reto.', () => retos.some(r => r.dias >= rc(r.id).n)],
  ['mejora', 'trend', 'Primera mejora', 'Obtén un resultado menor que el inicial.', () => calculos.length > 1 && ultimo().total < primero().total],
  ['tres', 'layers', 'Tres cálculos', 'Realiza tres cálculos.', () => calculos.length >= 3]
];

/* ---------- Estado (solo en memoria) ---------- */
let usuario = {}, calculos = [], retos = [], meta = { pct: 10, fijada: false }, aplicadas = {};
let logrosOk = new Set(), vista = 'inicio', paso = 0, resp = {};

/* ---------- Utilidades ---------- */
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const fmt = n => n.toFixed(1), f2 = n => n.toFixed(2);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ico = i => `<svg class="ico" aria-hidden="true"><use href="#i-${i}"/></svg>`;
const clamp = (n, a = 0, b = 100) => Math.min(b, Math.max(a, n));
const primero = () => calculos[0], ultimo = () => calculos[calculos.length - 1];
const rc = id => RETOS.find(r => r.id === id);
const cat = k => CATS.find(c => c.k === k);
const datos = () => ultimo() || { cats: REF, total: 3.2, ref: true };
const mayor = c => CATS.reduce((a, b) => c[b.k] > c[a.k] ? b : a);
const nivel = t => t < 2 ? { n: 'Bajo', m: 1 } : t < 4 ? { n: 'Moderado', m: 2 } : t < 6 ? { n: 'Alto', m: 3 } : { n: 'Muy alto', m: 4 };
const meter = m => `<span class="meter${m >= 3 ? ' alto' : ''}" aria-hidden="true">${[1, 2, 3, 4].map(i => `<i${i <= m ? ' class="on"' : ''}></i>`).join('')}</span>`;
const red = () => calculos.length > 1 ? (primero().total - ultimo().total) / primero().total * 100 : 0;
const objetivo = () => primero().total * (1 - meta.pct / 100);
const metaProg = () => calculos.length < 2 ? 0 : clamp((primero().total - ultimo().total) / (primero().total - objetivo()) * 100);
const head = (t, s) => `<header class="view-head"><h1 tabindex="-1">${t}</h1>${s ? `<p class="muted">${s}</p>` : ''}</header>`;
const vacio = (m, b, v) => `<div class="empty"><p>${m}</p><button type="button" class="btn btn-primary" data-action="ir" data-view="${v}">${b}</button></div>`;

let tt;
function toast(m) {
  const t = $('#toast'); t.textContent = m; t.classList.add('show');
  clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 2600);
}

function checkLogros() {
  let nuevo = false;
  LOGROS.forEach(l => {
    if (l[4]() && !logrosOk.has(l[0])) { logrosOk.add(l[0]); nuevo = true; toast('Logro desbloqueado: ' + l[2]); }
  });
  return nuevo;
}

/* ---------- Cálculo ---------- */
function num(id, r) {
  for (const p of PASOS) for (const c of p.campos) if (c.id === id) {
    if (c.r) return +r[id];
    const o = c.o.find(x => x[0] === r[id]); return o ? o[3] : 0;
  }
  return 0;
}
function lab(id, r) {
  for (const p of PASOS) for (const c of p.campos) if (c.id === id) return c.r ? r[id] + c.r[4] : (c.o.find(o => o[0] === r[id]) || [])[1];
}
function calcular(r) {
  const cats = {
    transporte: num('modo', r) * num('dist', r) * num('dias', r) * 52 / 1000 + num('avion', r),
    energia: num('consumo', r) * num('equipos', r) + num('clima', r),
    alimentacion: num('dieta', r) * num('desperdicio', r),
    consumo: (num('ropa', r) + num('electro', r)) * num('reciclaje', r)
  };
  return { resp: { ...r }, cats, total: Object.values(cats).reduce((a, b) => a + b, 0) };
}
function initResp() {
  resp = {};
  PASOS.forEach(p => p.campos.forEach(c => { if (c.r) resp[c.id] = String(c.r[3]); }));
}

/* ---------- Navegación ---------- */
function pantalla(n) {
  ['welcome', 'login', 'app'].forEach(x => $('#screen-' + x).hidden = x !== n);
  document.body.dataset.screen = n; window.scrollTo(0, 0);
}
function ir(v) {
  vista = v;
  $$('.view').forEach(s => s.hidden = s.dataset.view !== v);
  if (v === 'calcular') { paso = 0; vCalcular(); } else render();
  $$('.nav-item').forEach(b => {
    const on = b.dataset.view === (v === 'resultado' ? 'calcular' : v);
    b.classList.toggle('active', on);
    on ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current');
  });
  window.scrollTo(0, 0);
  const h = $('#view-' + v + ' h1'); if (h) h.focus({ preventScroll: true });
}
function render() { if (vista !== 'calcular') $('#view-' + vista).innerHTML = VISTAS[vista](); }

/* ---------- Vistas ---------- */
function vInicio() {
  const d = datos(), t = mayor(d.cats), n = nivel(d.total), tot = d.total;
  const rt = retos.find(r => r.dias < rc(r.id).n), mp = metaProg();
  const strip = CATS.map(c => `<span style="--w:${d.cats[c.k] * 100};background:${c.c}"></span>`).join('');
  const leg = CATS.map(c => `<li><span class="dot" style="background:${c.c}"></span>${c.n}<span class="v">${f2(d.cats[c.k])} t</span></li>`).join('');
  const prog = calculos.length > 1
    ? `${red() >= 0 ? '−' : '+'}${Math.abs(red()).toFixed(1)}% <small>respecto a tu resultado inicial</small>`
    : `Sin cambios todavía <small>${calculos.length ? 'vuelve a calcular para comparar' : 'calcula tu huella para empezar'}</small>`;
  const reto = rt
    ? `<div class="fact-row"><div class="fact-val">${esc(rc(rt.id).d)}</div><span class="num">${rt.dias}/${rc(rt.id).n}</span></div><span class="bar fact-reto"><i style="--p:${rt.dias / rc(rt.id).n * 100}%"></i></span>`
    : `<div class="fact-val">Sin reto activo</div><div class="fact-reto"><button type="button" class="btn btn-ghost btn-sm" data-action="ir" data-view="retos">Elegir un reto</button></div>`;
  return head('Hola, ' + esc(usuario.nombre), 'Este es el resumen de tu huella y tus avances.') + `
  <div class="home-grid">
    <div class="hero">
      <div class="hero-label">Tu huella estimada</div>
      <div class="hero-num"><b>${fmt(tot)}</b><span>t CO₂e/año</span></div>
      <div class="strip" role="img" aria-label="Distribución por categoría">${strip}</div>
      <ul class="legend">${leg}</ul>
      <p class="hero-note">${d.ref ? 'Valor de referencia. Calcula tu huella para personalizarlo.' : 'Estimación basada en tu último cálculo.'}</p>
      <button type="button" class="btn btn-light" data-action="ir" data-view="calcular">${calculos.length ? 'Calcular de nuevo' : 'Calcular mi huella'}</button>
    </div>
    <div class="panel facts">
      <div class="fact"><div class="fact-label">Nivel de impacto</div><div class="fact-val">${n.n} ${meter(n.m)}</div></div>
      <div class="fact"><div class="fact-label">Principal fuente de impacto</div><div class="fact-val">${t.n} <small>${Math.round(d.cats[t.k] / tot * 100)}% de tu huella</small></div></div>
      <div class="fact"><div class="fact-label">Progreso</div><div class="fact-val">${prog}</div></div>
      <div class="fact"><div class="fact-label">Meta</div><div class="fact-val">Reducir ${meta.pct}% <small>${calculos.length ? 'objetivo ' + fmt(objetivo()) + ' t' : ''}</small></div><span class="bar"><i style="--p:${mp}%"></i></span></div>
      <div class="fact"><div class="fact-label">Reto actual</div>${reto}</div>
    </div>
  </div>`;
}

function vCalcular() {
  $('#calc-prev').innerHTML = calculos.length
    ? `<p class="prev-link muted">Último resultado: ${fmt(ultimo().total)} t CO₂e/año. <button type="button" data-action="ir" data-view="resultado">Ver resultado</button></p>` : '';
  renderWiz();
}
const campo = c => {
  const h = c.h ? `<p class="hint">${c.h}</p>` : '';
  if (c.r) return `<div class="campo"><label for="f-${c.id}">${c.l}</label><div class="rango"><input type="range" id="f-${c.id}" name="${c.id}" min="${c.r[0]}" max="${c.r[1]}" step="${c.r[2]}" value="${resp[c.id]}"><output for="f-${c.id}">${resp[c.id]}${c.r[4]}</output></div>${h}</div>`;
  return `<fieldset class="campo"><legend>${c.l}</legend><div class="choices">${c.o.map(o =>
    `<label class="choice"><input type="radio" name="${c.id}" value="${o[0]}"${resp[c.id] === o[0] ? ' checked' : ''}><span class="choice-body"><span class="choice-t">${o[1]}</span>${o[2] ? `<span class="choice-s">${o[2]}</span>` : ''}</span></label>`).join('')}</div>${h}</fieldset>`;
};
function renderWiz() {
  $('#wiz-steps').innerHTML = PASOS.map((p, i) =>
    `<li><button type="button" class="step${i === paso ? ' on' : i < paso ? ' done' : ''}" data-action="paso" data-i="${i}"${i > paso ? ' disabled' : ''}${i === paso ? ' aria-current="step"' : ''}><span class="step-n">${i + 1}</span>${p.t}</button></li>`).join('');
  const p = PASOS[paso];
  $('#wiz-body').innerHTML = `<div class="paso"><h2>${p.t}</h2><p class="muted paso-intro">${p.i}</p>${p.campos.map(campo).join('')}</div>`;
  $('#btn-atras').disabled = paso === 0;
  $('#btn-sig').textContent = paso === PASOS.length - 1 ? 'Calcular huella' : 'Siguiente';
}
const falta = () => PASOS.findIndex(p => p.campos.some(c => !c.r && resp[c.id] === undefined));
function siguiente() {
  if (PASOS[paso].campos.some(c => !c.r && resp[c.id] === undefined)) return toast('Responde todas las preguntas de este bloque.');
  if (paso < PASOS.length - 1) { paso++; renderWiz(); window.scrollTo(0, 0); return; }
  const f = falta(); if (f > -1) { paso = f; renderWiz(); return toast('Te falta responder un bloque.'); }
  calculos.push(calcular(resp)); paso = 0;
  ir('resultado');
  if (!checkLogros()) toast('Huella calculada');
}

const EXPLICA = {
  transporte: 'Los desplazamientos en vehículos motorizados y los viajes en avión suelen concentrar la mayor parte de estas emisiones.',
  energia: 'El consumo eléctrico del hogar y el uso de climatización son los factores que más pesan en este bloque.',
  alimentacion: 'Lo que más influye es la cantidad de carne en tu dieta y la comida que se desperdicia.',
  consumo: 'Pesan sobre todo la frecuencia con que compras artículos nuevos y lo que haces con tus residuos.'
};
function vResultado() {
  if (!calculos.length) return head('Tu resultado') + vacio('Aún no has calculado tu huella.', 'Calcular ahora', 'calcular');
  const d = ultimo(), t = mayor(d.cats), n = nivel(d.total), tot = d.total, prev = calculos[calculos.length - 2];
  let delta = 'Este será tu resultado inicial para medir mejoras.';
  if (prev) {
    const dif = tot - prev.total;
    delta = Math.abs(dif) < 0.05 ? 'Sin cambios respecto al cálculo anterior.' : `${dif < 0 ? 'Bajaste' : 'Subiste'} ${fmt(Math.abs(dif))} t respecto al cálculo anterior.`;
  }
  const C = 2 * Math.PI * 70; let off = 0;
  const arcs = CATS.map(c => {
    const l = d.cats[c.k] / tot * C;
    const s = `<circle cx="100" cy="100" r="70" fill="none" stroke-width="26" style="stroke:${c.c}" stroke-dasharray="${l} ${C - l}" stroke-dashoffset="${-off}" transform="rotate(-90 100 100)"/>`;
    off += l; return s;
  }).join('');
  const rows = CATS.map(c => {
    const p = d.cats[c.k] / tot * 100;
    return `<div class="cat-row"><span class="cat-name"><span class="dot" style="background:${c.c}"></span>${c.n}</span><span class="cat-val">${f2(d.cats[c.k])} t<small>${Math.round(p)}%</small></span><span class="bar"><i style="--p:${p}%;background:${c.c}"></i></span></div>`;
  }).join('');
  const det = PASOS.find(p => p.k === t.k).campos.map(c => `${c.s}: ${lab(c.id, d.resp)}`).join(' · ');
  const pct = Math.round(d.cats[t.k] / tot * 100);
  return head('Tu resultado') + `
  <div class="res-top">
    <div class="panel panel-pad res-main">
      <div class="label">Tu huella estimada</div>
      <div class="big-num"><b>${fmt(tot)}</b><span>t CO₂e/año</span></div>
      <div class="nivel-line">${meter(n.m)} Impacto ${n.n.toLowerCase()}</div>
      <p class="delta">${delta}</p>
    </div>
    <div class="panel donut-wrap">
      <svg class="donut" viewBox="0 0 200 200" role="img" aria-label="Distribución de tu huella por categoría">${arcs}
        <text class="donut-pct" x="100" y="104" text-anchor="middle">${pct}%</text>
        <text class="donut-lbl" x="100" y="126" text-anchor="middle">${t.n}</text></svg>
      <div class="cat-list">${rows}</div>
    </div>
  </div>
  <div class="analisis">
    <h2>Análisis</h2>
    <p class="callout">Tu principal fuente de impacto es ${t.a}.</p>
    <p>Representa el ${pct}% de tu huella (${f2(d.cats[t.k])} t CO₂e/año). ${EXPLICA[t.k]}</p>
    <p class="muted">Tus respuestas: ${det}.</p>
  </div>
  <div class="meta-strip"><p>Tu meta es reducir tu huella un ${meta.pct}%. Con tu resultado inicial, el objetivo sería ${fmt(objetivo())} t CO₂e/año.</p>
    <button type="button" class="btn btn-ghost btn-sm" data-action="ir" data-view="progreso">Ver mi meta</button></div>
  <div class="actions">
    <button type="button" class="btn btn-primary" data-action="ir" data-view="recomendaciones">Ver recomendaciones</button>
    <button type="button" class="btn btn-ghost" data-action="ir" data-view="calcular">Calcular de nuevo</button>
  </div>`;
}

function vRecs() {
  if (!calculos.length) return head('Recomendaciones') + vacio('Calcula tu huella para recibir recomendaciones personalizadas.', 'Calcular mi huella', 'calcular');
  const d = ultimo(), t = mayor(d.cats); let lista = [];
  CATS.forEach(c => lista.push(...RECS.filter(x => x.c === c.k && (!x.w || x.w(d.resp))).slice(0, c.k === t.k ? 3 : 1)));
  lista.sort((a, b) => (b.c === t.k) - (a.c === t.k));
  const ahorro = lista.reduce((s, x) => s + d.cats[x.c] * x.f, 0);
  const items = lista.map(x => {
    const prio = x.c === t.k;
    return `<article class="panel rec${prio ? ' prio' : ''}"><div><div class="rec-top"><span class="chip">${cat(x.c).n}</span>${prio ? '<span class="chip prio">Prioridad</span>' : ''}</div>
      <h3>${x.t}</h3><p class="muted">${x.d}</p><p class="ahorro">Ahorro estimado: hasta ${f2(d.cats[x.c] * x.f)} t CO₂e/año</p></div>
      <div>${aplicadas[x.id] ? `<span class="done-txt">${ico('check')}Aplicada</span>` : `<button type="button" class="btn btn-ghost btn-sm" data-action="aplicar" data-id="${x.id}">Marcar como aplicada</button>`}</div></article>`;
  }).join('');
  return head('Recomendaciones', `Pensadas para ${t.a}, tu principal fuente de impacto, y para el resto de tus hábitos.`) + `
  <p class="resumen-ahorro">Si aplicas todas podrías reducir hasta ${fmt(ahorro)} t CO₂e/año (${Math.round(ahorro / d.total * 100)}%). Es una estimación según tus respuestas.</p>
  <div class="rec-list">${items}</div>
  <div class="actions"><button type="button" class="btn btn-primary" data-action="ir" data-view="retos">Elegir un reto</button></div>`;
}

function vRetos() {
  const t = mayor(datos().cats);
  const mis = retos.map(r => {
    const c = rc(r.id), ok = r.dias >= c.n;
    return `<article class="panel reto${ok ? ' done' : ''}"><div><h3>${c.t}</h3><p class="muted">${c.d}</p><span class="chip">${cat(c.c).n}</span></div>
      <div class="reto-prog"><div class="reto-count"><strong>${r.dias}</strong> / ${c.n} días</div>
      <div class="days">${Array.from({ length: c.n }, (_, i) => `<i${i < r.dias ? ' class="on"' : ''}></i>`).join('')}</div>
      ${ok ? `<span class="done-txt">${ico('check')}Completado</span>` : `<button type="button" class="btn btn-primary btn-sm" data-action="dia" data-id="${r.id}">+1 día</button>`}</div></article>`;
  }).join('');
  const disp = RETOS.filter(c => !retos.some(r => r.id === c.id)).map(c =>
    `<article class="panel disp"><h3>${c.t}</h3><p>${c.d}</p><div class="row"><span class="chip${c.c === t.k ? ' prio' : ''}">${c.c === t.k ? 'Recomendado' : cat(c.c).n}</span>
     <button type="button" class="btn btn-ghost btn-sm" data-action="aceptar" data-id="${c.id}">Aceptar reto</button></div></article>`).join('');
  return head('Retos', 'Convierte las recomendaciones en hábitos, un día a la vez.') + `
  <section class="section" style="margin-top:0"><h2>Mis retos</h2>${mis || '<div class="empty"><p>Aún no has aceptado ningún reto. Elige uno de la lista de abajo.</p></div>'}
  <p class="retos-nota">Avanza un día cuando cumplas el reto. Los retos no cambian tu cálculo: sirven para consolidar el hábito.</p></section>
  ${disp ? `<section class="section"><h2>Retos disponibles</h2><div class="disp-list">${disp}</div></section>` : ''}`;
}

function vProgreso() {
  let comp = '';
  if (!calculos.length) comp = vacio('Calcula tu huella para empezar a comparar tus resultados.', 'Calcular mi huella', 'calcular');
  else {
    const i = primero().total, a = ultimo().total, r = red();
    const bd = r > 0.05 ? `<span class="badge good">−${r.toFixed(1)}%</span>` : r < -0.05 ? `<span class="badge bad">+${(-r).toFixed(1)}%</span>` : '<span class="badge">0%</span>';
    const vals = calculos.slice(-8), off = calculos.length - vals.length, tg = objetivo();
    const mx = Math.max(...vals.map(c => c.total), tg), H = v => (v / mx * 85) + '%';
    comp = `<div class="panel compare">
      <div><p class="muted">Resultado inicial</p><div class="cmp-num">${fmt(i)} <small>t CO₂e</small></div></div>
      <div class="cmp-mid">${ico('arrow')}${bd}</div>
      <div><p class="muted">Resultado actual</p><div class="cmp-num">${fmt(a)} <small>t CO₂e</small></div></div></div>
      <p class="cmp-note">${calculos.length > 1 ? 'Reducción calculada respecto a tu primer resultado.' : 'Tienes un solo cálculo. Cambia hábitos y vuelve a calcular para ver tu mejora.'}</p>
      <div class="chart panel" style="margin-top:16px"><div class="plot"><div class="goal-line" style="--g:${H(tg)}"><span>Meta ${fmt(tg)} t</span></div>
      ${vals.map(c => `<div class="col"><div class="b" style="--h:${H(c.total)}"><span class="val">${fmt(c.total)}</span></div></div>`).join('')}</div>
      <div class="labels">${vals.map((c, k) => `<span>${off + k === 0 ? 'Inicial' : 'Cálculo ' + (off + k + 1)}</span>`).join('')}</div></div>`;
  }
  const mp = metaProg();
  const logros = LOGROS.map(l => {
    const on = logrosOk.has(l[0]);
    return `<article class="panel logro${on ? ' on' : ''}"><span class="logro-ico">${ico(l[1])}</span><div><h3>${l[2]}</h3><p>${l[3]}</p><span class="estado">${on ? 'Conseguido' : 'Pendiente'}</span></div></article>`;
  }).join('');
  return head('Progreso', 'Compara tu resultado inicial con el actual.') + comp + `
  <section class="section"><h2>Mi meta</h2><div class="panel meta-card">
    <p class="meta-t">Reducir mi huella un ${meta.pct}%</p>
    <div class="pills" role="group" aria-label="Porcentaje de reducción">${[5, 10, 15, 20].map(v => `<button type="button" class="pill${v === meta.pct ? ' on' : ''}" data-action="meta-pct" data-v="${v}">${v}%</button>`).join('')}</div>
    <span class="bar big"><i style="--p:${mp}%"></i></span>
    <p class="muted">${calculos.length ? `${Math.round(mp)}% de la meta · objetivo ${fmt(objetivo())} t CO₂e/año` : 'Calcula tu huella para medir tu avance.'}</p>
    <div class="meta-actions">${meta.fijada ? '<span class="chip">Meta fijada</span>' : '<button type="button" class="btn btn-primary btn-sm" data-action="fijar-meta">Fijar meta</button>'}</div></div></section>
  <section class="section"><h2>Logros</h2><div class="logros">${logros}</div></section>`;
}

function vPerfil() {
  const hechos = retos.filter(r => r.dias >= rc(r.id).n).length;
  const celdas = [
    ['Nombre', esc(usuario.nombre)], ['Usuario', esc(usuario.usuario)],
    ['Huella actual', calculos.length ? `${fmt(ultimo().total)} <small>t CO₂e/año</small>` : 'Sin calcular'],
    ['Meta', `Reducir ${meta.pct}%${meta.fijada ? '' : ' <small>(sin fijar)</small>'}`],
    ['Retos', `${hechos} completados <small>· ${retos.length - hechos} en curso</small>`],
    ['Logros', `${logrosOk.size} <small>de ${LOGROS.length}</small>`],
    ['Cálculos realizados', calculos.length],
    ['Reducción total', calculos.length > 1 ? `${red().toFixed(1)}%` : '—']
  ].map(c => `<div><dt>${c[0]}</dt><dd>${c[1]}</dd></div>`).join('');
  return `<div class="perfil-head"><span class="avatar avatar-lg">${esc(usuario.nombre[0].toUpperCase())}</span>
    <div><h1 tabindex="-1">${esc(usuario.nombre)}</h1><p class="muted">${esc(usuario.usuario)}</p></div></div>
    <div class="panel"><dl class="datos">${celdas}</dl></div>
    <div class="perfil-actions"><button type="button" class="btn btn-ghost" data-action="logout">Cerrar sesión</button></div>`;
}

const VISTAS = { inicio: vInicio, resultado: vResultado, recomendaciones: vRecs, retos: vRetos, progreso: vProgreso, perfil: vPerfil };

/* ---------- Eventos ---------- */
document.addEventListener('click', e => {
  const b = e.target.closest('[data-action]'); if (!b || b.disabled) return;
  const a = b.dataset.action, id = b.dataset.id;
  switch (a) {
    case 'comenzar': pantalla('login'); $('#in-nombre').focus(); break;
    case 'volver-bienvenida': pantalla('welcome'); break;
    case 'ir': ir(b.dataset.view); break;
    case 'atras': if (paso > 0) { paso--; renderWiz(); } break;
    case 'siguiente': siguiente(); break;
    case 'paso': paso = +b.dataset.i; renderWiz(); break;
    case 'aplicar': aplicadas[id] = true; toast('Recomendación marcada como aplicada'); render(); break;
    case 'aceptar':
      if (!retos.some(r => r.id === id)) retos.push({ id, dias: 0 });
      toast('Reto aceptado'); render(); break;
    case 'dia': {
      const r = retos.find(x => x.id === id), n = rc(id).n;
      if (r && r.dias < n) {
        r.dias++; render();
        if (!checkLogros()) toast(r.dias >= n ? 'Reto completado' : `Día ${r.dias} de ${n}`);
      } break;
    }
    case 'meta-pct': meta.pct = +b.dataset.v; render(); break;
    case 'fijar-meta': meta.fijada = true; render(); if (!checkLogros()) toast('Meta fijada'); break;
    case 'logout':
      usuario = {}; calculos = []; retos = []; aplicadas = {}; meta = { pct: 10, fijada: false };
      logrosOk = new Set(); paso = 0; initResp();
      $('#form-login').reset(); $$('.err').forEach(x => x.hidden = true);
      pantalla('welcome'); break;
  }
});

$('#form-calc').addEventListener('input', e => {
  const t = e.target; if (!t.name) return;
  resp[t.name] = t.value;
  if (t.type === 'range') t.nextElementSibling.textContent = t.value + ' km';
});

$('#form-login').addEventListener('submit', e => {
  e.preventDefault();
  const n = $('#in-nombre').value.trim(), u = $('#in-usuario').value.trim();
  const err = (eid, iid, m) => { const el = $('#' + eid); el.hidden = !m; el.textContent = m || ''; $('#' + iid).setAttribute('aria-invalid', String(!!m)); };
  err('err-nombre', 'in-nombre', n.length < 2 ? 'Escribe tu nombre (mínimo 2 caracteres).' : '');
  err('err-usuario', 'in-usuario', u.length < 3 ? 'Escribe un correo o usuario (mínimo 3 caracteres).' : '');
  if (n.length < 2 || u.length < 3) return;
  usuario = { nombre: n, usuario: u };
  $$('[data-user-name]').forEach(el => el.textContent = n);
  $$('[data-user-initial]').forEach(el => el.textContent = n[0].toUpperCase());
  pantalla('app'); ir('inicio');
});

initResp();