import calendar
from datetime import date as date_type
from datetime import timedelta

from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import settings
from .database import Base, engine, get_db
from .models import Event, Habit, HourEntry, HourPayment, PayPeriod, PomodoroLog, PomodoroSettings, Task, Transaction, User
from .rate_limit import auth_rate_limit, rate_limit
from .schemas import (
    ClosedPeriodOut,
    DashboardOut,
    EventCreate,
    EventOut,
    EventUpdate,
    HabitCreate,
    HabitOut,
    HabitUpdate,
    HourEntryCreate,
    HourEntryOut,
    HourPaymentCreate,
    HourPaymentOut,
    HoursStateOut,
    PayPeriodOut,
    PomodoroLogCreate,
    PomodoroLogOut,
    PomodoroOut,
    PomodoroUpdate,
    RateUpdate,
    TaskCreate,
    TaskOut,
    TaskUpdate,
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
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


def current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    try:
        user_id = get_user_id(token)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication") from exc
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


@app.api_route("/api/health", methods=["GET", "HEAD"])
def health(db: Session = Depends(get_db)) -> dict[str, str]:
    db.execute(select(1))
    return {"status": "ok"}


@app.post("/api/auth/register", response_model=Token, status_code=status.HTTP_201_CREATED, dependencies=[Depends(auth_rate_limit)])
def register(payload: UserCreate, db: Session = Depends(get_db)) -> Token:
    email = payload.email.lower()
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    user = User(email=email, full_name=payload.full_name.strip(), password_hash=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return Token(access_token=create_access_token(user.id))


@app.post("/api/auth/login", response_model=Token, dependencies=[Depends(auth_rate_limit)])
def login(payload: UserLogin, db: Session = Depends(get_db)) -> Token:
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    return Token(access_token=create_access_token(user.id))


@app.get("/api/auth/me", response_model=UserOut)
def me(user: User = Depends(current_user)) -> User:
    return user


def _roll_habit_day(habit: Habit, today: date_type) -> bool:
    if habit.updated_on is None:
        habit.updated_on = today
        return False
    if habit.updated_on < today:
        history = [*habit.history, habit.progress]
        habit.history = history[-7:]
        habit.count = 0
        habit.updated_on = today
        return True
    return False


@app.get("/api/dashboard", response_model=DashboardOut)
def dashboard(user: User = Depends(current_user), db: Session = Depends(get_db)) -> DashboardOut:
    tasks = db.scalars(select(Task).where(Task.user_id == user.id).order_by(Task.due_date, Task.completed, Task.id)).all()
    habits = db.scalars(select(Habit).where(Habit.user_id == user.id).order_by(Habit.id)).all()
    transactions = db.scalars(select(Transaction).where(Transaction.user_id == user.id).order_by(Transaction.created_at.desc())).all()
    today = date_type.today()
    rolled = [_roll_habit_day(habit, today) for habit in habits]
    if any(rolled):
        db.commit()
    return DashboardOut(tasks=tasks, habits=habits, transactions=transactions)


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


@app.patch("/api/tasks/{task_id}", response_model=TaskOut)
def update_task(task_id: int, payload: TaskUpdate, user: User = Depends(current_user), db: Session = Depends(get_db)) -> Task:
    task = db.scalar(select(Task).where(Task.id == task_id, Task.user_id == user.id))
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    db.commit()
    db.refresh(task)
    return task


@app.delete("/api/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)) -> None:
    task = db.scalar(select(Task).where(Task.id == task_id, Task.user_id == user.id))
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()


@app.post("/api/habits", response_model=HabitOut, status_code=status.HTTP_201_CREATED)
def create_habit(payload: HabitCreate, user: User = Depends(current_user), db: Session = Depends(get_db)) -> Habit:
    habit = Habit(user_id=user.id, name=payload.name.strip(), target=payload.target, unit=payload.unit.strip(), count=0, history=[], updated_on=date_type.today())
    db.add(habit)
    db.commit()
    db.refresh(habit)
    return habit


@app.patch("/api/habits/{habit_id}", response_model=HabitOut)
def update_habit(habit_id: int, payload: HabitUpdate, user: User = Depends(current_user), db: Session = Depends(get_db)) -> Habit:
    habit = db.scalar(select(Habit).where(Habit.id == habit_id, Habit.user_id == user.id))
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    _roll_habit_day(habit, date_type.today())
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(habit, field, value)
    habit.count = max(0, min(habit.count, habit.target))
    db.commit()
    db.refresh(habit)
    return habit


@app.patch("/api/habits/{habit_id}/increment", response_model=HabitOut)
def increment_habit(habit_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)) -> Habit:
    habit = db.scalar(select(Habit).where(Habit.id == habit_id, Habit.user_id == user.id))
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    _roll_habit_day(habit, date_type.today())
    habit.count = 0 if habit.count >= habit.target else habit.count + 1
    db.commit()
    db.refresh(habit)
    return habit


@app.delete("/api/habits/{habit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_habit(habit_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)) -> None:
    habit = db.scalar(select(Habit).where(Habit.id == habit_id, Habit.user_id == user.id))
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    db.delete(habit)
    db.commit()


@app.post("/api/transactions", response_model=TransactionOut, status_code=status.HTTP_201_CREATED)
def create_transaction(payload: TransactionCreate, user: User = Depends(current_user), db: Session = Depends(get_db)) -> Transaction:
    transaction = Transaction(user_id=user.id, **payload.model_dump())
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


@app.delete("/api/transactions/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(transaction_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)) -> None:
    transaction = db.scalar(select(Transaction).where(Transaction.id == transaction_id, Transaction.user_id == user.id))
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    db.delete(transaction)
    db.commit()


@app.get("/api/events", response_model=list[EventOut])
def list_events(user: User = Depends(current_user), db: Session = Depends(get_db)) -> list[Event]:
    return db.scalars(select(Event).where(Event.user_id == user.id).order_by(Event.event_date, Event.time)).all()


@app.post("/api/events", response_model=EventOut, status_code=status.HTTP_201_CREATED)
def create_event(payload: EventCreate, user: User = Depends(current_user), db: Session = Depends(get_db)) -> Event:
    event = Event(user_id=user.id, **payload.model_dump())
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@app.patch("/api/events/{event_id}/toggle", response_model=EventOut)
def toggle_event(event_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)) -> Event:
    event = db.scalar(select(Event).where(Event.id == event_id, Event.user_id == user.id))
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    event.done = not event.done
    db.commit()
    db.refresh(event)
    return event


@app.patch("/api/events/{event_id}", response_model=EventOut)
def update_event(event_id: int, payload: EventUpdate, user: User = Depends(current_user), db: Session = Depends(get_db)) -> Event:
    event = db.scalar(select(Event).where(Event.id == event_id, Event.user_id == user.id))
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(event, field, value)
    db.commit()
    db.refresh(event)
    return event


@app.delete("/api/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(event_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)) -> None:
    event = db.scalar(select(Event).where(Event.id == event_id, Event.user_id == user.id))
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(event)
    db.commit()


@app.get("/api/pomodoro", response_model=PomodoroOut)
def get_pomodoro_settings(user: User = Depends(current_user), db: Session = Depends(get_db)) -> PomodoroSettings:
    settings_row = db.scalar(select(PomodoroSettings).where(PomodoroSettings.user_id == user.id))
    if not settings_row:
        settings_row = PomodoroSettings(user_id=user.id)
        db.add(settings_row)
        db.commit()
        db.refresh(settings_row)
    return settings_row


@app.patch("/api/pomodoro", response_model=PomodoroOut)
def update_pomodoro_settings(payload: PomodoroUpdate, user: User = Depends(current_user), db: Session = Depends(get_db)) -> PomodoroSettings:
    settings_row = db.scalar(select(PomodoroSettings).where(PomodoroSettings.user_id == user.id))
    if not settings_row:
        settings_row = PomodoroSettings(user_id=user.id)
        db.add(settings_row)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(settings_row, field, value)
    db.commit()
    db.refresh(settings_row)
    return settings_row


@app.get("/api/pomodoro/history", response_model=list[PomodoroLogOut])
def get_pomodoro_history(user: User = Depends(current_user), db: Session = Depends(get_db)) -> list[PomodoroLogOut]:
    today = date_type.today()
    start = today - timedelta(days=6)
    rows = db.scalars(select(PomodoroLog).where(PomodoroLog.user_id == user.id, PomodoroLog.log_date >= start, PomodoroLog.log_date <= today)).all()
    by_date = {row.log_date: row.minutes for row in rows}
    return [PomodoroLogOut(date=start + timedelta(days=offset), minutes=by_date.get(start + timedelta(days=offset), 0)) for offset in range(7)]


@app.post("/api/pomodoro/log", response_model=PomodoroLogOut)
def log_pomodoro_minutes(payload: PomodoroLogCreate, user: User = Depends(current_user), db: Session = Depends(get_db)) -> PomodoroLogOut:
    today = date_type.today()
    row = db.scalar(select(PomodoroLog).where(PomodoroLog.user_id == user.id, PomodoroLog.log_date == today))
    if not row:
        row = PomodoroLog(user_id=user.id, log_date=today, minutes=0)
        db.add(row)
    row.minutes += payload.minutes
    db.commit()
    db.refresh(row)
    return PomodoroLogOut(date=row.log_date, minutes=row.minutes)


def _add_month(value: date_type) -> date_type:
    month = value.month + 1
    year = value.year + (1 if month > 12 else 0)
    month = month - 12 if month > 12 else month
    day = min(value.day, calendar.monthrange(year, month)[1])
    return value.replace(year=year, month=month, day=day)


def _period_end(start: date_type) -> date_type:
    shifted = _add_month(start)
    return shifted.replace(day=10)


def _entry_duration(entry: HourEntry) -> float:
    if entry.holiday:
        return 4.0
    if entry.hours is not None:
        return entry.hours
    from_h, from_m = (int(part) for part in entry.from_time.split(":"))
    to_h, to_m = (int(part) for part in entry.to_time.split(":"))
    return max(0.0, (to_h * 60 + to_m - from_h * 60 - from_m) / 60)


def _entry_value(entry: HourEntry, rate: float) -> float:
    return _entry_duration(entry) * rate * (2 if entry.extra else 1)


def _get_or_create_open_period(db: Session, user: User) -> PayPeriod:
    period = db.scalar(select(PayPeriod).where(PayPeriod.user_id == user.id, PayPeriod.closed.is_(False)))
    if period:
        return period
    last = db.scalar(select(PayPeriod).where(PayPeriod.user_id == user.id).order_by(PayPeriod.start.desc()))
    if last:
        start = _add_month(last.start)
        rate = last.rate
    else:
        start = date_type.today()
        rate = 0.0
    period = PayPeriod(user_id=user.id, start=start, end=_period_end(start), rate=rate)
    db.add(period)
    db.commit()
    db.refresh(period)
    return period


def _close_period(db: Session, period: PayPeriod, user: User) -> None:
    entries = db.scalars(select(HourEntry).where(HourEntry.user_id == user.id, HourEntry.entry_date >= period.start, HourEntry.entry_date <= period.end)).all()
    payments = db.scalars(select(HourPayment).where(HourPayment.period_id == period.id)).all()
    period.total_hours = sum(_entry_duration(entry) for entry in entries)
    period.expected = sum(_entry_value(entry, period.rate) for entry in entries)
    period.paid = sum(payment.amount for payment in payments)
    period.balance = period.expected - period.paid
    period.closed = True


def _build_hours_state(db: Session, user: User) -> HoursStateOut:
    period = _get_or_create_open_period(db, user)
    entries = db.scalars(select(HourEntry).where(HourEntry.user_id == user.id).order_by(HourEntry.entry_date)).all()
    payments = db.scalars(select(HourPayment).where(HourPayment.period_id == period.id).order_by(HourPayment.payment_date)).all()
    closed_periods = db.scalars(select(PayPeriod).where(PayPeriod.user_id == user.id, PayPeriod.closed.is_(True)).order_by(PayPeriod.start.desc())).all()
    return HoursStateOut(
        period=PayPeriodOut.model_validate(period),
        entries=[HourEntryOut.model_validate(entry) for entry in entries],
        payments=[HourPaymentOut.model_validate(payment) for payment in payments],
        closed_periods=[ClosedPeriodOut.model_validate(item) for item in closed_periods],
    )


@app.get("/api/hours", response_model=HoursStateOut)
def get_hours(user: User = Depends(current_user), db: Session = Depends(get_db)) -> HoursStateOut:
    return _build_hours_state(db, user)


@app.patch("/api/hours/period", response_model=HoursStateOut)
def update_period_rate(payload: RateUpdate, user: User = Depends(current_user), db: Session = Depends(get_db)) -> HoursStateOut:
    period = _get_or_create_open_period(db, user)
    period.rate = payload.rate
    db.commit()
    return _build_hours_state(db, user)


@app.put("/api/hours/entries", response_model=HourEntryOut)
def upsert_hour_entry(payload: HourEntryCreate, user: User = Depends(current_user), db: Session = Depends(get_db)) -> HourEntry:
    entry = db.scalar(select(HourEntry).where(HourEntry.user_id == user.id, HourEntry.entry_date == payload.entry_date))
    if entry:
        for field, value in payload.model_dump().items():
            setattr(entry, field, value)
    else:
        entry = HourEntry(user_id=user.id, **payload.model_dump())
        db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@app.delete("/api/hours/entries/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_hour_entry(entry_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)) -> None:
    entry = db.scalar(select(HourEntry).where(HourEntry.id == entry_id, HourEntry.user_id == user.id))
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    db.delete(entry)
    db.commit()


@app.post("/api/hours/payments", response_model=HoursStateOut, status_code=status.HTTP_201_CREATED)
def create_payment(payload: HourPaymentCreate, user: User = Depends(current_user), db: Session = Depends(get_db)) -> HoursStateOut:
    period = _get_or_create_open_period(db, user)
    payment = HourPayment(user_id=user.id, period_id=period.id, **payload.model_dump())
    db.add(payment)
    db.commit()
    return _build_hours_state(db, user)


@app.post("/api/hours/close", response_model=HoursStateOut)
def close_period(user: User = Depends(current_user), db: Session = Depends(get_db)) -> HoursStateOut:
    period = _get_or_create_open_period(db, user)
    _close_period(db, period, user)
    db.commit()
    _get_or_create_open_period(db, user)
    return _build_hours_state(db, user)


@app.post("/api/hours/periods/{period_id}/reopen", response_model=HoursStateOut)
def reopen_period(period_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)) -> HoursStateOut:
    target = db.scalar(select(PayPeriod).where(PayPeriod.id == period_id, PayPeriod.user_id == user.id))
    if not target:
        raise HTTPException(status_code=404, detail="Period not found")
    current_open = db.scalar(select(PayPeriod).where(PayPeriod.user_id == user.id, PayPeriod.closed.is_(False)))
    if current_open and current_open.id != target.id:
        _close_period(db, current_open, user)
    target.closed = False
    db.commit()
    return _build_hours_state(db, user)
