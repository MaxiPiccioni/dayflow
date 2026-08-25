from datetime import date, datetime, timedelta

from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import settings
from .database import Base, engine, get_db
from .models import Habit, Task, Transaction, User, WorkSession
from .rate_limit import rate_limit
from .schemas import (
    DashboardOut,
    HabitCreate,
    HabitOut,
    TaskCreate,
    TaskOut,
    Token,
    TransactionCreate,
    TransactionOut,
    UserCreate,
    UserLogin,
    UserOut,
)
from .security import create_access_token, get_user_id, hash_password, verify_password

Base.metadata.create_all(bind=engine)
app = FastAPI(title="Dayflow API", version="0.1.0", dependencies=[Depends(rate_limit)])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH"],
    allow_headers=["Authorization", "Content-Type"],
)


def current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    try:
        user_id = get_user_id(token)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication") from exc
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/auth/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)) -> Token:
    email = payload.email.lower()
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    user = User(email=email, full_name=payload.full_name.strip(), password_hash=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return Token(access_token=create_access_token(user.id))


@app.post("/api/auth/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)) -> Token:
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    return Token(access_token=create_access_token(user.id))


@app.get("/api/auth/me", response_model=UserOut)
def me(user: User = Depends(current_user)) -> User:
    return user


@app.get("/api/dashboard", response_model=DashboardOut)
def dashboard(user: User = Depends(current_user), db: Session = Depends(get_db)) -> DashboardOut:
    tasks = db.scalars(select(Task).where(Task.user_id == user.id, Task.due_date == date.today()).order_by(Task.completed, Task.id)).all()
    habits = db.scalars(select(Habit).where(Habit.user_id == user.id).order_by(Habit.id)).all()
    transactions = db.scalars(select(Transaction).where(Transaction.user_id == user.id).order_by(Transaction.created_at.desc()).limit(8)).all()
    sessions = db.scalars(select(WorkSession).where(WorkSession.user_id == user.id, WorkSession.started_at >= datetime.utcnow() - timedelta(days=30))).all()
    balance = sum(item.amount if item.kind == "income" else -item.amount for item in transactions)
    return DashboardOut(tasks=tasks, habits=habits, transactions=transactions, work_minutes=sum(item.minutes for item in sessions), balance=balance)


@app.post("/api/tasks", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(payload: TaskCreate, user: User = Depends(current_user), db: Session = Depends(get_db)) -> Task:
    task = Task(user_id=user.id, **payload.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@app.patch("/api/tasks/{task_id}/complete", response_model=TaskOut)
def complete_task(task_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)) -> Task:
    task = db.scalar(select(Task).where(Task.id == task_id, Task.user_id == user.id))
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.completed = not task.completed
    db.commit()
    db.refresh(task)
    return task


@app.post("/api/habits", response_model=HabitOut, status_code=status.HTTP_201_CREATED)
def create_habit(payload: HabitCreate, user: User = Depends(current_user), db: Session = Depends(get_db)) -> Habit:
    habit = Habit(user_id=user.id, name=payload.name.strip())
    db.add(habit)
    db.commit()
    db.refresh(habit)
    return habit


@app.patch("/api/habits/{habit_id}/check", response_model=HabitOut)
def check_habit(habit_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)) -> Habit:
    habit = db.scalar(select(Habit).where(Habit.id == habit_id, Habit.user_id == user.id))
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    habit.checked_today = not habit.checked_today
    habit.streak = max(0, habit.streak + (1 if habit.checked_today else -1))
    db.commit()
    db.refresh(habit)
    return habit


@app.post("/api/transactions", response_model=TransactionOut, status_code=status.HTTP_201_CREATED)
def create_transaction(payload: TransactionCreate, user: User = Depends(current_user), db: Session = Depends(get_db)) -> Transaction:
    transaction = Transaction(user_id=user.id, **payload.model_dump())
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction
