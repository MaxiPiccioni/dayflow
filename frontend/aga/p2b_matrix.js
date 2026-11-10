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
  return { steps, final: snap(), piv, split: opts.aug ? c0 : -1, cc: !!opts.cc, ncol, c0 };
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
