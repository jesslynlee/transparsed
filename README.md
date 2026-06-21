# Transparsed

Turn your bank statement PDFs into spending insights.

## Features

- **PDF Statement Parsing** — Upload credit card/bank statements and automatically extract transactions using template-based parsing
- **Auto-Categorization** — Transactions are matched to categories (Dining, Groceries, Transportation, etc.) using configurable keyword rules
- **Review & Edit** — Review parsed transactions before committing. Edit categories, descriptions, and amounts. Manual transactions are also supported
- **Dashboard** — Interactive charts showing spending by category, monthly trends, and top merchants. Click any chart element to drill down into individual transactions
- **Settings** — Manage categories and keyword rules. 

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Tailwind CSS 4, Recharts, Vite |
| Backend | Flask, SQLite |
| PDF Parsing | pdfplumber |
| Containerization | Docker, docker-compose |

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js 22+

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

Runs on http://localhost:5001

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on http://localhost:5173

### Docker

```bash
docker compose up --build
```

Frontend on http://localhost:3000, API on http://localhost:5001.

## Project Structure

```
transparsed/
├── backend/
│   ├── app.py                  # Flask app entry point
│   ├── config.py               # App configuration
│   ├── database/
│   │   ├── connection.py       # SQLite connection management
│   │   └── schema.sql          # Table definitions
│   ├── models/                 # Data access layer
│   ├── parsers/
│   │   ├── templates/          # Bank-specific parsing configs (JSON)
│   │   ├── template_parser.py  # PDF extraction engine
│   │   └── detector.py         # Auto-detect bank from PDF
│   ├── routes/                 # API endpoints
│   ├── services/               # Business logic
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/              # Upload, Review, Dashboard, Settings
│   │   ├── components/ui/      # Reusable UI components
│   │   └── api/client.js       # API client
│   ├── nginx.conf              # Production reverse proxy config
│   └── Dockerfile
└── docker-compose.yml
```

## Adding a New Bank Statement

1. Upload a statement and note the column positions using a PDF viewer
2. Create a new template JSON in `backend/parsers/templates/` following the existing format (see `hsbc_credit.json`)
3. Define detection keywords, column x-coordinates, date format, and extraction patterns
