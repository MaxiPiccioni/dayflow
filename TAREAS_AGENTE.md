# Plan de mejoras de Dayflow — tareas para el agente

Orden de trabajo: **una fase por vez**, con commit/PR propio y confirmación del usuario antes de pasar a la siguiente.
Antes de empezar, leé `AGENTS.md`.

Cada fase trae: objetivo, alcance, pasos, criterios de aceptación y un **prompt listo para pegar**.

---

## Fase 1 — Seguridad (urgente)

**Objetivo:** cortar fugas de información y endurecer la autenticación.

### 1.1 Limpiar archivos que no deberían estar en el repo
- `.claude/settings.json` está commiteado. Contiene un JWT (ya vencido el 26/08/2026), URLs de producción y una cuenta de prueba con su contraseña.
- `backend/uvicorn.log`, `backend/uv8020.log`, `backend/uvicorn8010.log` están commiteados (rutas locales, errores SQL).

Pasos:
1. `git rm --cached` de `.claude/settings.json` y de los tres `.log`. Dejar los archivos en disco.
2. Agregar al `.gitignore`: `.claude/`, `*.log`, `backend/*.db`, `.env*` (excepto `.env.example`), `__pycache__/`, `.venv/`.
3. Confirmar que `git ls-files` ya no lista nada de eso.

**Acciones manuales del usuario (el agente NO las hace):**
- Borrar el usuario `diag-test@example.com` de la base de producción.
- Rotar `JWT_SECRET` en Render (invalida todas las sesiones, es lo esperado).
- Decidir si se limpia el historial con `git filter-repo`. Si se hace, es reescritura de historial: requiere `push --force` y que cualquier clon se vuelva a bajar.

### 1.2 Fallar al arrancar con secreto por defecto
- En `backend/app/config.py`, `jwt_secret` tiene el default `"change-me-in-production"`.
- Agregar una variable `environment` (`development` | `production`, default `development`).
- Si `environment == "production"` y el secreto es el default o tiene menos de 32 caracteres, lanzar un error al importar `settings`.
- En `render.yaml` agregar `ENVIRONMENT=production`.
- Actualizar `backend/.env.example`.

### 1.3 Rate limit confiable
Problemas: está en memoria por proceso, se resetea al reiniciar y `--forwarded-allow-ips='*'` hace que uvicorn confíe en cualquier `X-Forwarded-For`.
1. Reemplazar `'*'` en `render.yaml` por una configuración que solo confíe en el proxy de Render. Verificar en la documentación de Render y de uvicorn qué IP real llega; si no se puede garantizar, tomar el último valor de `X-Forwarded-For` (el que agrega el proxy) y no el primero.
2. Agregar un límite por cuenta además del de IP en `/auth/login`: por ejemplo 5 intentos fallidos por email en 15 minutos.
3. Unificar `rate_limit` y `auth_rate_limit` en una sola función parametrizable (ventana, máximo, clave).
4. Dejar documentado en un comentario que el almacenamiento en memoria es por instancia y qué habría que cambiar para escalar a varias instancias.

### 1.4 Endurecer la API
- Deshabilitar `/docs`, `/redoc` y `/openapi.json` cuando `environment == "production"`.
- Quitar `allow_credentials=True` del CORS (se usa Bearer, no cookies).
- Reemplazar `python-jose` por `PyJWT` en `security.py`. Mantener HS256, `exp` y `sub`, y exigir `exp`.
- Agregar `Strict-Transport-Security` en el middleware de headers cuando es producción.
- Que el registro no revele si un email existe (respuesta genérica), o dejarlo documentado como decisión consciente.

### 1.5 Frontend: manejo de sesión
- `src/lib/api.js`:
  - Si la respuesta es 401, borrar el token y disparar un evento global (`dayflow-auth-expired`) para que `AuthGate` vuelva al login.
  - No fallar si el cuerpo del error no es JSON (500/502 de Render): usar mensaje genérico en español.
  - Distinguir errores de red de errores de API.
- Evaluar mover el token a cookie `httpOnly` (queda como **propuesta**, no implementar sin confirmación: implica cambios de CORS, CSRF y dominio).

**Criterios de aceptación Fase 1**
- `git ls-files` no contiene `.claude/`, `*.log` ni `.env`.
- Con `ENVIRONMENT=production` y secreto por defecto, la app no arranca.
- `/docs` responde 404 en producción.
- Un token vencido en el navegador lleva al login sin pantalla rota.
- Tests nuevos del rate limit y del arranque con config inválida.

**Prompt para pegar**
> Leé `AGENTS.md` y la Fase 1 de `TAREAS_AGENTE.md`. Implementá las tareas 1.1 (solo la parte de git y `.gitignore`), 1.2, 1.3, 1.4 y 1.5, en commits separados por tarea. No toques la base de producción ni reescribas historial. Cuando termines, listame qué acciones manuales me quedan (1.1) y qué decisiones necesitás de mí (cookie httpOnly, política de rate limit).

---

## Fase 2 — Red de seguridad: tests

**Objetivo:** poder refactorizar sin romper nada.

Pasos:
1. Agregar `pytest`, `httpx` y `pytest-cov` a `backend/requirements-dev.txt`.
2. Crear `backend/tests/conftest.py`: base SQLite en memoria (o archivo temporal) con las tablas creadas desde los modelos para tests, `TestClient`, override de `get_db`, y fixtures `user_a`, `user_b` con tokens.
3. Escribir los tests:
   - **Aislamiento entre usuarios:** para cada recurso (tasks, categories, habits, habit logs, shopping, transactions, savings, movements, events, pomodoro, hours entries/payments/periods) comprobar que el usuario B recibe 404 al leer, editar o borrar recursos de A, y que las listas de B no incluyen datos de A.
   - **Auth:** registro, login correcto e incorrecto, token vencido, token con firma inválida, `/auth/me`.
   - **Horas:** `_entry_duration` (por rango horario, `hours` manual, feriado = 4 h), `_entry_value` (extra x2), cierre de período, reapertura, borrado de período cerrado, resolución de período por mes calendario desde `CALENDAR_PERIODS_FROM` y por rango antes de esa fecha.
   - **Hábitos:** racha, tope del conteo en `target`, rechazo de días futuros y de días previos a la creación.
   - **Ahorros:** `_rollover_savings` (pasaje de mes, sin duplicar si se llama dos veces) y cálculo de `current_amount`/`gain`.
   - **Tareas y eventos repetidos:** cantidad de ocurrencias y días correctos.
   - **Categorías:** renombrar y borrar propagan a tareas, eventos, transacciones y compras según `scope`.
4. Agregar GitHub Actions (`.github/workflows/ci.yml`): backend (instalar, `ruff check`, `pytest`) y frontend (`npm ci`, `npm run lint`, `npm run build`).
5. Agregar `ruff` con configuración en `backend/pyproject.toml`.

**Criterios de aceptación Fase 2**
- `pytest` pasa en local y en CI.
- Cobertura de `main.py` mayor a 70 %.
- Hay al menos un test de aislamiento por cada recurso.

**Importante:** los tests documentan el comportamiento **actual**. Si encontrás un bug, no lo arregles acá: marcá el test con `xfail` y anotalo para la Fase 3.

**Prompt para pegar**
> Leé `AGENTS.md` y la Fase 2 de `TAREAS_AGENTE.md`. Armá la suite de tests del backend y el CI. No modifiques código de `app/` salvo lo mínimo para poder testear (por ejemplo, que `get_db` se pueda sobreescribir). Los bugs que encuentres marcalos con `xfail` y dejame una lista al final.

---

## Fase 3 — Datos y correctitud

**Objetivo:** que los números y las fechas sean correctos y que la base se proteja sola.

Hacerlo con **una migración Alembic por tema**, revisada a mano.

### 3.1 Dinero con precisión
- Pasar de `Float` a `Numeric(12, 2)` en: `Transaction.amount`, `SavingEntry.start_amount`, `SavingMovement.amount`, `PayPeriod.rate/expected/paid/balance`, `HourPayment.amount`.
- `hours` y `total_hours` pueden quedar como `Numeric(6, 2)`.
- Ajustar schemas (Pydantic `Decimal`, serializado como número) y cálculos de `main.py`. La migración debe convertir los datos existentes sin perder valores (probar con una copia de datos).
- Verificar que el frontend siga mostrando bien los montos.

### 3.2 Constraints únicos
Agregar, previa limpieza de duplicados existentes dentro de la migración:
- `habit_logs (habit_id, log_date)`
- `hour_entries (user_id, entry_date)`
- `pay_periods (user_id, start)`
- `pomodoro_logs (user_id, log_date)`
- `categories (user_id, scope, kind, name)` (considerar nombre en minúsculas)
- `saving_entries (user_id, name, month)`

Cambiar los "buscar o crear" a un upsert o a manejo de `IntegrityError` con reintento.

### 3.3 Fechas del cliente y UTC
- Reemplazar `date.today()` del servidor en: `create_saving`, `get_pomodoro_history`, `log_pomodoro_seconds`, `get_hours`, `update_period_rate`, `create_payment`, `close_period`. Recibir `client_today` (o `reference_date`) y usarlo.
- Reemplazar `datetime.utcnow` por `datetime.now(timezone.utc)` y definir si las columnas pasan a timezone-aware.
- Cuidado con `habit.created_at.date()`: se compara con fechas del cliente. Guardar la fecha de creación como `Date` local del cliente o convertir de forma explícita. Test: crear un hábito a las 22:00 en UTC-3 y registrar el día local.

### 3.4 Validaciones
- `habits/overview`: `days` con `Query(14, ge=1, le=366)`.
- `/categories`: `scope` y `kind` con `Literal`.
- Pasar `kind`, `method`, `priority`, `scope` a `Enum`/`Literal` compartido entre modelo y schema.
- Revisar el default `category="General"` de `TransactionCreate`: no existe en las categorías por defecto.

### 3.5 Categorías con FK
- Agregar `category_id` (FK nullable, `ondelete="SET NULL"`) a tasks, events, transactions y shopping_items.
- Migración de datos: crear/relacionar por nombre dentro de cada `scope` y usuario.
- Mantener el nombre en las respuestas de la API para no romper el frontend; cuando sea posible, devolver también `category_id`.
- Renombrar una categoría pasa a ser un solo `UPDATE` sobre `categories`.
- Esta tarea es la más riesgosa: hacerla en su propio PR y con backup previo.

### 3.6 Tareas repetidas
- Agregar `series_id` (UUID nullable) a tasks y events creados con `repeat_days`.
- Endpoints o parámetros para editar/borrar "solo esta" o "esta y las siguientes".

### 3.7 GET sin efectos secundarios
- Sacar `_rollover_savings` de `GET /api/dashboard`. Opciones: endpoint `POST /api/savings/rollover` que el frontend llama al detectar mes nuevo, o ejecutarlo en la creación perezosa de forma idempotente y protegida por el constraint de 3.2. Elegir la opción más simple y justificarla.

**Criterios de aceptación Fase 3**
- Todos los tests de la Fase 2 siguen en verde; los `xfail` resueltos pasan a verde.
- Tests nuevos para cada punto.
- Cada migración tiene `upgrade` y `downgrade` y se probó sobre SQLite y sobre Postgres local.
- Ningún `date.today()` ni `utcnow` queda en `app/`.

**Prompt para pegar**
> Leé `AGENTS.md` y la Fase 3 de `TAREAS_AGENTE.md`. Hacé una subtarea por vez (3.1 a 3.7), cada una con su migración Alembic, tests y commit. Antes de 3.5 pedime confirmación, porque requiere backup. Mostrame el SQL de cada migración antes de aplicarla.

---

## Fase 4 — Modularización

**Objetivo:** archivos chicos, responsabilidades claras. Cero cambios de comportamiento.

### 4.1 Backend
1. Crear `app/deps.py` con `current_user`, `get_db` y `get_owned_or_404(db, Model, id, user)`.
2. Crear `app/routers/` con un `APIRouter` por dominio (auth, tasks, categories, habits, shopping, finance, events, pomodoro, hours). Prefijo `/api`.
3. Mover la lógica sin HTTP a `app/services/` (horas, ahorros, hábitos, repeticiones).
4. Dejar `main.py` con la creación de la app, CORS, middlewares y `include_router`.
5. Dividir `schemas.py` y `models.py` por dominio solo si queda claro; si no, dejarlos.
6. Reemplazar los ~25 bloques repetidos de "buscar propio + 404" por `get_owned_or_404`.

### 4.2 Frontend
1. Crear `src/lib/dates.js` (`todayIso`, `shiftIsoDate`, `daysUntil`, `formatFullDate`) y `src/lib/mappers.js` (todos los `fromApi*`/`toApi*`). Eliminar los duplicados de `hours-panel.jsx`.
2. Extraer de `page.js` a `src/components/`:
   - `agenda/` (AgendaPanel, UnifiedAgenda, DayModal, TaskModal, EventModal, RepeatField)
   - `habits/` (Habits, HabitsTracker, HabitsOverviewChart, HabitModal)
   - `pomodoro/` (Pomodoro y los sonidos a `lib/sounds.js`)
   - `finance/` (FinanceModal, FinanceArchive, SavingsCard, SavingModal, SavingMovementsModal, CategoryBar)
   - `modals/` (CategoryManagerModal, FinanceCategoryManagerModal, WidgetPickerModal)
   - `summary/` (DraggableCard, ColumnDropZone, SummaryColumn)
3. Extraer hooks: `useDashboard`, `usePomodoro`, `useSummaryLayout`.
4. Unificar el `Select` propio con `ShadSelect` y eliminar el duplicado.
5. Reformatear los componentes de una línea a JSX legible.
6. Quitar el arreglo de 500 frases: dejar 5 a 10 frases reales.
7. Objetivo: `page.js` por debajo de 250 líneas.

**Criterios de aceptación Fase 4**
- Tests del backend sin cambios y en verde. El OpenAPI generado es equivalente (comparar antes y después).
- `npm run lint` y `npm run build` sin errores nuevos.
- Ningún archivo de `app/` supera ~300 líneas; ningún componente supera ~250.
- Comportamiento de la UI idéntico (checklist manual en el PR).

**Prompt para pegar**
> Leé `AGENTS.md` y la Fase 4 de `TAREAS_AGENTE.md`. Es un refactor puro: no cambies comportamiento. Hacé primero el backend (4.1) y después el frontend (4.2), con un commit por paso. Antes de empezar, guardá el `openapi.json` actual para compararlo al final. Avisame si encontrás algo que parezca un bug en vez de arreglarlo.

---

## Fase 5 — Rendimiento y experiencia

**Objetivo:** que la app cargue rápido aun con Neon dormido y con historial grande.

### 5.1 Carga inicial más liviana
- Reemplazar el `Promise.all` de 6 llamadas + una por hábito (`/habits/{id}/logs`) por:
  - un endpoint batch `GET /api/habits/logs?from=&to=` (todos los hábitos del rango), o incluir los logs recientes en `/dashboard`;
  - o un endpoint `GET /api/bootstrap` que devuelva lo necesario para la primera pantalla.
- Medir antes y después (tiempo hasta primera pantalla útil) y reportarlo en el PR.

### 5.2 Paginación y filtros por fecha
- `/dashboard`: tareas desde 30 días atrás hasta 90 adelante; transacciones del mes en curso con paginación.
- `/events`: parámetros `from` y `to`.
- `/hours`: entradas solo del período consultado (más las de cerrados bajo demanda).
- El frontend pide el rango visible del calendario.

### 5.3 Base de datos
- Revisar índices con `EXPLAIN` en Postgres para las consultas del dashboard y de horas. Agregar índices compuestos (`user_id, due_date`; `user_id, entry_date`; `user_id, created_at`).
- Revisar `pool_size`/`NullPool` según el costo real de conexión; documentar la decisión en `database.py`.

### 5.4 Experiencia
- Estados de carga (skeletons) y de error con reintento en los paneles.
- Actualizaciones optimistas al completar tareas y marcar hábitos, con rollback si falla.
- Pantalla "el servidor está despertando" cuando la primera respuesta tarda más de unos segundos (Render free + Neon).

**Criterios de aceptación Fase 5**
- La carga inicial hace como máximo 2 a 3 requests.
- Ningún endpoint de listado devuelve historial completo sin filtro.
- Tests de paginación y de rangos.

**Prompt para pegar**
> Leé `AGENTS.md` y la Fase 5 de `TAREAS_AGENTE.md`. Empezá midiendo la carga inicial actual (cantidad de requests y tiempo). Después hacé 5.1 y 5.2 con tests, y reportá las métricas antes y después. 5.3 y 5.4 las dejamos para cuando termine esto.

---

## Fase 6 (opcional) — Documentación y conexiones

- Reescribir `README.md`: Alembic, variables de entorno, Neon, Render, comandos para PowerShell y bash, cómo correr tests.
- Documentar la arquitectura y decisiones (por ejemplo, el por qué del `NullPool`).
- Ideas de integración (a evaluar con el usuario antes de implementar):
  - exportar/sincronizar eventos con Google Calendar o archivo `.ics`;
  - recordatorios por correo o notificaciones push;
  - exportación de finanzas y horas a CSV/Sheets;
  - webhooks o un endpoint de automatización para crear tareas desde otras apps.

---

## Checklist final

- [ ] Fase 1: secretos y logs fuera del repo, `JWT_SECRET` rotado, rate limit y headers
- [ ] Fase 2: tests de aislamiento y lógica, CI en verde
- [ ] Fase 3: dinero en `Numeric`, constraints únicos, fechas del cliente, categorías con FK
- [ ] Fase 4: `main.py` y `page.js` modularizados
- [ ] Fase 5: carga inicial con pocos requests, paginación
- [ ] Fase 6: README y documentación

> Estado actual y pendientes ordenados: ver `ESTADO.md`. Fase 3 se divide en 3-A (hecha), 3-B fechas/UTC, 3-C dinero, 3-D constraints+Postgres, 3-E categorías FK, 3-F ahorros. Facultad partes 1–3 hechas.
