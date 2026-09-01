import calendar
from collections import defaultdict
from datetime import date as date_type
from datetime import timedelta

from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .config import settings
from .database import get_db
from .models import Category, Event, Habit, HabitLog, HourEntry, HourPayment, PayPeriod, PomodoroLog, PomodoroSettings, SavingEntry, SavingMovement, ShoppingItem, Task, Transaction, User
from .rate_limit import auth_rate_limit, rate_limit
from .schemas import (
    CategoryCreate,
    CategoryOut,
    CategoryUpdate,
    ClosedPeriodOut,
    CloseRequest,
    DashboardOut,
    EventCreatePayload,
    EventOut,
    EventUpdate,
    HabitCreate,
    HabitLogOut,
    HabitLogUpdate,
    HabitOut,
    HabitOverviewOut,
    HabitUpdate,
    HourEntryCreate,
    HourEntryOut,
    HourPaymentOut,
    HourPaymentRequest,
    HoursStateOut,
    PayPeriodOut,
    PomodoroLogCreate,
    PomodoroLogOut,
    PomodoroOut,
    PomodoroUpdate,
    RateUpdate,
    SavingEntryCreate,
    SavingEntryOut,
    SavingEntryUpdate,
    SavingMovementCreate,
    SavingMovementOut,
    ShoppingItemCreate,
    ShoppingItemOut,
    ShoppingItemUpdate,
    TaskCreatePayload,
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


def _habit_logs_by_date(db: Session, habit_id: int) -> dict[date_type, int]:
    logs = db.scalars(select(HabitLog).where(HabitLog.habit_id == habit_id)).all()
    return {log.log_date: log.count for log in logs}


def _habit_out_from_logs(habit: Habit, by_date: dict[date_type, int], today: date_type) -> HabitOut:
    today_count = by_date.get(today, 0)
    progress = round(today_count / habit.target * 100) if habit.target else 0
    streak = 0
    if today_count >= habit.target:
        cursor = today
        while by_date.get(cursor, 0) >= habit.target:
            streak += 1
            cursor -= timedelta(days=1)
    return HabitOut(id=habit.id, name=habit.name, target=habit.target, unit=habit.unit, count=today_count, progress=progress, streak=streak, created_at=habit.created_at)


def _build_habit_out(db: Session, habit: Habit, today: date_type) -> HabitOut:
    return _habit_out_from_logs(habit, _habit_logs_by_date(db, habit.id), today)


def _habit_logs_by_habit_id(db: Session, habit_ids: list[int]) -> dict[int, dict[date_type, int]]:
    if not habit_ids:
        return {}
    logs = db.scalars(select(HabitLog).where(HabitLog.habit_id.in_(habit_ids))).all()
    by_habit: dict[int, dict[date_type, int]] = defaultdict(dict)
    for log in logs:
        by_habit[log.habit_id][log.log_date] = log.count
    return by_habit


def _saving_out_from_amount(saving: SavingEntry, current: float) -> SavingEntryOut:
    return SavingEntryOut(id=saving.id, name=saving.name, start_amount=saving.start_amount, current_amount=current, gain=current - saving.start_amount)


def _saving_current_amount(db: Session, saving: SavingEntry) -> float:
    moved = db.scalar(select(func.coalesce(func.sum(SavingMovement.amount), 0.0)).where(SavingMovement.saving_id == saving.id)) or 0.0
    return saving.start_amount + moved


def _build_saving_out(db: Session, saving: SavingEntry) -> SavingEntryOut:
    return _saving_out_from_amount(saving, _saving_current_amount(db, saving))


def _moved_amounts_by_saving_id(db: Session, saving_ids: list[int]) -> dict[int, float]:
    if not saving_ids:
        return {}
    rows = db.execute(
        select(SavingMovement.saving_id, func.coalesce(func.sum(SavingMovement.amount), 0.0))
        .where(SavingMovement.saving_id.in_(saving_ids))
        .group_by(SavingMovement.saving_id)
    ).all()
    return dict(rows)


def _rollover_savings(db: Session, user: User, current_month: str) -> None:
    all_savings = db.scalars(select(SavingEntry).where(SavingEntry.user_id == user.id).order_by(SavingEntry.month.desc())).all()
    latest_by_name: dict[str, SavingEntry] = {}
    for saving in all_savings:
        latest_by_name.setdefault(saving.name, saving)
    to_roll = [saving for saving in latest_by_name.values() if saving.month < current_month]
    if not to_roll:
        return
    moved_by_id = _moved_amounts_by_saving_id(db, [saving.id for saving in to_roll])
    for saving in to_roll:
        current_amount = saving.start_amount + moved_by_id.get(saving.id, 0.0)
        db.add(SavingEntry(user_id=user.id, name=saving.name, start_amount=current_amount, month=current_month))
    db.commit()


@app.get("/api/dashboard", response_model=DashboardOut)
def dashboard(user: User = Depends(current_user), db: Session = Depends(get_db)) -> DashboardOut:
    tasks = db.scalars(select(Task).where(Task.user_id == user.id).order_by(Task.due_date, Task.completed, Task.id)).all()
    habit_rows = db.scalars(select(Habit).where(Habit.user_id == user.id).order_by(Habit.id)).all()
    transactions = db.scalars(select(Transaction).where(Transaction.user_id == user.id).order_by(Transaction.created_at.desc())).all()
    today = date_type.today()
    logs_by_habit = _habit_logs_by_habit_id(db, [habit.id for habit in habit_rows])
    habits = [_habit_out_from_logs(habit, logs_by_habit.get(habit.id, {}), today) for habit in habit_rows]
    current_month = today.strftime("%Y-%m")
    _rollover_savings(db, user, current_month)
    saving_rows = db.scalars(select(SavingEntry).where(SavingEntry.user_id == user.id, SavingEntry.month == current_month).order_by(SavingEntry.id)).all()
    moved_by_saving = _moved_amounts_by_saving_id(db, [saving.id for saving in saving_rows])
    savings = [_saving_out_from_amount(saving, saving.start_amount + moved_by_saving.get(saving.id, 0.0)) for saving in saving_rows]
    return DashboardOut(tasks=tasks, habits=habits, transactions=transactions, savings=savings)


REPEAT_WEEKDAY_INDEX = {"mon": 0, "tue": 1, "wed": 2, "thu": 3, "fri": 4, "sat": 5, "sun": 6}
REPEAT_HORIZON_DAYS = 90


def _repeat_occurrence_dates(start: date_type, repeat_days: list[str] | None) -> list[date_type]:
    if not repeat_days:
        return [start]
    weekdays = {REPEAT_WEEKDAY_INDEX[day] for day in repeat_days}
    return [day for day in (start + timedelta(days=offset) for offset in range(REPEAT_HORIZON_DAYS + 1)) if day.weekday() in weekdays]


@app.post("/api/tasks", response_model=list[TaskOut], status_code=status.HTTP_201_CREATED)
def create_task(payload: TaskCreatePayload, user: User = Depends(current_user), db: Session = Depends(get_db)) -> list[Task]:
    data = payload.model_dump(exclude={"repeat_days"})
    occurrences = _repeat_occurrence_dates(payload.due_date, payload.repeat_days)
    tasks = [Task(user_id=user.id, **{**data, "due_date": occurrence}) for occurrence in occurrences]
    db.add_all(tasks)
    db.commit()
    for task in tasks:
        db.refresh(task)
    return tasks


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


DEFAULT_CATEGORIES = {
    "agenda": ["Trabajo", "Personal", "Foco", "Rutina"],
}
DEFAULT_FINANCE_CATEGORIES = {
    "income": ["Salario", "Freelance", "Regalo", "Otro"],
    "expense": ["Alimentación", "Transporte", "Servicios", "Ocio", "Otro"],
}


def _category_query(user_id: int, scope: str, kind: str | None):
    query = select(Category).where(Category.user_id == user_id, Category.scope == scope)
    return query.where(Category.kind.is_(None)) if kind is None else query.where(Category.kind == kind)


@app.get("/api/categories", response_model=list[CategoryOut])
def list_categories(scope: str = "agenda", kind: str | None = None, user: User = Depends(current_user), db: Session = Depends(get_db)) -> list[Category]:
    categories = db.scalars(_category_query(user.id, scope, kind).order_by(Category.name)).all()
    if not categories:
        defaults = DEFAULT_FINANCE_CATEGORIES.get(kind, []) if scope == "finance" else DEFAULT_CATEGORIES.get(scope, [])
        for name in defaults:
            db.add(Category(user_id=user.id, name=name, scope=scope, kind=kind))
        db.commit()
        categories = db.scalars(_category_query(user.id, scope, kind).order_by(Category.name)).all()
    return categories


@app.post("/api/categories", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(payload: CategoryCreate, user: User = Depends(current_user), db: Session = Depends(get_db)) -> Category:
    name = payload.name.strip()
    exists = db.scalar(_category_query(user.id, payload.scope, payload.kind).where(Category.name.ilike(name)))
    if exists:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Esa categoría ya existe")
    category = Category(user_id=user.id, name=name, scope=payload.scope, kind=payload.kind)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@app.patch("/api/categories/{category_id}", response_model=CategoryOut)
def rename_category(category_id: int, payload: CategoryUpdate, user: User = Depends(current_user), db: Session = Depends(get_db)) -> Category:
    category = db.scalar(select(Category).where(Category.id == category_id, Category.user_id == user.id))
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    name = payload.name.strip()
    exists = db.scalar(_category_query(user.id, category.scope, category.kind).where(Category.name.ilike(name), Category.id != category.id))
    if exists:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Esa categoría ya existe")
    old_name = category.name
    category.name = name
    if category.scope == "finance":
        affected_transactions = db.scalars(select(Transaction).where(Transaction.user_id == user.id, Transaction.category == old_name, Transaction.kind == category.kind)).all()
        for transaction in affected_transactions:
            transaction.category = name
    elif category.scope == "shopping":
        affected_items = db.scalars(select(ShoppingItem).where(ShoppingItem.user_id == user.id, ShoppingItem.category == old_name)).all()
        for item in affected_items:
            item.category = name
    else:
        affected_tasks = db.scalars(select(Task).where(Task.user_id == user.id, Task.category == old_name)).all()
        for task in affected_tasks:
            task.category = name
        affected_events = db.scalars(select(Event).where(Event.user_id == user.id, Event.type == old_name)).all()
        for event in affected_events:
            event.type = name
    db.commit()
    db.refresh(category)
    return category


@app.delete("/api/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(category_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)) -> None:
    category = db.scalar(select(Category).where(Category.id == category_id, Category.user_id == user.id))
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    if category.scope == "finance":
        affected_transactions = db.scalars(select(Transaction).where(Transaction.user_id == user.id, Transaction.category == category.name, Transaction.kind == category.kind)).all()
        for transaction in affected_transactions:
            transaction.category = None
    elif category.scope == "shopping":
        affected_items = db.scalars(select(ShoppingItem).where(ShoppingItem.user_id == user.id, ShoppingItem.category == category.name)).all()
        for item in affected_items:
            item.category = None
    else:
        affected_tasks = db.scalars(select(Task).where(Task.user_id == user.id, Task.category == category.name)).all()
        for task in affected_tasks:
            task.category = None
        affected_events = db.scalars(select(Event).where(Event.user_id == user.id, Event.type == category.name)).all()
        for event in affected_events:
            event.type = None
    db.delete(category)
    db.commit()


@app.post("/api/habits", response_model=HabitOut, status_code=status.HTTP_201_CREATED)
def create_habit(payload: HabitCreate, user: User = Depends(current_user), db: Session = Depends(get_db)) -> HabitOut:
    habit = Habit(user_id=user.id, name=payload.name.strip(), target=payload.target, unit=payload.unit.strip())
    db.add(habit)
    db.commit()
    db.refresh(habit)
    return _build_habit_out(db, habit, date_type.today())


@app.patch("/api/habits/{habit_id}", response_model=HabitOut)
def update_habit(habit_id: int, payload: HabitUpdate, user: User = Depends(current_user), db: Session = Depends(get_db)) -> HabitOut:
    habit = db.scalar(select(Habit).where(Habit.id == habit_id, Habit.user_id == user.id))
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(habit, field, value)
    db.commit()
    db.refresh(habit)
    return _build_habit_out(db, habit, date_type.today())


@app.get("/api/habits/{habit_id}/logs", response_model=list[HabitLogOut])
def list_habit_logs(habit_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)) -> list[HabitLog]:
    habit = db.scalar(select(Habit).where(Habit.id == habit_id, Habit.user_id == user.id))
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    return db.scalars(select(HabitLog).where(HabitLog.habit_id == habit_id).order_by(HabitLog.log_date)).all()


@app.put("/api/habits/{habit_id}/logs/{log_date}", response_model=HabitOut)
def set_habit_log(habit_id: int, log_date: date_type, payload: HabitLogUpdate, user: User = Depends(current_user), db: Session = Depends(get_db)) -> HabitOut:
    habit = db.scalar(select(Habit).where(Habit.id == habit_id, Habit.user_id == user.id))
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    if log_date > date_type.today():
        raise HTTPException(status_code=400, detail="No se pueden registrar días futuros")
    if log_date < habit.created_at.date():
        raise HTTPException(status_code=400, detail="No se pueden registrar días previos a la creación del hábito")
    count = min(max(payload.count, 0), habit.target)
    log = db.scalar(select(HabitLog).where(HabitLog.habit_id == habit_id, HabitLog.log_date == log_date))
    if not log:
        log = HabitLog(user_id=user.id, habit_id=habit_id, log_date=log_date, count=count)
        db.add(log)
    else:
        log.count = count
    db.commit()
    return _build_habit_out(db, habit, date_type.today())


@app.get("/api/habits/overview", response_model=list[HabitOverviewOut])
def habits_overview(days: int = 14, user: User = Depends(current_user), db: Session = Depends(get_db)) -> list[HabitOverviewOut]:
    today = date_type.today()
    start = today - timedelta(days=days - 1)
    habit_rows = db.scalars(select(Habit).where(Habit.user_id == user.id)).all()
    logs = db.scalars(select(HabitLog).where(HabitLog.user_id == user.id, HabitLog.log_date >= start, HabitLog.log_date <= today)).all()
    by_day: dict[date_type, dict[int, int]] = defaultdict(dict)
    for log in logs:
        by_day[log.log_date][log.habit_id] = log.count
    result = []
    for offset in range(days):
        day = start + timedelta(days=offset)
        active_habits = [habit for habit in habit_rows if habit.created_at.date() <= day]
        completed = sum(1 for habit in active_habits if by_day.get(day, {}).get(habit.id, 0) >= habit.target)
        result.append(HabitOverviewOut(log_date=day, completed=completed, total=len(active_habits)))
    return result


@app.delete("/api/habits/{habit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_habit(habit_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)) -> None:
    habit = db.scalar(select(Habit).where(Habit.id == habit_id, Habit.user_id == user.id))
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    db.delete(habit)
    db.commit()


@app.get("/api/shopping-items", response_model=list[ShoppingItemOut])
def list_shopping_items(user: User = Depends(current_user), db: Session = Depends(get_db)) -> list[ShoppingItem]:
    return db.scalars(select(ShoppingItem).where(ShoppingItem.user_id == user.id).order_by(ShoppingItem.name)).all()


@app.post("/api/shopping-items", response_model=ShoppingItemOut, status_code=status.HTTP_201_CREATED)
def create_shopping_item(payload: ShoppingItemCreate, user: User = Depends(current_user), db: Session = Depends(get_db)) -> ShoppingItem:
    item = ShoppingItem(user_id=user.id, name=payload.name.strip(), category=payload.category, stock=payload.stock, force_list=payload.force_list)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@app.patch("/api/shopping-items/{item_id}", response_model=ShoppingItemOut)
def update_shopping_item(item_id: int, payload: ShoppingItemUpdate, user: User = Depends(current_user), db: Session = Depends(get_db)) -> ShoppingItem:
    item = db.scalar(select(ShoppingItem).where(ShoppingItem.id == item_id, ShoppingItem.user_id == user.id))
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item


@app.delete("/api/shopping-items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_shopping_item(item_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)) -> None:
    item = db.scalar(select(ShoppingItem).where(ShoppingItem.id == item_id, ShoppingItem.user_id == user.id))
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
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


@app.post("/api/savings", response_model=SavingEntryOut, status_code=status.HTTP_201_CREATED)
def create_saving(payload: SavingEntryCreate, user: User = Depends(current_user), db: Session = Depends(get_db)) -> SavingEntryOut:
    saving = SavingEntry(user_id=user.id, name=payload.name.strip(), start_amount=payload.start_amount, month=date_type.today().strftime("%Y-%m"))
    db.add(saving)
    db.commit()
    db.refresh(saving)
    return _build_saving_out(db, saving)


@app.patch("/api/savings/{saving_id}", response_model=SavingEntryOut)
def update_saving(saving_id: int, payload: SavingEntryUpdate, user: User = Depends(current_user), db: Session = Depends(get_db)) -> SavingEntryOut:
    saving = db.scalar(select(SavingEntry).where(SavingEntry.id == saving_id, SavingEntry.user_id == user.id))
    if not saving:
        raise HTTPException(status_code=404, detail="Saving not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(saving, field, value)
    db.commit()
    db.refresh(saving)
    return _build_saving_out(db, saving)


@app.delete("/api/savings/{saving_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_saving(saving_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)) -> None:
    saving = db.scalar(select(SavingEntry).where(SavingEntry.id == saving_id, SavingEntry.user_id == user.id))
    if not saving:
        raise HTTPException(status_code=404, detail="Saving not found")
    db.delete(saving)
    db.commit()


@app.get("/api/savings/{saving_id}/movements", response_model=list[SavingMovementOut])
def list_saving_movements(saving_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)) -> list[SavingMovement]:
    saving = db.scalar(select(SavingEntry).where(SavingEntry.id == saving_id, SavingEntry.user_id == user.id))
    if not saving:
        raise HTTPException(status_code=404, detail="Saving not found")
    return db.scalars(select(SavingMovement).where(SavingMovement.saving_id == saving_id).order_by(SavingMovement.movement_date.desc(), SavingMovement.id.desc())).all()


@app.post("/api/savings/{saving_id}/movements", response_model=SavingEntryOut, status_code=status.HTTP_201_CREATED)
def create_saving_movement(saving_id: int, payload: SavingMovementCreate, user: User = Depends(current_user), db: Session = Depends(get_db)) -> SavingEntryOut:
    saving = db.scalar(select(SavingEntry).where(SavingEntry.id == saving_id, SavingEntry.user_id == user.id))
    if not saving:
        raise HTTPException(status_code=404, detail="Saving not found")
    if payload.amount == 0:
        raise HTTPException(status_code=400, detail="El monto no puede ser cero")
    movement = SavingMovement(user_id=user.id, saving_id=saving_id, amount=payload.amount, movement_date=payload.movement_date)
    db.add(movement)
    db.commit()
    return _build_saving_out(db, saving)


@app.delete("/api/savings/{saving_id}/movements/{movement_id}", response_model=SavingEntryOut)
def delete_saving_movement(saving_id: int, movement_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)) -> SavingEntryOut:
    saving = db.scalar(select(SavingEntry).where(SavingEntry.id == saving_id, SavingEntry.user_id == user.id))
    if not saving:
        raise HTTPException(status_code=404, detail="Saving not found")
    movement = db.scalar(select(SavingMovement).where(SavingMovement.id == movement_id, SavingMovement.saving_id == saving_id))
    if not movement:
        raise HTTPException(status_code=404, detail="Movement not found")
    db.delete(movement)
    db.commit()
    return _build_saving_out(db, saving)


@app.get("/api/events", response_model=list[EventOut])
def list_events(user: User = Depends(current_user), db: Session = Depends(get_db)) -> list[Event]:
    return db.scalars(select(Event).where(Event.user_id == user.id).order_by(Event.event_date, Event.time)).all()


@app.post("/api/events", response_model=list[EventOut], status_code=status.HTTP_201_CREATED)
def create_event(payload: EventCreatePayload, user: User = Depends(current_user), db: Session = Depends(get_db)) -> list[Event]:
    data = payload.model_dump(exclude={"repeat_days"})
    occurrences = _repeat_occurrence_dates(payload.event_date, payload.repeat_days)
    events = [Event(user_id=user.id, **{**data, "event_date": occurrence}) for occurrence in occurrences]
    db.add_all(events)
    db.commit()
    for event in events:
        db.refresh(event)
    return events


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
    start = today - timedelta(days=(today.weekday() + 1) % 7)
    end = start + timedelta(days=6)
    rows = db.scalars(select(PomodoroLog).where(PomodoroLog.user_id == user.id, PomodoroLog.log_date >= start, PomodoroLog.log_date <= end)).all()
    by_date = {row.log_date: row.seconds for row in rows}
    return [PomodoroLogOut(date=start + timedelta(days=offset), seconds=by_date.get(start + timedelta(days=offset), 0)) for offset in range(7)]


@app.post("/api/pomodoro/log", response_model=PomodoroLogOut)
def log_pomodoro_seconds(payload: PomodoroLogCreate, user: User = Depends(current_user), db: Session = Depends(get_db)) -> PomodoroLogOut:
    today = date_type.today()
    row = db.scalar(select(PomodoroLog).where(PomodoroLog.user_id == user.id, PomodoroLog.log_date == today))
    if not row:
        row = PomodoroLog(user_id=user.id, log_date=today, seconds=0)
        db.add(row)
    row.seconds += payload.seconds
    db.commit()
    db.refresh(row)
    return PomodoroLogOut(date=row.log_date, seconds=row.seconds)


PERIOD_ANCHOR_DAY = 11


def _shift_month(value: date_type, delta: int = 1) -> date_type:
    total = value.month - 1 + delta
    year = value.year + total // 12
    month = total % 12 + 1
    day = min(value.day, calendar.monthrange(year, month)[1])
    return value.replace(year=year, month=month, day=day)


def _period_end(start: date_type) -> date_type:
    shifted = _shift_month(start)
    return shifted.replace(day=PERIOD_ANCHOR_DAY - 1)


def _period_start_for(reference: date_type) -> date_type:
    if reference.day >= PERIOD_ANCHOR_DAY:
        return reference.replace(day=PERIOD_ANCHOR_DAY)
    return _shift_month(reference, -1).replace(day=PERIOD_ANCHOR_DAY)


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


def _resolve_period(db: Session, user: User, reference: date_type) -> PayPeriod:
    existing = db.scalar(select(PayPeriod).where(PayPeriod.user_id == user.id, PayPeriod.start <= reference, PayPeriod.end >= reference))
    if existing:
        return existing
    start = _period_start_for(reference)
    last = db.scalar(select(PayPeriod).where(PayPeriod.user_id == user.id).order_by(PayPeriod.start.desc()))
    rate = last.rate if last else 0.0
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


def _build_hours_state(db: Session, user: User, reference: date_type) -> HoursStateOut:
    period = _resolve_period(db, user, reference)
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
def get_hours(reference_date: date_type | None = None, user: User = Depends(current_user), db: Session = Depends(get_db)) -> HoursStateOut:
    return _build_hours_state(db, user, reference_date or date_type.today())


@app.patch("/api/hours/period", response_model=HoursStateOut)
def update_period_rate(payload: RateUpdate, user: User = Depends(current_user), db: Session = Depends(get_db)) -> HoursStateOut:
    reference = payload.reference_date or date_type.today()
    period = _resolve_period(db, user, reference)
    period.rate = payload.rate
    db.commit()
    return _build_hours_state(db, user, reference)


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
def create_payment(payload: HourPaymentRequest, user: User = Depends(current_user), db: Session = Depends(get_db)) -> HoursStateOut:
    reference = payload.reference_date or date_type.today()
    period = _resolve_period(db, user, reference)
    payment = HourPayment(user_id=user.id, period_id=period.id, amount=payload.amount, method=payload.method, payment_date=payload.payment_date)
    db.add(payment)
    db.commit()
    return _build_hours_state(db, user, reference)


@app.delete("/api/hours/payments/{payment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_payment(payment_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)) -> None:
    payment = db.scalar(select(HourPayment).where(HourPayment.id == payment_id, HourPayment.user_id == user.id))
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    db.delete(payment)
    db.commit()


@app.post("/api/hours/close", response_model=HoursStateOut)
def close_period(payload: CloseRequest, user: User = Depends(current_user), db: Session = Depends(get_db)) -> HoursStateOut:
    reference = payload.reference_date or date_type.today()
    period = _resolve_period(db, user, reference)
    if period.closed:
        raise HTTPException(status_code=400, detail="Period already closed")
    _close_period(db, period, user)
    db.commit()
    return _build_hours_state(db, user, date_type.today())


@app.post("/api/hours/periods/{period_id}/reopen", response_model=HoursStateOut)
def reopen_period(period_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)) -> HoursStateOut:
    target = db.scalar(select(PayPeriod).where(PayPeriod.id == period_id, PayPeriod.user_id == user.id))
    if not target:
        raise HTTPException(status_code=404, detail="Period not found")
    target.closed = False
    db.commit()
    return _build_hours_state(db, user, target.start)


@app.delete("/api/hours/periods/{period_id}", response_model=HoursStateOut)
def delete_period(period_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)) -> HoursStateOut:
    period = db.scalar(select(PayPeriod).where(PayPeriod.id == period_id, PayPeriod.user_id == user.id))
    if not period:
        raise HTTPException(status_code=404, detail="Period not found")
    if not period.closed:
        raise HTTPException(status_code=400, detail="Only closed periods can be deleted")
    entries = db.scalars(select(HourEntry).where(HourEntry.user_id == user.id, HourEntry.entry_date >= period.start, HourEntry.entry_date <= period.end)).all()
    for entry in entries:
        db.delete(entry)
    db.delete(period)
    db.commit()
    return _build_hours_state(db, user)


@app.get("/api/hours/periods/{period_id}/payments", response_model=list[HourPaymentOut])
def get_period_payments(period_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)) -> list[HourPayment]:
    period = db.scalar(select(PayPeriod).where(PayPeriod.id == period_id, PayPeriod.user_id == user.id))
    if not period:
        raise HTTPException(status_code=404, detail="Period not found")
    return db.scalars(select(HourPayment).where(HourPayment.period_id == period.id).order_by(HourPayment.payment_date)).all()
