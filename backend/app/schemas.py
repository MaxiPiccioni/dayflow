from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=120)
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: EmailStr
    full_name: str


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    due_date: date = Field(default_factory=date.today)
    time: str = Field(default="09:00", pattern=r"^\d{2}:\d{2}$")
    category: str = Field(default="Personal", min_length=1, max_length=50)
    notes: str | None = Field(default=None, max_length=2000)
    priority: str = Field(default="Media", pattern="^(Alta|Media|Baja)$")


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    due_date: date | None = None
    time: str | None = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    category: str | None = Field(default=None, min_length=1, max_length=50)
    notes: str | None = Field(default=None, max_length=2000)
    priority: str | None = Field(default=None, pattern="^(Alta|Media|Baja)$")


class TaskOut(TaskCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    completed: bool


class HabitCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    target: int = Field(default=1, ge=1, le=50)
    unit: str = Field(default="veces", min_length=1, max_length=30)


class HabitUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    target: int | None = Field(default=None, ge=1, le=50)
    unit: str | None = Field(default=None, min_length=1, max_length=30)
    count: int | None = Field(default=None, ge=0)


class HabitOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    target: int
    unit: str
    count: int
    progress: int
    history: list[int]


class TransactionCreate(BaseModel):
    description: str = Field(min_length=1, max_length=200)
    amount: float = Field(gt=0)
    kind: str = Field(pattern="^(income|expense)$")
    category: str = Field(default="General", min_length=1, max_length=50)


class TransactionOut(TransactionCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime


class DashboardOut(BaseModel):
    tasks: list[TaskOut]
    habits: list[HabitOut]
    transactions: list[TransactionOut]


class EventCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    event_date: date
    time: str = Field(default="09:00", pattern=r"^\d{2}:\d{2}$")
    type: str = Field(default="Personal", max_length=30)
    color: str = Field(default="#d9f99d", max_length=10)


class EventUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    event_date: date | None = None
    time: str | None = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    type: str | None = Field(default=None, max_length=30)
    color: str | None = Field(default=None, max_length=10)


class EventOut(EventCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    done: bool


class PomodoroOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    repetitions: int
    work: int
    break_time: int


class PomodoroUpdate(BaseModel):
    repetitions: int | None = Field(default=None, ge=0, le=20)
    work: int | None = Field(default=None, ge=0, le=180)
    break_time: int | None = Field(default=None, ge=0, le=60)


class HourEntryCreate(BaseModel):
    entry_date: date
    from_time: str = Field(default="09:00", pattern=r"^\d{2}:\d{2}$")
    to_time: str = Field(default="17:00", pattern=r"^\d{2}:\d{2}$")
    hours: float | None = Field(default=None, ge=0)
    extra: bool = False
    holiday: bool = False


class HourEntryOut(HourEntryCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int


class HourPaymentCreate(BaseModel):
    amount: float = Field(gt=0)
    method: str = Field(default="Transferencia", max_length=30)
    payment_date: date


class HourPaymentRequest(HourPaymentCreate):
    reference_date: date | None = None


class HourPaymentOut(HourPaymentCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int


class PayPeriodOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    start: date
    end: date
    rate: float
    closed: bool


class ClosedPeriodOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    start: date
    end: date
    rate: float
    total_hours: float
    expected: float
    paid: float
    balance: float


class RateUpdate(BaseModel):
    rate: float = Field(ge=0)
    reference_date: date | None = None


class CloseRequest(BaseModel):
    reference_date: date | None = None


class HoursStateOut(BaseModel):
    period: PayPeriodOut
    entries: list[HourEntryOut]
    payments: list[HourPaymentOut]
    closed_periods: list[ClosedPeriodOut]


class PomodoroLogOut(BaseModel):
    date: date
    minutes: int


class PomodoroLogCreate(BaseModel):
    minutes: int = Field(ge=1, le=60)
