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


class HabitUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    progress: int | None = Field(default=None, ge=0, le=100)
    history: list[int] | None = None


class HabitOut(HabitCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
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
    work_minutes: int
    balance: float
