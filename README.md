# BizOS AI — AI-Powered Business Assistant Platform

> An AI-powered SaaS platform where businesses can deploy AI employees for customer support, sales, revenue analytics, finance insights, and operations management.

![BizOS AI](https://img.shields.io/badge/BizOS-AI-blue?style=for-the-badge) ![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js) ![FastAPI](https://img.shields.io/badge/FastAPI-Python-green?style=for-the-badge&logo=fastapi) ![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?style=for-the-badge&logo=mongodb)

## Features

- 🎧 **Customer Support Agent** — Answers FAQs, searches knowledge base, creates tickets
- 💼 **Sales Agent** — Product recommendations, lead capture, consultative selling
- 📊 **Revenue Analytics Agent** — CSV/Excel analysis, revenue trends, growth insights
- 💰 **Finance Insights Agent** — Expense analysis, budget management, cost savings
- 🏢 **Operations Manager Agent** — Cross-functional executive summaries
- 📚 **Knowledge Base** — Upload PDFs, DOCX, TXT; import websites (crawl up to 20 pages)
- 💬 **ChatGPT-style UI** — Real-time streaming, markdown, source citations
- 🎫 **Ticket System** — Create, track, and manage support tickets
- 👥 **Lead Management** — Search, filter, and track sales leads
- 📈 **Analytics Dashboard** — Charts for agent usage, conversations, tickets, leads
- 🔐 **Multi-tenant** — Isolated workspaces per company with role-based access

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, Recharts |
| Backend | Python 3.12+, FastAPI, Pydantic, LangChain |
| Database | MongoDB Atlas |
| AI | Gemini API (Google) |
| Vector Search | MongoDB Atlas Vector Search |
| Storage | Cloudinary |
| Deployment | Vercel (Frontend), Render (Backend) |

## Project Structure

```
BizOS AI/
├── frontend/                # Next.js 15 App Router
│   ├── app/
│   │   ├── (auth)/         # Login, Register
│   │   ├── (dashboard)/    # Dashboard, Chat, Tickets, Leads, Analytics
│   │   └── onboarding/     # Company setup
│   ├── components/         # Reusable UI components
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API service layer
│   ├── types/              # TypeScript types
│   └── lib/                # Utilities
│
├── backend/                 # FastAPI Backend
│   ├── app/
│   │   ├── api/            # Route handlers
│   │   ├── agents/         # 5 AI agents
│   │   ├── models/         # MongoDB document models
│   │   ├── schemas/        # Pydantic validation schemas
│   │   ├── services/       # Business logic
│   │   ├── rag/            # Retrieval-Augmented Generation
│   │   ├── vectorstore/    # Vector search integration
│   │   ├── middleware/     # Auth, RBAC
│   │   └── main.py         # FastAPI app entry point
│   └── tests/              # Pytest test suite
```

## Installation & Setup

### Prerequisites

- Python 3.12+
- Node.js 18+
- MongoDB Atlas account (free M0 cluster)
- Gemini API key (Google AI Studio)
- Cloudinary account (free tier)

### 1. Clone & Setup Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Create .env from template
cp .env.example .env
# Edit .env with your actual credentials
```

### 2. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# The .env.local is already configured for local dev
```

### 3. Environment Variables

#### Backend (`.env`)

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `DATABASE_NAME` | Database name (default: `bizos_ai`) |
| `JWT_SECRET_KEY` | Secret for JWT token signing |
| `GEMINI_API_KEY` | Google Gemini API key |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `FRONTEND_URL` | Frontend URL for CORS |

#### Frontend (`.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |

### 4. MongoDB Atlas Setup

1. Create a free M0 cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create a database user
3. Whitelist your IP (or `0.0.0.0/0` for development)
4. Copy the connection string to `MONGODB_URI`
5. Create a Vector Search index named `vector_index` on the `document_chunks` collection:

```json
{
  "type": "vectorSearch",
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    }
  ]
}
```

### 5. Gemini API Setup

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create an API key
3. Copy it to `GEMINI_API_KEY`

## Running Locally

### Start Backend

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

### Start Frontend

```bash
cd frontend
npm run dev
```

Visit **http://localhost:3000** to use the app.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/companies/` | Create company |
| GET | `/api/companies/me` | Get user's company |
| GET | `/api/documents/` | List documents |
| POST | `/api/documents/upload` | Upload document |
| DELETE | `/api/documents/{id}` | Delete document |
| POST | `/api/knowledge/crawl` | Crawl website |
| POST | `/api/chat/{agent}` | Chat with agent |
| POST | `/api/chat/{agent}/stream` | Chat with SSE streaming |
| GET | `/api/chat/conversations` | List conversations |
| GET | `/api/tickets/` | List tickets |
| POST | `/api/tickets/` | Create ticket |
| PATCH | `/api/tickets/{id}` | Update ticket |
| GET | `/api/leads/` | List leads |
| POST | `/api/leads/` | Create lead |
| GET | `/api/analytics/overview` | Get stats overview |
| GET | `/api/analytics/charts` | Get chart data |

## Deployment

### Deploy Backend to Render

1. Push your code to GitHub
2. Create a new Web Service on [Render](https://render.com)
3. Connect your GitHub repo
4. Set the root directory to `backend`
5. Build command: `pip install -r requirements.txt`
6. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
7. Add all environment variables from `.env`

### Deploy Frontend to Vercel

1. Import your GitHub repo on [Vercel](https://vercel.com)
2. Set the root directory to `frontend`
3. Set `NEXT_PUBLIC_API_URL` to your Render backend URL
4. Deploy

## Testing

```bash
cd backend
pytest tests/ -v
```

## License

MIT
