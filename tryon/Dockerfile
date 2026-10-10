FROM pytorch/pytorch:2.6.0-cuda12.4-cudnn9-runtime
RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
RUN git clone https://github.com/Zheng-Chong/CatVTON.git /app/upstream && cd /app/upstream && git checkout 999bdbe81e6008a3f5749af7c1e0b0fa3d21b48e
COPY engine.py server.py /app/
ENV CATVTON_SOURCE=/app/upstream HF_HOME=/cache CATVTON_WIDTH=384 CATVTON_HEIGHT=512
EXPOSE 7861
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "7861", "--no-access-log"]
