
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
import jwt
from fastapi.middleware.cors import CORSMiddleware

from schemas import BudCreate, BudResponse, BudUpdate

from database import Base, SessionLocal, engine
import models
from schemas import (
    UserCreate,
    UserResponse,
    TokenResponse,
    TaskCreate,
    TaskResponse,
    TaskUpdate,
)
from security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)




app = FastAPI(title="Flowstate API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Kimlik doğrulaması yapılamadı.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_access_token(token)
        user_id = int(payload.get("sub"))
    except (jwt.InvalidTokenError, TypeError, ValueError):
        raise credentials_exception

    user = db.query(models.User).filter(
        models.User.id == user_id
    ).first()

    if user is None:
        raise credentials_exception

    return user


@app.get("/users/me", response_model=UserResponse)
def read_current_user(
    current_user: models.User = Depends(get_current_user),
):
    return current_user


@app.delete("/users/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_current_user(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        db.delete(current_user)
        db.commit()
    except Exception:
        db.rollback()
        raise

    return None


@app.get("/")
def home():
    return {"message": "Welcome to Flowstate"}


@app.post(
    "/auth/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
):
    user = models.User(
        email=str(user_data.email).lower(),
        hashed_password=hash_password(user_data.password),
    )

    db.add(user)

    try:
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Bu e-posta adresi zaten kayıtlı.",
        )
    except Exception:
        db.rollback()
        raise

    return user


@app.post("/auth/login", response_model=TokenResponse)
def login_user(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = (
        db.query(models.User)
        .filter(
            models.User.email == str(form_data.username).lower()
        )
        .first()
    )

    if user is None or not verify_password(
        form_data.password,
        user.hashed_password,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-posta veya parola hatalı.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(user.id)

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


@app.post(
    "/tasks",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_task(
    task_data: TaskCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = models.Task(
        title=task_data.title,
        description=task_data.description,
        priority=task_data.priority,
        user_id=current_user.id,
        category=task_data.category,
        deadline=task_data.deadline,
    )

    db.add(task)

    try:
        db.commit()
        db.refresh(task)
    except Exception:
        db.rollback()
        raise

    return task


@app.get("/tasks", response_model=list[TaskResponse])
def get_tasks(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tasks = (
        db.query(models.Task)
        .filter(models.Task.user_id == current_user.id)
        .all()
    )

    return tasks


@app.patch("/tasks/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    task_data: TaskUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = (
        db.query(models.Task)
        .filter(
            models.Task.id == task_id,
            models.Task.user_id == current_user.id,
        )
        .first()
    )

    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Görev bulunamadı.",
        )

    update_data = task_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(task, field, value)

    try:
        db.commit()
        db.refresh(task)
    except Exception:
        db.rollback()
        raise

    return task


@app.delete(
    "/tasks/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_task(
    task_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = (
        db.query(models.Task)
        .filter(
            models.Task.id == task_id,
            models.Task.user_id == current_user.id,
        )
        .first()
    )

    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Görev bulunamadı.",
        )

    try:
        db.delete(task)
        db.commit()
    except Exception:
        db.rollback()
        raise

    return None


@app.post(
    "/tasks/{task_id}/buds",
    response_model=BudResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_bud(
    task_id: int,
    bud_data: BudCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = db.query(models.Task).filter(
        models.Task.id == task_id,
        models.Task.user_id == current_user.id,
    ).first()

    if task is None:
        raise HTTPException(
            status_code=404,
            detail="Pad bulunamadı.",
        )

    bud = models.Bud(
        title=bud_data.title,
        task_id=task_id,
    )

    db.add(bud)
    db.commit()
    db.refresh(bud)

    return bud


@app.get(
    "/tasks/{task_id}/buds",
    response_model=list[BudResponse],
)
def get_buds(
    task_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = db.query(models.Task).filter(
        models.Task.id == task_id,
        models.Task.user_id == current_user.id,
    ).first()

    if task is None:
        raise HTTPException(status_code=404, detail="Pad bulunamadı.")

    return task.buds


@app.patch("/buds/{bud_id}", response_model=BudResponse)
def update_bud(
    bud_id: int,
    bud_data: BudUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bud = (
        db.query(models.Bud)
        .join(models.Task)
        .filter(
            models.Bud.id == bud_id,
            models.Task.user_id == current_user.id,
        )
        .first()
    )

    if bud is None:
        raise HTTPException(status_code=404, detail="Bud bulunamadı.")

    for field, value in bud_data.model_dump(exclude_unset=True).items():
        setattr(bud, field, value)

    db.commit()
    db.refresh(bud)

    return bud


@app.delete("/buds/{bud_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bud(
    bud_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bud = (
        db.query(models.Bud)
        .join(models.Task)
        .filter(
            models.Bud.id == bud_id,
            models.Task.user_id == current_user.id,
        )
        .first()
    )

    if bud is None:
        raise HTTPException(status_code=404, detail="Bud bulunamadı.")

    db.delete(bud)
    db.commit()

    return None
