# BLACKPINK 웹 관리 시스템

React + FastAPI + MongoDB Atlas를 사용한 웹 관리 코드

## 🚀 프로젝트 구조

- **board_rv/**: React 프론트엔드
- **fastapi_back/**: FastAPI 백엔드 
- **Dummy_data/**: 테스트용 더미 데이터 생성 스크립트
- **docker/**: Docker 컨테이너 설정

## 🛠️ 개발 환경 설정

### Frontend (React)

```bash
cd board_rv
npm install          # 의존성 설치
npm run dev         # 개발 서버 실행
npm run build       # 프로덕션 빌드
```

### Backend (FastAPI)

```bash
cd fastapi_back
pip install -r requirements.txt    # 의존성 설치
python main.py                     # 서버 실행
```

### 더미 데이터 생성

```bash
cd Dummy_data
pip install pymongo faker certifi  # 필요한 패키지 설치
python geberate_member.py          # 관리자 계정 생성
python dummy_data1.py              # 회사 데이터 생성
python dummy_data2.py              # 보안 사고 데이터 생성
python dummy_data3.py              # 개발 프로젝트 데이터 생성
```

## 🐳 Docker로 실행

Docker가 설치되어 있는 경우:

```bash
cd docker
docker compose up --build -d
```

- `-d` 옵션: 백그라운드에서 실행

## 📋 주요 기능

- 회사 관리 시스템
- 보안 사고 로그 관리
- 개발 프로젝트 추적
- 관리자 대시보드
- 사용자 인증 및 권한 관리
