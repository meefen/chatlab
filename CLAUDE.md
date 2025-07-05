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
- **Hosting**: Render
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
- **Primary**: PostgreSQL (hosted on Render)
- **Development**: SQLite for local development
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
pydantic[email]
pydantic-settings
httpx
supabase
openai
anthropic
python-multipart
python-jose[cryptography]
passlib[bcrypt]
psycopg2-binary
```

### Frontend (React + Vite)
```
@supabase/supabase-js
@tanstack/react-query
react-router-dom
axios or fetch
```

## Deployment Strategy

### Backend Deployment (Render)
- Native Python application deployment
- PostgreSQL database (managed)
- Environment variables for API keys and configuration
- Health check endpoints
- CORS configuration for frontend domain
- Automatic deployment from Git repository

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
│   │   ├── characters.py
│   │   ├── conversations.py
│   │   └── ai.py
│   ├── models/                # SQLAlchemy models
│   ├── schemas/               # Pydantic schemas
│   ├── services/              # Business logic
│   │   └── ai_service.py
│   └── utils/                 # Utility functions
├── alembic/                   # Database migrations
├── characters/                # Default character data
│   ├── characters_data.json
│   └── insert_characters_sqlite.py
├── migration/                 # Migration utilities (Fly.io → Render)
│   ├── export_sqlite_data.py
│   ├── import_postgresql_data.py
│   └── migration_data/
├── render.yaml                # Render deployment config
├── startup.py                 # Application startup script
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
# Database (auto-configured in production)
DATABASE_URL=sqlite:///./app.db

# Authentication
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key

# AI APIs
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
AI_PROVIDER=anthropic

# CORS
CORS_ORIGINS=["http://localhost:5173", "https://your-frontend-domain.vercel.app"]

# Environment
ENVIRONMENT=development
```

### Frontend (.env)
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=http://localhost:8000

# Production (.env.production)
# VITE_API_BASE_URL=https://your-backend.onrender.com
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

### Render Configuration (render.yaml)
```yaml
services:
  # FastAPI Backend Web Service
  - type: web
    name: chatlab-backend
    env: python
    region: oregon
    plan: free
    buildCommand: "pip install -r requirements.txt"
    startCommand: "python startup.py"
    healthCheckPath: "/health"
    envVars:
      - key: ENVIRONMENT
        value: production
      - key: PORT
        value: 8000
      - key: DATABASE_URL
        fromDatabase:
          name: chatlab-db
          property: connectionString
      - key: AI_PROVIDER
        value: anthropic
      # Additional environment variables set as secrets

  # PostgreSQL Database
  - type: pserv
    name: chatlab-db
    databaseName: chatlab
    databaseUser: chatlab_user
    region: oregon
    plan: free
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
python startup.py  # or uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

### Deployment Commands
```bash
# Backend to Render (automatic from Git)
git push origin main

# Frontend to Vercel (automatic from Git)
git push origin main
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

## Production Deployment Troubleshooting Guide

### Common Issues and Solutions

#### 1. Render Deployment Issues

**Problem**: Build or deployment failures on Render.

**Common Causes**:
- Missing dependencies in requirements.txt
- Incorrect Python version
- Build command errors

**Solution**: 
```bash
# Check build logs in Render dashboard
# Ensure all dependencies are specified:
pip install -r requirements.txt

# Test build locally:
cd backend
pip install -r requirements.txt
python startup.py
```

**Prevention**:
- Test requirements.txt locally before deploying
- Use specific package versions
- Include all extras (e.g., pydantic[email])

#### 2. CORS Errors in Production

**Problem**: Frontend gets CORS errors despite backend deployment success.

**Symptoms**: 
```
Access to fetch at 'https://backend.onrender.com/api/endpoint' from origin 'https://frontend.vercel.app' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
```

**Root Cause**: Environment variables not properly set in Render.

**Solution**:
1. Go to Render service dashboard
2. Navigate to Environment tab
3. Add environment variables:
```
CORS_ORIGINS=["http://localhost:5173", "https://your-frontend.vercel.app"]
SUPABASE_URL=your_url
SUPABASE_KEY=your_key
ANTHROPIC_API_KEY=your_key
```

**Verification**:
```bash
# Test CORS headers
curl -I -H "Origin: https://your-frontend.vercel.app" https://your-backend.onrender.com/api/endpoint
# Should return: access-control-allow-origin: https://your-frontend.vercel.app
```

#### 3. Missing Dependencies Causing Crashes

**Problem**: App crashes with `ImportError: package is not installed` errors.

**Common Example**: 
```
ImportError: email-validator is not installed, run `pip install pydantic[email]`
```

**Solution**: Update requirements.txt with proper package specifications:
```
# Change from:
pydantic==2.5.0

# To:
pydantic[email]==2.5.0
```

#### 4. Environment Variable Loading Issues

**Problem**: Environment variables return None values, causing authentication failures.

**Root Cause**: Using `os.getenv()` instead of pydantic settings system.

**Solution**: Always use pydantic-settings for environment variable management:
```python
# Wrong:
import os
supabase_url = os.getenv("SUPABASE_URL")

# Correct:
from .config import settings
supabase_url = settings.SUPABASE_URL
```

#### 5. Git Tracking Virtual Environment Files

**Problem**: Git tracks thousands of venv files despite .gitignore.

**Solution**:
```bash
# Remove from git tracking but keep local files
git rm -r --cached backend/venv

# Commit the removal
git commit -m "Remove venv files from git tracking"

# Ensure .gitignore contains:
backend/venv/
backend/.venv/
```

### Deployment Checklist

Before deploying to production:

1. **Environment Variables**:
   - [ ] All environment variables set in Render dashboard
   - [ ] Frontend environment variables set in Vercel
   - [ ] CORS_ORIGINS includes production frontend URL

2. **Database**:
   - [ ] PostgreSQL service created in Render
   - [ ] Database connection string configured
   - [ ] Startup script handles both SQLite and PostgreSQL

3. **Dependencies**:
   - [ ] All required packages in requirements.txt
   - [ ] Package extras included (e.g., pydantic[email])
   - [ ] psycopg2-binary included for PostgreSQL
   - [ ] No sensitive data in git repository

4. **Testing**:
   - [ ] Health endpoint responds: `curl https://backend.onrender.com/health`
   - [ ] CORS headers present: `curl -I -H "Origin: https://frontend.vercel.app" https://backend.onrender.com/api/endpoint`
   - [ ] API returns proper errors (401) not crashes (500)

### Monitoring Commands

```bash
# Check app status in Render dashboard
# View logs in Render dashboard

# Test endpoints
curl https://your-app.onrender.com/health
curl https://your-app.onrender.com/api/characters/

# Check CORS
curl -I -H "Origin: https://your-frontend.vercel.app" https://your-app.onrender.com/api/characters/
```

## Development Debugging Guide

### API 500 Internal Server Error Debugging

**Problem**: Frontend gets "500 Internal Server Error" when making API requests, especially after database schema changes.

**Symptoms**: 
- CORS error initially, then 500 error after CORS is fixed
- Frontend shows "Failed to save" error messages
- Backend logs may not show detailed error info

**Common Root Causes & Debugging Steps**:

1. **Database Schema Mismatch** (Most Common):
   ```bash
   # Check if database schema matches SQLAlchemy models
   source venv/bin/activate
   python -c "
   from app.database import engine
   from sqlalchemy import inspect
   inspector = inspect(engine)
   print('Actual DB columns:')
   for col in inspector.get_columns('table_name'):
       print(f'  {col[\"name\"]}: {col[\"type\"]} (nullable: {col[\"nullable\"]})')
   "
   ```

2. **Check SQLAlchemy Model vs Database**:
   ```bash
   # Compare model expectations with database reality
   # Look for columns that exist in DB but not in model, or vice versa
   # Common issues: old columns not removed, wrong defaults, missing FK constraints
   ```

3. **Authentication Issues**:
   ```bash
   # Test endpoint with curl to isolate auth vs schema issues
   curl -X POST http://localhost:8000/api/endpoint/ \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer fake-token" \
     -d '{"test":"data"}' -v
   ```

4. **Fix Database Schema Mismatch**:
   ```python
   # If schema mismatch found, manually fix database:
   import sqlite3
   conn = sqlite3.connect('app.db')
   cursor = conn.cursor()
   
   # Backup data
   cursor.execute('SELECT * FROM problematic_table')
   backup_data = cursor.fetchall()
   
   # Recreate table with correct schema
   cursor.execute('DROP TABLE problematic_table')
   cursor.execute('CREATE TABLE problematic_table (...correct_schema...)')
   
   # Restore data
   cursor.executemany('INSERT INTO ...', backup_data)
   conn.commit()
   ```

**Prevention**: 
- Always restart backend after model changes
- Run database migrations in development first
- Use startup.py script to handle schema transitions
- Test API endpoints with curl before frontend testing

**Quick Diagnostic Checklist**:
- [ ] Backend server running and responsive
- [ ] CORS headers present in response
- [ ] Database schema matches SQLAlchemy models exactly
- [ ] Authentication token being sent correctly
- [ ] No extra columns in database that aren't in model
- [ ] Default values in database match model defaults 
