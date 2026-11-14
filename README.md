# Flowstate

Flowstate is a full-stack productivity and task management application designed to help users organize their work, manage tasks, and track progress through a calm and minimal interface.

## Features

- User registration and authentication
- JWT-based authentication
- Password hashing with Argon2
- Dashboard with productivity statistics
- Create, edit, and delete Pads
- Break tasks into smaller steps called Buds
- Track task and subtask completion
- Task categories and priorities
- Progress tracking
- Customizable appearance settings
- Botanical and Lavender themes
- Adjustable interface density
- Animation preferences
- User-specific data management

## Tech Stack

### Frontend
- React 19
- Vite
- JavaScript
- CSS

### Backend
- Python
- FastAPI
- SQLAlchemy
- SQLite
- Alembic
- Pydantic
- PyJWT
- Argon2

### Testing
- Pytest
- HTTPX
- ESLint

## Project Structure

```text
Flowstate/
├── backend/
│   ├── migrations/
│   │   └── versions/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── security.py
│   ├── test_main.py
│   ├── requirements.txt
│   ├── alembic.ini
│   └── .env.example
│
├── frontend/
│   ├── public/
│   ├── src/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

- Python 3.10 or later
- Node.js and npm

### 1. Clone the repository

```bash
git clone https://github.com/berre6/Flowstate.git
cd Flowstate
```

### 2. Set up the backend

Open a terminal in the project root:

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment.

**Windows PowerShell:**

```powershell
.\.venv\Scripts\Activate.ps1
```

**macOS / Linux:**

```bash
source .venv/bin/activate
```

Install the dependencies:

```bash
python -m pip install -r requirements.txt
```

### 3. Configure environment variables

Create a local environment file from the example:

**Windows PowerShell:**

```powershell
Copy-Item .env.example .env
```

Configure the required values in `backend/.env`. Use a secure secret key and the appropriate database URL.

Never commit `.env` files or secret credentials.

### 4. Initialize the database

From the backend directory:

```bash
python -m alembic upgrade head
```

### 5. Start the backend server

```bash
python -m uvicorn main:app --reload
```

The backend runs at:

`http://127.0.0.1:8000`

Interactive API documentation is available at:

`http://127.0.0.1:8000/docs`

### 6. Set up the frontend

Open a second terminal:

```bash
cd Flowstate/frontend
npm install
npm run dev
```

Open the local URL provided by Vite.

## Running Tests

From the backend directory, with the virtual environment activated:

```bash
python -m pytest -v
```

## Code Quality

Run the frontend linter:

```bash
cd frontend
npm run lint
```

Create a production build:

```bash
npm run build
```

## Project Status

Flowstate is a full-stack application with an implemented React frontend and FastAPI backend.

The project includes task management, authentication, database migrations, automated backend tests, and customizable interface settings.

## Author

**Berre Yilmaz**