# CRM Backend

Backend API for CRM system built with FastAPI.

## Features

- User authentication with JWT tokens
- Role-based access control (Admin, Director, Senior, Employee)
- Company management with director assignment
- Declaration management with grouping and vehicle tracking
- Certificate request workflow between companies
- Task management with status history
- Document and folder management with access control
- Client management with access permissions
- Partnership system between companies
- Notification system
- Admin panel with statistics

## Technology Stack

- **Framework**: FastAPI
- **Database**: PostgreSQL with asyncpg
- **ORM**: SQLAlchemy 2.0 (async)
- **Migrations**: Alembic
- **Authentication**: JWT with python-jose
- **Password Hashing**: bcrypt via passlib
- **Validation**: Pydantic v2

## Requirements

- Python 3.11+
- PostgreSQL 15+

## Setup

### 1. Create virtual environment

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Create PostgreSQL database

```sql
CREATE DATABASE crm_db;
```

Or using psql:
```bash
psql -U postgres -c "CREATE DATABASE crm_db;"
```

### 4. Configure environment

```bash
copy .env.example .env  # Windows
cp .env.example .env    # Linux/Mac
```

Edit `.env` with your settings:

```env
# Required
DATABASE_URL=postgresql+asyncpg://postgres:your_password@localhost:5432/crm_db
SECRET_KEY=your-secret-key-here

# Optional
DEBUG=true
FRONTEND_URL=http://localhost:5173
ADMIN_LOGIN=admin
ADMIN_PASSWORD=your_admin_password
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
ADMIN_TELEGRAM_CHAT_ID=your_telegram_chat_id
```

### 5. Run database migrations

```bash
# Create initial migration (first time only)
alembic revision --autogenerate -m "Initial migration"

# Apply migrations
alembic upgrade head
```

### 6. Start the server

```bash
# Development
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Documentation

Once the server is running:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## Admin Access

1. Start the server - an admin code will be printed to the console
2. Navigate to the admin login page on the frontend
3. Use the admin credentials and the generated code

> **Note**: Admin code expires after 24 hours. Restart the server to generate a new code.

## Project Structure

```
backend/
├── alembic/                 # Database migrations
│   ├── versions/           # Migration files
│   └── env.py              # Alembic configuration
├── app/
│   ├── api/
│   │   ├── v1/             # API v1 endpoints
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── companies.py
│   │   │   ├── declarations.py
│   │   │   ├── certificates.py
│   │   │   ├── tasks.py
│   │   │   ├── documents.py
│   │   │   ├── clients.py
│   │   │   ├── partnerships.py
│   │   │   ├── requests.py
│   │   │   ├── notifications.py
│   │   │   └── dashboard.py
│   │   └── deps.py         # Dependencies (auth, etc.)
│   ├── models/             # SQLAlchemy models
│   ├── schemas/            # Pydantic schemas
│   ├── services/           # Business logic
│   ├── utils/              # Utilities
│   ├── config.py           # Configuration
│   ├── database.py         # Database connection
│   └── main.py             # FastAPI application
├── telegram_bot/           # Telegram bot (optional)
├── tests/                  # Test files
├── uploads/                # File uploads
├── .env.example
├── alembic.ini
├── requirements.txt
└── README.md
```

## Telegram Bot (Optional)

To enable Telegram notifications:

1. Create a bot with @BotFather
2. Get your chat ID by messaging @userinfobot
3. Set environment variables in `.env`:
   ```env
   TELEGRAM_BOT_TOKEN=your_bot_token
   ADMIN_TELEGRAM_CHAT_ID=your_chat_id
   ```

## Running Tests

```bash
pytest
pytest --cov=app  # with coverage
```

## License

MIT

