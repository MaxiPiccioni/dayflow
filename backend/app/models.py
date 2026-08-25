from datetime import date, datetime

from sqlalchemy import JSON, Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text
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
    habits: Mapped[list["Habit"]] = relationship(cascade="all, delete-orphan")
    transactions: Mapped[list["Transaction"]] = relationship(cascade="all, delete-orphan")
    events: Mapped[list["Event"]] = relationship(cascade="all, delete-orphan")
    pay_periods: Mapped[list["PayPeriod"]] = relationship(cascade="all, delete-orphan")
    hour_entries: Mapped[list["HourEntry"]] = relationship(cascade="all, delete-orphan")
    hour_payments: Mapped[list["HourPayment"]] = relationship(cascade="all, delete-orphan")
    pomodoro_logs: Mapped[list["PomodoroLog"]] = relationship(cascade="all, delete-orphan")


class Task(Base):
    __tablename__ = "tasks"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    due_date: Mapped[date] = mapped_column(Date, default=date.today, index=True)
    time: Mapped[str] = mapped_column(String(5), default="09:00")
    category: Mapped[str] = mapped_column(String(50), default="Personal")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    priority: Mapped[str] = mapped_column(String(20), default="medium")


class Habit(Base):
    __tablename__ = "habits"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(String(100))
    target: Mapped[int] = mapped_column(Integer, default=1)
    unit: Mapped[str] = mapped_column(String(30), default="veces")
    count: Mapped[int] = mapped_column(Integer, default=0)
    history: Mapped[list[int]] = mapped_column(JSON, default=list)
    updated_on: Mapped[date | None] = mapped_column(Date, nullable=True)

    @property
    def progress(self) -> int:
        return round(self.count / self.target * 100) if self.target else 0


class Transaction(Base):
    __tablename__ = "transactions"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    description: Mapped[str] = mapped_column(String(200))
    amount: Mapped[float] = mapped_column(Float)
    kind: Mapped[str] = mapped_column(String(20))
    category: Mapped[str] = mapped_column(String(50), default="General")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Event(Base):
    __tablename__ = "events"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    event_date: Mapped[date] = mapped_column(Date, index=True)
    time: Mapped[str] = mapped_column(String(5), default="09:00")
    type: Mapped[str] = mapped_column(String(30), default="Personal")
    color: Mapped[str] = mapped_column(String(10), default="#d9f99d")
    done: Mapped[bool] = mapped_column(Boolean, default=False)


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
    minutes: Mapped[int] = mapped_column(Integer, default=0)
