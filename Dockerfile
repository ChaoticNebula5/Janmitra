# Dockerfile for Janmitra Voice Bot
FROM python:3.12-slim

# Install uv
RUN pip install uv

# Set working directory
WORKDIR /app

# Copy project files
COPY . .

# Install dependencies
RUN uv sync --frozen

# Expose port for WebRTC server
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/offer || exit 1

# Run the bot
CMD ["uv", "run", "janmitra_bot.py", "--transport", "webrtc"]