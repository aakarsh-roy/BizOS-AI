# BizOS AI — Embeddable AI Chatbot Platform

> A multi-tenant SaaS platform where businesses create, configure, and embed a single AI-powered chatbot on their websites — grounded in their own documents, with optional lead capture and support-ticket actions.

![BizOS AI](https://img.shields.io/badge/BizOS-AI-blue?style=for-the-badge) ![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js) ![FastAPI](https://img.shields.io/badge/FastAPI-Python-green?style=for-the-badge&logo=fastapi) ![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?style=for-the-badge&logo=mongodb)

## Features

- 🤖 **Single configurable chatbot** — name, welcome message, tone, business instructions, and enabled actions per workspace
- 📚 **Knowledge Base (RAG)** — upload PDFs, DOCX, TXT; import websites (crawl up to 20 pages); MongoDB Atlas Vector Search
- 💬 **Streaming chat** — SSE streaming, markdown rendering, live tool-call indicators, source citations
- 🎫 **Support tickets** — the chatbot creates tickets through a validated, tenant-scoped tool
- 👥 **Lead capture** — natural lead qualification, saved to the workspace CRM
- 🔌 **Embeddable widget** — floating launcher, copy-paste snippet, public chatbot ID, origin restrictions, rate-limited public API
- 📈 **Analytics** — conversations, leads, tickets, and usage over time
- 🔐 **Multi-tenant** — JWT auth, workspace-scoped data access on every operation

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, Recharts |
| Backend | Python 3.12+, FastAPI, Pydantic, LangChain |
| Database | MongoDB Atlas |
| Chat LLM | Groq (`openai/gpt-oss-20b`) |
| Embeddings | Google Gemini embeddings (`gemini-embedding-2`, 3072 dims) |
| Vector Search | MongoDB Atlas Vector Search |
| Storage | Cloudinary |
| Deployment | Vercel (Frontend), Render (Backend) |

## Project Structure

```
BizOS AI/
├── frontend/                # Next.js 16 App Router
│   ├── app/
│   │   ├── (auth)/          # Login, Register
│   │   ├── (dashboard)/     # Overview, My Chatbot, Conversations, Knowledge,
│   │   │                    # Leads, Tickets, Analytics, Install
│   │   └── onboarding/      # Company setup
│   ├── components/          # Reusable UI components
│   ├── hooks/               # Custom React hooks
│   ├── public/widget.js     # Embeddable website chat widget
│   ├── services/            # API service layer
│   ├── types/               # TypeScript types
│   └── lib/                 # Utilities
│
├── backend/                 # FastAPI Backend
│   ├── app/
│   │   ├── api/             # Route handlers (auth, chat, chatbot, documents, ...)
│   │   ├── middleware/      # Auth, rate limiting
│   │   ├── schemas/         # Pydantic validation schemas
│   │   ├── services/        # Chatbot orchestration, tools, document processing
│   │   ├── rag/             # Retrieval (chunk retrieval, context formatting)
│   │   ├── vectorstore/     # MongoDB Atlas Vector Search integration
│   │   └── main.py          # FastAPI app entry point
│   └── tests/               # Pytest test suite
```

## Installation & Setup

### Prerequisites

- Python 3.12+
- Node.js 18+
- MongoDB Atlas account (free M0 cluster)
- Groq API key (chat LLM)
- Google AI Studio API key (embeddings)
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

npm install
```

### 3. Environment Variables

#### Backend (`.env`)

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `DATABASE_NAME` | Database name (default: `bizos_ai`) |
| `JWT_SECRET_KEY` | Secret for JWT token signing |
| `GROQ_API_KEY` | Groq API key (chat completions) |
| `GROQ_MODEL` | Groq chat model (default: `openai/gpt-oss-20b`) |
| `GEMINI_API_KEY` | Google Gemini API key (embeddings) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `FRONTEND_URL` | Frontend URL for CORS |

#### Frontend (`.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL (e.g. `https://your-backend.onrender.com/api`) |
| `NEXT_PUBLIC_SITE_URL` | Canonical frontend URL used in the widget embed snippet (e.g. `https://your-app.vercel.app`). Falls back to the current origin. |
| `NEXT_PUBLIC_DEMO_CHATBOT_ID` | Optional public chatbot ID powering the landing-page live demo with a real backend. If unset, the demo runs a built-in script. The same ID also loads the real floating site widget (requires `NEXT_PUBLIC_API_URL`); the widget renders nothing when either is unset. The demo chatbot's allowed origins must be blank or include the landing domain, or widget chats return 403. |

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
      "numDimensions": 3072,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "company_id"
    }
  ]
}
```

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
| POST | `/api/companies/` | Create company (creates default chatbot) |
| GET | `/api/companies/me` | Get user's company |
| GET/PUT | `/api/chatbot` | Get/update chatbot configuration |
| GET | `/api/chatbot/public/{public_id}` | Public widget branding (name, welcome, color) |
| POST | `/api/chat/stream` | Chat (authenticated, SSE streaming) |
| POST | `/api/chat` | Chat (authenticated, non-streaming) |
| POST | `/api/chat/widget/stream` | Chat (public widget, rate-limited, SSE) |
| GET | `/api/chat/conversations` | List conversations |
| GET | `/api/chat/conversations/{id}/messages` | Get conversation messages |
| GET | `/api/documents/` | List documents |
| POST | `/api/documents/upload` | Upload document |
| DELETE | `/api/documents/{id}` | Delete document |
| POST | `/api/knowledge/crawl` | Crawl website |
| GET | `/api/tickets/` | List tickets |
| POST | `/api/tickets/` | Create ticket |
| PATCH | `/api/tickets/{id}` | Update ticket |
| GET | `/api/leads/` | List leads |
| POST | `/api/leads/` | Create lead |
| GET | `/api/analytics/overview` | Get stats overview |
| GET | `/api/analytics/charts` | Get chart data |

## Embedding the Widget

From the **Install** page (or My Chatbot), copy the generated snippet:

```html
<script
  src="https://YOUR-FRONTEND-DOMAIN/widget.js"
  data-chatbot-id="PUBLIC_CHATBOT_ID"
  data-api-url="https://YOUR-BACKEND-DOMAIN/api"
  async
></script>
```

The snippet contains no secrets — only a public chatbot identifier and API base URL.

Optional attributes:

| Attribute | Values | Default | Description |
|---|---|---|---|
| `data-theme` | `light`, `dark` | `light` | Widget color scheme |
| `data-position` | `bottom-right`, `bottom-left` | `bottom-right` | Launcher corner |
| `data-greeting-delay` | seconds (e.g. `10`) | off (`0`) | Show a proactive greeting bubble after N seconds (once per session) |

## Deployment

### Deploy Backend to Render

1. Push your code to GitHub
2. Create a new Web Service on [Render](https://render.com)
3. Connect your GitHub repo
4. Set the root directory to `backend`
5. Build command: `pip install -r requirements.txt`
6. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
7. Add all environment variables from `.env` (including `GROQ_API_KEY`)

### Deploy Frontend to Vercel

1. Import your GitHub repo on [Vercel](https://vercel.com)
2. Set the root directory to `frontend`
3. Set `NEXT_PUBLIC_API_URL` to your Render backend URL + `/api`
4. Deploy

## Testing

```bash
cd backend
pytest tests/ -v
```

Tests that write data use the MongoDB instance configured in `backend/.env`.

## License

MIT
