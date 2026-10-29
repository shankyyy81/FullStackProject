
FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install CPU-only PyTorch to avoid unnecessary CUDA packages
RUN python -m pip install \
    --no-cache-dir \
    --timeout 300 \
    --retries 10 \
    torch \
    --index-url https://download.pytorch.org/whl/cpu

# Copy dependency list
COPY requirements.txt .

# Install remaining backend dependencies
RUN python -m pip install \
    --no-cache-dir \
    --timeout 300 \
    --retries 10 \
    -r requirements.txt

# Copy backend source and model files
COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
