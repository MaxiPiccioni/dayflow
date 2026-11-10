# Estado de Dayflow (actualizado 2026-11-09)

## Hecho (todo en main)
- Fase 1 seguridad: secretos fuera del repo, JWT con PyJWT, rate limit (300/min general, /auth 10/5min, login 5 fallos/15min), CORS Retry-After, HSTS y docs off en producción.
- Fase 2 tests + CI (GitHub Actions: ruff, alembic, pytest, lint/build). Hoy: 358 passed, 0 xfailed (en la rama de la fase 3).
- Fase 3-A: bugs y bloqueo de períodos cerrados.
- Hotfix 429 en el frontend.
- Facultad completa: materias por año (1–5), estados, nota única, correlativas (aprobada/cursada, sin ciclos), electivas con créditos, anotaciones, dashboard, % de carrera, filtros, links de Drive por materia y carpeta.
- Carpetas de Drive creadas para las 37 curriculares.
- Facultad conectada con Pomodoro y Tareas: `subject_id` opcional en ambos, `GET /api/faculty/study` y tarjeta "Estudio" en cada materia. Buscador de materias en el Pomodoro y en el formulario de tareas.
- Sandbox de SSL (Sintaxis y Semántica de los Lenguajes), solo frontend en `lib/ssl` y `components/ssl`: Unidad 2 (ejercicios 1 a 29) y Unidades 3 a 6 con editor de autómatas (AFD, AFND, AP, ALA y MT), ejecución manual/automática y comprobación por lenguaje. Progreso y autómatas en localStorage. 246 tests de vitest.
- Sandbox de Álgebra y Geometría Analítica (React, `lib/aga` y `components/aga`; ruta `/facultad/[id]/sandbox/[unidad]`): Unidad 1 (vectores 2D), Unidad 2 (matrices paso a paso) Unidad 3 (determinantes: diagonales, Sarrus, Laplace, triangulación, cofactores y adjunta; 6 ejemplos + 34 ejercicios) y Unidad 4 (sistemas de ecuaciones: Rouché-Frobenius, Gauss-Jordan con columna de control, Cramer, método matricial, solución paramétrica y balanceo de ecuaciones; 20 ejemplos + 69 ejercicios, con problemas de redes de flujo). Quedan sin cargar la red de tuberías del teórico, el puente de Wheatstone y la placa de temperatura, porque sus ecuaciones solo están en figuras. Todos los ejercicios se comprueban contra las respuestas del apunte en `aga.test.js`. Las erratas del apunte quedan marcadas en el campo `note` de cada ejercicio. Unidad 5 (espacios vectoriales: axiomas, subespacios, combinación lineal, generadores, independencia, bases, dimensión, coordenadas y cambio de base; 16 ejemplos + 69 ejercicios, con comandos `Genera`, `Indep`, `Base`, `Dimension` y `Caracterizar`). Unidad 6 (transformaciones lineales: linealidad, núcleo, imagen, teorema de la dimensión, matriz estándar, transformaciones del plano y matriz respecto de bases; 22 ejemplos + 31 ejercicios, con comandos `Imagen`, `Nulidad` y `Rot`). Próximas: U7 en adelante; U11 y cuádricas quedan afuera.

## Pendiente (orden sugerido)
1. Datos y correctitud (fase 3): hecha en la rama `fix/fase3-datos` (3-C dinero con Numeric, 3-D índices únicos y CI con Postgres, 3-E categorías por id, 3-F ahorros sin xfail). Falta aplicarla en producción (ver REPORTE_FASE3_DATOS.md: backup de Neon primero). Quedan 3.6 (tareas repetidas con series) y 3.7 (rollover fuera del GET).
2. Sandbox de SSL: confirmar con la cátedra la complejidad de Shannon (estados x símbolos de cinta); ejercicios 5 y 21 de la Unidad 6 sin comprobación automática. Unidad 1 (teórica) más adelante, con el programa del final.
3. Facultad: partes interactivas de otras materias, árbol de correlativas, integración con Claude (API key solo en Render, rate limit, vista previa antes de guardar), carpetas de electivas.
4. Fase 4: modularizar `main.py` y `page.js`; unificar paleta de colores (`lib/faculty.js` vs `page.js`).
5. Fase 5: lotes de logs de hábitos, paginación, debounce del PATCH de tarifa, catch en el efecto de logs.
6. Fase 6: documentación.

## Tareas manuales del usuario
- Borrar ramas remotas viejas en GitHub.
- Verificar producción en Render tras el deploy (`/api/health` ok, `/docs` 404, login) y que las materias cargadas tengan level 1–5 (el máximo bajó de 8 a 5).
- Borrar `diag-test@example.com` en Neon si sigue.
- GitHub Actions está bloqueado por un problema de facturación de la cuenta ("account is locked due to a billing issue"): hoy ningún PR tiene CI. Se mergea confiando en los tests locales y en el build de Vercel. Arreglar en Settings, Billing and plans.
- Opcional: branch protection exigiendo CI en main (después de arreglar la facturación).

## Decisiones
- Aprobada = `aprobada` o `aprobacion_directa`; cursada incluye regular, promociones, aprobación directa y aprobada.
- Electivas no cuentan en el total curricular; 20 créditos requeridos.
- Archivos solo como links de Drive (nada se guarda en el servidor).
- Materias se cargan a mano (sin botón de importar plan).
- Flujo: el agente de VS Code programa y pushea; se abre PR con `gh api`, se espera CI y se mergea con merge commit.
- El material de la cátedra (texto de la guía de SSL) vive en `docs/ssl/`, ignorado por git: no se sube al repo.
- Ahorrar tokens: no re-correr suites que ya pasaron en CI, respuestas cortas.
