FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create data directory for SQLite database
RUN mkdir -p /data

# Set environment variables
ENV DATABASE_URL="sqlite:////data/app.db"
ENV PYTHONPATH="/app"

# Expose port
EXPOSE 8000

# Start the application (database tables will be created via FastAPI startup event)
CMD uvicorn app.main:app --host 0.0.0.0 --port 8000