// Motor del sandbox de Álgebra: intérprete de expresiones (vectores, puntos, matrices), formato exacto, álgebra matricial
// y Gauss-Jordan con pasos. Lógica pura, sin DOM.
/* ===== Motor: números, vectores, parser ===== */
const TOL = 1e-9;
function gcd(a, b){ a = Math.abs(a); b = Math.abs(b); while (b){ [a, b] = [b, a % b]; } return a; }
function sqrtForm(n){ let a = 1, b = n; for (let f = Math.floor(Math.sqrt(n)); f > 1; f--){ if (n % (f*f) === 0){ a = f; b = n/(f*f); break; } } return [a, b]; }
function fmtNum(x, dec){
  if (!isFinite(x)) return '—';
  if (Math.abs(x) < TOL) return '0';
  const r = Math.round(x); if (Math.abs(x - r) < TOL) return String(r);
  if (dec) return x.toFixed(2);
  const sg = x < 0 ? '-' : '', ax = Math.abs(x);
  for (let q = 2; q <= 240; q++){ const p = Math.round(ax*q); if (Math.abs(ax - p/q) < TOL) return sg + p + '/' + q; }
  const s = ax*ax;
  for (let q = 1; q <= 12; q++){
    const s2 = s*q*q, n = Math.round(s2);
    if (n > 1 && n <= 200000 && Math.abs(s2 - n) < 1e-6*Math.max(1, n)){
      let [a, b] = sqrtForm(n); if (b === 1) continue;
      const g = gcd(a, q); a /= g; const qq = q/g;
      return sg + (a > 1 ? a : '') + '√' + b + (qq > 1 ? '/' + qq : '');
    }
  }
  return sg + String(+ax.toFixed(4));
}
const isExact = s => /[√\/]/.test(s);
function fmtVal(v, dec){
  if (typeof v === 'number'){ const m = fmtNum(v, dec); return { main: m, approx: isExact(m) ? '≈ ' + (+v.toFixed(4)) : '' }; }
  if (v.t === 's') return { main: v.v, approx: '' };
  if (v.t === 'm') return { main: '[' + v.d.map(r => r.map(x => fmtNum(x, dec)).join(', ')).join('; ') + ']', approx: '' };
  const parts = v.c.map(x => fmtNum(x, dec));
  const ex = parts.some(isExact);
  return { main: '(' + parts.join(', ') + ')', approx: ex ? '≈ (' + v.c.map(x => +x.toFixed(3)).join(', ') + ')' : '' };
}
function cartesian(v, dec){
  if (v.c.length > 3) return '';
  const B = ['i', 'j', 'k'];
  return v.c.map((x, i) => {
    let f = fmtNum(Math.abs(x), dec); if (isExact(f)) f = '(' + f + ')';
    const sg = x < -TOL ? '−' : '+';
    return (i === 0 ? (sg === '−' ? '−' : '') : ' ' + sg + ' ') + f + B[i];
  }).join('');
}

/* álgebra de vectores */
const isV = a => a && (a.t === 'v' || a.t === 'p');
const isN = a => typeof a === 'number';
function same(a, b){ if (a.c.length !== b.c.length) throw new Error('Los vectores tienen distinta dimensión (' + a.c.length + ' y ' + b.c.length + ')'); }
function add(a, b){
  if (isM(a) || isM(b)){ if (isM(a) && isM(b)) return mAdd(a, b); throw new Error('No se puede sumar una matriz con un número o un vector'); }
  if (isN(a) && isN(b)) return a + b;
  if (isV(a) && isV(b)){ same(a, b); const c = a.c.map((x, i) => x + b.c[i]); return (a.t === 'p' || b.t === 'p') ? { t: 'p', c } : { t: 'v', c, o: a.o || null }; }
  throw new Error('No se pueden sumar un número y un vector');
}
function neg(a){ if (isM(a)) return mk(a.d.map(r => r.map(x => -x))); return isN(a) ? -a : { ...a, c: a.c.map(x => -x) }; }
function sub(a, b){
  if (isV(a) && isV(b) && a.t === 'p' && b.t === 'p'){ same(a, b); return { t: 'v', c: a.c.map((x, i) => x - b.c[i]), o: b.c.slice() }; }
  return add(a, neg(b));
}
function mul(a, b){
  if (isM(a) && isM(b)) return mMul(a, b);
  if (isM(a) && isN(b)) return mk(a.d.map(r => r.map(x => x*b)));
  if (isN(a) && isM(b)) return mk(b.d.map(r => r.map(x => a*x)));
  if (isM(a) || isM(b)) throw new Error('No se puede multiplicar una matriz por un vector; escribilo como matriz columna');
  if (isN(a) && isN(b)) return a*b;
  if (isN(a) && isV(b)) return { t: b.t === 'p' ? 'p' : 'v', c: b.c.map(x => a*x), o: null };
  if (isV(a) && isN(b)) return mul(b, a);
  throw new Error('El producto de dos vectores es el producto escalar o vectorial (Unidad 8)');
}
function div(a, b){ if (isM(a) && isN(b) && b !== 0) return mk(a.d.map(r => r.map(x => x/b))); if (!isN(b)) throw new Error('Solo se puede dividir por un número'); if (b === 0) throw new Error('División por cero'); return isN(a) ? a/b : mul(1/b, a); }
function normOf(a){ if (isM(a)) return detOf(a); if (isN(a)) return Math.abs(a); return Math.sqrt(a.c.reduce((s, x) => s + x*x, 0)); }
const coords = a => { if (!isV(a)) throw new Error('Se esperaba un punto o vector'); return a.c; };
function needNum(a, n){ if (!isN(a)) throw new Error(n + ' debe ser un número'); return a; }
function needV(a, n){ if (!isV(a)) throw new Error(n + ' debe ser un vector'); return a; }

/* rango / combinaciones lineales por eliminación gaussiana */
function rref(M){
  const R = M.map(r => r.slice()), rows = R.length, cols = R[0].length, piv = [];
  let r = 0;
  for (let c = 0; c < cols && r < rows; c++){
    let p = r; for (let i = r + 1; i < rows; i++) if (Math.abs(R[i][c]) > Math.abs(R[p][c])) p = i;
    if (Math.abs(R[p][c]) < TOL) continue;
    [R[r], R[p]] = [R[p], R[r]];
    const d = R[r][c]; R[r] = R[r].map(x => x/d);
    for (let i = 0; i < rows; i++) if (i !== r){ const f = R[i][c]; if (Math.abs(f) > 0) R[i] = R[i].map((x, j) => x - f*R[r][j]); }
    piv.push(c); r++;
  }
  return { R, piv };
}
function rankOf(vs){ const n = vs[0].c.length; vs.forEach(v => { if (v.c.length !== n) throw new Error('Dimensiones distintas'); }); const M = Array.from({ length: n }, (_, i) => vs.map(v => v.c[i])); return rref(M).piv.length; }
function clOf(v, A){
  const n = v.c.length; A.forEach(a => { if (a.c.length !== n) throw new Error('Dimensiones distintas'); });
  const M = Array.from({ length: n }, (_, i) => [...A.map(a => a.c[i]), v.c[i]]);
  const { R, piv } = rref(M);
  if (piv.includes(A.length)) return null;
  const lam = Array(A.length).fill(0); piv.forEach((c, i) => { lam[c] = R[i][A.length]; });
  return { lam, unique: piv.length === A.length };
}

/* funciones disponibles */
const FN = {
  vector: a => { if (a.length !== 2) throw new Error('Vector(A, B) necesita dos puntos'); const A = coords(a[0]), B = coords(a[1]); same(a[0], a[1]); return { t: 'v', c: B.map((x, i) => x - A[i]), o: A.slice() }; },
  norma: a => { if (a.length !== 1) throw new Error('Norma(v) necesita un vector'); return normOf(a[0]); },
  unitario: a => { const n = normOf(a[0]); if (n < TOL) throw new Error('El vector nulo no tiene versor'); return mul(1/n, needV(a[0], 'El argumento')); },
  trasladar: a => { needV(a[0], 'El primer argumento'); return { t: 'v', c: a[0].c.slice(), o: coords(a[1]).slice() }; },
  extremo: a => { const v = needV(a[0], 'El argumento'); const o = v.o || v.c.map(() => 0); return { t: 'p', c: v.c.map((x, i) => x + o[i]) }; },
  suma: a => coords(a[0]).reduce((s, x) => s + x, 0),
  comp: a => { const i = needNum(a[1], 'El índice'); const c = coords(a[0]); if (i < 1 || i > c.length) throw new Error('Índice fuera de rango'); return c[i - 1]; },
  rango: a => rankOf(a.map(x => needV(x, 'Cada argumento'))),
  dependencia: a => { const vs = a.map(x => needV(x, 'Cada argumento')); return { t: 's', v: rankOf(vs) === vs.length ? 'Linealmente independientes' : 'Linealmente dependientes' }; },
  cl: a => {
    const v = needV(a[0], 'El primer argumento'), A = a.slice(1).map(x => needV(x, 'Cada vector del conjunto'));
    const r = clOf(v, A); if (!r) return { t: 's', v: 'No es combinación lineal' };
    return { t: 's', v: r.lam.map((l, i) => 'λ' + (i + 1) + ' = ' + fmtNum(l)).join(' ; ') + (r.unique ? '' : ' (hay infinitas soluciones)') };
  },
  sqrt: a => { const x = needNum(a[0], 'El argumento'); if (x < 0) throw new Error('Raíz de un número negativo'); return Math.sqrt(x); },
  cos: a => Math.cos(needNum(a[0], 'El ángulo')), sin: a => Math.sin(needNum(a[0], 'El ángulo')), tan: a => Math.tan(needNum(a[0], 'El ángulo')),
  grados: a => needNum(a[0], 'El argumento')*180/Math.PI,
  acos: a => Math.acos(needNum(a[0], 'El argumento')), asin: a => Math.asin(needNum(a[0], 'El argumento')), atan: a => Math.atan(needNum(a[0], 'El argumento')),
};
const ALIAS = { norm: 'norma', longitud: 'norma', abs: 'norma', unit: 'unitario', versor: 'unitario', raiz: 'sqrt', translate: 'trasladar', end: 'extremo', sum: 'suma', rank: 'rango', rg: 'rango' };
const fnKey = n => { const k = n.toLowerCase(); const r = ALIAS[k] || k; return FN[r] ? r : null; };

/* tokenizer */
function tokenize(s){
  const T = []; let i = 0;
  while (i < s.length){
    const c = s[i];
    if (/\s/.test(c)){ i++; continue; }
    let m;
    if ((m = s.slice(i).match(/^(\d+\.?\d*|\.\d+)/))){ T.push({ k: 'n', v: parseFloat(m[1]) }); i += m[1].length; continue; }
    if ((m = s.slice(i).match(/^[A-Za-zÀ-ÿα-ωΑ-Ω_][A-Za-zÀ-ÿα-ωΑ-Ω0-9_']*/))){ T.push({ k: 'id', v: m[0] }); i += m[0].length; continue; }
    if ('+-*/^(),|=√[];'.includes(c)){ T.push({ k: c }); i++; continue; }
    if (c === '−'){ T.push({ k: '-' }); i++; continue; }
    if (c === '·' || c === '×'){ T.push({ k: '*' }); i++; continue; }
    if (c === '°' || c === 'º'){ T.push({ k: 'deg' }); i++; continue; }
    throw new Error('Carácter no reconocido: ' + c);
  }
  return T;
}

function evalExpr(src, env){
  const T = tokenize(src); let p = 0, bar = 0, lastNum = false;
  const peek = () => T[p], next = () => T[p++];
  const expect = k => { const t = next(); if (!t || t.k !== k) throw new Error('Falta «' + (k === 'id' ? 'nombre' : k) + '»'); return t; };
  function expr(){
    let a = term();
    for (;;){ const t = peek(); if (t && t.k === '+'){ next(); a = add(a, term()); } else if (t && t.k === '-'){ next(); a = sub(a, term()); } else break; }
    return a;
  }
  function startsFactor(t){
    if (!t) return false;
    if (t.k === 'n' || t.k === 'id' || t.k === '(' || t.k === '√') return true;
    if (t.k === '|') return bar === 0 && lastNum;
    return false;
  }
  function term(){
    let a = unary();
    for (;;){
      const t = peek(); if (!t) break;
      if (t.k === '*'){ next(); a = mul(a, unary()); }
      else if (t.k === '/'){ next(); a = div(a, unary()); }
      else if (startsFactor(t)){ a = mul(a, power()); }
      else break;
    }
    return a;
  }
  function unary(){ const t = peek(); if (t && t.k === '-'){ next(); return neg(unary()); } if (t && t.k === '+'){ next(); return unary(); } return power(); }
  function power(){ let a = postfix(); const t = peek(); if (t && t.k === '^'){ next(); const nx = peek(); if (nx && nx.k === 'id' && nx.v === 'T' && isM(a)){ next(); a = mT(a); } else { const b = unary(); a = isM(a) ? mPow(a, needNum(b, 'El exponente')) : Math.pow(needNum(a, 'La base'), needNum(b, 'El exponente')); } } return a; }
  function postfix(){ let a = primary(); while (peek() && peek().k === 'deg'){ next(); a = needNum(a, 'El ángulo')*Math.PI/180; lastNum = false; } return a; }
  function primary(){
    const t = next(); if (!t) throw new Error('Expresión incompleta');
    if (t.k === 'n'){ lastNum = true; return t.v; }
    lastNum = false;
    if (t.k === 'id'){
      const nx = peek(), fk = fnKey(t.v);
      if (nx && nx.k === '(' && fk){
        next(); const args = [];
        if (peek() && peek().k === ')') next();
        else { for (;;){ args.push(expr()); const s = next(); if (!s) throw new Error('Falta «)»'); if (s.k === ')') break; if (s.k !== ',') throw new Error('Se esperaba «,» o «)»'); } }
        lastNum = false; return FN[fk](args);
      }
      if (Object.prototype.hasOwnProperty.call(env, t.v)) return env[t.v].v;
      if (t.v === 'pi' || t.v === 'π') return Math.PI;
      throw new Error('«' + t.v + '» no está definido');
    }
    if (t.k === '('){
      const first = expr();
      if (peek() && peek().k === ','){
        const c = [first]; while (peek() && peek().k === ','){ next(); c.push(expr()); } expect(')');
        c.forEach(x => needNum(x, 'Cada componente')); lastNum = false; return { t: 'v', c, o: null, tuple: true };
      }
      expect(')'); lastNum = false; return first;
    }
    if (t.k === '['){
      const rows = [[]];
      for (;;){ rows[rows.length - 1].push(needNum(expr(), 'Cada elemento')); const s = next(); if (!s) throw new Error('Falta «]»'); if (s.k === ']') break; if (s.k === ';') rows.push([]); else if (s.k !== ',') throw new Error('Se esperaba «,», «;» o «]»'); }
      if (rows.some(r => r.length !== rows[0].length)) throw new Error('Todas las filas deben tener la misma cantidad de elementos');
      lastNum = false; return mk(rows);
    }
    if (t.k === '|'){ bar++; const e = expr(); expect('|'); bar--; lastNum = false; return normOf(e); }
    if (t.k === '√'){ const x = needNum(power(), 'El radicando'); if (x < 0) throw new Error('Raíz de un número negativo'); lastNum = false; return Math.sqrt(x); }
    throw new Error('Símbolo inesperado «' + t.k + '»');
  }
  const r = expr(); if (p < T.length) throw new Error('Sobra «' + (T[p].k === 'id' ? T[p].v : T[p].k) + '»'); return r;
}

/* escena = lista de órdenes evaluadas en secuencia */
function evalScene(cmds){
  const env = {}, objs = []; let auto = 0;
  cmds.forEach((raw, idx) => {
    let c = raw, graph = true, aux = false;
    while (c[0] === '!' || c[0] === '~'){ if (c[0] === '!') graph = false; else aux = true; c = c.slice(1); }
    const m = c.match(/^\s*([A-Za-zÀ-ÿα-ωΑ-Ω][A-Za-zÀ-ÿα-ωΑ-Ω0-9_']*)\s*=\s*(.+)$/);
    let name = m ? m[1] : null; const src = m ? m[2] : c;
    const o = { idx, name, cmd: src, graph, aux, raw };
    try {
      let v = evalExpr(src, env);
      if (!name) name = 'r' + (++auto);
      if (typeof v === 'object' && v.tuple){ v = /^[A-ZÀ-Þ]/.test(name) ? { t: 'p', c: v.c } : { t: 'v', c: v.c, o: null }; }
      o.name = name; o.v = v; env[name] = o;
    } catch (e){ o.err = e.message; o.name = name || '?'; }
    objs.push(o);
  });
  return objs;
}
/* ¿se puede dibujar en el plano? (hasta 3 comps con z = 0) */
function plottable(o){
  if (!o.v || typeof o.v === 'number' || o.v.t === 's' || o.v.t === 'm') return false;
  const ok = a => a.length <= 2 || (a.length === 3 && Math.abs(a[2]) < TOL);
  return ok(o.v.c) && (!o.v.o || ok(o.v.o));
}

/* ===== Matrices ===== */
const isM = a => a && a.t === 'm';
const mk = d => ({ t: 'm', d });
const dimS = a => a.d.length + '×' + a.d[0].length;
const clean = x => (Math.abs(x) < 1e-12 ? 0 : x);
function mAdd(a, b){
  if (a.d.length !== b.d.length || a.d[0].length !== b.d[0].length) throw new Error('Operación no conformable: ' + dimS(a) + ' y ' + dimS(b) + ' (para sumar deben tener el mismo orden)');
  return mk(a.d.map((r, i) => r.map((x, j) => x + b.d[i][j])));
}
function mMul(a, b){
  if (a.d[0].length !== b.d.length) throw new Error('Operación no conformable: ' + dimS(a) + ' · ' + dimS(b) + ' (las columnas de la primera deben igualar las filas de la segunda)');
  return mk(a.d.map(r => b.d[0].map((_, j) => clean(r.reduce((s, x, k) => s + x*b.d[k][j], 0)))));
}
const mT = a => mk(a.d[0].map((_, j) => a.d.map(r => r[j])));
const idn = n => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
function needSquare(a, what){ if (a.d.length !== a.d[0].length) throw new Error(what + ' solo existe para matrices cuadradas (esta es ' + dimS(a) + ')'); }
function detOf(a){
  needSquare(a, 'El determinante'); const n = a.d.length, M = a.d.map(r => r.slice()); let det = 1;
  for (let c = 0; c < n; c++){
    let p = c; for (let i = c + 1; i < n; i++) if (Math.abs(M[i][c]) > Math.abs(M[p][c])) p = i;
    if (Math.abs(M[p][c]) < 1e-12) return 0;
    if (p !== c){ [M[p], M[c]] = [M[c], M[p]]; det = -det; }
    det *= M[c][c];
    for (let i = c + 1; i < n; i++){ const f = M[i][c]/M[c][c]; for (let j = c; j < n; j++) M[i][j] -= f*M[c][j]; }
  }
  return clean(det);
}
/* Gauss-Jordan con registro de operaciones elementales (notación del apunte: e_il(λ) = fila i + λ·fila l) */
function gaussSteps(d, opts){
  opts = opts || {}; const n = d.length, c0 = d[0].length;
  let M = d.map(r => r.slice());
  if (opts.aug) M = M.map((r, i) => r.concat(idn(n)[i]));
  const ncol = M[0].length; if (opts.cc) M = M.map(r => r.concat([r.reduce((s, x) => s + x, 0)]));
  const snap = () => M.map(r => r.map(clean)), steps = [{ op: 'Matriz inicial', why: '', M: snap() }];
  const sub = k => String(k).split('').map(ch => '₀₁₂₃₄₅₆₇₈₉'[+ch]).join('');
  let r = 0; const piv = [];
  for (let col = 0; col < c0 && r < n; col++){
    let p = -1; for (let i = r; i < n; i++) if (Math.abs(M[i][col]) > 1e-12){ p = i; break; }
    if (p < 0) continue;
    if (p !== r){ [M[p], M[r]] = [M[r], M[p]]; steps.push({ op: 'e' + sub(r + 1) + sub(p + 1), why: 'Intercambiar las filas ' + (r + 1) + ' y ' + (p + 1), M: snap() }); }
    const pv = M[r][col];
    if (Math.abs(pv - 1) > 1e-12){ M[r] = M[r].map(x => x/pv); steps.push({ op: 'e' + sub(r + 1) + '(' + fmtNum(1/pv) + ')', why: 'Multiplicar la fila ' + (r + 1) + ' por ' + fmtNum(1/pv), M: snap() }); }
    for (let i = 0; i < n; i++){
      if (i === r) continue; const f = M[i][col]; if (Math.abs(f) < 1e-12) continue;
      M[i] = M[i].map((x, j) => x - f*M[r][j]);
      steps.push({ op: 'e' + sub(i + 1) + sub(r + 1) + '(' + fmtNum(-f) + ')', why: 'A la fila ' + (i + 1) + ' sumarle la fila ' + (r + 1) + ' multiplicada por ' + fmtNum(-f), M: snap() });
    }
    piv.push(col); r++;
  }
  return { steps, final: snap(), piv, split: opts.aug ? c0 : (opts.split || -1), cc: !!opts.cc, ncol, c0 };
}
function rrefM(d){ const g = gaussSteps(d); return g.final; }
function rankM(d){ return gaussSteps(d).piv.length; }
function mInv(a){
  needSquare(a, 'La inversa'); const n = a.d.length, g = gaussSteps(a.d, { aug: true });
  if (g.piv.length < n) throw new Error('La matriz no es inversible: su rango es ' + g.piv.length + ' < ' + n);
  return mk(g.final.map(r => r.slice(n, 2*n)));
}
function mPow(a, k){
  needSquare(a, 'La potencia'); if (!Number.isInteger(k)) throw new Error('El exponente debe ser entero');
  let base = a; if (k < 0){ base = mInv(a); k = -k; }
  let res = mk(idn(a.d.length)); for (let i = 0; i < k; i++) res = mMul(res, base); return res;
}
function needM(a, n){ if (!isM(a)) throw new Error(n + ' debe ser una matriz'); return a; }
function matP(a){
  const n = a.d.length, g = gaussSteps(a.d, { aug: true }); return mk(g.final.map(r => r.slice(a.d[0].length, a.d[0].length + n)));
}
function reducidaInfo(a){
  const d = a.d, fails = []; let lastPiv = -1, seenZero = false, ordered = true, ones = true, cols = true, zeroBottom = true;
  d.forEach((row, i) => {
    const j = row.findIndex(x => Math.abs(x) > 1e-12);
    if (j < 0){ seenZero = true; return; }
    if (seenZero) zeroBottom = false;
    if (j <= lastPiv) ordered = false; lastPiv = j;
    if (Math.abs(row[j] - 1) > 1e-12) ones = false;
    d.forEach((o, k) => { if (k !== i && Math.abs(o[j]) > 1e-12) cols = false; });
  });
  if (!ordered) fails.push('no tiene forma escalonada (el primer elemento no nulo de cada fila debe estar a la derecha del de la fila anterior)');
  if (!ones) fails.push('hay elementos conductores distintos de 1');
  if (!cols) fails.push('hay elementos no nulos en la columna de un conductor');
  if (!zeroBottom) fails.push('hay filas nulas sobre filas no nulas');
  return fails;
}
function tipoInfo(a){
  const d = a.d, m = d.length, n = d[0].length, tags = [], z = x => Math.abs(x) < 1e-12;
  if (m === n){
    tags.push('cuadrada de orden ' + m);
    const all = (f) => d.every((r, i) => r.every((x, j) => f(x, i, j)));
    if (all(x => z(x))) tags.push('nula');
    else if (all((x, i, j) => (i === j ? Math.abs(x - 1) < 1e-12 : z(x)))) tags.push('identidad');
    else if (all((x, i, j) => i === j || z(x))){ tags.push(d.every((r, i) => Math.abs(r[i] - d[0][0]) < 1e-12) ? 'escalar' : 'diagonal'); }
    if (all((x, i, j) => Math.abs(x - d[j][i]) < 1e-12) && !tags.includes('diagonal') && !tags.includes('escalar') && !tags.includes('identidad') && !tags.includes('nula')) tags.push('simétrica');
    if (all((x, i, j) => Math.abs(x + d[j][i]) < 1e-12) && !tags.includes('nula')) tags.push('antisimétrica');
    if (!tags.includes('diagonal') && !tags.includes('escalar') && !tags.includes('identidad') && !tags.includes('nula')){
      if (all((x, i, j) => i <= j || z(x))) tags.push('triangular superior');
      else if (all((x, i, j) => i >= j || z(x))) tags.push('triangular inferior');
    }
    const p = mMul(a, mT(a)); if (p.d.every((r, i) => r.every((x, j) => Math.abs(x - (i === j ? 1 : 0)) < 1e-9)) && !tags.includes('identidad')) tags.push('ortogonal');
  } else tags.push('rectangular ' + m + '×' + n + (n > m ? ' (horizontal)' : ' (vertical)'));
  return tags.join(' · ');
}
Object.assign(FN, {
  transpuesta: a => mT(needM(a[0], 'El argumento')),
  inversa: a => mInv(needM(a[0], 'El argumento')),
  rref: a => mk(rrefM(needM(a[0], 'El argumento').d)),
  reducida: a => mk(rrefM(needM(a[0], 'El argumento').d)),
  rango: a => isM(a[0]) ? rankM(a[0].d) : rankOf(a.map(x => needV(x, 'Cada argumento'))),
  traza: a => { const m = needM(a[0], 'El argumento'); needSquare(m, 'La traza'); return m.d.reduce((s, r, i) => s + r[i], 0); },
  det: a => detOf(needM(a[0], 'El argumento')),
  identidad: a => mk(idn(needNum(a[0], 'El orden'))),
  nula: a => { const m = needNum(a[0], 'Las filas'), n = a.length > 1 ? needNum(a[1], 'Las columnas') : m; return mk(Array.from({ length: m }, () => Array(n).fill(0))); },
  matp: a => matP(needM(a[0], 'El argumento')),
  esreducida: a => { const f = reducidaInfo(needM(a[0], 'El argumento')); return { t: 's', v: f.length ? 'No es reducida por filas: ' + f.join('; ') : 'Es reducida por filas' }; },
  tipo: a => ({ t: 's', v: tipoInfo(needM(a[0], 'El argumento')) }),
  equivalentes: a => {
    const A = needM(a[0], 'El primer argumento'), B = needM(a[1], 'El segundo argumento');
    if (dimS(A) !== dimS(B)) return { t: 's', v: 'No son equivalentes por filas (distinto orden)' };
    const RA = rrefM(A.d), RB = rrefM(B.d);
    return { t: 's', v: RA.every((r, i) => r.every((x, j) => Math.abs(x - RB[i][j]) < 1e-9)) ? 'Son equivalentes por filas' : 'No son equivalentes por filas' };
  },
});
Object.assign(ALIAS, { transpose: 'transpuesta', inv: 'inversa', inverse: 'inversa', escalonar: 'rref', trace: 'traza', tr: 'traza', zeros: 'nula', identity: 'identidad', eye: 'identidad' });

Object.assign(FN, {
  igual: a => {
    const x = a[0], y = a[1]; let ok;
    if (isM(x) && isM(y)) ok = x.d.length === y.d.length && x.d[0].length === y.d[0].length && x.d.every((r, i) => r.every((v, j) => Math.abs(v - y.d[i][j]) < 1e-9));
    else if (isN(x) && isN(y)) ok = Math.abs(x - y) < 1e-9;
    else if (isV(x) && isV(y)) ok = x.c.length === y.c.length && x.c.every((v, i) => Math.abs(v - y.c[i]) < 1e-9);
    else ok = false;
    return { t: 's', v: ok ? 'Son iguales' : 'No son iguales' };
  },
});
/* menores, cofactores y adjunta (Unidad 3) */
const minorOf = (d, i, j) => d.filter((_, r) => r !== i).map(r => r.filter((_, c) => c !== j));
const detRaw = d => (d.length === 1 ? d[0][0] : detOf(mk(d)));
const cofactorOf = (d, i, j) => clean(((i + j) % 2 ? -1 : 1) * detRaw(minorOf(d, i, j)));
const cofMat = d => d.map((r, i) => r.map((_, j) => cofactorOf(d, i, j)));
const adjMat = d => mT(mk(cofMat(d))).d;
const cell = (a, i, j) => { const m = needM(a[0], 'El primer argumento'); needSquare(m, 'El cofactor'); const r = needNum(i, 'La fila'), c = needNum(j, 'La columna'); if (!Number.isInteger(r) || !Number.isInteger(c) || r < 1 || c < 1 || r > m.d.length || c > m.d.length) throw new Error('Posición fuera de la matriz'); return [m.d, r - 1, c - 1]; };
Object.assign(FN, {
  cofactores: a => { const m = needM(a[0], 'El argumento'); needSquare(m, 'La matriz de cofactores'); if (m.d.length < 2) throw new Error('Se necesita una matriz de orden 2 o mayor'); return mk(cofMat(m.d)); },
  adjunta: a => { const m = needM(a[0], 'El argumento'); needSquare(m, 'La adjunta'); if (m.d.length < 2) throw new Error('Se necesita una matriz de orden 2 o mayor'); return mk(adjMat(m.d)); },
  cofactor: a => cofactorOf(...cell(a, a[1], a[2])),
  menor: a => { const [d, i, j] = cell(a, a[1], a[2]); return d.length === 1 ? 1 : detRaw(minorOf(d, i, j)); },
});
Object.assign(ALIAS, { adj: 'adjunta', adjoint: 'adjunta', cof: 'cofactores', cofactors: 'cofactores', minor: 'menor' });


/* sistemas de ecuaciones lineales (Unidad 4): A·X = B, Rouché-Frobenius, Gauss-Jordan, Cramer */
function sysParts(a, what){
  const A = needM(a[0], 'La matriz de coeficientes');
  let rows = A.d, b;
  if (a.length < 2){
    if (rows[0].length < 2) throw new Error(what + ': la matriz ampliada necesita al menos 2 columnas');
    b = rows.map(r => r[r.length - 1]); rows = rows.map(r => r.slice(0, -1));
  } else {
    const B = a[1];
    if (isM(B) && B.d[0].length === 1) b = B.d.map(r => r[0]);
    else if (isV(B)) b = B.c.slice();
    else throw new Error('Los términos independientes deben ser una columna: [b1; b2; …]');
    if (b.length !== rows.length) throw new Error('Hay ' + rows.length + ' ecuaciones y ' + b.length + ' términos independientes');
  }
  return { A: rows, b };
}
function sysInfo(A, b){
  const n = A[0].length, g = gaussSteps(A.map((r, i) => r.concat([b[i]])), { split: n });
  const rA = g.piv.filter(c => c < n).length, rAb = g.piv.length;
  const kind = rAb > rA ? 'incompatible' : rA === n ? 'determinado' : 'indeterminado';
  const free = []; for (let c = 0; c < n; c++) if (!g.piv.includes(c)) free.push(c);
  const part = Array(n).fill(0); g.piv.forEach((c, i) => { if (c < n) part[c] = g.final[i][n]; });
  const basis = free.map(f => { const v = Array(n).fill(0); v[f] = 1; g.piv.forEach((c, i) => { if (c < n) v[c] = clean(-g.final[i][f]); }); return v; });
  return { g, n, m: A.length, rA, rAb, kind, free, part: part.map(clean), basis };
}
const col = v => mk(v.map(x => [x]));
const KIND = { determinado: 'Compatible determinado', indeterminado: 'Compatible indeterminado', incompatible: 'Incompatible' };
function paramText(info){
  const nm = i => 'x' + (i + 1), ts = info.free.map((_, i) => info.free.length > 1 ? 't' + (i + 1) : 't');
  return '(' + info.part.map(x => fmtNum(x)).join(', ') + ') + ' + info.basis.map((v, i) => ts[i] + '·(' + v.map(x => fmtNum(x)).join(', ') + ')').join(' + ');
}
function intVec(v){
  let best = null;
  for (let q = 1; q <= 5000 && !best; q++) if (v.every(x => Math.abs(x*q - Math.round(x*q)) < 1e-7)) best = q;
  if (!best) throw new Error('No se pudo escalar a enteros');
  let w = v.map(x => Math.round(x*best)), g = w.reduce((p, x) => gcd(p, Math.abs(x)), 0) || 1;
  w = w.map(x => x / g); if (w.find(x => x !== 0) < 0) w = w.map(x => -x); return w;
}
Object.assign(FN, {
  clasificar: a => { const { A, b } = sysParts(a, 'Clasificar'); return { t: 's', v: KIND[sysInfo(A, b).kind] }; },
  resolver: a => {
    const { A, b } = sysParts(a, 'Resolver'), info = sysInfo(A, b);
    if (info.kind === 'incompatible') return { t: 's', v: 'Incompatible: rango(A) = ' + info.rA + ' < rango(A|B) = ' + info.rAb };
    if (info.kind === 'determinado') return col(info.part);
    return { t: 's', v: 'Indeterminado (' + (info.n - info.rA) + (info.n - info.rA === 1 ? ' parámetro' : ' parámetros') + '): X = ' + paramText(info) };
  },
  particular: a => { const { A, b } = sysParts(a, 'Particular'), info = sysInfo(A, b); if (info.kind === 'incompatible') throw new Error('El sistema es incompatible: no tiene solución'); return col(info.part); },
  nucleo: a => {
    const A = needM(a[0], 'El argumento'), info = sysInfo(A.d, Array(A.d.length).fill(0));
    return info.basis.length ? mk(info.n ? Array.from({ length: info.n }, (_, i) => info.basis.map(v => v[i])) : []) : col(Array(info.n).fill(0));
  },
  cramer: a => {
    const { A, b } = sysParts(a, 'Cramer'); if (A.length !== A[0].length) throw new Error('Cramer necesita un sistema cuadrado');
    const D = detOf(mk(A)); if (Math.abs(D) < 1e-12) throw new Error('|A| = 0: no se puede aplicar Cramer');
    return col(A.map((_, j) => detOf(mk(A.map((r, i) => r.map((x, k) => (k === j ? b[i] : x))))) / D).map(clean));
  },
  balancear: a => { const A = needM(a[0], 'El argumento'), info = sysInfo(A.d, Array(A.d.length).fill(0)); if (info.basis.length !== 1) throw new Error('La ecuación no tiene una única solución mínima (' + info.basis.length + ' parámetros)'); return col(intVec(info.basis[0])); },
});
Object.assign(ALIAS, { sistema: 'clasificar', rouche: 'clasificar', solve: 'resolver', solucion: 'resolver', null: 'nucleo', kernel: 'nucleo', balance: 'balancear' });


/* espacios vectoriales (Unidad 5): las columnas de la matriz son los vectores (o sus coordenadas en la base canónica) */
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const rn = n => 'ℝ' + String(n).split('').map(d => SUP[+d]).join('');
const colRank = A => sysInfo(A, A.map(() => 0)).rA;
function leftNull(A){ // condiciones de compatibilidad: y·A = 0
  const AT = A[0].map((_, j) => A.map(r => r[j]));
  return sysInfo(AT, AT.map(() => 0)).basis.map(intVec);
}
function condText(v){
  let s = '';
  v.forEach((c, i) => { if (!c) return; const mag = Math.abs(c), co = mag === 1 ? '' : fmtNum(mag); s += (s ? (c < 0 ? ' − ' : ' + ') : c < 0 ? '−' : '') + co + 'y' + SUBD(i + 1); });
  return s + ' = 0';
}
function SUBD(n){ return String(n).split('').map(d => '₀₁₂₃₄₅₆₇₈₉'[+d]).join(''); }
Object.assign(FN, {
  genera: a => { const A = needM(a[0], 'El argumento').d, r = colRank(A); return { t: 's', v: r === A.length ? 'Genera ' + rn(A.length) : 'No genera ' + rn(A.length) + ' (rango ' + r + ' < ' + A.length + ')' }; },
  indep: a => { const A = needM(a[0], 'El argumento').d, r = colRank(A), k = A[0].length; return { t: 's', v: r === k ? 'Linealmente independientes' : 'Linealmente dependientes (rango ' + r + ' < ' + k + ' vectores)' }; },
  base: a => {
    const A = needM(a[0], 'El argumento').d, r = colRank(A), k = A[0].length, m = A.length;
    if (r === k && k === m) return { t: 's', v: 'Es base de ' + rn(m) };
    if (r < k) return { t: 's', v: 'No es base: son linealmente dependientes (rango ' + r + ' < ' + k + ')' };
    return { t: 's', v: 'No es base de ' + rn(m) + ': son independientes pero no generan (' + k + ' vectores < dimensión ' + m + ')' };
  },
  dimension: a => { const A = needM(a[0], 'El argumento').d; return A[0].length - colRank(A); },
  caracterizar: a => {
    const A = needM(a[0], 'El argumento').d, r = colRank(A);
    if (r === A.length) return { t: 's', v: 'Sin condiciones: genera ' + rn(A.length) };
    return { t: 's', v: leftNull(A).map(condText).join(' ; ') };
  },
});
Object.assign(FN, {
  imagen: a => { // base del espacio de columnas: filas no nulas de la reducida de Aᵀ, escritas como columnas
    const A = needM(a[0], 'El argumento').d, AT = A[0].map((_, j) => A.map(r => r[j])), R = rrefM(AT).filter(r => r.some(x => Math.abs(x) > 1e-9));
    return R.length ? mk(A.length ? Array.from({ length: A.length }, (_, i) => R.map(v => clean(v[i]))) : []) : col(Array(A.length).fill(0));
  },
  rot: a => { // matriz de rotación antihoraria; el ángulo va en grados
    const t = needNum(a[0], 'El ángulo') * Math.PI / 180, c = clean(Math.cos(t)), s = clean(Math.sin(t));
    return mk([[c, clean(-s)], [s, c]]);
  },
});
Object.assign(ALIAS, { nulidad: 'dimension', image: 'imagen', recorrido: 'imagen', rotacion: 'rot', giro: 'rot' });
Object.assign(ALIAS, { generan: 'genera', span: 'genera', li: 'indep', independencia: 'indep', independientes: 'indep', basis: 'base', dim: 'dimension', caracteriza: 'caracterizar' });

/* comparación con respuestas esperadas (compartida por la app y las pruebas) */
function cmpExpect(got, exp, err){
  if (exp === 'ERR') return !!err;
  if (got === undefined) return false;
  if (exp && exp.m) return isM(got) && got.d.length === exp.m.length && got.d[0].length === exp.m[0].length && exp.m.every((r, i) => r.every((x, j) => Math.abs(got.d[i][j] - x) < 1e-7));
  if (exp && exp.dim) return isM(got) && got.d.length === exp.dim[0] && got.d[0].length === exp.dim[1];
  if (typeof exp === 'number') return typeof got === 'number' && Math.abs(got - exp) < 1e-7;
  if (Array.isArray(exp)) return !!got.c && got.c.length === exp.length && exp.every((x, i) => Math.abs(got.c[i] - x) < 1e-7);
  return got.t === 's' && (got.v === exp || (exp.endsWith('*') && got.v.startsWith(exp.slice(0, -1))));
}
function expShown(exp, dec){
  if (exp === 'ERR') return 'operación no definida';
  if (exp && exp.m) return fmtVal(mk(exp.m), dec).main;
  if (exp && exp.dim) return 'matriz de orden ' + exp.dim[0] + '×' + exp.dim[1];
  if (typeof exp === 'number') return fmtNum(exp, dec);
  if (Array.isArray(exp)) return '(' + exp.map(x => fmtNum(x, dec)).join(', ') + ')';
  return exp;
}

export { leftNull, colRank, rn, sysInfo, sysParts, paramText, KIND, minorOf, cofactorOf, cofMat, adjMat, ALIAS, FN, TOL, add, cartesian, clOf, clean, cmpExpect, coords, detOf, dimS, div, evalExpr, evalScene, expShown, fmtNum, fmtVal, fnKey, gaussSteps, gcd, idn, isExact, isM, isN, isV, mAdd, mInv, mMul, mPow, mT, matP, mk, mul, needM, needNum, needSquare, needV, neg, normOf, plottable, rankM, rankOf, reducidaInfo, rref, rrefM, same, sqrtForm, sub, tipoInfo, tokenize };
