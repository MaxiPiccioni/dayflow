/* ===== Unidad 2 · Matrices ===== */
const mx = rows => '[' + rows.map(r => r.join(',')).join(';') + ']';
const MM = rows => ({ m: rows });
function ejemplo2(n, title, text, items){ EX.push({ id: 'u2x' + n, kind: 'ej', unit: 2, n, title, tag: 'Matrices', text, items }); }
function ejercicio2(n, title, text, items){ EX.push({ id: 'u2e' + n, num: n, n, kind: 'ex', unit: 2, title, tag: 'Matrices', text, items }); }
const Z = (m, n) => Array.from({ length: m }, () => Array(n).fill(0));
const SH = 'La numeración de las respuestas del apunte está corrida desde el ejercicio 22 hasta el 27: la respuesta rotulada «N» corresponde al ejercicio N + 1. ';

/* ---------- Ejemplos (recuadros del apunte) ---------- */
ejemplo2(1, 'Traza de una matriz', 'La traza de una matriz cuadrada es la suma de los elementos de su diagonal principal. A = [5 2 −3; 1 0 2; 4 1 3].',
  [{ cmds: ['A=' + mx([[5, 2, -3], [1, 0, 2], [4, 1, 3]]), 't=Traza(A)'], expect: { t: 8 }, sol: 'Traza(A) = 5 + 0 + 3 = <b>8</b>.' }]);
ejemplo2(2, 'Matriz transpuesta', 'Dada A (3×2), obtener Aᵗ: las filas de A pasan a ser las columnas.',
  [{ cmds: ['A=' + mx([[-1, 2], [3, 5], [4, -2]]), 'At=A^T'], expect: { At: MM([[-1, 3, 4], [2, 5, -2]]) }, sol: 'A es de orden 3×2, Aᵗ es de orden 2×3: A<sub>ij</sub> pasa a ser (Aᵗ)<sub>ji</sub>.' }]);
ejemplo2(3, 'Matriz identidad', 'Si A = [2 1; −3 4] e I es la identidad de orden 2, verificar que A·I = I·A = A.',
  [{ cmds: ['A=' + mx([[2, 1], [-3, 4]]), 'I=Identidad(2)', 'r1=A*I', 'r2=I*A'], expect: { r1: MM([[2, 1], [-3, 4]]), r2: MM([[2, 1], [-3, 4]]) }, sol: 'La identidad es el elemento neutro del producto de matrices: A·I = I·A = A.' }]);
ejemplo2(4, 'Matriz ortogonal', 'Verificar que A = [1/2 √3/2; −√3/2 1/2] es ortogonal: A·Aᵗ = I.',
  [{ cmds: ['A=[1/2,√3/2;-√3/2,1/2]', 'r=A*A^T', 't=Tipo(A)'], expect: { r: MM([[1, 0], [0, 1]]), t: 'cuadrada de orden 2 · ortogonal' }, sol: 'A·Aᵗ = I, por lo tanto A es ortogonal y A⁻¹ = Aᵗ.' }]);
ejemplo2(5, 'Suma de matrices', 'Resolver A + B con A = [3 1 −2; −4 0 5] y B = [−3 2 4; 1 −2 0].',
  [{ cmds: ['A=' + mx([[3, 1, -2], [-4, 0, 5]]), 'B=' + mx([[-3, 2, 4], [1, -2, 0]]), 'r=A+B'], expect: { r: MM([[0, 3, 2], [-3, -2, 5]]) }, sol: 'Se suman los elementos correspondientes: c<sub>ij</sub> = a<sub>ij</sub> + b<sub>ij</sub>.<br>A + B = [0 3 2; −3 −2 5].' }]);
ejemplo2(6, 'Producto por un escalar: 3A − 2C', 'Dadas A = [2 −4 1; 0 3 5] y C = [0 1 2; 0 −1 3], resolver 3A − 2C.',
  [{ cmds: ['A=' + mx([[2, -4, 1], [0, 3, 5]]), 'C=' + mx([[0, 1, 2], [0, -1, 3]]), 'r=3A-2C'], expect: { r: MM([[6, -14, -1], [0, 11, 9]]) }, sol: '3A = [6 −12 3; 0 9 15] ; 2C = [0 2 4; 0 −2 6]<br>3A − 2C = [6 −14 −1; 0 11 9].' }]);
ejemplo2(7, 'Ingeniería: costos en dos fábricas', 'Costos de manufactura y embarque (3 modelos × 2 costos) en Brasil (F₁) y Argentina (F₂). a) Costos totales F_T = F₁ + F₂. b) Los costos de Brasil aumentan 50 %.',
  [{ cmds: ['F1=' + mx([[32, 40], [50, 80], [70, 20]]), 'F2=' + mx([[40, 60], [50, 50], [130, 20]]), 'FT=F1+F2', 'F1N=1.5*F1'], expect: { FT: MM([[72, 100], [100, 130], [200, 40]]), F1N: MM([[48, 60], [75, 120], [105, 30]]) },
     sol: 'F_T = F₁ + F₂ = [72 100; 100 130; 200 40]. Un producto del modelo C cuesta $200 de manufactura y $40 de embarque.<br>F₁ nueva = 1,5·F₁ = [48 60; 75 120; 105 30].' }]);
ejemplo2(8, 'Producto de matrices A·B', 'Dadas A (2×3) y B (3×3), ¿es posible obtener A·B? Calcular. Se cumple A₂ₓ₃ · B₃ₓ₃ = C₂ₓ₃.',
  [{ cmds: ['A=' + mx([[1, 2, 0], [0, 1, -2]]), 'B=' + mx([[2, 1, 1], [1, 2, 0], [-2, -2, 1]]), 'C=A*B'], focus: 'C', expect: { C: MM([[4, 5, 1], [5, 6, -2]]) },
     sol: 'Las columnas de A (3) igualan las filas de B (3): son conformables. c<sub>ij</sub> = Σ a<sub>ik</sub>·b<sub>kj</sub>. Seleccioná C para ver cada elemento en el panel central.<br>Verificación con fila de control: la fila adicional de A suma por columnas y la fila adicional de C debe sumar por columnas lo mismo (9 = 4 + 5, 11 = 5 + 6, −1 = 1 − 2).' }]);
ejemplo2(9, 'El producto no es conmutativo', 'Con A (2×1) y B (1×2) comparar A·B y B·A.',
  [{ cmds: ['A=[-3;5]', 'B=[4,-1]', 'AB=A*B', 'BA=B*A'], expect: { AB: MM([[-12, 3], [20, -5]]), BA: MM([[-17]]) }, sol: 'A·B es de orden 2×2 y B·A es de orden 1×1: en general A·B ≠ B·A.' }]);
ejemplo2(10, 'Ingeniería: insumos y costos de tres piezas', 'Insumos por pieza (acero, aluminio, soldadura, pintura, mano de obra). a) Total de cada insumo para 20, 30 y 15 unidades de las piezas 1, 2 y 3. b) Costo de cada pieza con precios $60, $70, $10, $30 y $300.',
  [{ cmds: ['Ins=' + mx([[4, 20, 14, 9, 20], [5, 18, 16, 10, 22], [6, 24, 18, 12, 24]]), 'P=[20,30,15]', 'total=P*Ins', 'C=[60;70;10;30;300]', 'costo=Ins*C'], focus: 'total',
     expect: { total: MM([[320, 1300, 1030, 660, 1420]]), costo: MM([[8050], [8620], [9780]]) }, sol: 'a) P·Ins = [320 1300 1030 660 1420].<br>b) Ins·C = [8050; 8620; 9780]: las piezas cuestan $8.050, $8.620 y $9.780.' }]);
ejemplo2(11, 'Matriz reducida por filas: una operación elemental', '¿Qué operación elemental hay que aplicar a C para que resulte reducida por filas? C = [1 3 0 0 3; 0 0 1 1 1; 0 0 0 1 3].',
  [{ cmds: ['C=' + mx([[1, 3, 0, 0, 3], [0, 0, 1, 1, 1], [0, 0, 0, 1, 3]]), 'e=EsReducida(C)', 'R=Rref(C)', 'r=Rango(C)'], focus: 'R', expect: { R: MM([[1, 3, 0, 0, 3], [0, 0, 1, 0, -2], [0, 0, 0, 1, 3]]), r: 3, e: 'No es reducida por filas*' },
     sol: 'Hay que anular el 1 de la fila 2 que está en la columna del conductor de la fila 3: <b>e₂₃(−1)</b> (a la fila 2 sumarle la fila 3 por −1). Rango = 3.' }]);
ejemplo2(12, 'Reducida por filas y rango', 'Encontrar la matriz reducida por filas de A mediante operaciones elementales y dar su rango.',
  [{ cmds: ['A=' + mx([[1, 0, 1, 0, 2], [0, 1, -1, 1, 1], [1, 1, 0, 0, 2]]), 'R=Rref(A)', 'r=Rango(A)'], focus: 'R', expect: { R: MM([[1, 0, 1, 0, 2], [0, 1, -1, 0, 0], [0, 0, 0, 1, 1]]), r: 3 },
     sol: 'Operaciones del apunte: e₃₁(−1), e₃₂(−1), e₂₃(1), e₃(−1). El rango es el número de filas no nulas de la reducida: <b>r = h = 3</b>.' }]);
ejemplo2(13, 'Matriz P que transforma A en su reducida', 'Encontrar la matriz P que transforma A = [2 −1; 5 2; −3 0] en su reducida por filas. P = E₆·E₅·…·E₁, con las matrices elementales de las operaciones usadas.',
  [{ cmds: ['A=' + mx([[2, -1], [5, 2], [-3, 0]]), 'P=MatP(A)', 'R=P*A'], focus: 'P', expect: { P: MM([['2/9', '1/9', 0], ['-5/9', '2/9', 0], ['6/9', '3/9', 1]].map(r => r.map(x => (typeof x === 'string' ? eval(x) : x)))), R: MM([[1, 0], [0, 1], [0, 0]]) },
     sol: 'Se aplican las mismas operaciones a la identidad: P = [2/9 1/9 0; −5/9 2/9 0; 6/9 3/9 1] y P·A = [1 0; 0 1; 0 0].' }]);
ejemplo2(14, 'Matriz inversa con operaciones elementales', 'Calcular la inversa de A = [2 1; 5 3] por operaciones elementales sobre filas, con columna de control (CC).',
  [{ cmds: ['A=' + mx([[2, 1], [5, 3]]), 'Ai=Inversa(A)', 'chk=A*Ai'], focus: 'Ai', expect: { Ai: MM([[3, -1], [-5, 2]]), chk: MM([[1, 0], [0, 1]]) },
     sol: 'Se parte de [A | I | CC]. La columna de control es la suma de cada fila y debe seguir cumpliéndose después de cada operación. Resultado: A⁻¹ = [3 −1; −5 2].' }]);

/* ---------- Ejercicios para resolver ---------- */
ejercicio2(1, 'Operaciones y propiedades', 'Dadas A, B y C resolver los incisos a) a t). Responder: ¿qué propiedad demuestran b) y d)? ¿Qué se concluye de f) y g)? ¿De h) e i)? ¿j) y k)? ¿l) y m)? ¿Qué operación es n)? ¿Qué surge de comparar o), p) y q)? ¿Y de t)?',
  [{ cmds: ['A=' + mx([[2, -4, 1], [0, 3, 5]]), 'B=' + mx([[-1, 3, 1], [2, 0, 5]]), 'C=' + mx([[0, 1, 2], [0, -1, 3]]),
      'r_a=B-C', 'r_b=A+(B+C)', 'r_c=B+A', 'r_d=(A+B)+C', 'r_e=B+(-C)', 'r_f=B+(-B)', 'r_g=A+Nula(2,3)', 'r_h=3(A+B)', 'r_i=3A+3B', 'r_j=(5-3)A', 'r_k=5A-3A', 'r_l=3(2B)', 'r_m=(3*2)B', 'r_n=(B^T)^T', 'r_o=(B+C)^T', 'r_p=C^T+B^T', 'r_q=B^T+C^T', 'r_r=(3B-A)^T', 'r_s=(A+B+C)^T', 'r_t=A+B^T'],
    expect: { r_a: MM([[-1, 2, -1], [2, 1, 2]]), r_b: MM([[1, 0, 4], [2, 2, 13]]), r_c: MM([[1, -1, 2], [2, 3, 10]]), r_d: MM([[1, 0, 4], [2, 2, 13]]), r_e: MM([[-1, 2, -1], [2, 1, 2]]), r_f: MM(Z(2, 3)), r_g: MM([[2, -4, 1], [0, 3, 5]]),
      r_h: MM([[3, -3, 6], [6, 9, 30]]), r_i: MM([[3, -3, 6], [6, 9, 30]]), r_j: MM([[4, -8, 2], [0, 6, 10]]), r_k: MM([[4, -8, 2], [0, 6, 10]]), r_l: MM([[-6, 18, 6], [12, 0, 30]]), r_m: MM([[-6, 18, 6], [12, 0, 30]]), r_n: MM([[-1, 3, 1], [2, 0, 5]]),
      r_o: MM([[-1, 2], [4, -1], [3, 8]]), r_p: MM([[-1, 2], [4, -1], [3, 8]]), r_q: MM([[-1, 2], [4, -1], [3, 8]]), r_r: MM([[-5, 6], [13, -3], [2, 10]]), r_s: MM([[1, 2], [0, 2], [4, 13]]), r_t: 'ERR' },
    ans: 'b) = d): propiedad asociativa de la suma · f) y g): elemento opuesto y elemento neutro (matriz nula) · h) = i): distributiva del escalar respecto de la suma de matrices · j) = k): distributiva respecto de la suma de escalares · l) = m): asociativa del producto por escalares · n) transponer dos veces devuelve la matriz · o) = p) = q): (B + C)ᵗ = Bᵗ + Cᵗ y la suma es conmutativa · t) no conformable: A es 2×3 y Bᵗ es 3×2.',
    note: 'En el inciso r) el enunciado dice (3B − A)ᵗ y la respuesta impresa dice (3B + A)ᵗ. El resultado impreso corresponde a 3B − A. En d) el apunte imprime «1 4 0» en la primera fila; el valor correcto es (1, 0, 4), igual que en b).' }]);
ejercicio2(2, 'Transpuesta y tipos de matrices', 'Dadas E, F, G y H calcular: a) Eᵗ y tipo de E y Eᵗ · b) Fᵗ · c) −F y su tipo; comparar con Fᵗ · d) G + Gᵗ · e) G − Gᵗ; comparar con d) · f) Hᵗ y tipo de H · g) ½(H + Hᵗ) − ½(H − Hᵗ) · h) F + Fᵗ.',
  [{ cmds: ['E=' + mx([[1, 3, 5], [0, 2, 4], [0, 0, 6]]), 'F=' + mx([[0, -1, 2], [1, 0, 3], [-2, -3, 0]]), 'G=' + mx([[1, 2, 6], [3, 4, 7], [5, 8, 9]]), 'H=' + mx([[1, -2, 3], [-2, 4, 5], [3, 5, -8]]),
      'r_a=E^T', 'tipo_E=Tipo(E)', 'tipo_Et=Tipo(E^T)', 'r_b=F^T', 'r_c=-F', 'tipo_F=Tipo(F)', 'r_d=G+G^T', 'r_e=G-G^T', 'tipo_d=Tipo(r_d)', 'tipo_e=Tipo(r_e)', 'r_f=H^T', 'tipo_H=Tipo(H)', 'r_g=(H+H^T)/2-(H-H^T)/2', 'r_h=F+F^T'],
    expect: { r_a: MM([[1, 0, 0], [3, 2, 0], [5, 4, 6]]), tipo_E: 'cuadrada de orden 3 · triangular superior', tipo_Et: 'cuadrada de orden 3 · triangular inferior', r_b: MM([[0, 1, -2], [-1, 0, -3], [2, 3, 0]]), r_c: MM([[0, 1, -2], [-1, 0, -3], [2, 3, 0]]), tipo_F: 'cuadrada de orden 3 · antisimétrica',
      r_d: MM([[2, 5, 11], [5, 8, 15], [11, 15, 18]]), r_e: MM([[0, -1, 1], [1, 0, -1], [-1, 1, 0]]), tipo_d: 'cuadrada de orden 3 · simétrica', tipo_e: 'cuadrada de orden 3 · antisimétrica', r_f: MM([[1, -2, 3], [-2, 4, 5], [3, 5, -8]]), tipo_H: 'cuadrada de orden 3 · simétrica', r_g: MM([[1, -2, 3], [-2, 4, 5], [3, 5, -8]]), r_h: MM(Z(3, 3)) },
    ans: 'E es triangular superior y Eᵗ triangular inferior · −F = Fᵗ porque F es antisimétrica · G + Gᵗ es simétrica y G − Gᵗ es antisimétrica · H es simétrica (H = Hᵗ) · g) da Hᵗ: toda matriz es suma de una simétrica y una antisimétrica · h) F + Fᵗ = 0 por ser F antisimétrica.',
    note: 'El apunte rotula la respuesta h) como F − Fᵗ, pero la matriz nula que imprime corresponde a F + Fᵗ (lo que pide el enunciado): F es antisimétrica, así que F + Fᵗ = 0 y F − Fᵗ = 2F.' }]);
ejercicio2(3, 'Suma y producto por escalar', 'Dadas A y B calcular: a) A + B · b) −1B · c) A − B · d) 4(B + C) · e) 2A · f) −3A + 2B.',
  [{ cmds: ['A=' + mx([[1, -1, 4], [0, -4, 2]]), 'B=' + mx([[2, 3, -4], [1, 0, 2]]), 'r_a=A+B', 'r_b=-1*B', 'r_c=A-B', 'r_d=4(B+C)', 'r_e=2A', 'r_f=-3A+2B'],
    expect: { r_a: MM([[3, 2, 0], [1, -4, 4]]), r_b: MM([[-2, -3, 4], [-1, 0, -2]]), r_c: MM([[-1, -4, 8], [-1, -4, 0]]), r_d: 'ERR', r_e: MM([[2, -2, 8], [0, -8, 4]]), r_f: MM([[1, 9, -20], [2, 12, -2]]) },
    ans: 'a) [3 2 0; 1 −4 4] · b) [−2 −3 4; −1 0 −2] · c) [−1 −4 8; −1 −4 0] · e) [2 −2 8; 0 −8 4] · f) [1 9 −20; 2 12 −2].',
    note: 'El inciso d) usa una matriz C que el enunciado no define, por eso la app indica que C no está definido. En b) el apunte imprime «−1 −2 4» en la primera fila; con B = [2 3 −4; 1 0 2] el resultado es (−2, −3, 4).' }]);
ejercicio2(4, 'Transpuesta de sumas', 'Dadas A y B calcular: a) Aᵗ · b) Bᵗ · c) (A + B)ᵗ · d) Aᵗ + A · e) Verificar si Aᵗ + Bᵗ = (A + B)ᵗ · f) Analizar e) y decir qué tipo de matriz es «A + Aᵗ».',
  [{ cmds: ['A=' + mx([[2, 2, -3], [4, 1, -3], [4, 5, 4]]), 'B=' + mx([[0, 1, -3], [4, -5, 1], [1, 2, 4]]), 'r_a=A^T', 'r_b=B^T', 'r_c=(A+B)^T', 'r_d=A^T+A', 'r_e=Igual(A^T+B^T,(A+B)^T)', 'tipo_d=Tipo(r_d)'],
    expect: { r_a: MM([[2, 4, 4], [2, 1, 5], [-3, -3, 4]]), r_b: MM([[0, 4, 1], [1, -5, 2], [-3, 1, 4]]), r_c: MM([[2, 8, 5], [3, -4, 7], [-6, -2, 8]]), r_d: MM([[4, 6, 1], [6, 2, 2], [1, 2, 8]]), r_e: 'Son iguales', tipo_d: 'cuadrada de orden 3 · simétrica' },
    ans: 'e) Se verifica (A + B)ᵗ = Aᵗ + Bᵗ · f) A + Aᵗ es simétrica.' }]);
ejercicio2(5, 'Combinaciones lineales de matrices', 'Calcular: a) A + 2B · b) −5F · c) −C · d) 4D + 4E.',
  [{ cmds: ['A=' + mx([[1, 2], [3, 4]]), 'B=' + mx([[-10, 1], [1, 10]]), 'C=[1,2,3]', 'D=' + mx([[4, 7, 8], [9, 1, 10]]), 'E=' + mx([[-1, -1, 2], [-2, 2, 1]]), 'F=' + mx([[1, 0], [3, 2], [7, -1]]), 'r_a=A+2B', 'r_b=-5F', 'r_c=-C', 'r_d=4D+4E'],
    expect: { r_a: MM([[-19, 4], [5, 24]]), r_b: MM([[-5, 0], [-15, -10], [-35, 5]]), r_c: MM([[-1, -2, -3]]), r_d: MM([[12, 24, 40], [28, 12, 44]]) }, ans: 'a) [−19 4; 5 24] · b) [−5 0; −15 −10; −35 5] · c) [−1 −2 −3] · d) [12 24 40; 28 12 44].' }]);
ejercicio2(6, 'Hallar la matriz D', 'Dadas A y B, hallar D tal que: a) A + B − D = matriz nula · b) 2A + 3B − 4D = 5A.',
  [{ l: 'a)', cmds: ['A=' + mx([[1, 2], [3, 4], [5, 6]]), 'B=' + mx([[-3, -2], [1, -5], [4, 3]]), 'D=A+B', 'chk=A+B-D'], expect: { D: MM([[-2, 0], [4, -1], [9, 9]]), chk: MM(Z(3, 2)) }, ans: 'D = A + B = [−2 0; 4 −1; 9 9]', sol: 'Despejando: D = A + B.' },
   { l: 'b)', cmds: ['A=' + mx([[1, 2], [3, 4], [5, 6]]), 'B=' + mx([[-3, -2], [1, -5], [4, 3]]), 'D=(3B-3A)/4', 'chk=2A+3B-4D-5A'], expect: { D: MM([[-3, -3], ['-3/2', '-27/4'], ['-3/4', '-9/4']].map(r => r.map(x => (typeof x === 'string' ? eval(x) : x)))), chk: MM(Z(3, 2)) }, ans: 'D = (3/4)(B − A) = [−3 −3; −3/2 −27/4; −3/4 −9/4]', sol: 'Despejando: 4D = 2A + 3B − 5A = 3B − 3A ⇒ D = (3B − 3A)/4.' }]);
ejercicio2(7, 'Hallar la matriz X', 'Determinar la matriz X tal que 2A + 3B − X = matriz nula.',
  [{ cmds: ['A=' + mx([[1, 2, -1], [0, 2, 3]]), 'B=' + mx([[0, 5, 4], [1, 3, 2]]), 'X=2A+3B'], expect: { X: MM([[2, 19, 10], [3, 13, 12]]) }, ans: 'X = 2A + 3B = [2 19 10; 3 13 12]' }]);
ejercicio2(8, 'Expresiones definidas', 'Dadas K, L y M, de las expresiones a) a q) encontrar las que están definidas y calcularlas.',
  [{ cmds: ['K=' + mx([[4, 6, -1], [3, 0, 2], [1, -2, 5]]), 'L=' + mx([[2, 4], [0, 1], [-1, 2]]), 'M=[3,1,2]',
      'r_a=K*L', 'r_b=L*K', 'r_c=K^2', 'r_d=L^2', 'r_e=K*K^T', 'r_f=K^T*K', 'r_g=L*L^T', 'r_h=L^T*L', 'r_i=(K*L)^T', 'r_j=L^T*K^T', 'r_k=K*M', 'r_l=K*M^T', 'r_m=M*K', 'r_n=M*M^T', 'r_o=M^T*M', 'r_p=M*K*L', 'r_q=(K*L)^T*M^T'],
    expect: { r_a: MM([[9, 20], [4, 16], [-3, 12]]), r_b: 'ERR', r_c: MM([[33, 26, 3], [14, 14, 7], [3, -4, 20]]), r_d: 'ERR', r_e: MM([[53, 10, -13], [10, 13, 13], [-13, 13, 30]]), r_f: MM([[26, 22, 7], [22, 40, -16], [7, -16, 30]]), r_g: MM([[20, 4, 6], [4, 1, 2], [6, 2, 5]]), r_h: MM([[5, 6], [6, 21]]),
      r_i: MM([[9, 4, -3], [20, 16, 12]]), r_j: MM([[9, 4, -3], [20, 16, 12]]), r_k: 'ERR', r_l: MM([[16], [13], [11]]), r_m: MM([[17, 14, 9]]), r_n: MM([[14]]), r_o: MM([[9, 3, 6], [3, 1, 2], [6, 2, 4]]), r_p: MM([[25, 100]]), r_q: MM([[25], [100]]) },
    ans: 'No definidas (no conformables): b) L·K, d) L², k) K·M. Las demás están definidas; ver los valores en la vista algebraica.' }]);
ejercicio2(9, 'Cuadrado de una matriz', 'Dada la matriz A, hallar A².',
  [{ cmds: ['A=' + mx([[2, 5, 4], [1, 3, 0], [2, 6, 0]]), 'r=A^2'], focus: 'r', expect: { r: MM([[17, 49, 8], [5, 14, 4], [10, 28, 8]]) }, ans: 'A² = [17 49 8; 5 14 4; 10 28 8]' }]);
ejercicio2(10, 'Verificar proposiciones', 'Dadas A y B, verificar si se cumplen: a) (A·B)ᵗ = Aᵗ·Bᵗ · b) A·B = B·A · c) A·B = matriz nula, siendo A ≠ 0 y B ≠ 0.',
  [{ cmds: ['A=' + mx([[1, -1, 1], [-3, 2, -1], [-2, 1, 0]]), 'B=' + mx([[1, 2, 3], [2, 4, 6], [1, 2, 3]]), 'AB=A*B', 'r_a1=(A*B)^T', 'r_a2=A^T*B^T', 'ok_a=Igual(r_a1,r_a2)', 'BA=B*A', 'ok_b=Igual(AB,BA)'],
    expect: { AB: MM(Z(3, 3)), r_a2: MM([[-11, -22, -11], [6, 12, 6], [-1, -2, -1]]), ok_a: 'No son iguales', BA: MM([[-11, 6, -1], [-22, 12, -2], [-11, 6, -1]]), ok_b: 'No son iguales' },
    ans: 'a) No se cumple: (A·B)ᵗ = 0 ≠ Aᵗ·Bᵗ · b) No se cumple: A·B = 0 ≠ B·A · c) Sí: A·B es la matriz nula con A ≠ 0 y B ≠ 0.' }]);
ejercicio2(11, 'Producto P·Q y Q·P', 'Dadas P y Q resolver: a) P·Q · b) Q·P.',
  [{ cmds: ['P=' + mx([[1, -2, 4], [3, 1, 5], [2, 4, 0]]), 'Q=' + mx([[2, 4, -2], [-1, -2, 1], [-1, -2, 1]]), 'PQ=P*Q', 'QP=Q*P'], expect: { PQ: MM(Z(3, 3)), QP: MM([[10, -8, 28], [-5, 4, -14], [-5, 4, -14]]) }, ans: 'P·Q = matriz nula · Q·P = [10 −8 28; −5 4 −14; −5 4 −14]' }]);
ejercicio2(12, 'Órdenes y conformabilidad', 'A y B son de orden 4×5; C, D y E son de orden 5×2, 4×2 y 5×4. Determinar cuáles expresiones están definidas y el orden del resultado. (Las matrices se cargan nulas: solo importan sus órdenes.)',
  [{ cmds: ['A=Nula(4,5)', 'B=Nula(4,5)', 'C=Nula(5,2)', 'D=Nula(4,2)', 'E=Nula(5,4)', 'r_a=B*A', 'r_b=A*C+D', 'r_c=A*E+B', 'r_d=A*B+B', 'r_e=E*(A+B)', 'r_f=E*(A*C)'],
    expect: { r_a: 'ERR', r_b: { dim: [4, 2] }, r_c: 'ERR', r_d: 'ERR', r_e: { dim: [5, 5] }, r_f: { dim: [5, 2] } }, ans: 'a) no conformable · b) 4×2 · c) no conformable · d) no conformable · e) 5×5 · f) 5×2' }]);
ejercicio2(13, 'Combinación (A + B)·C − D', 'Dadas A, B, C y D calcular (A + B)·C − D.',
  [{ cmds: ['A=' + mx([[0, 6, -4], [1, 3, 8]]), 'B=' + mx([[5, 3, -1], [2, -2, 3]]), 'C=[4;-1;6]', 'D=[2;3]', 'r=(A+B)*C-D'], focus: 'r', expect: { r: MM([[-21], [74]]) }, ans: '(A + B)·C − D = [−21; 74]' }]);
ejercicio2(14, 'Asociatividad del producto', 'Dadas A, B y C: a) comprobar (A·B)·C = A·(B·C) · b) ¿qué conclusión se obtiene?',
  [{ cmds: ['A=' + mx([[2, 1, -1], [3, 1, 1]]), 'B=' + mx([[1, 1], [2, 0], [3, -1]]), 'C=[1;3]', 'r1=(A*B)*C', 'r2=A*(B*C)', 'ok=Igual(r1,r2)'], expect: { r1: MM([[10], [14]]), r2: MM([[10], [14]]), ok: 'Son iguales' }, ans: '(A·B)·C = A·(B·C) = [10; 14]: el producto de matrices es asociativo.' }]);
ejercicio2(15, 'Distributividad del producto', 'Comprobar: a) A·(B + C) = A·B + A·C · b) (B + C)·D = B·D + C·D · c) ¿Qué se puede asegurar sobre el producto?',
  [{ cmds: ['A=' + mx([[1, 2], [0, 1]]), 'B=' + mx([[1, 3, 0], [2, 1, -1]]), 'C=' + mx([[0, 2, -1], [-3, 2, 1]]), 'D=' + mx([[1, 2], [0, 3], [2, 5]]),
      'r_a1=A*(B+C)', 'r_a2=A*B+A*C', 'ok_a=Igual(r_a1,r_a2)', 'r_b1=(B+C)*D', 'r_b2=B*D+C*D', 'ok_b=Igual(r_b1,r_b2)'],
    expect: { r_a1: MM([[-1, 11, -1], [-1, 3, 0]]), ok_a: 'Son iguales', r_b1: MM([[-1, 12], [-1, 7]]), ok_b: 'Son iguales' }, ans: 'a) y b) se cumplen: el producto es distributivo a derecha y a izquierda respecto de la suma.' }]);
ejercicio2(16, 'A·B = C·B no implica A = C', 'Dadas A, B y C: a) probar si A·B = B·A · b) ¿Qué implican los resultados?',
  [{ cmds: ['A=' + mx([[1, 2, 0], [0, 1, 2]]), 'B=' + mx([[1, 2, 0], [2, 1, 1], [3, 3, 1]]), 'C=' + mx([[0, 1, 1], [2, 3, 0]]), 'r_ab=A*B', 'r_cb=C*B', 'r_ba=B*A', 'ok=Igual(r_ab,r_cb)', 'ig=Igual(A,C)'],
    expect: { r_ab: MM([[5, 4, 2], [8, 7, 3]]), r_cb: MM([[5, 4, 2], [8, 7, 3]]), r_ba: 'ERR', ok: 'Son iguales', ig: 'No son iguales' },
    ans: 'A·B = C·B = [5 4 2; 8 7 3] pero A ≠ C: no se puede «simplificar» B en un producto de matrices.',
    note: 'El enunciado pregunta por A·B = B·A, que no está definido (B·A no es conformable). La respuesta impresa del apunte compara A·B con C·B, y eso es lo que se muestra.' }]);
ejercicio2(17, '(A + B)² = A² + 2AB + B²', 'Sean A y B matrices cuadradas de orden n. ¿Bajo qué condición se verifica (A + B)² = A² + 2·A·B + B²? Se prueban dos pares de ejemplo.',
  [{ l: 'Conmutan', cmds: ['A=' + mx([[1, 2], [0, 1]]), 'B=' + mx([[3, 4], [0, 3]]), 'AB=A*B', 'BA=B*A', 'izq=(A+B)^2', 'der=A^2+2A*B+B^2', 'ok=Igual(izq,der)'], expect: { ok: 'Son iguales' }, ans: 'Como A·B = B·A, la igualdad se cumple.' },
   { l: 'No conmutan', cmds: ['A=' + mx([[1, 1], [0, 1]]), 'B=' + mx([[1, 0], [1, 1]]), 'AB=A*B', 'BA=B*A', 'izq=(A+B)^2', 'der=A^2+2A*B+B^2', 'ok=Igual(izq,der)'], expect: { ok: 'No son iguales' }, ans: 'Como A·B ≠ B·A, la igualdad no se cumple.' }].map(it => ({ ...it, sol: '(A + B)² = A² + A·B + B·A + B². Esto coincide con A² + 2·A·B + B² si y solo si A·B = B·A.' })).map((it, i) => ({ ...it, note: i === 0 ? 'La condición necesaria y suficiente es que A y B conmuten (A·B = B·A). El apunte indica «A es la inversa de B (o al revés)»: en ese caso A·B = B·A = I y la igualdad se cumple, pero la condición es más amplia.' : undefined })));
ejercicio2(18, 'Propiedades con A, B y C', 'Con a = −3 y b = 2 probar: a) A + (B + C) = (A + B) + C · b) (A·B)·C = A·(B·C) · c) (a + b)·C = a·C + b·C · d) a·(B − C) = a·B − a·C.',
  [{ cmds: ['A=' + mx([[3, 2], [-1, 3]]), 'B=' + mx([[4, 0], [1, 5]]), 'C=' + mx([[0, -1], [4, 6]]), 'ea=-3', 'eb=2',
      'r_a1=A+(B+C)', 'r_a2=(A+B)+C', 'ok_a=Igual(r_a1,r_a2)', 'r_b1=(A*B)*C', 'r_b2=A*(B*C)', 'ok_b=Igual(r_b1,r_b2)', 'r_c1=(ea+eb)*C', 'r_c2=ea*C+eb*C', 'ok_c=Igual(r_c1,r_c2)', 'r_d1=ea*(B-C)', 'r_d2=ea*B-ea*C', 'ok_d=Igual(r_d1,r_d2)'],
    expect: { r_a1: MM([[7, 1], [4, 14]]), r_b1: MM([[40, 46], [60, 91]]), r_c1: MM([[0, 1], [-4, -6]]), r_d1: MM([[-12, -3], [9, 3]]), ok_a: 'Son iguales', ok_b: 'Son iguales', ok_c: 'Son iguales', ok_d: 'Son iguales' },
    ans: 'a) [7 1; 4 14] · b) [40 46; 60 91] · c) [0 1; −4 −6] · d) [−12 −3; 9 3]. En los cuatro casos ambos miembros coinciden.' }]);
ejercicio2(19, 'Ecuación matricial con transpuesta', 'Determinar X = [x₁; x₂; x₃] tal que (A − I)ᵗ·X = A·X + 3Z, con A = diag(3, 2, 3) y Z = [4; 5; 6].',
  [{ cmds: ['A=' + mx([[3, 0, 0], [0, 2, 0], [0, 0, 3]]), 'Z=[4;5;6]', 'I=Identidad(3)', 'X=-3Z', 'lado1=(A-I)^T*X', 'lado2=A*X+3Z', 'ok=Igual(lado1,lado2)'], focus: 'X', expect: { X: MM([[-12], [-15], [-18]]), ok: 'Son iguales' },
    ans: 'X = [−12; −15; −18]', sol: '(Aᵗ − I)X = AX + 3Z. Como A es simétrica, AX − X = AX + 3Z ⇒ −X = 3Z ⇒ X = −3Z.' }]);
ejercicio2(20, 'Propiedades de la transposición', 'Dadas A y B de orden 3 con elementos generales a<sub>ij</sub> y b<sub>ij</sub>, demostrar: a) (Aᵗ)ᵗ = A · b) (A + B)ᵗ = Aᵗ + Bᵗ · c) (A·B)ᵗ = Bᵗ·Aᵗ · d) (k·A)ᵗ = k·Aᵗ. (La demostración general se hace a mano con a<sub>ij</sub>; acá se verifica con matrices numéricas.)',
  [{ cmds: ['A=' + mx([[1, 2, 3], [4, 5, 6], [7, 8, 10]]), 'B=' + mx([[2, 0, 1], [1, 3, 2], [0, 1, 4]]), 'k=5', 'ok_a=Igual((A^T)^T,A)', 'ok_b=Igual((A+B)^T,A^T+B^T)', 'ok_c=Igual((A*B)^T,B^T*A^T)', 'ok_d=Igual((k*A)^T,k*A^T)'],
    expect: { ok_a: 'Son iguales', ok_b: 'Son iguales', ok_c: 'Son iguales', ok_d: 'Son iguales' }, ans: 'El apunte no trae respuestas para este ejercicio. Los cuatro casos numéricos verifican las propiedades.' }]);
ejercicio2(21, 'Contratista y proveedores', 'La matriz A da los precios por unidad de madera, ladrillos, concreto, vidrio y pintura de cada uno de tres proveedores (filas). Las obras I, II y III requieren (20, 4, 5, 3, 3), (10, 0, 8, 8, 2) y (30, 10, 20, 10, 12) unidades. Armar B y calcular A·B. Interpretar y decidir qué proveedor conviene para cada obra.',
  [{ cmds: ['A=' + mx([[8, 5, 7, 2, 4], [9, 4, 5, 2, 5], [9, 5, 6, 1, 5]]), 'B=' + mx([[20, 10, 30], [4, 0, 10], [5, 8, 20], [3, 8, 10], [3, 2, 12]]), 'AB=A*B'], focus: 'AB', expect: { AB: MM([[233, 160, 498], [242, 156, 490], [248, 156, 510]]) },
    ans: 'A·B tiene una fila por proveedor y una columna por obra: el elemento (i, j) es el costo total de la obra j con el proveedor i. Obra I: proveedor 1 ($233) · Obra II: proveedor 2 o 3 ($156, empatan) · Obra III: proveedor 2 ($490).',
    note: 'El apunte no trae respuesta para este ejercicio; el resultado es el calculado por la app.' }]);
ejercicio2(22, 'Matriz P que lleva A a su reducida', 'En cada caso dar la matriz P que transforma a A en su reducida por filas.',
  [{ l: 'a)', cmds: ['A=' + mx([[1, 3, 2, 1], [5, -1, 0, 1], [0, 1, 2, 6]]), 'R=Rref(A)', 'P=MatP(A)', 'ok=Igual(P*A,R)'], focus: 'P', expect: { P: MM([['1/11', '2/11', '-1/11'], ['5/11', '-1/11', '-5/11'], ['-5/22', '1/22', '8/11']].map(r => r.map(x => eval(x)))), ok: 'Son iguales' },
     ans: 'P = [1/11 2/11 −1/11; 5/11 −1/11 −5/11; −5/22 1/22 8/11]', note: SH },
   { l: 'b)', cmds: ['A=' + mx([[1, 3, 2], [4, -1, 0], [0, 1, 1]]), 'R=Rref(A)', 'P=MatP(A)', 'ok=Igual(P*A,R)'], focus: 'P', expect: { P: MM([['1/5', '1/5', '-2/5'], ['4/5', '-1/5', '-8/5'], ['-4/5', '1/5', '13/5']].map(r => r.map(x => eval(x)))), ok: 'Son iguales' },
     ans: 'P = A⁻¹ = [1/5 1/5 −2/5; 4/5 −1/5 −8/5; −4/5 1/5 13/5]', note: SH + 'El apunte imprime «16/22» en la posición (3, 3); el valor que resulta es 13/5 (A·P = I lo confirma).' }]);
ejercicio2(23, 'Matriz elemental E', 'Dada A = [1 2; 0 1; 2 1], dar la matriz elemental E tal que E·A = B.',
  [{ l: 'a)', cmds: ['A=' + mx([[1, 2], [0, 1], [2, 1]]), 'B=' + mx([[1, 2], [0, 3], [2, 1]]), 'E=' + mx([[1, 0, 0], [0, 3, 0], [0, 0, 1]]), 'ok=Igual(E*A,B)'], focus: 'E', expect: { ok: 'Son iguales' }, ans: 'E = e₂(3): multiplicar la fila 2 por 3.', note: SH },
   { l: 'b)', cmds: ['A=' + mx([[1, 2], [0, 1], [2, 1]]), 'B=' + mx([[1, 5], [0, 1], [2, 1]]), 'E=' + mx([[1, 3, 0], [0, 1, 0], [0, 0, 1]]), 'ok=Igual(E*A,B)'], focus: 'E', expect: { ok: 'Son iguales' }, ans: 'E = e₁₂(3): a la fila 1 sumarle la fila 2 por 3.', note: SH },
   { l: 'c)', cmds: ['A=' + mx([[1, 2], [0, 1], [2, 1]]), 'B=' + mx([[0, 1], [1, 2], [2, 1]]), 'E=' + mx([[0, 1, 0], [1, 0, 0], [0, 0, 1]]), 'ok=Igual(E*A,B)'], focus: 'E', expect: { ok: 'Son iguales' }, ans: 'E = e₁₂: intercambiar las filas 1 y 2.', note: SH }]);
ejercicio2(24, 'Equivalencia por filas (F y G)', 'Determinar si F y G son equivalentes por filas. Dos matrices son equivalentes por filas si y solo si tienen la misma reducida por filas.',
  [{ cmds: ['F=' + mx([[1, 1, 0, -2], [-1, 3, 1, 5], [1, 13, 3, 7]]), 'G=' + mx([[0, 0, 1, -1], [0, 1, 0, 1], [1, 0, 1, -1]]), 'RF=Rref(F)', 'RG=Rref(G)', 'r=Equivalentes(F,G)'], focus: 'RF', expect: { r: 'No son equivalentes por filas' }, ans: 'F y G no son equivalentes por filas.', note: SH }]);
ejercicio2(25, 'Equivalencia por filas (H y L)', 'Determinar si H y L son equivalentes por filas.',
  [{ cmds: ['H=' + mx([[2, -1], [5, 2], [-3, 0]]), 'L=' + mx([[7, 11], [-2, 3], ['1/2', -1]]), 'RH=Rref(H)', 'RL=Rref(L)', 'r=Equivalentes(H,L)'], focus: 'RL', expect: { r: 'Son equivalentes por filas' }, ans: 'H y L son equivalentes por filas (misma reducida: [1 0; 0 1; 0 0]).', note: SH }]);
ejercicio2(26, 'Equivalencia por filas con filas simbólicas', 'Dadas A (con filas A₁, A₂, A₃) y B (con filas 2A₁ + 3A₂, A₂, A₃), determinar si son equivalentes por filas. (Se verifica con una A numérica.)',
  [{ cmds: ['A=' + mx([[1, 2, 0], [3, 1, 4], [0, 5, 2]]), 'E=' + mx([[2, 3, 0], [0, 1, 0], [0, 0, 1]]), 'B=E*A', 'r=Equivalentes(A,B)', 'dE=Det(E)'], focus: 'B', expect: { r: 'Son equivalentes por filas', dE: 2 },
    ans: 'Son equivalentes: B = E·A con E inversible (det E = 2 ≠ 0), es decir, B se obtiene de A por operaciones elementales de fila.', note: 'El apunte no trae respuesta para este ejercicio.' }]);
const R27 = { A: [[1, 0, 0, 0], [0, 1, -3, 0], [0, 0, 0, 1]], B: [[1, 0, 0, 0], [0, 1, -1, 0], [0, 0, 1, 0]], C: [[0, 2, 3, 0], [0, 0, 0, 1], [0, 0, 0, 0]], D: [[0, 1, 0, -2, 0], [0, 0, 1, 4, 0], [0, 0, 0, 0, 1]], E: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], F: [[1, 3, 0, 0], [0, 0, 1, 0], [0, 0, 1, 1]], G: [[0, 1, 0, -2], [1, 0, 2, 1], [0, 0, 1, 0]], M: [[0, 1, -1, 0, 0], [2, 0, 3, 0, 5], [0, 0, 0, 1, 6]], N: [[1, 0], [0, 1], [0, 0]] };
const E27 = { A: [true, 3], B: [false, 3], C: [false, 2], D: [true, 3], E: [true, 3], F: [false, 3], G: [false, 3], M: [false, 3], N: [true, 2] };
ejercicio2(27, '¿Reducida por filas? Condiciones y rango', 'Para cada matriz señalar si es reducida por filas. Para las que no lo sean, indicar qué condiciones no se verifican y hallar la reducida. Dar el rango de cada una.',
  Object.keys(R27).map(k => ({ l: k, cmds: [k + '=' + mx(R27[k]), 'e=EsReducida(' + k + ')', 'R=Rref(' + k + ')', 'r=Rango(' + k + ')'], focus: 'R',
    expect: { e: E27[k][0] ? 'Es reducida por filas' : 'No es reducida por filas*', r: E27[k][1] }, ans: (E27[k][0] ? 'Ya es reducida por filas.' : 'No es reducida por filas; su reducida está en la vista algebraica.') + ' Rango = ' + E27[k][1] + '.', note: 'El apunte no trae respuesta para este ejercicio; los resultados son los calculados por la app.' })));
const R28 = { B: [[2, 1], [5, 3]], C: [[1, -1, 2], [2, 1, 1]], D: [[1, 2, 0, -1], [2, 4, 1, 4], [1, 5, -1, 2]], E: [[1, 2, 3, 0, 0], [0, 1, 2, 3, 0], [0, 0, 1, 2, 3]], F: [[1, 0, -3], [0, 0, 0], [0, 1, '1/2']],
  G: [[1, 2], [0, 1], [2, 3], [1, -1]], H: [[3, -3, -3, -2, 4], [0, 0, 0, 0, 0], [2, -1, 1, -1, 2], [-2, 2, 2, 1, -3]], I: [[2, 6, 2, 1], [0, 3, 6, 1], [2, 3, -4, 0], [6, 24, 24, 5]], J: [[6, 24, 24, 5], [2, 3, -4, 0], [2, 6, 2, 1], [0, 3, 6, 1]],
  K: [[3, 1, -1], [2, 0, 5], [5, 3, -13], [1, 0, 1], [0, 0, 1]], L: [[3, '-1/2'], [-6, 1]], M: [[2, 1, 1], [1, 0, 1], [3, 1, 0]], N: [[1, 0, 2, -1], [1, 1, 1, 1], [2, 1, 3, 0], [3, 2, 4, 2]], 'Ñ': [[0, 0, 3, 1], [0, 1, 0, 1], [1, 0, 1, 0], [3, 1, 6, 2]] };
const A28 = { B: [[[1, 0], [0, 1]], 2], C: [[[1, 0, 1], [0, 1, -1]], 2], D: [[[1, 0, 0, -7], [0, 1, 0, 3], [0, 0, 1, 6]], 3], E: [[[1, 0, 0, -4, 3], [0, 1, 0, -1, -6], [0, 0, 1, 2, 3]], 3], F: [[[1, 0, -3], [0, 1, '1/2'], [0, 0, 0]], 2], G: [[[1, 0], [0, 1], [0, 0], [0, 0]], 2],
  H: [[[1, 0, 2, 0, 1], [0, 1, 3, 0, -1], [0, 0, 0, 1, 1], [0, 0, 0, 0, 0]], 3], I: [[[1, 0, 0, '-1/2'], [0, 1, 0, '1/3'], [0, 0, 1, 0], [0, 0, 0, 0]], 3], K: [[[1, 0, 0], [0, 1, 0], [0, 0, 1], [0, 0, 0], [0, 0, 0]], 3], L: [[[1, '-1/6'], [0, 0]], 1], M: [[[1, 0, 0], [0, 1, 0], [0, 0, 1]], 3],
  N: [[[1, 0, 2, 0], [0, 1, -1, 0], [0, 0, 0, 1], [0, 0, 0, 0]], 3], 'Ñ': [[[1, 0, 0, '-1/3'], [0, 1, 0, 1], [0, 0, 1, '1/3'], [0, 0, 0, 0]], 3] };
A28.J = A28.I;
const ev = x => (typeof x === 'string' ? eval(x) : x);
ejercicio2(28, 'Reducida por filas y rango', 'Dadas las matrices B a Ñ, encontrar la matriz reducida por filas y dar su rango.',
  Object.keys(R28).map(k => ({ l: k, cmds: [k + '=' + mx(R28[k]), 'R=Rref(' + k + ')', 'r=Rango(' + k + ')'], focus: 'R',
    expect: { R: MM(A28[k][0].map(r => r.map(ev))), r: A28[k][1] },
    ans: 'Reducida: ' + fmtVal(mk(A28[k][0].map(r => r.map(ev)))).main + ' · rango = ' + A28[k][1],
    note: k === 'L' ? 'El apunte indica r = 2 para L, pero las dos filas de L = [3 −1/2; −6 1] son proporcionales (F₂ = −2F₁), por lo que el rango es 1.' : k === 'K' ? 'La reducida de K (5×3) tiene tres filas no nulas e identidad en las tres primeras.' : undefined })));
const R29 = { B: [[-1, 5], [2, 3]], C: [[3, 0, 1], [0, 5, 0], [-1, 1, -1]], D: [[2, 0, -1], [5, 1, 0], [0, 1, 3]], E: [[2, -1, 0], [0, -2, 1], [1, 0, 1]], F: [[-4, 0, 0], [0, 3, 0], [0, 0, '1/2']], G: [[0, 1, 0], [1, 0, 0], [0, 0, 1]], K: [[2, 0, -1], [3, 2, 5], [7, 2, 3]], L: [[3, 1], [5, 2]], M: [[2, -3], [4, 4]], N: [[1, 2, -2], [-1, 3, 0], [0, -2, 1]] };
const I29 = { B: [[-3 / 13, 5 / 13], [2 / 13, 1 / 13]], C: [[1 / 2, -1 / 10, 1 / 2], [0, 1 / 5, 0], [-1 / 2, 3 / 10, -3 / 2]], D: [[3, -1, 1], [-15, 6, -5], [5, -2, 2]], E: [[2 / 5, -1 / 5, 1 / 5], [-1 / 5, -2 / 5, 2 / 5], [-2 / 5, 1 / 5, 4 / 5]], F: [[-1 / 4, 0, 0], [0, 1 / 3, 0], [0, 0, 2]], G: [[0, 1, 0], [1, 0, 0], [0, 0, 1]], K: 'ERR', L: [[2, -1], [-5, 3]], M: [[1 / 5, 3 / 20], [-1 / 5, 1 / 10]], N: [[3, 2, 6], [1, 1, 2], [2, 2, 5]] };
const inv29 = Object.keys(R29).map(k => ({ l: k, cmds: [k + '=' + mx(R29[k]), 'Ai=Inversa(' + k + ')'].concat(I29[k] === 'ERR' ? [] : ['chk=' + k + '*Ai']), focus: 'Ai',
  expect: I29[k] === 'ERR' ? { Ai: 'ERR' } : { Ai: MM(I29[k]) }, ans: I29[k] === 'ERR' ? 'No existe la inversa: aparece una fila nula (rango menor que 3).' : 'Inversa: ' + fmtVal(mk(I29[k])).main }));
inv29.push({ l: 'H', cmds: ['th=30°', 'H=[cos(th),sin(th);-sin(th),cos(th)]', 'Hi=Inversa(H)', 'ok=Igual(Hi,H^T)'], focus: 'Hi', expect: { ok: 'Son iguales' }, ans: 'H⁻¹ = [cos θ  −sen θ; sen θ  cos θ] = Hᵗ (H es ortogonal). Aquí se calcula con θ = 30°.' });
inv29.push({ l: 'J', cmds: ['a=3', 'b=1', 'J=[a,b;b,a]', 'Ji=Inversa(J)', 'chk=J*Ji'], focus: 'Ji', expect: { Ji: MM([[3 / 8, -1 / 8], [-1 / 8, 3 / 8]]) }, ans: 'J⁻¹ = 1/(a² − b²) · [a −b; −b a]. Aquí se calcula con a = 3 y b = 1.' });
ejercicio2(29, 'Matriz inversa por operaciones elementales', 'Calcular la inversa de cada matriz con operaciones elementales sobre filas (reducida por filas). Seleccioná la inversa para ver el paso a paso con la columna de control.', inv29);
ejercicio2(30, '(A·B)⁻¹ = B⁻¹·A⁻¹', 'Con A = [3 1; 5 2] y B = [2 −3; 4 4], comprobar que (A·B)⁻¹ = B⁻¹·A⁻¹.',
  [{ cmds: ['A=' + mx([[3, 1], [5, 2]]), 'B=' + mx([[2, -3], [4, 4]]), 'r1=(A*B)^-1', 'r2=B^-1*A^-1', 'ok=Igual(r1,r2)'], focus: 'r1', expect: { ok: 'Son iguales' }, ans: 'La relación se cumple. (El apunte no trae respuesta numérica.)' }]);
ejercicio2(31, 'Ecuación A·X = A + B', 'Con A = [2 1; 0 1] y B = [3 3; 1 1], calcular X tal que A·X = A + B.',
  [{ cmds: ['A=' + mx([[2, 1], [0, 1]]), 'B=' + mx([[3, 3], [1, 1]]), 'X=A^-1*(A+B)', 'chk=A*X-(A+B)'], focus: 'X', expect: { X: MM([[2, 1], [1, 2]]), chk: MM(Z(2, 2)) }, ans: 'X = [2 1; 1 2]', sol: 'X = A⁻¹·(A + B) (se multiplica a izquierda por A⁻¹).' }]);
ejercicio2(32, 'Ecuación A·X = 2B − C', 'Obtener X que verifica A·X = 2B − C, con A = [2 1; −5 0], B = [3 −4; −1 1] y C = [−2 −7; 13 2].',
  [{ cmds: ['A=' + mx([[2, 1], [-5, 0]]), 'B=' + mx([[3, -4], [-1, 1]]), 'C=' + mx([[-2, -7], [13, 2]]), 'X=A^-1*(2B-C)', 'chk=A*X-(2B-C)'], focus: 'X', expect: { X: MM([[3, 0], [2, -1]]), chk: MM(Z(2, 2)) }, ans: 'X = [3 0; 2 −1]', sol: 'X = A⁻¹·(2B − C).' }]);
ejercicio2(33, 'Ecuación A·X·Aᵗ − B = 2I', 'Con A = [−1 2; 0 1] y B = [−3 0; 2 −1] resolver A·X·Aᵗ − B = 2I.',
  [{ cmds: ['A=' + mx([[-1, 2], [0, 1]]), 'B=' + mx([[-3, 0], [2, -1]]), 'I=Identidad(2)', 'X=A^-1*(2I+B)*(A^T)^-1', 'chk=A*X*A^T-B-2I'], focus: 'X', expect: { X: MM([[-1, 2], [0, 1]]), chk: MM(Z(2, 2)) }, ans: 'X = [−1 2; 0 1] (= A⁻¹, porque A² = I y 2I + B = [−1 0; 2 1] cumple (2I + B)² = I).', sol: 'A·X·Aᵗ = 2I + B ⇒ X = A⁻¹·(2I + B)·(Aᵗ)⁻¹.', note: 'El apunte imprime X = [3 0; 2 −1], que es la misma respuesta del ejercicio 32 y no verifica la ecuación: el objeto «chk» muestra que con X = [−1 2; 0 1] la diferencia es la matriz nula.' }]);
ejercicio2(34, 'Ecuaciones matriciales', 'Con A = [1 2; 0 1], B = [−1 0; 3 1] y C = [−1 −1; −1 0], calcular X en: a) X + A = 3X · b) 5X + A = X + B · c) X + A·X = B · d) 2X + X·A = B · e) A·X + B·X = C · f) A·X + A = B·X.',
  [['a)', 'X=A/2', 'chk=X+A-3X', [[1 / 2, 1], [0, 1 / 2]], 'X = (1/2)A'], ['b)', 'X=(B-A)/4', 'chk=5X+A-X-B', [[-1 / 2, -1 / 2], [3 / 4, 0]], 'X = (B − A)/4'], ['c)', 'X=(I+A)^-1*B', 'chk=X+A*X-B', [[-2, -1 / 2], [3 / 2, 1 / 2]], 'X = (I + A)⁻¹·B'],
   ['d)', 'X=B*(2I+A)^-1', 'chk=2X+X*A-B', [[-1 / 3, 2 / 9], [1, -1 / 3]], 'X = B·(2I + A)⁻¹'], ['e)', 'X=(A+B)^-1*C', 'chk=A*X+B*X-C', [[0, 1 / 3], [-1 / 2, -1 / 2]], 'X = (A + B)⁻¹·C'], ['f)', 'X=(A-B)^-1*(-A)', 'chk=A*X+A-B*X', [[0, 1 / 3], [-1 / 2, -4 / 3]], 'X = (A − B)⁻¹·(−A)']]
  .map(([l, x, chk, sol, how]) => ({ l, cmds: ['A=' + mx([[1, 2], [0, 1]]), 'B=' + mx([[-1, 0], [3, 1]]), 'C=' + mx([[-1, -1], [-1, 0]]), 'I=Identidad(2)', x, chk], focus: 'X', expect: { X: MM(sol), chk: MM(Z(2, 2)) }, ans: how + ' = ' + fmtVal(mk(sol)).main, sol: 'Se despeja X: ' + how + '.' })));
ejercicio2(35, 'Ecuación X·A·B − X·C = 2C', 'Con A = [1 1; 3 4], B = [2 1; 1 1] y C = [1 2; 1 3], calcular X en X·A·B − X·C = 2C.',
  [{ cmds: ['A=' + mx([[1, 1], [3, 4]]), 'B=' + mx([[2, 1], [1, 1]]), 'C=' + mx([[1, 2], [1, 3]]), 'X=2C*(A*B-C)^-1', 'chk=X*A*B-X*C-2C'], focus: 'X', expect: { X: MM([['-7/2', '1'], ['-23/4', '3/2']].map(r => r.map(ev))), chk: MM(Z(2, 2)) }, ans: 'X = [−7/2 1; −23/4 3/2]', sol: 'X·(A·B − C) = 2C ⇒ X = 2C·(A·B − C)⁻¹.' }]);
ejercicio2(36, 'Bidones y precios', 'Las filas de A son los litros de líquidos 1, 2 y 3 de tres bidones; B son los precios por litro. a) ¿Significado de A·B? b) Con C = [10 4 5] hallar C·A·B y su significado.',
  [{ cmds: ['A=' + mx([[20, 30, 50], [30, 20, 60], [30, 30, 32]]), 'B=[5;45;10]', 'AB=A*B', 'C=[10,4,5]', 'CAB=C*A*B'], focus: 'AB', expect: { AB: MM([[1950], [1650], [1820]]), CAB: MM([[35200]]) },
    ans: 'a) A·B = [1950; 1650; 1820]: precio de cada bidón. b) C·A·B = [35200]: valor de 10 bidones del tipo 1, 4 del tipo 2 y 5 del tipo 3.' }]);
ejercicio2(37, 'Fábricas de automóviles', 'Producción diaria en España (A) e Inglaterra (B) de dos modelos en tres colores. a) Producción total por día. b) España +20 % e Inglaterra −10 %: nueva producción total.',
  [{ cmds: ['A=' + mx([[300, 95], [250, 100], [200, 100]]), 'B=' + mx([[190, 90], [200, 100], [150, 80]]), 'total=A+B', 'nueva=1.2A+0.9B'], focus: 'nueva', expect: { total: MM([[490, 185], [450, 200], [350, 180]]), nueva: MM([[531, 195], [480, 210], [375, 192]]) },
    ans: 'a) A + B = [490 185; 450 200; 350 180] · b) 1,2A + 0,9B = [531 195; 480 210; 375 192]',
    note: 'El apunte imprime 410 en la posición (2, 1) de la nueva producción. El valor que resulta es 1,2·250 + 0,9·200 = 480.' }]);
ejercicio2(38, 'Ventanas, cristales y bisagras', 'a) Matriz A (viviendas × ventanas grande, mediana y pequeña) y matriz B (ventanas × cristales y bisagras). b) A·B: cristales y bisagras necesarias por tipo de vivienda.',
  [{ cmds: ['A=' + mx([[1, 7, 1], [2, 9, 2], [4, 10, 3]]), 'B=' + mx([[4, 8], [2, 4], [1, 2]]), 'AB=A*B'], focus: 'AB', expect: { AB: MM([[19, 38], [28, 56], [39, 78]]) }, ans: 'A·B = [19 38; 28 56; 39 78]: filas S, N y L; columnas cristales y bisagras.' }]);
