import uuid
from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Index, Integer, Numeric, String, Text, UniqueConstraint, false, func, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .clock import today, utcnow
from .database import Base


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(120))
    password_hash: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
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
    subject_requirements: Mapped[list["SubjectRequirement"]] = relationship(cascade="all, delete-orphan")
    folder_links: Mapped[list["FolderLink"]] = relationship(cascade="all, delete-orphan")


class Task(Base):
    __tablename__ = "tasks"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    due_date: Mapped[date] = mapped_column(Date, default=today, index=True)
    time: Mapped[str] = mapped_column(String(5), default="09:00")
    category: Mapped[str | None] = mapped_column(String(50), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    priority: Mapped[str | None] = mapped_column(String(20), nullable=True)
    # Materia de Facultad a la que pertenece la tarea (opcional). Si se borra la materia queda en NULL.
    subject_id: Mapped[int | None] = mapped_column(ForeignKey("subjects.id", ondelete="SET NULL", name="fk_tasks_subject_id_subjects"), nullable=True, index=True)


class Category(Base):
    __tablename__ = "categories"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(String(50))
    scope: Mapped[str] = mapped_column(String(20), default="agenda")
    kind: Mapped[str | None] = mapped_column(String(20), nullable=True)


# Un nombre por usuario, ámbito y tipo, sin distinguir mayúsculas (kind NULL cuenta como ""; en SQL los NULL nunca chocan).
Index("uq_categories_user_scope_kind_name", Category.user_id, Category.scope, func.coalesce(Category.kind, ""), func.lower(Category.name), unique=True)


class Habit(Base):
    __tablename__ = "habits"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(String(100))
    target: Mapped[int] = mapped_column(Integer, default=1)
    unit: Mapped[str] = mapped_column(String(30), default="veces")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    logs: Mapped[list["HabitLog"]] = relationship(cascade="all, delete-orphan")


class HabitLog(Base):
    __tablename__ = "habit_logs"
    __table_args__ = (Index("uq_habit_logs_habit_id_log_date", "habit_id", "log_date", unique=True),)
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
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    kind: Mapped[str] = mapped_column(String(20))
    category: Mapped[str | None] = mapped_column(String(50), nullable=True)
    method: Mapped[str] = mapped_column(String(20), default="Efectivo")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class SavingEntry(Base):
    __tablename__ = "saving_entries"
    __table_args__ = (
        Index("uq_saving_entries_user_id_name_month", "user_id", "name", "month", unique=True),
        Index("uq_saving_entries_user_id_series_id_month", "user_id", "series_id", "month", unique=True),
    )
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    # Todas las filas mensuales de un mismo ahorro comparten series_id: así renombrar o borrar el ahorro del mes actual
    # alcanza a todo el ahorro y el traspaso al mes siguiente no lo revive ni lo duplica.
    series_id: Mapped[str] = mapped_column(String(36), index=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(100))
    start_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"))
    month: Mapped[str] = mapped_column(String(7), index=True)
    movements: Mapped[list["SavingMovement"]] = relationship(cascade="all, delete-orphan")


class SavingMovement(Base):
    __tablename__ = "saving_movements"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    saving_id: Mapped[int] = mapped_column(ForeignKey("saving_entries.id"), index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    movement_date: Mapped[date] = mapped_column(Date, default=today)


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
    __table_args__ = (Index("uq_pay_periods_user_id_start", "user_id", "start", unique=True),)
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    start: Mapped[date] = mapped_column(Date)
    end: Mapped[date] = mapped_column(Date)
    rate: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"))
    closed: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    total_hours: Mapped[Decimal] = mapped_column(Numeric(6, 2), default=Decimal("0.00"))
    expected: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"))
    # paid y balance ya no son fuente de verdad: se calculan en vivo desde hour_payments
    # porque un período cerrado sigue recibiendo pagos. Se quitan en una migración posterior.
    paid: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"))
    balance: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"))
    payments: Mapped[list["HourPayment"]] = relationship(cascade="all, delete-orphan")


class HourEntry(Base):
    __tablename__ = "hour_entries"
    __table_args__ = (Index("uq_hour_entries_user_id_entry_date", "user_id", "entry_date", unique=True),)
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    entry_date: Mapped[date] = mapped_column(Date, index=True)
    from_time: Mapped[str] = mapped_column(String(5), default="09:00")
    to_time: Mapped[str] = mapped_column(String(5), default="17:00")
    hours: Mapped[Decimal | None] = mapped_column(Numeric(6, 2), nullable=True)
    extra: Mapped[bool] = mapped_column(Boolean, default=False)
    holiday: Mapped[bool] = mapped_column(Boolean, default=False)


class HourPayment(Base):
    __tablename__ = "hour_payments"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    period_id: Mapped[int] = mapped_column(ForeignKey("pay_periods.id"), index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    method: Mapped[str] = mapped_column(String(30), default="Transferencia")
    payment_date: Mapped[date] = mapped_column(Date)


class PomodoroLog(Base):
    __tablename__ = "pomodoro_logs"
    __table_args__ = (
        # Una fila por día y materia; los NULL no chocan entre sí, por eso "sin materia" tiene su propio índice parcial.
        Index(
            "uq_pomodoro_logs_user_id_log_date_subject",
            "user_id", "log_date", "subject_id",
            unique=True,
            sqlite_where=text("subject_id IS NOT NULL"),
            postgresql_where=text("subject_id IS NOT NULL"),
        ),
        Index("uq_pomodoro_logs_user_id_log_date_no_subject", "user_id", "log_date", unique=True, sqlite_where=text("subject_id IS NULL"), postgresql_where=text("subject_id IS NULL")),
    )
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    log_date: Mapped[date] = mapped_column(Date, index=True)
    seconds: Mapped[int] = mapped_column(Integer, default=0)
    # Materia en la que se estudió (opcional). Hay una fila por día y por materia (o sin materia).
    subject_id: Mapped[int | None] = mapped_column(ForeignKey("subjects.id", ondelete="SET NULL", name="fk_pomodoro_logs_subject_id_subjects"), nullable=True, index=True)


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
    __table_args__ = (
        UniqueConstraint("user_id", "name", name="uq_subjects_user_id_name"),
        # Los NULL no chocan entre sí: varias materias pueden no tener código.
        UniqueConstraint("user_id", "code", name="uq_subjects_user_id_code"),
    )
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", name="fk_subjects_user_id_users"), index=True)
    name: Mapped[str] = mapped_column(String(120))
    # Número de la materia en el plan de estudios (opcional).
    code: Mapped[str | None] = mapped_column(String(10), nullable=True)
    # Optativa: suma créditos al aprobarse. credits solo tiene valor si elective es true.
    elective: Mapped[bool] = mapped_column(Boolean, default=False, server_default=false())
    credits: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # A (anual), 1C, 2C, 1C-2C o 2C-1C.
    modality: Mapped[str | None] = mapped_column(String(10), nullable=True)
    weekly_hours: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # Anotaciones rápidas del detalle (links, horarios, palabras sueltas).
    notes: Mapped[str] = mapped_column(Text, default="", server_default="")
    # Link a la carpeta de Drive (o cualquier sitio) de la materia. Solo http/https (ver routers/faculty.py).
    drive_url: Mapped[str | None] = mapped_column(String(2000), nullable=True)
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
    # Correlativas que necesita esta materia. Las filas donde es la requerida se borran en el router.
    requirements: Mapped[list["SubjectRequirement"]] = relationship(cascade="all, delete-orphan", foreign_keys="SubjectRequirement.subject_id")


class SubjectFolder(Base):
    __tablename__ = "subject_folders"
    __table_args__ = (UniqueConstraint("subject_id", "name", name="uq_subject_folders_subject_id_name"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", name="fk_subject_folders_user_id_users"), index=True)
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id", name="fk_subject_folders_subject_id_subjects", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(60))
    position: Mapped[int] = mapped_column(Integer, default=0)
    # Link a la carpeta de Drive de esta parte (FINAL, PRÁCTICO...).
    drive_url: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    # Archivos de la carpeta (links). El ORM los borra al borrar la carpeta: SQLite no aplica el ON DELETE CASCADE.
    links: Mapped[list["FolderLink"]] = relationship(cascade="all, delete-orphan", order_by="FolderLink.position")


class SubjectRequirement(Base):
    """Correlativa: para cursar subject_id hace falta required_id cursada o aprobada."""

    __tablename__ = "subject_requirements"
    __table_args__ = (UniqueConstraint("subject_id", "required_id", name="uq_subject_requirements_subject_id_required_id"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", name="fk_subject_requirements_user_id_users"), index=True)
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id", name="fk_subject_requirements_subject_id_subjects", ondelete="CASCADE"), index=True)
    required_id: Mapped[int] = mapped_column(ForeignKey("subjects.id", name="fk_subject_requirements_required_id_subjects", ondelete="CASCADE"), index=True)
    # "cursada" o "aprobada".
    kind: Mapped[str] = mapped_column(String(10))


class FolderLink(Base):
    """Archivo de una carpeta de materia: un link (Drive u otro sitio) que se abre en otra pestaña."""

    __tablename__ = "folder_links"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", name="fk_folder_links_user_id_users"), index=True)
    folder_id: Mapped[int] = mapped_column(ForeignKey("subject_folders.id", name="fk_folder_links_folder_id_subject_folders", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(120))
    url: Mapped[str] = mapped_column(String(2000))
    position: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utc_now)
