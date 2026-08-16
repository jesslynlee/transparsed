# TransParsed

Built out of personal necessity after one too many questionable spending decisions.
This is my attempt to fix that because if I can't stop spending, I can at least pretend it's for the data. 
Runs on a local LLM, so my bad financial decisions stay private.

## What it Does
- **PDF Statement Parsing** — Upload credit card/bank statements and automatically extract transactions using a vision-language model
- **Auto-Categorization** — Transactions are matched to categories (Dining, Groceries, Transportation, etc.) using configurable keyword rules
- **Review & Edit** — Review parsed transactions before committing. Edit categories, descriptions, and amounts. Manual transactions are also supported
- **Dashboard** — Interactive charts showing spending by category, monthly trends, and top merchants. Click any chart element to drill down into individual transactions
- **Settings** — Manage account, categories and keyword rules. 

## Tech Stack

| Layer         | Tech |
|---------------|---|
| Frontend      | React 19, Tailwind CSS 4, Recharts, Vite |
| Backend       | Flask, PostgreSQL |
| PDF Processing | PyMuPDF |
| LLM | Ollama |
| Containerization | Docker |

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js 22+
- Ollama

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
│   ├── app.py                       # Flask app entry point
│   ├── config.py                    # App configuration
│   ├── database/
│   │   ├── connection.py            # PostgreSQL connection management
│   │   └── schema.sql               # Table definitions
│   ├── models/                      # Data access layer
│   ├── parsers/
│   │   ├── llm_client.py            
│   │   ├── llm_statement_parser.py  
│   │   ├── pdf_renderer.py          
│   │   └── prompts.py               
│   ├── routes/                      # API endpoints
│   ├── services/                    # Business logic
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/                   # Upload, Review, Dashboard, Settings
│   │   ├── components/ui/           # Reusable UI components
│   │   └── api/client.js            # API client
│   ├── nginx.conf                   # Production reverse proxy config
│   └── Dockerfile
└── docker-compose.yml
```