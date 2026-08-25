# Dayflow

Aplicacion personal para organizar tareas, foco, trabajo, habitos y finanzas.

## Estructura

- `backend/`: FastAPI, SQLite, JWT, Argon2 y rate limiting por IP.
- `frontend/`: Next.js, JavaScript y Tailwind; los componentes UI siguen el estilo de shadcn.

## Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

## Frontend

```powershell
cd frontend
npm run dev
```

Frontend: http://localhost:3000
