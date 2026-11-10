import { cartesian, sub } from "./engine.js";
/* ===== Contenido: Unidad 1 (apunte UTN-FRC AGA 2026) =====
   cmds: '!' = no se dibuja · '~' = auxiliar punteado · expect: valores correctos para comprobar. */
const R2 = 'ℝ²', R3 = 'ℝ³', RN = 'ℝⁿ';
const SQ = Math.sqrt;
export const EX1 = [];
function ejemplo(id, title, tag, text, items){ EX1.push({ id, kind: 'ej', unit: 1, n: id.slice(1), title, tag, text, items }); }
function ejercicio(n, title, tag, text, items){ EX1.push({ id: 'e' + n, num: n, n, kind: 'ex', unit: 1, title, tag, text, items }); }

/* ---------- Ejemplos (recuadros del apunte) ---------- */
ejemplo('x1', 'Vector definido por dos puntos', R2,
  'Dibujar el vector y expresarlo de forma cartesiana, definido por los puntos P (inicio) y Q (extremo) en ℝ². P = (1, 2) ; Q = (4, 3).',
  [{ cmds: ['P=(1,2)', 'Q=(4,3)', 'v=Vector(P,Q)'], expect: { v: [3, 1] },
     sol: 'PQ = (v₁, v₂) = [(x<sub>Q</sub> − x<sub>P</sub>) ; (y<sub>Q</sub> − y<sub>P</sub>)] = [(4 − 1) ; (3 − 2)] = (3, 1)<br>⇒ <b>v = 3i + 1j</b>' }]);
ejemplo('x2', 'Norma o módulo de un vector', R2,
  'Calcular la «norma» o módulo del vector v = (3, 4).',
  [{ cmds: ['v=(3,4)', 'n=|v|'], expect: { n: 5 },
     sol: '|v| = √(v<sub>x</sub>² + v<sub>y</sub>²) = √(3² + 4²) = √(9 + 16) = √25 = <b>5</b>' }]);
ejemplo('x3', 'Componentes y módulo con P y F', R3,
  'Encontrar las componentes y la longitud del vector dados su punto inicial P(1, 0, 0) y su extremo F(3, 2, 0). Representar gráficamente.',
  [{ cmds: ['P=(1,0,0)', 'F=(3,2,0)', 'v=Vector(P,F)', 'n=|v|'], expect: { v: [2, 2, 0], n: SQ(8) },
     sol: 'v<sub>x</sub> = 3 − 1 = 2 ; v<sub>y</sub> = 2 − 0 = 2 ; v<sub>z</sub> = 0 − 0 = 0 ⇒ <b>v = 2i + 2j + 0k</b><br>|v| = √(2² + 2² + 0²) = √8' }]);
ejemplo('x4', 'Punto final a partir de las componentes', R3,
  'Dadas las componentes v<sub>x</sub> = 2 ; v<sub>y</sub> = 4 ; v<sub>z</sub> = −1 y su punto inicial P(0, 2, 4), encontrar el punto final F. Representar gráficamente.',
  [{ cmds: ['v=(2,4,-1)', 'P=(0,2,4)', 'F=P+v', 's=Vector(P,F)'], expect: { F: [2, 6, 3] },
     sol: 'x<sub>F</sub> = v<sub>x</sub> + x<sub>P</sub> = 2 + 0 = 2 ; y<sub>F</sub> = 4 + 2 = 6 ; z<sub>F</sub> = −1 + 4 = 3<br>⇒ <b>F(2 ; 6 ; 3)</b>' }]);
ejemplo('x5', 'Resultante de dos fuerzas', R3,
  'Encuentre la resultante de las fuerzas p = i + 2j + k y q = −i + 3j, y halle el módulo correspondiente.',
  [{ cmds: ['p=(1,2,1)', 'q=(-1,3,0)', 'r=p+q', 'n=|r|'], expect: { r: [0, 5, 1], n: SQ(26) },
     sol: 'p + q = [1 + (−1)]i + (2 + 3)j + (1 + 0)k = 0i + 5j + 1k<br>|p + q| = √(0² + 5² + 1²) = <b>√26</b>' }]);
ejemplo('x6', 'Ingeniería y vectores en ℝ³: precios con descuento', R3,
  'p = (18,95 ; 14,75 ; 8,60) son los precios de tres artículos. Hay un descuento del 20 %. a) Vector con el cambio de precio de cada artículo. b) Vector con los precios nuevos.',
  [{ dec: true, cmds: ['p=(18.95,14.75,8.60)', 'd=0.20*p', 'nuevo=p-d', 'chk=0.80*p'], expect: { d: [3.79, 2.95, 1.72], nuevo: [15.16, 11.8, 6.88] },
     sol: 'a) 0,20 p = (3,79 ; 2,95 ; 1,72)<br>b) p − 0,20 p = (15,16 ; 11,80 ; 6,88). También se puede escribir como <b>0,80 p</b> (objeto «chk»).' }]);
ejemplo('x7', 'Ingeniería y vectores de ℝⁿ: panadería', RN,
  'Vectores de dimensión 6 (pan francés, pan miñón, criollos de hojaldre, criollos comunes, facturas, medialunas). Stock inicial P₁, mercadería que ingresa P₂, stock final P_f = P₁ + P₂ y aumento del 20 % en los precios.',
  [{ cmds: ['p1=(100,150,260,350,230,525)', 'p2=(50,100,60,35,23,125)', 'pf=p1+p2'], expect: { pf: [150, 250, 320, 385, 253, 650] },
     sol: 'Stock final P_f = P₁ + P₂ = (150, 250, 320, 385, 253, 650).' },
   { l: 'Precios', cmds: ['p=(40,50,60,50,30,25)', 'nuevo=1.2*p'], expect: { nuevo: [48, 60, 72, 60, 36, 30] },
     sol: 'Aplicando el aumento del 20 %: P_f = 1,2 · P = ($48, $60, $72, $60, $36, $30).' }]);
ejemplo('x8', 'Dependencia lineal: u y v paralelos', R3,
  'Sean u = (1, 2, 3) y v = (2, 4, 6). Verificar que el vector nulo se obtiene como combinación lineal con escalares no nulos.',
  [{ cmds: ['u=(1,2,3)', 'v=(2,4,6)', 'r=2u-v', 't=Dependencia(u,v)'], expect: { r: [0, 0, 0], t: 'Linealmente dependientes' },
     sol: '2u + (−1)v = 0 con escalares 2 y −1 no nulos ⇒ u y v son <b>linealmente dependientes</b> (son paralelos).' }]);

/* ---------- Ejercicios para resolver ---------- */
ejercicio(1, 'Segmentos dirigidos PQ', R2,
  'Dibujar los segmentos dirigidos (vectores) definidos por P (origen) y Q (extremo) en ℝ². En cada caso, determinar las componentes y expresar el vector en su forma cartesiana.',
  [['a', '(-1,3)', '(-2,1)', [-1, -2]], ['b', '(-2,-3)', '(0,-1)', [2, 2]], ['c', '(7,-2)', '(1,-4)', [-6, -2]], ['d', '(3,0)', '(2,-2)', [-1, -2]], ['e', '(6,2)', '(6,0)', [0, -2]]]
  .map(([l, p, q, v]) => ({ l: l + ')', cmds: ['P=' + p, 'Q=' + q, 'v=Vector(P,Q)'], expect: { v }, ans: 'PQ = (' + v.join(', ') + ') ⇒ v = ' + cartesian({ c: v }).replace(/([ij])/g, '$1') })));
ejercicio(2, 'Componentes y módulo con P y F', R3,
  'Encontrar las componentes y la longitud (módulo) del vector dados su origen P(x₁; y₁; z₁) y su extremo F(x₂; y₂; z₂). Representar gráficamente.',
  [['a', '(3,2,0)', '(1,0,0)', [-2, -2, 0], SQ(8), '√8'], ['b', '(-1,-1,0)', '(0,0,0)', [1, 1, 0], SQ(2), '√2'], ['c', '(-3,2,0)', '(1,2,0)', [4, 0, 0], 4, '4'], ['d', '(2,-3,0)', '(1,2,0)', [-1, 5, 0], SQ(26), '√26']]
  .map(([l, p, f, v, n, ns]) => ({ l: l + ')', cmds: ['P=' + p, 'F=' + f, 'v=Vector(P,F)', 'n=|v|'], expect: { v, n }, ans: 'v = ' + cartesian({ c: v }) + ' ; |v| = ' + ns })));
ejercicio(3, 'Punto final dadas las componentes', R3,
  'Dadas las componentes v<sub>x</sub>, v<sub>y</sub>, v<sub>z</sub> de un vector v y su punto inicial P, encontrar el punto final F. Representar gráficamente.',
  [['a', '(2,1,0)', '(2,1,0)', [4, 2, 0], 'F(4 ; 2 ; 0)'], ['b', '(-2,1/2,-1)', '(3/2,4,-3/2)', [-0.5, 4.5, -2.5], 'F(−1/2 ; 9/2 ; −5/2)'], ['c', '(0,0,1)', '(-3,-3,0)', [-3, -3, 1], 'F(−3 ; −3 ; 1)']]
  .map(([l, v, p, f, a]) => ({ l: l + ')', cmds: ['v=' + v, 'P=' + p, 'F=P+v', 's=Vector(P,F)'], expect: { F: f }, ans: a })));
ejercicio(4, 'Vector opuesto con punto final dado', R3,
  'Hallar un vector, con sentido opuesto al de v = (−2 ; 4 ; −1) y que tenga el punto final F(2, 0, −7). Graficar.',
  [{ cmds: ['v=(-2,4,-1)', 'F=(2,0,-7)', 'P=F+v', 's=Vector(P,F)'], expect: { P: [0, 4, -8], s: [2, -4, 1] }, ans: 'P(0, 4, −8). El vector buscado es PF = (2, −4, 1) = −v.',
     sol: 'Si PF = −v, entonces F − P = −v ⇒ P = F + v.' }]);
ejercicio(5, 'Vector de módulo 6 y sentido opuesto', R3,
  'Sea el vector v = (−1/3 ; 2/3 ; −2/3). Encontrar el vector de módulo 6 que tiene la misma dirección y sentido opuesto al de v.',
  [{ cmds: ['v=(-1/3,2/3,-2/3)', 'n=|v|', 'w=-6*v/|v|'], expect: { w: [2, -4, 4] }, ans: 'a = (2 ; −4 ; 4)',
     sol: 'Versor de v: v/|v|. El vector pedido es −6 · v/|v|.' }]);
ejercicio(6, 'Vector con ángulos directores', R3,
  'Dado v de módulo 2, si α = 45°, β = 120° y γ = 60°, encontrar el vector de módulo 4 que sea paralelo y del mismo sentido que v.',
  [{ cmds: ['u=(cos(45°),cos(120°),cos(60°))', 'v=2*u', 'w=4*u'], expect: { w: [2 * SQ(2), -2, 2] }, ans: 'a = (2√2 ; −2 ; 2)',
     sol: 'Los cosenos directores forman el versor: u = (cos α, cos β, cos γ). Como cos²α + cos²β + cos²γ = 1, |u| = 1.' }]);
ejercicio(7, 'Vectores paralelos de norma dada', R3,
  'Determinar el o los vectores paralelos a a = (√2 ; √10 ; 2) de modo tal que: a) tengan norma 6; b) tengan norma 2 y sentido opuesto.',
  [{ l: 'a)', cmds: ['a=(√2,√10,2)', 'n=|a|', 'w1=6*a/|a|', 'w2=-6*a/|a|'], expect: { n: 4, w1: [3 * SQ(2) / 2, 3 * SQ(10) / 2, 3], w2: [-3 * SQ(2) / 2, -3 * SQ(10) / 2, -3] },
     ans: 'Hay dos: ±(3/2)a = ±(3√2/2 ; 3√10/2 ; 3). El apunte lista el de sentido negativo (−3/2 √2 ; −3/2 √10 ; −3).' },
   { l: 'b)', cmds: ['a=(√2,√10,2)', 'w=-2*a/|a|'], expect: { w: [-SQ(2) / 2, -SQ(10) / 2, -1] },
     ans: 'w = (−√2/2 ; −√10/2 ; −1).',
     note: 'El apunte imprime (½√2 ; ½√10 ; 1) sin signo menos. Ese vector tiene el mismo sentido que a; el de sentido opuesto es su negativo. Puede ser un error de impresión.' }]);
ejercicio(8, 'Operaciones y propiedades con vectores', R3,
  'Dados a = 2i + j − k ; b = −i + 4k ; c = i + 2j + 3k ; d = 3j − 2k, resolver los incisos a) a n). Comprobar las propiedades: a)=b) conmutativa; i)=j) asociativa; k) elemento neutro; l) opuesto; m)=n) distributiva.',
  [{ cmds: ['a=(2,1,-1)', 'b=(-1,0,4)', 'c=(1,2,3)', 'd=(0,3,-2)',
      'r_a=a+b', 'r_b=b+a', 'r_c=a-b', 'r_d=a+(-b)', 'r_e=b-c-d', 'r_f=4c-a', 'r_g=3c-4d', 'r_h=4b-c', 'r_i=a+(b+c)', 'r_j=(a+b)+c', 'r_k=c+(0,0,0)', 'r_l=a+(-a)', 'r_m=3(b+d)', 'r_n=3b+3d'],
    expect: { r_a: [1, 1, 3], r_b: [1, 1, 3], r_c: [3, 1, -5], r_d: [3, 1, -5], r_e: [-2, -5, 3], r_f: [2, 7, 13], r_g: [3, -6, 17], r_h: [-5, -2, 13], r_i: [2, 3, 6], r_j: [2, 3, 6], r_k: [1, 2, 3], r_l: [0, 0, 0], r_m: [-3, 9, 6], r_n: [-3, 9, 6] },
    ans: 'a) y b) i + j + 3k (conmutativa) · c) y d) 3i + j − 5k · e) −2i − 5j + 3k · f) 2i + 7j + 13k · g) 3i − 6j + 17k · h) −5i − 2j + 13k · i) y j) 2i + 3j + 6k (asociativa) · k) i + 2j + 3k (elemento neutro) · l) 0 (opuesto) · m) y n) −3i + 9j + 6k (distributiva).' }]);
ejercicio(9, 'Resultante de fuerzas', R3,
  'Encuentre la resultante de las fuerzas p = 2i + j − k ; q = i − j + 4k ; u = −3i − 3k y halle el módulo correspondiente.',
  [{ cmds: ['p=(2,1,-1)', 'q=(1,-1,4)', 'u=(-3,0,-3)', 'r=p+q+u', 'n=|r|'], expect: { r: [0, 0, 0], n: 0 }, ans: 'p + q + u = 0i + 0j + 0k ; |p + q + u| = 0 (las fuerzas están en equilibrio).' }]);
ejercicio(10, 'Combinaciones con u, v, w', R3,
  'Dados u = (1, 2, 3) ; v = (2, −3, 1) ; w = (3, 2, −1) hallar las componentes de: a) u − w ; b) 7v + 3w ; c) −w + v ; d) 3(u − 7v) ; e) −3v − 8w ; f) 2v − (u + w).',
  [{ cmds: ['u=(1,2,3)', 'v=(2,-3,1)', 'w=(3,2,-1)', 'r_a=u-w', 'r_b=7v+3w', 'r_c=-w+v', 'r_d=3(u-7v)', 'r_e=-3v-8w', 'r_f=2v-(u+w)'],
    expect: { r_a: [-2, 0, 4], r_b: [23, -15, 4], r_c: [-1, -5, 2], r_d: [-39, 69, -12], r_e: [-30, -7, 5], r_f: [0, -10, 0] },
    ans: 'a) (−2, 0, 4) · b) (23, −15, 4) · c) (−1, −5, 2) · d) (−39, 69, −12) · e) (−30, −7, 5) · f) (0, −10, 0).',
    note: 'En e) el apunte imprime (30, −7, 5). Calculando: −3v = (−6, 9, −3) y −8w = (−24, −16, 8), la suma da (−30, −7, 5). La primera componente lleva signo menos.' }]);
ejercicio(11, 'Operación con vectores del gráfico', R2,
  'A partir de los vectores libres representados en el gráfico, resolver |v + 4u| · a − w. (Los vectores se leyeron del gráfico del apunte.)',
  [{ view: [-8, 5, -4.5, 5.5], cmds: ['u=Vector((-5,1),(-6,4))', 'v=Vector((-3,3),(1,3))', 'w=Vector((-3,-2),(1,-1))', 'a=Vector((3,-1),(0,0))', 'r=|v+4u|*a-w'],
    expect: { r: [-40, 11] }, ans: '(−40 ; 11)',
    sol: 'u = (−1, 3), v = (4, 0), w = (4, 1), a = (−3, 1). v + 4u = (0, 12) ⇒ |v + 4u| = 12 ; 12a − w = (−36, 12) − (4, 1) = (−40, 11).' }]);
ejercicio(12, 'Operación con vectores del gráfico', R2,
  'A partir de los vectores libres representados en el gráfico, calcular |4w + a| · u − v. (Los vectores se leyeron del gráfico del apunte.)',
  [{ view: [-8, 7, -6, 5], cmds: ['w=Vector((-1,4),(-3,2))', 'a=Vector((-2,2),(6,-1))', 'u=Vector((0,-4),(-6,-3))', 'v=Vector((1,-5),(1,-1))', 'r=|4w+a|*u-v'],
    expect: { r: [-66, 7] }, ans: '(−66 ; 7)',
    sol: 'w = (−2, −2), a = (8, −3), u = (−6, 1), v = (0, 4). 4w + a = (0, −11) ⇒ módulo 11 ; 11u − v = (−66, 11) − (0, 4) = (−66, 7).' }]);
ejercicio(13, 'Operaciones analítica y gráficamente', R2,
  'Dados u = (2, 3) ; v = (0, −3) ; w = (2, −4) obtener x = u + v − w e y = u + (2/3)v − (1/2)w. Realizar las mismas operaciones gráficamente, con origen en el origen del sistema.',
  [{ cmds: ['u=(2,3)', 'v=(0,-3)', 'w=(2,-4)', 'x=u+v-w', 'y=u+(2/3)*v-(1/2)*w',
      '~x1=Trasladar(v,Extremo(u))', '~x2=Trasladar(-w,Extremo(x1))', '~y1=Trasladar((2/3)*v,Extremo(u))', '~y2=Trasladar(-(1/2)*w,Extremo(y1))'],
    expect: { x: [0, 4], y: [1, 3] }, ans: 'x = (0, 4) ; y = (1, 3)',
    sol: 'Suma gráfica punta-cola: se traslada cada vector al extremo del anterior (líneas punteadas). El último extremo es el vector resultante.' }]);
ejercicio(14, 'Ecuación vectorial 1', R3,
  'Dados u = (1, 2, 3) ; v = (2, −3, 1) y w = (3, 2, −1) hallar las componentes de x = (x₁; x₂; x₃) que satisfaga 2u − v + x = 7x + w.',
  [{ cmds: ['u=(1,2,3)', 'v=(2,-3,1)', 'w=(3,2,-1)', 'x=(2u-v-w)/6', '!lado1=2u-v+x', '!lado2=7x+w'], expect: { x: [-0.5, 5 / 6, 1] },
    ans: 'x = (−1/2 ; 5/6 ; 1)', sol: 'Despejando: 6x = 2u − v − w ⇒ x = (2u − v − w)/6. «lado1» y «lado2» comprueban la igualdad.' }]);
ejercicio(15, 'Ecuación vectorial 2', R3,
  'Resolver la ecuación vectorial −3u + 2x = 5v + 3x, siendo u = (1, −3, 5) ; v = (0, −2, 1) y x = (x₁; x₂; x₃).',
  [{ cmds: ['u=(1,-3,5)', 'v=(0,-2,1)', 'x=-3u-5v', '!lado1=-3u+2x', '!lado2=5v+3x'], expect: { x: [-3, 19, -20] }, ans: 'x = (−3 ; 19 ; −20)', sol: 'Despejando: x = −3u − 5v.' }]);
ejercicio(16, 'Norma de un vector', RN,
  'Calcular la «norma» o módulo del vector v, cuando: a) v = (−1 ; 7) ; b) v = (1 ; 1) ; c) v = (−8 ; 7 ; 4).',
  [{ l: 'a)', cmds: ['v=(-1,7)', 'n=|v|'], expect: { n: SQ(50) }, ans: '|v| = 5√2' },
   { l: 'b)', cmds: ['v=(1,1)', 'n=|v|'], expect: { n: SQ(2) }, ans: '|v| = √2' },
   { l: 'c)', cmds: ['v=(-8,7,4)', 'n=|v|'], expect: { n: SQ(129) }, ans: '|v| = √129' }]);
ejercicio(17, 'Módulos y propiedades', R3,
  'Dados a = 2i + j − k ; b = −i + 4k ; c = i + 2j + 3k ; d = 3j − 2k, calcular: a) |a| ; b) |4a| ; c) 4|a| ; d) |c − a| ; e) |c| − |a| ; f) |3c − 4d| ; g) |a + b + c + d|. Comparar b) y c).',
  [{ cmds: ['a=(2,1,-1)', 'b=(-1,0,4)', 'c=(1,2,3)', 'd=(0,3,-2)', 'n_a=|a|', 'n_b=|4a|', 'n_c=4|a|', 'n_d=|c-a|', 'n_e=|c|-|a|', 'n_f=|3c-4d|', 'n_g=|a+b+c+d|'],
    expect: { n_a: SQ(6), n_b: SQ(96), n_c: SQ(96), n_d: SQ(18), n_e: SQ(14) - SQ(6), n_f: SQ(334), n_g: SQ(56) },
    ans: 'a) √6 · b) √96 = 4√6 · c) 4√6 · d) √18 · e) √14 − √6 · f) √334 · g) √56.  Como b) = c): |λa| = |λ|·|a|.' }]);
ejercicio(18, 'Módulos con u, v, w', R3,
  'Dados u = (1, −3, 2) ; v = (1, 1, 0) ; w = (2, 2, −4), encontrar: a) |u + v| ; b) |u| + |v| ; c) |−2u| + |2u| ; d) |3u − 5v + w| ; e) (1/|w|) w ; f) |(1/|w|) w|.',
  [{ cmds: ['u=(1,-3,2)', 'v=(1,1,0)', 'w=(2,2,-4)', 'r_a=|u+v|', 'r_b=|u|+|v|', 'r_c=|-2u|+|2u|', 'r_d=|3u-5v+w|', 'r_e=w/|w|', 'r_f=|w/|w||'],
    expect: { r_a: SQ(12), r_b: SQ(14) + SQ(2), r_c: 4 * SQ(14), r_d: SQ(148), r_e: [1 / SQ(6), 1 / SQ(6), -2 / SQ(6)], r_f: 1 },
    ans: 'a) 2√3 · b) √14 + √2 · c) 4√14 · d) √148 = 2√37 · e) w/|w| = (1/√6)(1, 1, −2) · f) 1 (es un versor).' }]);
ejercicio(19, 'Escalares k con k|v| = 3', R3,
  'Hallar todos los escalares k tales que k|v| = 3, siendo v = (1, 2, 4).',
  [{ cmds: ['v=(1,2,4)', 'n=|v|', 'k_1=3/|v|', 'k_2=-3/|v|'], expect: { k_1: 3 / SQ(21), k_2: -3 / SQ(21) }, ans: 'k = ± 3/√21 = ± √21/7' }]);
ejercicio(20, '¿Es combinación lineal?', R3,
  'En cada caso, analizar si el vector propuesto es combinación lineal del conjunto de vectores que se enuncia.',
  [{ l: 'a)', cmds: ['v=(4,5)', 'a1=(1,-5)', 'a2=(1,10)', 'r=CL(v,a1,a2)'], expect: { r: 'λ1 = 7/3 ; λ2 = 5/3' }, ans: 'Sí: v = 7/3·(1; −5) + 5/3·(1; 10).' },
   { l: 'b)', cmds: ['v=(-4,10)', 'a1=(-3,2)', 'a2=(6,-4)', 'r=CL(v,a1,a2)', 'rg=Rango(a1,a2)'], expect: { r: 'No es combinación lineal' },
     ans: 'No es combinación lineal: a₂ = −2a₁, así que el conjunto genera solo una recta, y v no está sobre ella.',
     note: 'El apunte indica que solo en d) v no es combinación lineal. En b) los dos vectores del conjunto son paralelos (rango 1) y v = (−4, 10) no es paralelo a ellos, por lo tanto tampoco es combinación lineal.' },
   { l: 'c)', cmds: ['v=(5,7,1)', 'a1=(1,1,0)', 'a2=(0,1,1)', 'a3=(1,0,1)', 'r=CL(v,a1,a2,a3)'], expect: { r: 'λ1 = 11/2 ; λ2 = 3/2 ; λ3 = -1/2' }, ans: 'Sí: v = 11/2·a₁ + 3/2·a₂ − 1/2·a₃.' },
   { l: 'd)', cmds: ['v=(2,3,4)', 'a1=(1,1,1)', 'a2=(2,0,2)', 'a3=(3,1,3)', 'r=CL(v,a1,a2,a3)', 'rg=Rango(a1,a2,a3)'], expect: { r: 'No es combinación lineal' }, ans: 'No es combinación lineal (a₃ = a₁ + a₂: el conjunto genera un plano y v no pertenece a él).' }]);
ejercicio(21, 'Escalares k₁ y k₂', R2,
  'Si a = 2i − j, b = −3i + j y c = i + 3j, determinar si existen k₁ y k₂ tal que a = k₁b + k₂c.',
  [{ cmds: ['a=(2,-1)', 'b=(-3,1)', 'c=(1,3)', 'r=CL(a,b,c)'], expect: { r: 'λ1 = -7/10 ; λ2 = -1/10' }, ans: 'k₁ = −0,7 ; k₂ = −0,1' }]);
ejercicio(22, 'Dependencia o independencia lineal', R2,
  'Analizar si los siguientes vectores son linealmente dependientes o independientes. Comparar con los vectores del ejercicio 1: dos vectores de ℝ² son dependientes cuando son paralelos.',
  [['a', '(-2,2)', '(1,1)', 'Linealmente independientes'], ['b', '(2,-1)', '(1,2)', 'Linealmente independientes'], ['c', '(-1,2)', '(2,1)', 'Linealmente independientes'], ['d', '(-2,1)', '(-4,2)', 'Linealmente dependientes']]
  .map(([l, a, b, t]) => ({ l: l + ')', cmds: ['a=' + a, 'b=' + b, 't=Dependencia(a,b)'], expect: { t }, ans: t + (l === 'd' ? ' (b = 2a)' : '') }))
);
ejercicio(23, 'Embotelladora (vectores de ℝ³)', R3,
  'Los litros por día de agua, alcohol y café son a = (30, 40, 50). Los días por semana de funcionamiento de M1, M2, M3 son b = (2, 5, 1). a) Cuánto se recoge por mes de cada producto. b) Qué máquina maneja el mayor volumen por semana. c) El tiempo semanal se reduce 50 %: impacto mensual. d) Sin producción de alcohol: total líquido por mes. (1 mes = 4 semanas.)',
  [{ l: 'a)', cmds: ['a=(30,40,50)', 'b=(2,5,1)', 'mes=4*Suma(b)*a'], expect: { mes: [960, 1280, 1600] }, ans: 'Agua = 960 L ; Alcohol = 1280 L ; Café = 1600 L' },
   { l: 'b)', cmds: ['a=(30,40,50)', 'b=(2,5,1)', 'semana=Suma(a)*b'], expect: { semana: [240, 600, 120] }, ans: 'M2 = 600 L por semana (la de mayor volumen).' },
   { l: 'c)', cmds: ['a=(30,40,50)', 'b=(2,5,1)', 'mes=4*Suma(b)*0.5*a'], expect: { mes: [480, 640, 800] }, ans: 'Agua = 480 L ; Alcohol = 640 L ; Café = 800 L' },
   { l: 'd)', cmds: ['a=(30,40,50)', 'b=(2,5,1)', 'total=4*Suma(b)*(Comp(a,1)+Comp(a,3))'], expect: { total: 2560 }, ans: '2560 L por mes.' }]);
