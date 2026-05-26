FROM python:3.12.9-slim

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Set working directory
WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN uv pip install --no-cache -r requirements.txt --system

# Install playwright browsers
RUN python -m playwright install chromium

# Copy the rest of the application
COPY . .

# Make startup script executable
RUN chmod +x scripts/startup.sh

# Expose port
EXPOSE 8000

# Run the startup script
CMD ["./scripts/startup.sh"]
