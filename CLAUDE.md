# ChatLab Technical Specification

## Project Overview

Building a web application with user authentication, data storage, external API integration, and AI model integration capabilities. The app should be simple to host and maintain while providing a robust user experience.

The web app allows the user to invite multiple characters into a collaborative dialogue. The characters can be customized by the user based on needs, such as different philosophers, different educational theorists, or different hats of thinking. The characters should also be able to take turns and interact with each other in the multi-party dialogue.

Here is the user experience: User selects 1 or more educational theorists to chat with. When the chat session begins, the user will set the topic to launch the discussion. The selected theorists will react to the topic and have a thoughtful discussion about the topic based on their key ideas about education. 

The user is controlling the flow, by clicking on Next to get one theorist to add a response, or by typing a user response to direct the conversation. 

The chat history should be saved on the server for the user to review later, similar to Claude.ai.

### Core Features:
1. **Theorist Selection Interface**
   - Grid of educational theorists with photos and brief descriptions
   - Multi-select capability to choose 2-4 theorists for a session
   - Include major figures like Dewey, Montessori, Piaget, Vygotsky, Freire, etc.

2. **Discussion Setup**
   - Topic input field where user sets the initial discussion prompt
   - Brief preview of each selected theorist's likely perspective
   - "Launch Discussion" button to begin

3. **Interactive Chat Interface**
   - Chat-style layout showing each theorist's contributions
   - Each theorist gets a distinct avatar/color scheme
   - "Next Response" button to prompt the next theorist to respond
   - User input field to inject questions or redirect the conversation
   - Theorists respond authentically based on their educational philosophies

4. **Discussion Management**
   - Turn-based system ensuring each theorist gets opportunities to respond
   - Theorists can reference and build on each other's points
   - User can guide discussion with follow-up questions or new angles

5. **Session History**
   - Complete transcript saved in app memory during session
   - Export/copy functionality for the full discussion
   - Session summary showing topic, participants, and key insights


## Architecture & Tech Stack

### Frontend
- **Framework**: React with Vite
- **Hosting**: Vercel (separate from backend)
- **Key Features**:
  - User authentication UI
  - Dashboard for user data and history
  - Interface for AI-processed information
  - Responsive design

### Backend
- **Framework**: FastAPI (Python)
- **Hosting**: Fly.io
- **Key Features**:
  - RESTful API endpoints
  - User behavior logging
  - External API integration
  - AI model API calls (Claude, GPT)
  - Data processing and storage

### Authentication
- **Service**: Supabase Auth
- **Features**:
  - Email/password registration
  - Google OAuth integration
  - Microsoft 365 integration
  - Other social login providers as needed
  - User session management
  - JWT token handling

### Database
- **Primary**: SQLite (hosted on Fly.io volumes)
- **Migration path**: Fly Postgres when scaling is needed
- **ORM**: SQLAlchemy with Alembic for migrations
- **Data storage**:
  - User profiles and preferences
  - User behavior logs and history
  - User-created data
  - Cached AI responses (optional)

### External Integrations
- **AI Models**: OpenAI GPT, Anthropic Claude APIs
- **External Platform APIs**: [To be specified based on requirements]
- **HTTP Client**: httpx for async requests
- **Considerations**: Rate limiting, caching, error handling

## Key Libraries & Dependencies

### Backend (FastAPI)
```
fastapi
uvicorn[standard]
sqlalchemy
alembic
pydantic
httpx
supabase
openai
anthropic
python-multipart
python-jose[cryptography]
passlib[bcrypt]
```

### Frontend (React + Vite)
```
@supabase/supabase-js
@tanstack/react-query
react-router-dom
axios or fetch
```

## Deployment Strategy

### Backend Deployment (Fly.io)
- Dockerized FastAPI application
- SQLite database on persistent volumes
- Environment variables for API keys and configuration
- Health check endpoints
- CORS configuration for frontend domain

### Frontend Deployment (Vercel)
- Automatic deployment from Git repository
- Environment variables for Supabase and API endpoints
- Build optimization for production

## Project Structure

### Backend Structure
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app entry point
│   ├── config.py              # Configuration and settings
│   ├── database.py            # Database connection and models
│   ├── auth/                  # Authentication logic
│   ├── api/                   # API route handlers
│   │   ├── auth.py
│   │   ├── users.py
│   │   ├── data.py
│   │   └── ai.py
│   ├── models/                # SQLAlchemy models
│   ├── schemas/               # Pydantic schemas
│   ├── services/              # Business logic
│   │   ├── external_api.py
│   │   ├── ai_service.py
│   │   └── user_service.py
│   └── utils/                 # Utility functions
├── alembic/                   # Database migrations
├── Dockerfile
├── fly.toml
├── requirements.txt
└── .env.example
```

### Frontend Structure
```
frontend/
├── src/
│   ├── components/            # Reusable UI components
│   ├── pages/                 # Page components
│   ├── hooks/                 # Custom React hooks
│   ├── services/              # API service functions
│   ├── utils/                 # Utility functions
│   ├── context/               # React context for auth
│   ├── App.jsx
│   └── main.jsx
├── public/
├── package.json
├── vite.config.js
└── .env.example
```

## Environment Variables

### Backend (.env)
```
DATABASE_URL=sqlite:///./app.db
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
EXTERNAL_API_KEY=your_external_api_key
EXTERNAL_API_BASE_URL=https://api.external-platform.com
CORS_ORIGINS=["https://your-frontend-domain.vercel.app"]
```

### Frontend (.env)
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=https://your-backend.fly.dev
```

## Core Functionality Requirements

### User Management
- User registration with email/password
- Google OAuth integration
- User profile management
- Session handling and JWT validation

### Data Management
- User behavior logging (page views, actions, timestamps)
- User-created data storage and retrieval
- Data history and versioning
- Export capabilities

### External API Integration
- Fetch data from external platform APIs
- Handle rate limiting and retries
- Data transformation and validation
- Caching strategies

### AI Processing
- Integration with OpenAI GPT models
- Integration with Anthropic Claude models
- Prompt engineering and response handling
- Cost optimization (caching, batching)
- Error handling for AI API failures

### Security Considerations
- Input validation and sanitization
- SQL injection prevention
- CORS configuration
- Rate limiting on API endpoints
- Secure storage of API keys
- User data privacy and protection

## Deployment Configuration

### Fly.io Configuration (fly.toml)
```toml
app = "chatlab"
primary_region = "sjc"

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "8000"

[[services]]
  http_checks = []
  internal_port = 8000
  processes = ["app"]
  protocol = "tcp"
  script_checks = []

  [services.concurrency]
    hard_limit = 25
    soft_limit = 20
    type = "connections"

  [[services.ports]]
    force_https = true
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443

  [[services.tcp_checks]]
    grace_period = "1s"
    interval = "15s"
    restart_limit = 0
    timeout = "2s"

[mounts]
  source = "data"
  destination = "/data"
```

## Development Workflow

### Getting Started
1. Set up Supabase project and obtain credentials
2. Obtain API keys for AI services and external platforms
3. Clone repository and set up environment variables
4. Install dependencies for both frontend and backend
5. Run database migrations
6. Start development servers

### Development Commands
```bash
# Backend
cd backend
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

### Deployment Commands
```bash
# Backend to Fly.io
flyctl deploy

# Frontend to Vercel
git push origin main  # Auto-deployment
```

## Additional Information

Below is additional details for the project:

1. **Specific External Platform Details**:
   - Integrate either OpenAI or Claude APIs
   - Authenticate through API tokens

2. **AI Use Cases**:
   - The main function of AI models is to generate responses based on characters

3. **User Data Requirements**:
   - What specific user behaviors need to be logged? User selection of characters and text inputs will be stored. 
   - Transcripts of chat sessions (user, characters) will be systematically stored for later retrieval or analysis. 
