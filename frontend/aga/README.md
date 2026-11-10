# Sandbox de Álgebra y Geometría Analítica

Fuentes del sandbox (HTML/JS sin dependencias). `node aga/build.mjs` genera `public/aga/index.html`, que se commitea
y la app abre dentro de un iframe en `/facultad/[id]/sandbox`.

- `p2_engine.js`: intérprete de expresiones (vectores, puntos, matrices) y formato exacto.
- `p2b_matrix.js`: álgebra matricial y Gauss-Jordan con pasos (notación del apunte).
- `p3_data.js`: Unidad 1 (vectores 2D). `p5_unit2.js`: Unidad 2 (matrices).
- `p4_ui.js` / `p4b_mat.js`: interfaz (plano 2D, panel de pasos de matrices).
- `check.js`, `check2.js`: verificación de los ejercicios contra las respuestas del apunte (`node check2.js` desde esta carpeta).

Cada unidad nueva suma su archivo de datos y se agrega a la lista `parts` de `build.mjs`.
