/* ===== Interfaz ===== */
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const PAL = ['--c1', '--c2', '--c3', '--c4', '--c5', '--c6', '--c7', '--c8'];
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const ST = { ex: 0, it: 0, scenes: new Map(), sel: null, tool: 'move', tab: 'sol', reveal: new Set(), editing: null, tmp: null, mouse: null, dpr: 1, W: 0, H: 0 };
const curEx = () => EX[ST.ex];
const curItem = () => curEx().items[ST.it];
const key = () => curEx().id + ':' + ST.it;
function scene(){
  const k = key(); let s = ST.scenes.get(k);
  if (!s){ s = { cmds: curItem().cmds.slice(), opts: {}, view: null, comp: true }; ST.scenes.set(k, s); }
  s.objs = evalScene(s.cmds); return s;
}
const opt = (s, n) => (s.opts[n] || (s.opts[n] = { vis: true, label: true, color: null }));
function colorOf(s, o, i){ const op = opt(s, o.name); if (op.color) return op.color; return css(PAL[i % PAL.length]); }
function plotted(s){ // objetos dibujables con su color
  let i = 0; const out = [];
  s.objs.forEach(o => { if (o.err || !o.graph || !plottable(o)) { if (!o.err && o.v && typeof o.v !== 'number') i++; return; } out.push({ o, color: colorOf(s, o, i++) }); });
  return out;
}

/* ---------- vista (zoom/pan) ---------- */
const V = { cx: 0, cy: 0, sc: 50 };
function fit(s, region){
  const w = ST.W || 600, h = ST.H || 400; let x0 = 0, x1 = 0, y0 = 0, y1 = 0;
  const it = curItem();
  if (region || it.view){ [x0, x1, y0, y1] = region || it.view; }
  else {
    const pts = []; plotted(s).forEach(({ o }) => { const o0 = o.v.o || [0, 0]; if (o.v.t === 'p') pts.push(o.v.c); else { pts.push(o0, [o0[0] + o.v.c[0], o0[1] + o.v.c[1]]); } });
    pts.push([0, 0]); x0 = Math.min(...pts.map(p => p[0])); x1 = Math.max(...pts.map(p => p[0])); y0 = Math.min(...pts.map(p => p[1])); y1 = Math.max(...pts.map(p => p[1]));
    const px = Math.max(1.5, (x1 - x0)*0.25), py = Math.max(1.5, (y1 - y0)*0.25); x0 -= px; x1 += px; y0 -= py; y1 += py;
    if (x1 - x0 < 6){ const m = (x0 + x1)/2; x0 = m - 3; x1 = m + 3; } if (y1 - y0 < 6){ const m = (y0 + y1)/2; y0 = m - 3; y1 = m + 3; }
  }
  V.sc = Math.max(4, Math.min(w/(x1 - x0), h/(y1 - y0))); V.cx = (x0 + x1)/2; V.cy = (y0 + y1)/2;
}
const sx = x => ST.W/2 + (x - V.cx)*V.sc, sy = y => ST.H/2 - (y - V.cy)*V.sc;
const wx = px => (px - ST.W/2)/V.sc + V.cx, wy = py => -(py - ST.H/2)/V.sc + V.cy;
function niceStep(target){ const e = Math.pow(10, Math.floor(Math.log10(target))); const m = target/e; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10)*e; }
function snapStep(){ for (const s of [0.1, 0.25, 0.5, 1, 2, 5, 10, 20, 50, 100]) if (s*V.sc >= 24) return s; return 100; }

/* ---------- dibujo ---------- */
const cv = $('#cv'), g = cv.getContext('2d');
function resize(){
  const r = $('#gwrap').getBoundingClientRect(); ST.dpr = window.devicePixelRatio || 1; ST.W = Math.max(50, r.width); ST.H = Math.max(50, r.height);
  cv.width = Math.round(ST.W*ST.dpr); cv.height = Math.round(ST.H*ST.dpr); draw();
}
function arrow(x0, y0, x1, y1, col, w, dash){
  const L = Math.hypot(x1 - x0, y1 - y0); if (L < 0.5) return;
  const ux = (x1 - x0)/L, uy = (y1 - y0)/L, hl = Math.min(12, L*0.6), hw = hl*0.42;
  g.strokeStyle = col; g.fillStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.setLineDash(dash || []);
  g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1 - ux*hl*0.8, y1 - uy*hl*0.8); g.stroke(); g.setLineDash([]);
  g.beginPath(); g.moveTo(x1, y1); g.lineTo(x1 - ux*hl + uy*hw, y1 - uy*hl - ux*hw); g.lineTo(x1 - ux*hl - uy*hw, y1 - uy*hl + ux*hw); g.closePath(); g.fill();
}
function label(txt, x, y, col, italic){ g.font = (italic ? 'italic 500 16px ' : '500 12px ') + css('--font-math'); g.fillStyle = col; g.textBaseline = 'middle'; g.textAlign = 'center'; g.fillText(txt, x, y); }
function draw(){
  if (isMat()){ renderMat(); return; }
  g.setTransform(ST.dpr, 0, 0, ST.dpr, 0, 0); const W = ST.W, H = ST.H;
  g.fillStyle = css('--canvas'); g.fillRect(0, 0, W, H);
  const major = niceStep(70/V.sc), mant = major/Math.pow(10, Math.floor(Math.log10(major))), minor = major/(mant === 2 ? 4 : 5);
  const xa = wx(0), xb = wx(W), ya = wy(H), yb = wy(0);
  const lines = (st, col, lw) => { g.strokeStyle = col; g.lineWidth = lw; g.beginPath();
    for (let x = Math.ceil(xa/st)*st; x <= xb; x += st){ const X = Math.round(sx(x)) + 0.5; g.moveTo(X, 0); g.lineTo(X, H); }
    for (let y = Math.ceil(ya/st)*st; y <= yb; y += st){ const Y = Math.round(sy(y)) + 0.5; g.moveTo(0, Y); g.lineTo(W, Y); } g.stroke(); };
  if (minor*V.sc >= 9) lines(minor, css('--grid'), 1); lines(major, css('--grid2'), 1);
  const ax = css('--axis'), X0 = sx(0), Y0 = sy(0);
  g.strokeStyle = ax; g.fillStyle = ax; g.lineWidth = 1.4;
  g.beginPath(); g.moveTo(0, Y0); g.lineTo(W - 8, Y0); g.moveTo(X0, H); g.lineTo(X0, 8); g.stroke();
  g.beginPath(); g.moveTo(W - 2, Y0); g.lineTo(W - 11, Y0 - 4); g.lineTo(W - 11, Y0 + 4); g.fill();
  g.beginPath(); g.moveTo(X0, 2); g.lineTo(X0 - 4, 11); g.lineTo(X0 + 4, 11); g.fill();
  g.font = '11px ' + css('--font-mono'); g.fillStyle = css('--ink2'); g.textBaseline = 'top';
  const ty = Math.min(Math.max(Y0 + 4, 4), H - 16), tx = Math.min(Math.max(X0 + 6, 4), W - 40);
  g.textAlign = 'center';
  for (let x = Math.ceil(xa/major)*major; x <= xb; x += major){ if (Math.abs(x) < major/2) continue; g.fillText(fmtNum(+x.toFixed(6), true).replace(/\.00$/, ''), sx(x), ty); }
  g.textAlign = X0 > W - 50 ? 'right' : 'left'; g.textBaseline = 'middle';
  for (let y = Math.ceil(ya/major)*major; y <= yb; y += major){ if (Math.abs(y) < major/2) continue; g.fillText(fmtNum(+y.toFixed(6), true).replace(/\.00$/, ''), X0 > W - 50 ? X0 - 6 : tx - 2, sy(y)); }
  g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText('0', Math.min(X0 + 5, W - 14), Math.min(Y0 + 4, H - 16));
  label('x', W - 14, Y0 - 12 < 8 ? Y0 + 14 : Y0 - 12, ax, true); label('y', X0 + 13 > W - 10 ? X0 - 13 : X0 + 13, 14, ax, true);
  const s = scene(), list = plotted(s);
  list.sort((a, b) => (b.o.aux ? 1 : 0) - (a.o.aux ? 1 : 0)).reverse();
  const sel = ST.sel;
  list.forEach(({ o, color }) => {
    const op = opt(s, o.name); if (!op.vis) return; const v = o.v, isSel = sel === o.name, col = color;
    if (v.t === 'p'){
      const X = sx(v.c[0]), Y = sy(v.c[1]); if (isSel){ g.fillStyle = col + '44'; g.beginPath(); g.arc(X, Y, 11, 0, 7); g.fill(); }
      g.fillStyle = col; g.strokeStyle = css('--canvas'); g.lineWidth = 1.5; g.beginPath(); g.arc(X, Y, 4.6, 0, 7); g.fill(); g.stroke();
      if (op.label) label(o.name, X + 13, Y - 11, col, true); return;
    }
    const o0 = v.o || [0, 0], x0 = sx(o0[0]), y0 = sy(o0[1]), x1 = sx(o0[0] + v.c[0]), y1 = sy(o0[1] + v.c[1]);
    if (isSel){ g.strokeStyle = col + '40'; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
      if (s.comp){ g.strokeStyle = col; g.lineWidth = 1.2; g.setLineDash([4, 4]); g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y0); g.lineTo(x1, y1); g.stroke(); g.setLineDash([]);
        label(fmtNum(v.c[0]), (x0 + x1)/2, y0 + (v.c[1] >= 0 ? 12 : -12), col); label(fmtNum(v.c[1]), x1 + (v.c[0] >= 0 ? 14 : -14), (y0 + y1)/2, col); } }
    if (o.aux) arrow(x0, y0, x1, y1, css('--ink2'), 1.6, [5, 4]); else arrow(x0, y0, x1, y1, col, isSel ? 3 : 2.4);
    if (op.label && !o.aux){ const mx = (x0 + x1)/2, my = (y0 + y1)/2, L = Math.hypot(x1 - x0, y1 - y0) || 1; label(o.name, mx - (y1 - y0)/L*14, my + (x1 - x0)/L*14, col, true); }
  });
  if (ST.tmp && ST.mouse){ const a = ST.tmp; arrow(sx(a.x), sy(a.y), sx(ST.mouse.x), sy(ST.mouse.y), css('--accent'), 2, [6, 4]); g.fillStyle = css('--accent'); g.beginPath(); g.arc(sx(a.x), sy(a.y), 4, 0, 7); g.fill(); }
  const hid = s.objs.filter(o => !o.err && o.graph && o.v && typeof o.v !== 'number' && o.v.t !== 's' && !plottable(o)).length;
  const all = s.objs.some(o => !o.err && o.graph && o.v && typeof o.v !== 'number' && o.v.t !== 's') && list.length === 0;
  const b = $('#banner'), e = $('#empty3d');
  b.hidden = !(hid > 0 && !all); e.hidden = !all;
  const dim = Math.max(0, ...s.objs.map(o => (o.v && o.v.c) ? o.v.c.length : 0));
  b.textContent = 'Algunos objetos están en ℝ³: se calculan en el panel algebraico y se grafican en la vista 3D (próxima etapa).';
  e.firstElementChild.innerHTML = dim > 3 ? 'Vectores de ℝⁿ con n > 3: no se pueden graficar. Los resultados están en el panel algebraico.' : 'Este ejercicio está en ℝ³. Los resultados se calculan a la izquierda; el gráfico 3D llega en la próxima etapa.';
}

/* ---------- panel izquierdo ---------- */
const isMat = () => !!UNITS[curEx().unit - 1].mat;
function exTitle(e){ return e.kind === 'ej' ? 'Ejemplo ' + e.n : 'Ejercicio ' + e.num; }
function renderHead(){
  const e = curEx(), items = e.items;
  $('#curName').textContent = exTitle(e) + ' · ' + e.tag; $('#brandSub').textContent = UNITS[e.unit - 1].title;
  let h = '<div class="sub">' + (e.kind === 'ej' ? 'Ejemplo del apunte' : 'Ejercicio para resolver') + ' · <span class="tag">' + e.tag + '</span></div><h2>' + esc(exTitle(e)) + ' — ' + esc(e.title) + '</h2><p>' + e.text + '</p>';
  if (items.length > 1) h += '<div class="chips" role="group" aria-label="Incisos">' + items.map((it, i) => '<button class="chip" data-it="' + i + '" aria-pressed="' + (i === ST.it) + '">' + esc(it.l || String(i + 1)) + '</button>').join('') + '</div>';
  $('#exhead').innerHTML = h;
}
function renderAlg(){
  const s = scene(); let i = 0, h = '';
  s.objs.forEach(o => {
    const drawable = !o.err && o.graph && plottable(o), numLike = !o.err && o.v && (typeof o.v === 'number' || o.v.t === 's');
    const col = drawable && !o.aux ? colorOf(s, o, i) : 'var(--ink2)'; if (!o.err && o.v && !numLike) i++;
    const op = opt(s, o.name), isSel = ST.sel === o.name;
    const dec = !!curItem().dec;
    let body;
    if (ST.editing === o.idx) body = '<input class="rowedit" id="rowedit" value="' + esc(o.raw.replace(/^[!~]+/, '')) + '" aria-label="Editar objeto">';
    else if (o.err) body = '<div class="l"><i>' + esc(o.name) + '</i></div><div class="er">' + esc(o.err) + '</div><div class="df">' + esc(o.cmd) + '</div>';
    else if (isM(o.v)){ const df = /[A-Za-z]/.test(o.cmd.replace(/Nula|Identidad|Inversa|Rref|MatP|Rango|Tipo|Igual|Traza|Det|EsReducida|Equivalentes|cos|sin|√/g, '')); body = '<div class="l"><i>' + esc(o.name) + '</i> =</div><div class="mxw">' + matSmall(o.v) + '</div>' + (df ? '<div class="df">' + esc(o.cmd) + '</div>' : ''); }
    else { const f = fmtVal(o.v, dec); const isDef = /[A-Za-z]/.test(o.cmd.replace(/cos|sin|tan|sqrt|Vector|Norma|Unitario|Trasladar|Extremo|Suma|Comp|Rango|CL|Dependencia/g, '').replace(/[0-9]/g, ''));
      body = '<div class="l"><i>' + esc(o.name) + '</i> = ' + esc(f.main) + '</div>' + (f.approx ? '<div class="ap">' + esc(f.approx) + '</div>' : '') + (isDef ? '<div class="df">' + esc(o.cmd) + '</div>' : ''); }
    h += '<div class="row" data-i="' + o.idx + '" data-n="' + esc(o.name) + '" aria-selected="' + isSel + '"><button class="dot' + (drawable ? '' : ' nodraw') + '" style="--dc:' + col + '" data-off="' + (op.vis ? 0 : 1) + '" data-vis="' + o.idx + '" aria-label="Mostrar u ocultar ' + esc(o.name) + '"' + (drawable ? '' : ' disabled') + '></button><div class="rv">' + body + '</div><button class="rx" data-del="' + o.idx + '" aria-label="Eliminar ' + esc(o.name) + '">✕</button></div>';
  });
  $('#alg').innerHTML = h || '<div class="row"><div class="rv hint">Sin objetos. Escribí una orden abajo, por ejemplo: u = (2, 3)</div></div>';
  const ed = $('#rowedit'); if (ed){ ed.focus(); ed.select(); }
}

/* ---------- panel derecho ---------- */
function checkItem(it, objs){
  const m = {}, errs = {}; objs.forEach(o => { if (o.err) errs[o.name] = o.err; else m[o.name] = o.v; });
  return Object.entries(it.expect || {}).map(([n, exp]) => {
    const got = m[n], ok = cmpExpect(got, exp, errs[n]);
    return { n, ok, shown: errs[n] ? 'no definida' : got === undefined ? '—' : fmtVal(got, it.dec).main, expShown: expShown(exp, it.dec) };
  });
}
function renderRight(){
  const e = curEx(), it = curItem(), s = scene(); $('#tabSol').setAttribute('aria-selected', ST.tab === 'sol'); $('#tabProp').setAttribute('aria-selected', ST.tab === 'prop');
  let h = '';
  if (ST.tab === 'sol'){
    const open = e.kind === 'ej' || ST.reveal.has(key());
    h += '<div><h3>' + (e.kind === 'ej' ? 'Resolución del apunte' : 'Cómo trabajar este ejercicio') + '</h3><div class="box">' +
      (e.kind === 'ej' ? (it.sol || '') : (it.sol ? it.sol : 'Resolvé a mano y probá tus resultados escribiendo las órdenes en la entrada algebraica. Los objetos ya cargados muestran el planteo del ejercicio.')) + '</div></div>';
    if (e.kind === 'ex'){
      if (!open) h += '<button class="btn primary" id="revealBtn">Mostrar respuesta del apunte</button>';
      else {
        h += '<div><h3>Respuesta del apunte</h3><div class="box ans">' + (it.ans || '') + '</div></div>';
        if (it.note) h += '<div class="note"><b>Observación.</b> ' + it.note + '</div>';
      }
    }
    if (open && it.expect){
      const rs = checkItem(it, s.objs);
      h += '<div><h3>Comprobación con la app</h3><div class="box">' + rs.map(r => '<div class="chk"><span class="' + (r.ok ? 'ok' : 'bad') + '">' + (r.ok ? '✓' : '✗') + '</span><span>' + esc(r.n) + ' = ' + esc(r.shown) + (r.ok ? '' : ' (esperado ' + esc(r.expShown) + ')') + '</span></div>').join('') + '</div></div>';
    }
  } else {
    const o = s.objs.find(x => x.name === ST.sel && !x.err);
    if (!o) h += '<div class="hint">Seleccioná un objeto en la vista algebraica o en el gráfico para ver sus propiedades.</div>';
    else {
      const op = opt(s, o.name), v = o.v, dec = !!it.dec;
      h += '<div><h3>Objeto</h3><dl class="kv"><dt>Nombre</dt><dd>' + esc(o.name) + '</dd><dt>Tipo</dt><dd>' + (typeof v === 'number' ? 'Número' : v.t === 's' ? 'Texto' : v.t === 'p' ? 'Punto' : 'Vector') + '</dd><dt>Valor</dt><dd>' + esc(fmtVal(v, dec).main) + '</dd>';
      if (isM(v)){
        h += '<dt>Orden</dt><dd>' + dimS(v) + '</dd><dt>Tipo</dt><dd>' + esc(tipoInfo(v)) + '</dd><dt>Rango</dt><dd>' + rankM(v.d) + '</dd>';
        if (v.d.length === v.d[0].length){ const dt = detOf(v); h += '<dt>Traza</dt><dd>' + fmtNum(v.d.reduce((s, r, i) => s + r[i], 0)) + '</dd><dt>Determinante</dt><dd>' + fmtNum(dt) + '</dd><dt>Inversible</dt><dd>' + (Math.abs(dt) > 1e-9 ? 'sí' : 'no') + '</dd>'; }
      }
      if (v && v.c){
        h += '<dt>Dimensión</dt><dd>ℝ' + (v.c.length === 2 ? '²' : v.c.length === 3 ? '³' : 'ⁿ (n = ' + v.c.length + ')') + '</dd>';
        if (v.t === 'v'){
          const n = normOf(v);
          if (v.c.length <= 3) h += '<dt>Cartesiana</dt><dd>' + esc(cartesian(v, dec)) + '</dd>';
          h += '<dt>Módulo</dt><dd>' + esc(fmtNum(n, dec)) + (isExact(fmtNum(n)) ? ' ≈ ' + (+n.toFixed(4)) : '') + '</dd>';
          if (n > TOL){
            h += '<dt>Versor</dt><dd>' + esc(fmtVal({ t: 'v', c: v.c.map(x => x/n) }).main) + '</dd>';
            if (v.c.length <= 3){ const nm = ['α', 'β', 'γ']; h += '<dt>cos dir.</dt><dd>' + v.c.map((x, i) => 'cos ' + nm[i] + ' = ' + fmtNum(x/n)).join('<br>') + '</dd><dt>Ángulos</dt><dd>' + v.c.map((x, i) => nm[i] + ' = ' + (Math.acos(Math.max(-1, Math.min(1, x/n)))*180/Math.PI).toFixed(2) + '°').join('<br>') + '</dd>'; }
          }
          if (v.o) h += '<dt>Origen</dt><dd>' + esc('(' + v.o.map(x => fmtNum(x, dec)).join(', ') + ')') + '</dd>';
        }
      }
      h += '</dl></div><div><h3>Estilo</h3><div class="sw" role="group" aria-label="Color">' + PAL.map(p => '<button style="background:var(' + p + ')" data-col="' + p + '" aria-label="Color ' + p.slice(3) + '" aria-pressed="' + (op.color === css(p)) + '"></button>').join('') + '</div></div>' +
        '<div style="display:flex;flex-direction:column;gap:7px"><label class="ck"><input type="checkbox" id="pVis"' + (op.vis ? ' checked' : '') + '> Mostrar objeto</label><label class="ck"><input type="checkbox" id="pLab"' + (op.label ? ' checked' : '') + '> Mostrar nombre</label><label class="ck"><input type="checkbox" id="pComp"' + (s.comp ? ' checked' : '') + '> Mostrar componentes (vector seleccionado)</label></div>';
    }
  }
  $('#rp').innerHTML = h;
}

/* ---------- selector de ejercicios ---------- */
function buildMenu(){
  let h = '';
  UNITS.forEach(un => ['ej', 'ex'].forEach(k => {
    const list = EX.map((e, i) => [e, i]).filter(([e]) => e.unit === un.id && e.kind === k); if (!list.length) return;
    h += '<h4>Unidad ' + un.id + ' · ' + (k === 'ej' ? 'Ejemplos del apunte' : 'Ejercicios para resolver') + '</h4>' + list.map(([e, i]) => menuBtn(e, i)).join('');
  }));
  $('#pickMenu').innerHTML = h;
}
const menuBtn = (e, i) => '<button data-ex="' + i + '" aria-current="' + (i === ST.ex) + '"><span class="n">' + (e.kind === 'ej' ? 'Ej ' + e.n : e.num) + '</span><span class="t">' + esc(e.title) + '</span><span class="tag">' + e.tag + '</span></button>';
function openEx(i, it){
  ST.ex = Math.max(0, Math.min(EX.length - 1, i)); ST.it = it || 0; ST.sel = null; ST.tmp = null; ST.editing = null; ST.tab = 'sol';
  try { localStorage.setItem('aga-u1-last', ST.ex + ':' + ST.it); } catch (_) {}
  buildMenu(); renderAll(true);
}
function renderAll(refit){
  const mat = isMat(); $('#gwrap').classList.toggle('matmode', mat);
  document.querySelector('.mnav [data-pane="graph"]').textContent = mat ? 'Pasos' : 'Gráfico';
  const s0 = scene(); if (mat && (!ST.sel || !s0.objs.find(x => x.name === ST.sel))){ const fo = curItem().focus && s0.objs.find(x => x.name === curItem().focus); ST.sel = fo ? fo.name : (s0.objs.length ? s0.objs[s0.objs.length - 1].name : null); }
  renderHead(); renderAlg(); renderRight(); const s = scene();
  if (!mat){ if (refit || !s.view) { fit(s); s.view = { ...V }; } else Object.assign(V, s.view); }
  draw();
}
function save(){ const s = scene(); s.view = { ...V }; }

/* ---------- agregar / editar órdenes ---------- */
function nextName(kind){
  const used = new Set(scene().objs.map(o => o.name)); const L = kind === 'p' ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' : 'uvwabcdefghijklmnopqrstxyz';
  for (const c of L) if (!used.has(c)) return c; let n = 1; while (used.has('o' + n)) n++; return 'o' + n;
}
function tryAdd(cmd){
  const s = scene(), test = evalScene(s.cmds.concat([cmd])), last = test[test.length - 1];
  if (last.err) return last.err; s.cmds.push(cmd); return null;
}
function commitAndRender(){ renderAlg(); renderRight(); draw(); }

/* ---------- eventos ---------- */
const snapv = v => { const st = snapStep(); return +(Math.round(v/st)*st).toFixed(6); };
function hit(px, py){
  const s = scene(); let best = null, bd = 9;
  plotted(s).forEach(({ o }) => { if (!opt(s, o.name).vis) return; const v = o.v;
    if (v.t === 'p'){ const d = Math.hypot(sx(v.c[0]) - px, sy(v.c[1]) - py); if (d < bd){ bd = d; best = o.name; } return; }
    const o0 = v.o || [0, 0], ax = sx(o0[0]), ay = sy(o0[1]), bx = sx(o0[0] + v.c[0]), by = sy(o0[1] + v.c[1]), dx = bx - ax, dy = by - ay, L2 = dx*dx + dy*dy || 1;
    const t = Math.max(0, Math.min(1, ((px - ax)*dx + (py - ay)*dy)/L2)), d = Math.hypot(ax + t*dx - px, ay + t*dy - py); if (d < bd){ bd = d; best = o.name; } });
  return best;
}
const ptrs = new Map(); let drag = null;
cv.addEventListener('pointerdown', e => {
  cv.setPointerCapture(e.pointerId); const r = cv.getBoundingClientRect(); ptrs.set(e.pointerId, { x: e.clientX - r.left, y: e.clientY - r.top });
  drag = { moved: 0, startX: e.clientX, startY: e.clientY, cx: V.cx, cy: V.cy, d0: null, sc0: V.sc };
  if (ptrs.size === 2){ const [a, b] = [...ptrs.values()]; drag.d0 = Math.hypot(a.x - b.x, a.y - b.y); drag.sc0 = V.sc; }
});
cv.addEventListener('pointermove', e => {
  const r = cv.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
  ST.mouse = { x: snapv(wx(px)), y: snapv(wy(py)) }; const raw = { x: wx(px), y: wy(py) };
  $('#coord').textContent = 'x = ' + raw.x.toFixed(2) + ', y = ' + raw.y.toFixed(2);
  if (!ptrs.has(e.pointerId)){ if (ST.tmp) draw(); return; }
  ptrs.set(e.pointerId, { x: px, y: py });
  if (ptrs.size === 2 && drag && drag.d0){ const [a, b] = [...ptrs.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); V.sc = Math.max(4, Math.min(4000, drag.sc0*d/drag.d0)); drag.moved = 99; draw(); return; }
  if (!drag) return; const dx = e.clientX - drag.startX, dy = e.clientY - drag.startY; drag.moved = Math.max(drag.moved, Math.hypot(dx, dy));
  if (drag.moved > 4 && ptrs.size === 1){ V.cx = drag.cx - dx/V.sc; V.cy = drag.cy + dy/V.sc; draw(); }
});
cv.addEventListener('pointerup', e => {
  const r = cv.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top; ptrs.delete(e.pointerId);
  if (drag && drag.moved <= 4 && ptrs.size === 0){
    if (ST.tool === 'point'){ const n = nextName('p'); const err = tryAdd(n + '=(' + snapv(wx(px)) + ',' + snapv(wy(py)) + ')'); if (!err){ ST.sel = n; commitAndRender(); } }
    else if (ST.tool === 'vector'){
      const p = { x: snapv(wx(px)), y: snapv(wy(py)) };
      if (!ST.tmp){ ST.tmp = p; draw(); }
      else { const a = ST.tmp; ST.tmp = null; if (a.x !== p.x || a.y !== p.y){ const n = nextName('v'); const err = tryAdd(n + '=Vector((' + a.x + ',' + a.y + '),(' + p.x + ',' + p.y + '))'); if (!err) ST.sel = n; } commitAndRender(); }
    } else { const n = hit(px, py); ST.sel = n; if (n) ST.tab = 'prop'; renderAlg(); renderRight(); draw(); }
  }
  if (ptrs.size === 0){ save(); drag = null; }
});
cv.addEventListener('pointerleave', () => { ST.mouse = null; });
cv.addEventListener('wheel', e => { e.preventDefault(); const r = cv.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top, bx = wx(px), by = wy(py);
  V.sc = Math.max(4, Math.min(4000, V.sc*Math.pow(1.0015, -e.deltaY))); V.cx = bx - (px - ST.W/2)/V.sc; V.cy = by + (py - ST.H/2)/V.sc; save(); draw(); }, { passive: false });
function zoom(f){ V.sc = Math.max(4, Math.min(4000, V.sc*f)); save(); draw(); }
$('#zin').onclick = () => zoom(1.25); $('#zout').onclick = () => zoom(0.8); $('#zfit').onclick = () => { fit(scene()); save(); draw(); };
document.querySelectorAll('.tools button').forEach(b => b.onclick = () => { ST.tool = b.dataset.tool; ST.tmp = null; document.querySelectorAll('.tools button').forEach(x => x.setAttribute('aria-pressed', x === b)); cv.classList.toggle('tool', ST.tool !== 'move'); draw(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape'){ ST.tmp = null; ST.editing = null; $('#pickMenu').hidden = true; $('#pickBtn').setAttribute('aria-expanded', 'false'); renderAlg(); draw(); } });

$('#exhead').addEventListener('click', e => { const b = e.target.closest('[data-it]'); if (!b) return; ST.it = +b.dataset.it; ST.sel = null; ST.tab = 'sol'; ST.editing = null; renderAll(true); });
$('#alg').addEventListener('click', e => {
  const vis = e.target.closest('[data-vis]'), del = e.target.closest('[data-del]'), row = e.target.closest('.row'); const s = scene();
  if (vis){ const o = s.objs[+vis.dataset.vis]; const op = opt(s, o.name); op.vis = !op.vis; renderAlg(); draw(); return; }
  if (del){ s.cmds.splice(+del.dataset.del, 1); ST.sel = null; commitAndRender(); return; }
  if (row && !e.target.closest('input') && row.dataset.n !== '?'){ ST.sel = row.dataset.n; if (!isMat()) ST.tab = 'prop'; renderAlg(); renderRight(); draw(); }
});
$('#alg').addEventListener('dblclick', e => { const row = e.target.closest('.row'); if (!row) return; ST.editing = +row.dataset.i; renderAlg(); });
$('#alg').addEventListener('keydown', e => {
  if (!e.target.matches('#rowedit')) return;
  if (e.key === 'Enter'){ const s = scene(), i = ST.editing, old = s.cmds[i], pre = old.match(/^[!~]*/)[0]; s.cmds[i] = pre + e.target.value; ST.editing = null; commitAndRender(); }
});
$('#cmd').addEventListener('keydown', e => {
  if (e.key !== 'Enter') return; const v = e.target.value.trim(); if (!v) return; const err = tryAdd(v); $('#inerr').textContent = err || '';
  if (!err){ e.target.value = ''; const s = scene(); ST.sel = s.objs[s.objs.length - 1].name; commitAndRender(); const a = $('#alg'); a.scrollTop = a.scrollHeight; }
});
$('#resetBtn').onclick = () => { ST.scenes.delete(key()); ST.sel = null; ST.editing = null; $('#inerr').textContent = ''; renderAll(true); };
$('#tabSol').onclick = () => { ST.tab = 'sol'; renderRight(); }; $('#tabProp').onclick = () => { ST.tab = 'prop'; renderRight(); };
$('#rp').addEventListener('click', e => {
  const s = scene(); if (e.target.id === 'revealBtn'){ ST.reveal.add(key()); renderRight(); return; }
  const c = e.target.closest('[data-col]'); if (c && ST.sel){ opt(s, ST.sel).color = css(c.dataset.col); renderAlg(); renderRight(); draw(); }
});
$('#rp').addEventListener('change', e => {
  const s = scene(); if (e.target.id === 'pComp'){ s.comp = e.target.checked; draw(); return; }
  if (!ST.sel) return; const op = opt(s, ST.sel); if (e.target.id === 'pVis') op.vis = e.target.checked; if (e.target.id === 'pLab') op.label = e.target.checked; renderAlg(); draw();
});
$('#pickBtn').onclick = () => { const m = $('#pickMenu'); m.hidden = !m.hidden; $('#pickBtn').setAttribute('aria-expanded', String(!m.hidden)); };
$('#pickMenu').addEventListener('click', e => { const b = e.target.closest('[data-ex]'); if (!b) return; $('#pickMenu').hidden = true; $('#pickBtn').setAttribute('aria-expanded', 'false'); openEx(+b.dataset.ex); });
document.addEventListener('click', e => { if (!e.target.closest('.pick')){ $('#pickMenu').hidden = true; $('#pickBtn').setAttribute('aria-expanded', 'false'); } });
$('#prevBtn').onclick = () => openEx(ST.ex - 1); $('#nextBtn').onclick = () => openEx(ST.ex + 1);
document.querySelectorAll('.mnav button').forEach(b => b.onclick = () => { $('#app').dataset.pane = b.dataset.pane; document.querySelectorAll('.mnav button').forEach(x => x.setAttribute('aria-pressed', x === b)); requestAnimationFrame(resize); });
new ResizeObserver(resize).observe($('#gwrap'));
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { renderAlg(); draw(); });

/* arranque */
(function(){ let start = 0, it = 0; try { const l = (localStorage.getItem('aga-u1-last') || '').split(':'); if (l[0] && EX[+l[0]]){ start = +l[0]; it = EX[start].items[+l[1]] ? +l[1] : 0; } } catch (_) {}
  buildMenu(); resize(); openEx(start, it); })();
window.__sandbox = { EX, evalScene, checkItem, fmtVal, fmtNum, openEx, ST };
