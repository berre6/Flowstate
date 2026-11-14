
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from typing import Literal
from datetime import date

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    priority: Literal["low", "medium", "high"] = "medium"
    category: str | None = Field(default=None, max_length=100)
    deadline: date | None = None


class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None
    completed: bool
    priority: str
    category: str | None
    deadline: date | None


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    completed: bool | None = None
    priority: Literal["low", "medium", "high"] | None = None
    category: str | None = Field(default=None, max_length=100)
    deadline: date | None = None

class BudCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)


class BudResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    completed: bool
    task_id: int


class BudUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    completed: bool | None = None