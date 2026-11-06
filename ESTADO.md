# Estado de Dayflow (actualizado 2026-11-06)

## Hecho (todo en main)
- Fase 1 seguridad: secretos fuera del repo, JWT con PyJWT, rate limit (300/min general, /auth 10/5min, login 5 fallos/15min), CORS Retry-After, HSTS y docs off en producción.
- Fase 2 tests + CI (GitHub Actions: ruff, alembic, pytest, lint/build). Hoy: 299 passed, 2 xfailed (ahorros).
- Fase 3-A: bugs y bloqueo de períodos cerrados.
- Hotfix 429 en el frontend.
- Facultad completa: materias por año (1–5), estados, nota única, correlativas (aprobada/cursada, sin ciclos), electivas con créditos, anotaciones, dashboard, % de carrera, filtros, links de Drive por materia y carpeta.
- Carpetas de Drive creadas para las 37 curriculares.

## Pendiente (orden sugerido)
1. Facultad: conectar con Pomodoro y Tareas (`subject_id`), partes interactivas por materia, árbol de correlativas, integración con Claude (API key solo en Render, rate limit, vista previa antes de guardar), carpetas de electivas.
2. 3-B fechas del cliente/UTC y mensajes 422 en español.
3. 3-C dinero con Numeric. 3-D constraints únicos + CI con Postgres. 3-E categorías con FK. 3-F ahorros (los 2 xfail).
4. Fase 4: modularizar `main.py` y `page.js`; unificar paleta de colores (`lib/faculty.js` vs `page.js`).
5. Fase 5: lotes de logs de hábitos, paginación, debounce del PATCH de tarifa, catch en el efecto de logs.
6. Fase 6: documentación.

## Tareas manuales del usuario
- Borrar ramas remotas viejas en GitHub.
- Verificar producción en Render tras el deploy (`/api/health` ok, `/docs` 404, login) y que las materias cargadas tengan level 1–5 (el máximo bajó de 8 a 5).
- Borrar `diag-test@example.com` en Neon si sigue.
- Opcional: branch protection exigiendo CI en main.

## Decisiones
- Aprobada = `aprobada` o `aprobacion_directa`; cursada incluye regular, promociones, aprobación directa y aprobada.
- Electivas no cuentan en el total curricular; 20 créditos requeridos.
- Archivos solo como links de Drive (nada se guarda en el servidor).
- Materias se cargan a mano (sin botón de importar plan).
- Flujo: el agente de VS Code programa y pushea; se abre PR con `gh api`, se espera CI y se mergea con merge commit.
- Ahorrar tokens: no re-correr suites que ya pasaron en CI, respuestas cortas.
