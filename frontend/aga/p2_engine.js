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
