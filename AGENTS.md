# AGENTS.md — Dayflow

Guía para agentes de código (VS Code, Claude Code, etc.) que trabajen en este repo.
Si una tarea contradice algo de acá, frená y preguntá antes de seguir.

## Qué es

App personal para organizar tareas, eventos, hábitos, pomodoro, horas trabajadas, finanzas, ahorros y compras.

- `backend/`: FastAPI + SQLAlchemy 2 + Alembic. SQLite en local, Postgres (Neon) en producción. JWT + Argon2.
- `frontend/`: Next.js (App Router, JavaScript) + Tailwind 4 + componentes estilo shadcn.
- Deploy: Render (`render.yaml`) para el backend. El frontend también corre en Render.
- Idioma de la UI y de los mensajes de error visibles: español rioplatense. Código y nombres técnicos en inglés.

## Comandos (Windows / PowerShell)

```powershell
# Backend
cd backend
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
alembic upgrade head              # SIEMPRE antes de levantar en local
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev
npm run lint
npm run build
```

Antes de dar una tarea por terminada tienen que pasar: tests del backend (cuando existan), `npm run lint` y `npm run build`.

## Reglas que no se negocian

### Seguridad
1. **Nunca commitear secretos, tokens, contraseñas, logs ni configuración local.** Esto incluye `.env`, `*.log`, `*.db`, `.claude/` y cualquier `settings.local.json`.
2. **Toda consulta a datos de usuario filtra por `user_id`.** Un usuario jamás puede leer ni modificar datos de otro. Si agregás un endpoint, agregá un test de aislamiento.
3. No imprimir ni loguear tokens, hashes ni contraseñas.
4. No reescribir el historial de git ni hacer `push --force` sin pedir confirmación explícita.
5. No ejecutar nada contra la base de producción ni contra las URLs de Render sin que el usuario lo pida.

### Backend
- Cambios de esquema **solo con migración Alembic** (`alembic revision --autogenerate -m "..."`) y revisando el archivo generado. No usar `create_all`.
- Dinero: `Numeric`/`Decimal` (o centavos enteros). Nada de `float` para montos nuevos.
- Fechas: el "hoy" lo define el cliente (`client_today`), no el servidor. No usar `date.today()` ni `datetime.utcnow()` en lógica de negocio. Usar `datetime.now(timezone.utc)` cuando haga falta un instante.
- Búsqueda de un recurso propio por id: usar el helper `get_owned_or_404` (cuando exista) en vez de repetir el `select` + 404.
- Parámetros de query siempre validados (`Query(ge=..., le=...)`, `Literal`, `Enum`).
- Operaciones "buscar o crear" deben apoyarse en un constraint único, no solo en un `select` previo.
- Los GET no escriben en la base.

### Frontend
- Los llamados a la API pasan por `src/lib/api.js`. No usar `fetch` directo en componentes.
- Mapeos API ↔ UI (`fromApi*`, `toApi*`) viven en `src/lib/mappers.js`. Utilidades de fechas en `src/lib/dates.js`. No duplicar.
- Un componente por archivo en `src/components/`. Evitar componentes de una sola línea gigante.
- Usar los componentes de `src/components/ui/` (shadcn). No agregar un segundo select/modal propio.
- No tragarse errores con `catch {}` vacío: mostrar mensaje al usuario o registrar el motivo.
- Next.js de esta versión tiene cambios respecto de lo que se conoce: leer `frontend/AGENTS.md` y `node_modules/next/dist/docs/` antes de usar APIs nuevas.

### Calidad
- Cambios chicos y revisables: un tema por commit/PR. No mezclar refactor con cambios de comportamiento.
- **Refactor solo con tests en verde antes y después.** Si no hay tests para esa zona, escribirlos primero.
- Mensajes de commit en español, en imperativo, cortos (`Agregar constraint único a habit_logs`).
- No agregar dependencias nuevas sin justificarlo en el PR.
- Si encontrás algo fuera del alcance de la tarea, anotalo en el PR; no lo arregles de paso.

## Estructura objetivo del backend (se llega en la Fase 4)

```
backend/app/
  main.py            # solo crea la app, middlewares y registra routers
  config.py
  database.py
  deps.py            # current_user, get_db, get_owned_or_404
  security.py
  rate_limit.py
  models.py
  schemas.py
  routers/           # auth, tasks, categories, habits, shopping, finance, events, pomodoro, hours
  services/          # hours.py, savings.py, habits.py (lógica de negocio sin HTTP)
backend/tests/
```

## Estructura objetivo del frontend

```
frontend/src/
  app/page.js        # solo arma el layout y las tabs
  components/        # agenda/, habits/, pomodoro/, finance/, hours/, shopping/, modals/, ui/
  hooks/             # useDashboard, usePomodoro, ...
  lib/               # api.js, mappers.js, dates.js, utils.js
```

## Dónde está el plan

El plan de mejoras, en orden, está en `TAREAS_AGENTE.md`. Trabajá una fase por vez y no avances a la siguiente sin confirmación del usuario.
