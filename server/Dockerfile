FROM python:3.11-slim

WORKDIR /app

# Install git and system dependencies (graphviz, libmagic)
RUN apt-get update && \
    apt-get install -y git graphviz libgraphviz-dev libmagic1 build-essential && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install startleft from source
RUN git clone https://github.com/iriusrisk/startleft.git /tmp/startleft && \
    pip install --no-cache-dir /tmp/startleft && \
    rm -rf /tmp/startleft

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
