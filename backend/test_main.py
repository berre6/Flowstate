
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from models import User, Task
from main import app, get_db
from database import Base


TEST_DATABASE_URL = "sqlite://"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

@event.listens_for(test_engine, "connect")
def enable_foreign_keys(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=test_engine,
)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()



@pytest.fixture
def client():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    app.dependency_overrides[get_db] = override_get_db

    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.clear()
        Base.metadata.drop_all(bind=test_engine)



def test_homepage_returns_welcome_message(client):
    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to Flowstate"}


def test_create_task_without_authentication_returns_401(client):
    response = client.post(
        "/tasks",
        json={
            "title": "Test task",
            "description": "A task created during testing",
            "priority": "high",
        },
    )

    assert response.status_code == 401


def test_register_and_login_returns_access_token(client):
    client.post(
        "/auth/register",
        json={
            "email": "testuser@example.com",
            "password": "TestPassword123!",
        },
    )

    login_response = client.post(
        "/auth/login",
        data={
            "username": "testuser@example.com",
            "password": "TestPassword123!",
        },
    )

    assert login_response.status_code == 200

    token_data = login_response.json()

    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"


def test_login_token_accesses_current_user(client):
    client.post(
        "/auth/register",
        json={
            "email": "currentuser@example.com",
            "password": "TestPassword123!",
        },
    )

    login_response = client.post(
        "/auth/login",
        data={
            "username": "currentuser@example.com",
            "password": "TestPassword123!",
        },
    )

    token = login_response.json()["access_token"]

    response = client.get(
        "/users/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.json()["email"] == "currentuser@example.com"


def test_user_cannot_update_another_users_task(client):
    client.post(
        "/auth/register",
        json={
            "email": "owner@example.com",
            "password": "TestPassword123!",
        },
    )

    owner_login = client.post(
        "/auth/login",
        data={
            "username": "owner@example.com",
            "password": "TestPassword123!",
        },
    )
    owner_token = owner_login.json()["access_token"]

    task_response = client.post(
        "/tasks",
        json={
            "title": "Private task",
            "description": "This belongs to the owner",
            "priority": "high",
        },
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    task_id = task_response.json()["id"]

    client.post(
        "/auth/register",
        json={
            "email": "otheruser@example.com",
            "password": "TestPassword123!",
        },
    )

    other_login = client.post(
        "/auth/login",
        data={
            "username": "otheruser@example.com",
            "password": "TestPassword123!",
        },
    )
    other_token = other_login.json()["access_token"]

    response = client.patch(
        f"/tasks/{task_id}",
        json={"completed": True},
        headers={"Authorization": f"Bearer {other_token}"},
    )

    assert response.status_code == 404


def test_user_cannot_delete_another_users_task(client):
    client.post(
        "/auth/register",
        json={
            "email": "deleteowner@example.com",
            "password": "TestPassword123!",
        },
    )

    owner_login = client.post(
        "/auth/login",
        data={
            "username": "deleteowner@example.com",
            "password": "TestPassword123!",
        },
    )
    owner_token = owner_login.json()["access_token"]

    task_response = client.post(
        "/tasks",
        json={"title": "Do not delete", "priority": "medium"},
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    task_id = task_response.json()["id"]

    client.post(
        "/auth/register",
        json={
            "email": "deleteother@example.com",
            "password": "TestPassword123!",
        },
    )

    other_login = client.post(
        "/auth/login",
        data={
            "username": "deleteother@example.com",
            "password": "TestPassword123!",
        },
    )
    other_token = other_login.json()["access_token"]

    response = client.delete(
        f"/tasks/{task_id}",
        headers={"Authorization": f"Bearer {other_token}"},
    )

    assert response.status_code == 404


def test_user_sees_only_their_own_tasks(client):
    client.post(
        "/auth/register",
        json={
            "email": "listowner@example.com",
            "password": "TestPassword123!",
        },
    )

    owner_login = client.post(
        "/auth/login",
        data={
            "username": "listowner@example.com",
            "password": "TestPassword123!",
        },
    )
    owner_token = owner_login.json()["access_token"]

    client.post(
        "/tasks",
        json={"title": "Owner private task", "priority": "high"},
        headers={"Authorization": f"Bearer {owner_token}"},
    )

    client.post(
        "/auth/register",
        json={
            "email": "listother@example.com",
            "password": "TestPassword123!",
        },
    )

    other_login = client.post(
        "/auth/login",
        data={
            "username": "listother@example.com",
            "password": "TestPassword123!",
        },
    )
    other_token = other_login.json()["access_token"]

    response = client.get(
        "/tasks",
        headers={"Authorization": f"Bearer {other_token}"},
    )

    assert response.status_code == 200
    assert response.json() == []



def test_user_can_update_their_own_task(client):
    client.post(
        "/auth/register",
        json={
            "email": "updateown@example.com",
            "password": "TestPassword123!",
        },
    )

    login_response = client.post(
        "/auth/login",
        data={
            "username": "updateown@example.com",
            "password": "TestPassword123!",
        },
    )
    token = login_response.json()["access_token"]

    task_response = client.post(
        "/tasks",
        json={"title": "Original title", "priority": "medium"},
        headers={"Authorization": f"Bearer {token}"},
    )
    task_id = task_response.json()["id"]

    response = client.patch(
        f"/tasks/{task_id}",
        json={"title": "Updated title", "completed": True},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.json()["title"] == "Updated title"
    assert response.json()["completed"] is True



def test_user_can_delete_their_own_task(client):
    client.post(
        "/auth/register",
        json={
            "email": "deleteown@example.com",
            "password": "TestPassword123!",
        },
    )

    login_response = client.post(
        "/auth/login",
        data={
            "username": "deleteown@example.com",
            "password": "TestPassword123!",
        },
    )
    token = login_response.json()["access_token"]

    task_response = client.post(
        "/tasks",
        json={"title": "Task to delete", "priority": "medium"},
        headers={"Authorization": f"Bearer {token}"},
    )
    task_id = task_response.json()["id"]

    response = client.delete(
        f"/tasks/{task_id}",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 204

    get_response = client.get(
        "/tasks",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert get_response.status_code == 200
    assert all(
        task["id"] != task_id
        for task in get_response.json()
    )



def test_create_task_rejects_empty_title(client):
    client.post(
        "/auth/register",
        json={
            "email": "validation@example.com",
            "password": "TestPassword123!",
        },
    )

    login_response = client.post(
        "/auth/login",
        data={
            "username": "validation@example.com",
            "password": "TestPassword123!",
        },
    )
    token = login_response.json()["access_token"]

    response = client.post(
        "/tasks",
        json={"title": ""},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 422


def test_create_task_rejects_invalid_priority(client):
    client.post(
        "/auth/register",
        json={
            "email": "priority@example.com",
            "password": "TestPassword123!",
        },
    )

    login_response = client.post(
        "/auth/login",
        data={
            "username": "priority@example.com",
            "password": "TestPassword123!",
        },
    )
    token = login_response.json()["access_token"]

    response = client.post(
        "/tasks",
        json={
            "title": "Test task",
            "priority": "urgent",
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 422



def test_register_rejects_duplicate_email(client):
    user_data = {
        "email": "duplicate@example.com",
        "password": "TestPassword123!",
    }

    first_response = client.post(
        "/auth/register",
        json=user_data,
    )

    second_response = client.post(
        "/auth/register",
        json=user_data,
    )

    assert first_response.status_code == 201
    assert second_response.status_code == 409


def test_login_rejects_wrong_password(client):
    client.post(
        "/auth/register",
        json={
            "email": "wrongpassword@example.com",
            "password": "CorrectPassword123!",
        },
    )

    response = client.post(
        "/auth/login",
        data={
            "username": "wrongpassword@example.com",
            "password": "WrongPassword123!",
        },
    )

    assert response.status_code == 401



def test_login_rejects_unknown_email(client):
    response = client.post(
        "/auth/login",
        data={
            "username": "unknown@example.com",
            "password": "SomePassword123!",
        },
    )

    assert response.status_code == 401


def test_invalid_token_cannot_access_current_user(client):
    response = client.get(
        "/users/me",
        headers={
            "Authorization": "Bearer invalid.token.value",
        },
    )

    assert response.status_code == 401



def test_update_nonexistent_task_returns_404(client):
    client.post(
        "/auth/register",
        json={
            "email": "missingtask@example.com",
            "password": "TestPassword123!",
        },
    )

    login_response = client.post(
        "/auth/login",
        data={
            "username": "missingtask@example.com",
            "password": "TestPassword123!",
        },
    )
    token = login_response.json()["access_token"]

    response = client.patch(
        "/tasks/999999",
        json={"completed": True},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 404



def test_delete_nonexistent_task_returns_404(client):
    client.post(
        "/auth/register",
        json={
            "email": "missingdelete@example.com",
            "password": "TestPassword123!",
        },
    )

    login_response = client.post(
        "/auth/login",
        data={
            "username": "missingdelete@example.com",
            "password": "TestPassword123!",
        },
    )
    token = login_response.json()["access_token"]

    response = client.delete(
        "/tasks/999999",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 404


def test_deleting_user_also_deletes_their_tasks(client):
    db = TestingSessionLocal()

    try:
        user = User(
            email="cascade@example.com",
            hashed_password="test"
        )

        task1 = Task(title="First task", priority="medium")
        task2 = Task(title="Second task", priority="high")

        user.tasks.extend([task1, task2])

        db.add(user)
        db.commit()

        user_id = user.id

        assert db.query(Task).filter(
            Task.user_id == user_id
        ).count() == 2

        db.delete(user)
        db.commit()

        assert db.query(Task).filter(
            Task.user_id == user_id
        ).count() == 0

    finally:
        db.close()



def test_user_can_delete_their_account_and_tasks(client):
    # Kullanıcı oluştur
    register_response = client.post(
        "/auth/register",
        json={
            "email": "accountdelete@example.com",
            "password": "TestPassword123!",
        },
    )
    assert register_response.status_code == 201

    # Giriş yap
    login_response = client.post(
        "/auth/login",
        data={
            "username": "accountdelete@example.com",
            "password": "TestPassword123!",
        },
    )
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # İki görev oluştur
    for title in ["First task", "Second task"]:
        response = client.post(
            "/tasks",
            json={"title": title},
            headers=headers,
        )
        assert response.status_code == 201

    # Hesabı sil
    delete_response = client.delete(
        "/users/me",
        headers=headers,
    )

    assert delete_response.status_code == 204

    # Eski token artık çalışmamalı
    user_response = client.get(
        "/users/me",
        headers=headers,
    )
    assert user_response.status_code == 401

    # Veritabanında kullanıcı ve görevleri kalmamalı
    db = TestingSessionLocal()

    try:
        user = db.query(User).filter(
            User.email == "accountdelete@example.com"
        ).first()

        assert user is None

        tasks = db.query(Task).all()
        assert tasks == []

    finally:
        db.close()

def test_delete_account_without_authentication_returns_401(client):
    response = client.delete("/users/me")
    assert response.status_code == 401
