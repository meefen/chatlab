# ChatLab - Educational Theorist Chat Application

A refactored web application with React frontend and FastAPI backend that allows users to engage in multi-character conversations with educational theorists.

## Quick start

```
cd backend
source venv/bin/activate && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &

cd ../frontend && npm run dev &
```

## Architecture

- **Frontend**: React with Vite (deployed on Vercel)
- **Backend**: FastAPI with Python (deployed on Fly.io)
- **Database**: SQLite (with migration path to PostgreSQL)
- **Authentication**: Supabase Auth (to be implemented)
- **AI Integration**: Support for both OpenAI GPT-4o and Anthropic Claude 3.5 Sonnet

## Project Structure

```
ChatLab/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API route handlers
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   ├── main.py         # FastAPI app entry point
│   │   ├── config.py       # Configuration
│   │   └── database.py     # Database setup
│   ├── requirements.txt
│   ├── Dockerfile
│   └── fly.toml
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # API services
│   │   └── lib/           # Utilities
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## Getting Started

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

5. Run the FastAPI server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your API endpoint
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## API Endpoints

### Characters
- `GET /api/characters` - Get all characters
- `GET /api/characters/active` - Get active characters
- `POST /api/characters` - Create a new character
- `PUT /api/characters/{id}` - Update character
- `DELETE /api/characters/{id}` - Delete character

### Conversations
- `GET /api/conversations` - Get all conversations
- `GET /api/conversations/{id}` - Get conversation with messages
- `POST /api/conversations` - Create new conversation
- `POST /api/conversations/{id}/messages` - Add message to conversation

### AI Services
- `POST /api/ai/conversations/{id}/generate-response` - Generate AI character response
- `POST /api/ai/conversations/{id}/generate-title` - Generate conversation title
- `GET /api/ai/config` - Get current AI provider configuration
- `POST /api/ai/config/provider` - Switch AI provider (openai/anthropic)

## Environment Variables

### Backend (.env)
```
DATABASE_URL=sqlite:///./app.db
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
AI_PROVIDER=anthropic
CORS_ORIGINS=["http://localhost:5173"]
```

**AI Provider Options:**
- Set `AI_PROVIDER=anthropic` to use Claude 3.5 Sonnet (default)
- Set `AI_PROVIDER=openai` to use GPT-4o
- You can switch providers at runtime via the API endpoint

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:8000
```

## Deployment

### Backend (Fly.io)
```bash
cd backend
fly deploy
```

### Frontend (Vercel)
```bash
cd frontend
vercel --prod
```

## Migration from Original Stack

This application has been refactored from Express.js/Node.js to FastAPI/Python while maintaining the same functionality:

- Database models converted from Drizzle ORM to SQLAlchemy
- Express routes converted to FastAPI endpoints
- Pydantic schemas for request/response validation
- Maintained existing React frontend components
- Separated frontend and backend for independent deployment