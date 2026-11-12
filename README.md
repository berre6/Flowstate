# Flowstate

**Flowstate** is a task management REST API built with Python and FastAPI. It provides user authentication and personal task management through a secure, user-specific API.

> The current implementation focuses on the backend. A React frontend is planned as the next development stage.

## Features

- User registration and login
- JWT-based authentication
- Password hashing with Argon2
- Create, read, update, and delete tasks
- User-specific task access and ownership validation
- Task priorities: `low`, `medium`, and `high`
- Task completion tracking
- Input validation with Pydantic
- SQLAlchemy ORM and SQLite database
- Database migrations with Alembic
- Cascade deletion of a user's tasks when their account is deleted
- Automated tests with pytest

## Tech Stack

| Technology | Purpose |
|---|---|
| Python | Main programming language |
| FastAPI | REST API framework |
| SQLAlchemy | Database ORM |
| SQLite | Database |
| Alembic | Database migrations |
| Pydantic | Data validation |
| JWT | Authentication |
| Argon2 | Password hashing |
| Pytest | Automated testing |

## Project Structure

```text
Flowstate/
├── backend/
│   ├── migrations/
│   │   └── versions/
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   ├── database.py
│   ├── security.py
│   ├── test_main.py
│   ├── requirements.txt
│   ├── alembic.ini
│   └── .env.example
├── .gitignore
└── README.md
```

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/berre6/Flowstate.git
cd Flowstate
```

### 2. Navigate to the backend directory

```bash
cd backend
```

### 3. Create and activate a virtual environment

```bash
python -m venv .venv
```

On Windows:

```powershell
.venv\Scripts\Activate.ps1
```

On macOS/Linux:

```bash
source .venv/bin/activate
```

### 4. Install dependencies

```bash
python -m pip install -r requirements.txt
```

### 5. Configure environment variables

Create a `.env` file using the example configuration:

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Configure the following variables in your `.env` file:

```env
JWT_SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///./flowstate.db
```

Replace the placeholder secret with a secure, randomly generated value. Never commit your `.env` file.

### 6. Apply database migrations

```bash
python -m alembic upgrade head
```

### 7. Start the development server

```bash
python -m uvicorn main:app --reload
```

The API will be available at:

`http://127.0.0.1:8000`

Interactive API documentation:

`http://127.0.0.1:8000/docs`

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Root endpoint |
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Authenticate and receive an access token |
| GET | `/users/me` | Get the current user's profile |
| DELETE | `/users/me` | Delete the current user's account |
| POST | `/tasks` | Create a task |
| GET | `/tasks` | List the current user's tasks |
| PATCH | `/tasks/{task_id}` | Update a task |
| DELETE | `/tasks/{task_id}` | Delete a task |

Protected endpoints require a valid JWT access token.

## Running Tests

From the `backend` directory, run:

```bash
python -m pytest -v
```

## Development Status

- [x] Backend API implementation
- [x] User authentication and authorization
- [x] Task CRUD operations
- [x] Database migrations
- [x] Automated tests
- [ ] React frontend
- [ ] Frontend-backend integration

## License

No license has been specified yet.
