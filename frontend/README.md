# 🌿 Flowstate

**Flowstate** is a productivity and task management web application designed to help users organize their work, track progress, and build consistent habits through a calm and minimal interface.

## ✨ Features

- **Dashboard:** Overview of tasks, progress, and productivity statistics.
- **Pad Management:** Create, edit, organize, and manage Pads.
- **Bud Tracking:** Break tasks into smaller steps and track their completion.
- **Progress Tracking:** Monitor task completion and overall progress.
- **Categories & Priorities:** Organize tasks with categories and priority levels.
- **Settings:** Customize themes, interface density, and animations.
- **Authentication:** User account and session management.
- **Persistent Storage:** Store application data using a relational database.

## 🛠️ Tech Stack

### Frontend
- React
- Vite
- JavaScript
- CSS

### Backend
- Python
- FastAPI
- SQLAlchemy
- SQLite
- Alembic

### Testing
- Pytest

## 📁 Project Structure

```text
Flowstate/
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── security.py
│   ├── migrations/
│   └── test_main.py
│
├── frontend/
│   ├── src/
│   └── package.json
│
├── .gitignore
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js and npm

### 1. Clone the repository

```bash
git clone https://github.com/berre6/Flowstate
cd Flowstate
```

### 2. Set up the backend

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment:

**Windows PowerShell**
```powershell
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the backend:

```bash
python -m uvicorn main:app --reload
```

Backend API documentation:

`http://127.0.0.1:8000/docs`

### 3. Set up the frontend

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL provided by Vite.

## 🧪 Running Tests

From the backend directory:

```bash
pytest -v
```

## 🔐 Environment Variables

Create a `.env` file in the backend directory and configure the required environment variables.

Do not commit secret keys or environment files to version control.

## 📌 Project Status

Flowstate is an ongoing personal software development project focused on full-stack application development, API design, database management, and user experience.

## 👩‍💻 Author

**Berre Yılmaz**