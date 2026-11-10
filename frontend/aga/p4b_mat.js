/* ===== Vista de matrices: pasos y propiedades ===== */
function matrixHTML(d, o){
  o = o || {}; let h = '<table class="mx"><tbody>';
  d.forEach(r => { h += '<tr>'; r.forEach((x, j) => { const c = []; if (o.split > 0 && j === o.split) c.push('sp'); if (o.cc && j === r.length - 1) c.push('cc'); h += '<td' + (c.length ? ' class="' + c.join(' ') + '"' : '') + '>' + esc(fmtNum(x, o.dec)) + '</td>'; }); h += '</tr>'; });
  return h + '</tbody></table>';
}
function matSmall(v){
  const m = v.d.length, n = v.d[0].length;
  if (v.d.every(r => r.every(x => Math.abs(x) < 1e-12)) && m*n > 12) return '<span class="hint">matriz nula de ' + m + '×' + n + '</span>';
  if (m > 8 || n > 8) return '<span class="hint">matriz de ' + m + '×' + n + '</span>';
  return matrixHTML(v.d);
}
const card = (title, body) => '<section class="mc"><h3>' + title + '</h3>' + body + '</section>';
function propsHTML(v){
  const m = v.d.length, n = v.d[0].length; let h = '<dl class="kv"><dt>Orden</dt><dd>' + m + '×' + n + '</dd><dt>Tipo</dt><dd>' + esc(tipoInfo(v)) + '</dd><dt>Rango</dt><dd>' + rankM(v.d) + '</dd>';
  if (m === n){ const dt = detOf(v); h += '<dt>Traza</dt><dd>' + fmtNum(v.d.reduce((s, r, i) => s + r[i], 0)) + '</dd><dt>Determinante</dt><dd>' + fmtNum(dt) + '</dd><dt>Inversible</dt><dd>' + (Math.abs(dt) > 1e-9 ? 'sí' : 'no (rango menor que ' + n + ')') + '</dd>'; }
  return h + '</dl>';
}
function stepsHTML(g, kind, name){
  const n = g.steps[0].M.length; let h = '<div class="steps">';
  g.steps.forEach((s, i) => {
    let ccok = '';
    if (g.cc){ const ok = s.M.every(r => Math.abs(r.slice(0, g.ncol).reduce((a, x) => a + x, 0) - r[g.ncol]) < 1e-9); ccok = ok ? '<span class="ccok ok">CC ✓</span>' : '<span class="ccok bad">CC ✗</span>'; }
    h += '<div class="st"><div class="stt"><span class="op">' + esc(s.op) + '</span>' + (s.why ? '<span class="why">' + esc(s.why) + '</span>' : '') + ccok + '</div>' + matrixHTML(s.M, { split: g.split, cc: g.cc }) + '</div>';
  });
  h += '</div>';
  const last = g.final;
  if (kind === 'rref') h += '<p class="res">Matriz reducida por filas. Rango = número de filas no nulas = <b>' + g.piv.length + '</b>.</p>';
  else if (kind === 'inv'){
    if (g.piv.length < n) h += '<p class="res bad">Aparece una fila nula en el bloque de A (rango ' + g.piv.length + ' < ' + n + '): <b>la matriz no es inversible</b>.</p>';
    else h += '<p class="res">A la izquierda quedó la identidad: <b>A⁻¹</b> es el bloque derecho.' + '</p>';
  } else if (kind === 'p') h += '<p class="res">El bloque derecho es <b>P</b> y cumple P·' + esc(name) + ' = reducida por filas.</p>';
  return h;
}
function prodHTML(A, B){
  const m = A.d.length, q = B.d[0].length, p = B.d.length; let h = '<div class="exp">';
  if (m*q > 36) return '<p class="hint">El producto tiene ' + m*q + ' elementos: se omite el desarrollo elemento por elemento.</p>';
  const par = x => { const f = fmtNum(x); return x < 0 ? '(' + f + ')' : f; };
  for (let i = 0; i < m; i++) for (let j = 0; j < q; j++){
    const terms = Array.from({ length: p }, (_, k) => fmtNum(A.d[i][k]) + '·' + par(B.d[k][j])).join(' + '), val = A.d[i].reduce((s, a, k) => s + a*B.d[k][j], 0);
    h += '<div class="chk"><span>c<sub>' + (i + 1) + (j + 1) + '</sub></span><span>= ' + esc(terms) + ' = <b>' + esc(fmtNum(clean(val))) + '</b></span></div>';
  }
  return h + '</div><p class="hint">Cada elemento c<sub>ij</sub> es la fila i del primer factor por la columna j del segundo.</p>';
}
function explainHTML(o, s){
  const cmd = o.cmd.replace(/\s+/g, ''); let m;
  const mat = nm => { const x = s.objs.find(q => q.name === nm && !q.err); return x && isM(x.v) ? x.v : null; };
  if ((m = cmd.match(/^(?:Rref|Reducida|Escalonar)\((\w+)\)$/i)) && mat(m[1])) return card('Reducida por filas, paso a paso', '<p class="hint">Notación del apunte: e<sub>il</sub>(λ) suma a la fila i la fila l multiplicada por λ; e<sub>i</sub>(λ) multiplica la fila i por λ; e<sub>il</sub> intercambia filas. La última columna (CC) es la columna de control.</p>' + stepsHTML(gaussSteps(mat(m[1]).d, { cc: true }), 'rref', m[1]));
  if (((m = cmd.match(/^(?:Inversa|Inv|Inverse)\((\w+)\)$/i)) || (m = cmd.match(/^(\w+)\^-1$/))) && mat(m[1])) return card('Inversa por operaciones elementales', '<p class="hint">Se parte de [A | I | CC] y se reduce A. Lo que queda a la derecha de la barra es A⁻¹. CC se mantiene igual a la suma de cada fila si no hay errores de cuenta.</p>' + stepsHTML(gaussSteps(mat(m[1]).d, { aug: true, cc: true }), 'inv', m[1]));
  if ((m = cmd.match(/^MatP\((\w+)\)$/i)) && mat(m[1])) return card('Matriz P, paso a paso', '<p class="hint">Se aplican a [A | I] las mismas operaciones que reducen A. El resultado a la derecha es P.</p>' + stepsHTML(gaussSteps(mat(m[1]).d, { aug: true, cc: true }), 'p', m[1]));
  if ((m = cmd.match(/^(\w+)\*(\w+)$/)) && mat(m[1]) && mat(m[2]) && !o.err) return card('Producto elemento por elemento', prodHTML(mat(m[1]), mat(m[2])));
  return '';
}
function renderMat(){
  const s = scene(), o = s.objs.find(x => x.name === ST.sel); let h = '';
  if (!o) h = '<p class="hint">Seleccioná un objeto de la vista algebraica para ver su resolución.</p>';
  else {
    h += '<header class="mh"><span class="mn"><i>' + esc(o.name) + '</i></span><code>' + esc(o.cmd) + '</code></header>';
    if (o.err) h += '<p class="res bad">' + esc(o.err) + '</p>';
    else if (isM(o.v)) h += card('Resultado', '<div class="mxw">' + matrixHTML(o.v.d, { dec: !!curItem().dec }) + '</div>') + card('Propiedades de la matriz', propsHTML(o.v));
    else { const f = fmtVal(o.v, !!curItem().dec); h += card('Valor', '<p class="big">' + esc(f.main) + (f.approx ? ' <span class="hint">' + esc(f.approx) + '</span>' : '') + '</p>'); }
    h += explainHTML(o, s);
  }
  $('#mview').innerHTML = h;
}
