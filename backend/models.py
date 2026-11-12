from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
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
    passive_deletes=True
)


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    completed = Column(Boolean, default=False, nullable=False)
    priority = Column(String, default="medium", nullable=False)

    user_id = Column(
    Integer,
    ForeignKey("users.id", ondelete="CASCADE"),
    nullable=False
)
    owner = relationship("User", back_populates="tasks")