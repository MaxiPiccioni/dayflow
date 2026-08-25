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
    priority: str = Field(default="medium", pattern="^(low|medium|high)$")


class TaskOut(TaskCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    completed: bool


class HabitCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class HabitOut(HabitCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    streak: int
    checked_today: bool


class TransactionCreate(BaseModel):
    description: str = Field(min_length=1, max_length=200)
    amount: float = Field(gt=0)
    kind: str = Field(pattern="^(income|expense)$")


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
