# Step 1: Build the React frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# We don't set VITE_API_URL because we want it to default to empty string
# so it makes relative requests to the FastAPI server serving it.
RUN npm run build

# Step 2: Build the FastAPI backend
FROM python:3.11-slim
WORKDIR /app

# Install dependencies required by OpenCV and YOLO
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu \
    && pip install --no-cache-dir -r requirements.txt

# Copy built frontend assets
COPY --from=frontend-builder /app/dist /app/dist

# Copy backend source code
COPY . .

# Hugging Face Spaces require running as non-root user 1000
RUN useradd -m -u 1000 user
RUN chown -R user:user /app
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

EXPOSE 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
