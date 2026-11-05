from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(120))
    password_hash: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    tasks: Mapped[list["Task"]] = relationship(cascade="all, delete-orphan")
    categories: Mapped[list["Category"]] = relationship(cascade="all, delete-orphan")
    habits: Mapped[list["Habit"]] = relationship(cascade="all, delete-orphan")
    habit_logs: Mapped[list["HabitLog"]] = relationship(cascade="all, delete-orphan")
    transactions: Mapped[list["Transaction"]] = relationship(cascade="all, delete-orphan")
    savings: Mapped[list["SavingEntry"]] = relationship(cascade="all, delete-orphan")
    saving_movements: Mapped[list["SavingMovement"]] = relationship(cascade="all, delete-orphan")
    events: Mapped[list["Event"]] = relationship(cascade="all, delete-orphan")
    pay_periods: Mapped[list["PayPeriod"]] = relationship(cascade="all, delete-orphan")
    hour_entries: Mapped[list["HourEntry"]] = relationship(cascade="all, delete-orphan")
    hour_payments: Mapped[list["HourPayment"]] = relationship(cascade="all, delete-orphan")
    pomodoro_logs: Mapped[list["PomodoroLog"]] = relationship(cascade="all, delete-orphan")
    shopping_items: Mapped[list["ShoppingItem"]] = relationship(cascade="all, delete-orphan")
    subjects: Mapped[list["Subject"]] = relationship(cascade="all, delete-orphan")
    subject_folders: Mapped[list["SubjectFolder"]] = relationship(cascade="all, delete-orphan")


class Task(Base):
    __tablename__ = "tasks"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    due_date: Mapped[date] = mapped_column(Date, default=date.today, index=True)
    time: Mapped[str] = mapped_column(String(5), default="09:00")
    category: Mapped[str | None] = mapped_column(String(50), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    priority: Mapped[str | None] = mapped_column(String(20), nullable=True)


class Category(Base):
    __tablename__ = "categories"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(String(50))
    scope: Mapped[str] = mapped_column(String(20), default="agenda")
    kind: Mapped[str | None] = mapped_column(String(20), nullable=True)


class Habit(Base):
    __tablename__ = "habits"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(String(100))
    target: Mapped[int] = mapped_column(Integer, default=1)
    unit: Mapped[str] = mapped_column(String(30), default="veces")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    logs: Mapped[list["HabitLog"]] = relationship(cascade="all, delete-orphan")


class HabitLog(Base):
    __tablename__ = "habit_logs"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    habit_id: Mapped[int] = mapped_column(ForeignKey("habits.id"), index=True)
    log_date: Mapped[date] = mapped_column(Date, index=True)
    count: Mapped[int] = mapped_column(Integer, default=0)


class Transaction(Base):
    __tablename__ = "transactions"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    description: Mapped[str] = mapped_column(String(200))
    amount: Mapped[float] = mapped_column(Float)
    kind: Mapped[str] = mapped_column(String(20))
    category: Mapped[str | None] = mapped_column(String(50), nullable=True)
    method: Mapped[str] = mapped_column(String(20), default="Efectivo")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class SavingEntry(Base):
    __tablename__ = "saving_entries"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(String(100))
    start_amount: Mapped[float] = mapped_column(Float, default=0)
    month: Mapped[str] = mapped_column(String(7), index=True)
    movements: Mapped[list["SavingMovement"]] = relationship(cascade="all, delete-orphan")


class SavingMovement(Base):
    __tablename__ = "saving_movements"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    saving_id: Mapped[int] = mapped_column(ForeignKey("saving_entries.id"), index=True)
    amount: Mapped[float] = mapped_column(Float)
    movement_date: Mapped[date] = mapped_column(Date, default=date.today)


class Event(Base):
    __tablename__ = "events"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    event_date: Mapped[date] = mapped_column(Date, index=True)
    time: Mapped[str] = mapped_column(String(5), default="09:00")
    type: Mapped[str | None] = mapped_column(String(30), nullable=True)
    color: Mapped[str] = mapped_column(String(10), default="#d9f99d")
    done: Mapped[bool] = mapped_column(Boolean, default=False)
    important: Mapped[bool] = mapped_column(Boolean, default=False)


class PomodoroSettings(Base):
    __tablename__ = "pomodoro_settings"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, index=True)
    repetitions: Mapped[int] = mapped_column(Integer, default=0)
    work: Mapped[int] = mapped_column(Integer, default=0)
    break_time: Mapped[int] = mapped_column(Integer, default=0)


class PayPeriod(Base):
    __tablename__ = "pay_periods"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    start: Mapped[date] = mapped_column(Date)
    end: Mapped[date] = mapped_column(Date)
    rate: Mapped[float] = mapped_column(Float, default=0)
    closed: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    total_hours: Mapped[float] = mapped_column(Float, default=0)
    expected: Mapped[float] = mapped_column(Float, default=0)
    # paid y balance ya no son fuente de verdad: se calculan en vivo desde hour_payments
    # porque un período cerrado sigue recibiendo pagos. Se quitan en una migración posterior.
    paid: Mapped[float] = mapped_column(Float, default=0)
    balance: Mapped[float] = mapped_column(Float, default=0)
    payments: Mapped[list["HourPayment"]] = relationship(cascade="all, delete-orphan")


class HourEntry(Base):
    __tablename__ = "hour_entries"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    entry_date: Mapped[date] = mapped_column(Date, index=True)
    from_time: Mapped[str] = mapped_column(String(5), default="09:00")
    to_time: Mapped[str] = mapped_column(String(5), default="17:00")
    hours: Mapped[float | None] = mapped_column(Float, nullable=True)
    extra: Mapped[bool] = mapped_column(Boolean, default=False)
    holiday: Mapped[bool] = mapped_column(Boolean, default=False)


class HourPayment(Base):
    __tablename__ = "hour_payments"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    period_id: Mapped[int] = mapped_column(ForeignKey("pay_periods.id"), index=True)
    amount: Mapped[float] = mapped_column(Float)
    method: Mapped[str] = mapped_column(String(30), default="Transferencia")
    payment_date: Mapped[date] = mapped_column(Date)


class PomodoroLog(Base):
    __tablename__ = "pomodoro_logs"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    log_date: Mapped[date] = mapped_column(Date, index=True)
    seconds: Mapped[int] = mapped_column(Integer, default=0)


class ShoppingItem(Base):
    __tablename__ = "shopping_items"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(String(100))
    category: Mapped[str | None] = mapped_column(String(50), nullable=True)
    stock: Mapped[int] = mapped_column(Integer, default=0)
    force_list: Mapped[bool] = mapped_column(Boolean, default=False)
    buy_quantity: Mapped[int] = mapped_column(Integer, default=1)


# --- Facultad ---


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Subject(Base):
    __tablename__ = "subjects"
    __table_args__ = (UniqueConstraint("user_id", "name", name="uq_subjects_user_id_name"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", name="fk_subjects_user_id_users"), index=True)
    name: Mapped[str] = mapped_column(String(120))
    # Nivel de cursado (1° año, 2° año...).
    level: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(30), default="por_cursar")
    # Nota final: solo para estados aprobados (ver app/routers/faculty.py).
    grade: Mapped[Decimal | None] = mapped_column(Numeric(4, 2), nullable=True)
    # Claves de ícono y color: el frontend las traduce y tiene valores de reserva.
    icon: Mapped[str] = mapped_column(String(40), default="book")
    color: Mapped[str] = mapped_column(String(20), default="lime")
    # Orden dentro del nivel.
    position: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utc_now)
    # El ORM borra las carpetas al borrar la materia (SQLite no aplica el ON DELETE CASCADE de la FK).
    folders: Mapped[list["SubjectFolder"]] = relationship(cascade="all, delete-orphan", order_by="SubjectFolder.position")


class SubjectFolder(Base):
    __tablename__ = "subject_folders"
    __table_args__ = (UniqueConstraint("subject_id", "name", name="uq_subject_folders_subject_id_name"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", name="fk_subject_folders_user_id_users"), index=True)
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id", name="fk_subject_folders_subject_id_subjects", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(60))
    position: Mapped[int] = mapped_column(Integer, default=0)
