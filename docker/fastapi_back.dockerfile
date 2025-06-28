FROM python:3.11-slim

WORKDIR /app

COPY ../fastapi_back/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY ../fastapi_back ./

# 한국 시간대 설정
RUN apt-get update && apt-get install -y tzdata \
    && ln -sf /usr/share/zoneinfo/Asia/Seoul /etc/localtime \
    && echo "Asia/Seoul" > /etc/timezone \
    && dpkg-reconfigure -f noninteractive tzdata \
    && apt-get clean

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]