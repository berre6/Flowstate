from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Date
from sqlalchemy.orm import relationship

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    tasks = relationship(
        "Task",
        back_populates="owner",
        cascade="all, delete",
        passive_deletes=True,
    )


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    completed = Column(Boolean, default=False, nullable=False)
    priority = Column(String, default="medium", nullable=False)
    category = Column(String, nullable=True)
    deadline = Column(Date, nullable=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    owner = relationship("User", back_populates="tasks")

    buds = relationship(
        "Bud",
        back_populates="task",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class Bud(Base):
    __tablename__ = "buds"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    completed = Column(Boolean, default=False, nullable=False)

    task_id = Column(
        Integer,
        ForeignKey("tasks.id", ondelete="CASCADE"),
        nullable=False,
    )

    task = relationship("Task", back_populates="buds")