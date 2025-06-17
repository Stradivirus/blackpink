# FastAPI, 예외 처리, 데이터 모델, 타입 힌트 등 필요한 라이브러리 임포트
from fastapi import FastAPI, HTTPException  # FastAPI 앱 생성 및 HTTP 예외 처리를 위한 모듈
from pydantic import BaseModel              # 데이터 검증 및 직렬화를 위한 Pydantic의 BaseModel
from typing import List                     # 타입 힌트: 리스트 타입 지정
from pymongo import MongoClient             # MongoDB 연결을 위한 PyMongo 클라이언트
from bson import ObjectId                   # MongoDB의 ObjectId 타입 사용을 위한 모듈
from fastapi.middleware.cors import CORSMiddleware  # CORS 미들웨어
from datetime import datetime               # 현재 시간 저장용

# FastAPI 애플리케이션 인스턴스 생성
app = FastAPI()

# ------------------ CORS 설정 ------------------
# CORS(Cross-Origin Resource Sharing) 허용 설정
# 프론트엔드(React, Vue 등)와 연동 시 필요한 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],            # 모든 도메인에서 접근 허용 (운영 환경에서는 제한 권장)
    allow_credentials=True,         # 인증 정보(쿠키 등) 허용
    allow_methods=["*"],            # 모든 HTTP 메서드 허용 (GET, POST, PUT, DELETE 등)
    allow_headers=["*"],            # 모든 헤더 허용
)

# ------------------ MongoDB 연결 ------------------
# MongoDB Atlas 클러스터에 연결 (URI는 보안상 환경변수 사용 권장)
client = MongoClient(
    "mongodb+srv://stradivirus:1q2w3e4r@cluster0.e7rvfpz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
)
db = client["Todo"]           # 'Todo' 데이터베이스 선택
collection = db["todo"]       # 'todo' 컬렉션 선택

# ------------------ 데이터 모델 정의 ------------------
# 클라이언트로부터 입력받거나 반환할 데이터의 구조를 Pydantic 모델로 정의

class Todo(BaseModel):
    title: str                        # 할 일 제목 (필수)
    description: str = ""             # 할 일 설명 (선택, 기본값: "")
    completed: bool = False           # 완료 여부 (기본값: False)
    due_date: str = ""                # 마감 기한 (문자열, 기본값: "")
    status: str = "등록됨"             # 상태 (등록됨, 진행중 등, 기본값: "등록됨")
    created_at: str = ""              # 등록일시 (문자열, 기본
