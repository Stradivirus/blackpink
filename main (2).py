# main.py

from fastapi import FastAPI, HTTPException, Response, UploadFile, File
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
import os
import io # 파일을 바이트 스트림으로 다루기 위해 추가
import datetime
import uvicorn
import uuid
import random
import asyncio # asyncio 모듈 임포트
import urllib.parse # Filename encoding을 위해 추가

# MongoDB 관련 임포트
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from gridfs import GridFSBucket # 'gridfs' 모듈에서 동기 GridFSBucket 임포트
from bson import ObjectId

# APScheduler를 위한 임포트: 비동기 스케줄러
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

# CORS 미들웨어를 위한 임포트
from fastapi.middleware.cors import CORSMiddleware

# --- MongoDB 설정 ---
# 사용자님이 제공한 MongoDB Atlas 연결 문자열
MONGO_DETAILS = "mongodb+srv://stradivirus:1q2w3e4r@cluster0.e7rvfpz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
DB_NAME = "blackpink" # DB_NAME을 "blackpink"으로 변경
COLLECTION_NAME = "global_security_index"

# --- 데이터 모델 정의 (Pydantic) ---
class BaseData(BaseModel):
    type: Literal["gci_ranking", "risky_country"] = Field(..., description="데이터 유형 (예: 'gci_ranking', 'risky_country')")
    timestamp: datetime.datetime = Field(default_factory=datetime.datetime.now, description="데이터 생성/업데이트 시각")

class GCIRanking(BaseData):
    type: Literal["gci_ranking"] = "gci_ranking"
    country: str = Field(..., description="국가명")
    rank: int = Field(..., description="순위")
    score: float = Field(..., description="점수 (0.0 ~ 1.0)")
    year: int = Field(..., description="연도")

class RiskyCountry(BaseData):
    type: Literal["risky_country"] = "risky_country"
    country: str = Field(..., description="위험 국가명")
    risk_level: str = Field(..., description="위험 수준 (예: 'High', 'Medium', 'Low')")
    alert_type: Optional[str] = Field(None, description="경고 유형 (예: 'Malware', 'Phishing', 'DDoS')")
    latitude: float = Field(..., description="위험 국가의 위도")
    longitude: float = Field(..., description="위험 국가의 경도")

# 위협 리포트 메타데이터를 위한 모델 (MongoDB에 별도 컬렉션으로 저장)
class ThreatReportMetadata(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="리포트의 고유 ID")
    title: str = Field(..., description="리포트 제목")
    upload_date: datetime.datetime = Field(default_factory=datetime.datetime.now, description="업로드 날짜")
    # 파일 경로 대신 GridFS 파일 ID를 저장
    gridfs_file_id: str = Field(..., description="MongoDB GridFS에 저장된 파일의 ID")

# --- FastAPI 애플리케이션 초기화 ---
app = FastAPI(
    title="사이버보안 대시보드 API",
    description="GCI 순위, 위험 국가 매핑, 위협 리포트 제공을 위한 백엔드 API입니다."
)

# --- CORS 설정 ---
origins = [
    "http://localhost",
    "http://localhost:8000",
    "http://127.0.0.1",
    "http://127.0.0.1:8000",
    "null", # 개발 환경에서 JavaScript fetch API 사용 시 'null' origin이 발생할 수 있습니다.
    "*" # 모든 오리진 허용 (개발용, 프로덕션에서는 특정 도메인으로 제한 권장)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # 모든 HTTP 메서드 허용 (GET, POST 등)
    allow_headers=["*"], # 모든 헤더 허용
)

# --- 전역 MongoDB 클라이언트 및 컬렉션 참조 ---
db_client: AsyncIOMotorClient = None
db: AsyncIOMotorDatabase = None # 타입 힌트 명확화
gsi_collection = None
threat_reports_collection = None
fs: GridFSBucket = None # fs의 타입을 gridfs.GridFSBucket으로 명확히 지정 (동기 버전)

# APScheduler 인스턴스 초기화
scheduler = AsyncIOScheduler()

# --- 데이터 생성을 위한 헬퍼 데이터 ---
GLOBAL_COUNTRIES = [
    {"country": "브라질", "latitude": -14.2350, "longitude": -51.9253},
    {"country": "인도", "latitude": 20.5937, "longitude": 78.9629},
    {"country": "나이지리아", "latitude": 9.0820, "longitude": 8.6753},
    {"country": "남아프리카 공화국", "latitude": -30.5595, "longitude": 22.9375},
    {"country": "이집트", "latitude": 26.8206, "longitude": 30.8025},
    {"country": "멕시코", "latitude": 23.6345, "longitude": -102.5528},
    {"country": "캐나다", "latitude": 56.1304, "longitude": -106.3468},
    {"country": "호주", "latitude": -25.2744, "longitude": 133.7751},
    {"country": "아르헨티나", "latitude": -38.4161, "longitude": -63.6167},
    {"country": "프랑스", "latitude": 46.2276, "longitude": 2.2137},
    {"country": "이탈리아", "latitude": 41.8719, "longitude": 12.5674},
    {"country": "스페인", "latitude": 40.4637, "longitude": -3.7492},
    {"country": "사우디아라비아", "latitude": 23.8859, "longitude": 45.0792},
    {"country": "인도네시아", "latitude": -0.7893, "longitude": 113.9213},
    {"country": "파키스탄", "latitude": 30.3753, "longitude": 69.3451},
    {"country": "터키", "latitude": 38.9637, "longitude": 35.2433},
    {"country": "대한민국", "latitude": 35.907757, "longitude": 127.766922},
    {"country": "미국", "latitude": 37.090240, "longitude": -95.712891},
    {"country": "영국", "latitude": 55.378051, "longitude": -3.435973},
    {"country": "독일", "latitude": 51.165691, "longitude": 10.451526},
    {"country": "일본", "latitude": 36.204824, "longitude": 138.252924},
    {"country": "북한", "latitude": 40.339852, "longitude": 127.510093},
    {"country": "러시아", "latitude": 61.524010, "longitude": 105.318756},
    {"country": "중국", "latitude": 35.861660, "longitude": 104.195397},
    {"country": "이란", "latitude": 32.427908, "longitude": 53.688046},
    {"country": "우크라이나", "latitude": 48.379433, "longitude": 31.165580},
    {"country": "베트남", "latitude": 14.058324, "longitude": 108.277199}
]

RISK_LEVELS = ["High", "Medium", "Low"]
ALERT_TYPES = ["Malware", "Phishing", "DDoS", "Ransomware", "Data Breach", "APT Attack", "Zero-day Exploit"]

# --- API 엔드포인트 ---

@app.get("/")
async def read_root():
    return {"message": "사이버보안 대시보드 API에 오신 것을 환영합니다!"}

@app.get("/api/gci_rankings", response_model=List[GCIRanking], summary="GCI 순위 조회")
async def get_gci_rankings(year: Optional[int] = None):
    query = {"type": "gci_ranking"}
    if year:
        query["year"] = year
    
    rankings_cursor = gsi_collection.find(query).sort([("year", -1), ("rank", 1)])
    rankings = await rankings_cursor.to_list(length=None)
    
    for ranking in rankings:
        ranking.pop('_id', None)
    
    return [GCIRanking(**ranking) for ranking in rankings]

@app.post("/api/gci_rankings", response_model=GCIRanking, summary="새 GCI 순위 추가 (관리자용)")
async def add_gci_ranking(ranking: GCIRanking):
    result = await gsi_collection.insert_one(ranking.model_dump(by_alias=True, exclude_unset=True))
    inserted_ranking = await gsi_collection.find_one({"_id": result.inserted_id})
    inserted_ranking.pop('_id', None)
    return GCIRanking(**inserted_ranking)

@app.get("/api/risky_countries", response_model=List[RiskyCountry], summary="위험 국가 목록 조회")
async def get_risky_countries():
    query = {"type": "risky_country"}
    countries_cursor = gsi_collection.find(query).sort("timestamp", -1)
    countries = await countries_cursor.to_list(length=None)
    
    for country in countries:
        country.pop('_id', None)
    
    return [RiskyCountry(**country) for country in countries]

@app.post("/api/risky_countries", response_model=RiskyCountry, summary="새 위험 국가 데이터 추가 (관리자용)")
async def add_risky_country(country: RiskyCountry):
    result = await gsi_collection.insert_one(country.model_dump(by_alias=True, exclude_unset=True))
    inserted_country = await gsi_collection.find_one({"_id": result.inserted_id})
    inserted_country.pop('_id', None)
    return RiskyCountry(**inserted_country)

@app.get("/api/risky_countries/map_data", summary="지도 시각화를 위한 위험 국가 데이터 제공")
async def get_risky_countries_map_data():
    query = {"type": "risky_country"}
    countries_cursor = gsi_collection.find(query).sort("timestamp", -1)
    countries = await countries_cursor.to_list(length=None)
    
    features = [
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [c["longitude"], c["latitude"]]
            },
            "properties": {
                "country": c["country"],
                "risk_level": c["risk_level"],
                "alert_type": c["alert_type"],
                "timestamp": c["timestamp"].isoformat()
            }
        } for c in countries
    ]
    return {
        "type": "FeatureCollection",
        "features": features
    }

@app.get("/api/risky_countries/alerts", response_model=List[RiskyCountry], summary="최근 위험 국가 알림 조회")
async def get_risky_country_alerts(minutes_ago: int = 60):
    time_threshold = datetime.datetime.now() - datetime.timedelta(minutes=minutes_ago)
    query = {
        "type": "risky_country",
        "timestamp": {"$gte": time_threshold}
    }
    recent_alerts_cursor = gsi_collection.find(query).sort("timestamp", -1)
    recent_alerts = await recent_alerts_cursor.to_list(length=None)

    for alert in recent_alerts:
        alert.pop('_id', None)

    return [RiskyCountry(**alert) for alert in recent_alerts]

# --- 위협 리포트 기반 PDF 제공 엔드포인트 ---
@app.get("/api/threat_reports", response_model=List[ThreatReportMetadata], summary="위협 리포트 목록 조회")
async def get_threat_reports_list():
    reports_cursor = threat_reports_collection.find().sort("upload_date", -1)
    reports = await reports_cursor.to_list(length=None)

    for report in reports:
        report.pop('_id', None) # MongoDB의 내부 _id는 제거합니다.
    
    return [ThreatReportMetadata(**report) for report in reports]

@app.post("/api/threat_reports/upload", summary="위협 리포트 PDF 업로드")
async def upload_threat_report(
    title: str = File(..., description="리포트 제목"),
    file: UploadFile = File(..., description="업로드할 PDF 파일")
):
    report_uuid = str(uuid.uuid4()) # 메타데이터 문서의 고유 ID (UUID 문자열)
    
    try:
        contents = await file.read() # 파일 내용 읽기 (비동기)
        
        # 동기 GridFSBucket의 upload_from_stream을 asyncio.to_thread로 래핑
        gridfs_file_oid = await asyncio.to_thread(
            fs.upload_from_stream, file.filename, io.BytesIO(contents)
        )
        
        # 메타데이터 생성 시, GridFS ObjectId를 문자열로 변환하여 gridfs_file_id 필드에 저장합니다.
        metadata = ThreatReportMetadata(
            id=report_uuid,
            title=title,
            upload_date=datetime.datetime.now(),
            gridfs_file_id=str(gridfs_file_oid) # ObjectId를 문자열로 변환하여 저장
        ).model_dump()
        
        await threat_reports_collection.insert_one(metadata)
        
        return {"message": "리포트가 성공적으로 업로드되었습니다.", "report_id": metadata["id"], "title": metadata["title"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"파일 업로드 실패: {e}")

@app.get("/api/threat_reports/download/{report_id}", summary="위협 리포트 PDF 다운로드")
async def download_threat_report(report_id: str):
    print(f"DEBUG: download_threat_report called for report_id: {report_id}")
    # 우리가 정의한 'id' 필드(UUID 문자열)를 사용하여 리포트 메타데이터를 MongoDB에서 조회합니다.
    report_metadata = await threat_reports_collection.find_one({"id": report_id})
    
    if not report_metadata:
        print(f"ERROR: Report metadata not found for ID: {report_id}")
        raise HTTPException(status_code=404, detail="요청한 리포트를 찾을 수 없습니다.")
    
    gridfs_file_id_str = report_metadata.get("gridfs_file_id")
    if not gridfs_file_id_str:
        print(f"ERROR: GridFS file ID not found in metadata for report_id: {report_id}")
        raise HTTPException(status_code=404, detail="리포트 파일 ID를 찾을 수 없습니다.")

    try:
        # GridFS 파일 ID (문자열)를 ObjectId로 변환하여 GridFS에서 파일을 찾습니다.
        gridfs_file_oid = ObjectId(gridfs_file_id_str)
        print(f"DEBUG: Converted gridfs_file_id_str '{gridfs_file_id_str}' to ObjectId: {gridfs_file_oid}")
        
        # 동기 GridFSBucket의 open_download_stream을 asyncio.to_thread로 래핑
        gridfs_file = await asyncio.to_thread(
            fs.open_download_stream, gridfs_file_oid
        )
        print(f"DEBUG: Successfully opened download stream for ObjectId: {gridfs_file_oid}")
        
        # 파일 이름을 UTF-8로 인코딩하여 Content-Disposition에 사용
        # RFC 5987에 따라 filename*을 사용
        encoded_filename = urllib.parse.quote(f"{report_metadata['title']}.pdf", encoding='utf-8')
        content_disposition_header = f"attachment; filename*=UTF-8''{encoded_filename}"
        print(f"DEBUG: Content-Disposition header: {content_disposition_header}")

        # 파일을 청크별로 읽어 스트리밍 응답을 생성합니다.
        def iterfile():
            try:
                while True:
                    chunk = gridfs_file.read(4096) # 4KB 청크로 읽기
                    if not chunk:
                        break
                    yield chunk
                print(f"DEBUG: Finished streaming file for ObjectId: {gridfs_file_oid}")
            except Exception as e:
                print(f"ERROR: Error during file streaming for ObjectId {gridfs_file_oid}: {e}")
                raise
            finally:
                gridfs_file.close() # Ensure the stream is closed
                print(f"DEBUG: Closed GridFS file stream for ObjectId: {gridfs_file_oid}")


        return StreamingResponse(
            iterfile(),
            media_type="application/pdf",
            headers={"Content-Disposition": content_disposition_header}
        )
    except Exception as e:
        print(f"ERROR: Failed to download file for report_id {report_id}: {e}")
        raise HTTPException(status_code=500, detail=f"파일 다운로드 실패: {e}")

@app.delete("/api/threat_reports/delete/{report_id}", summary="위협 리포트 PDF 삭제")
async def delete_threat_report(report_id: str):
    print(f"DEBUG: delete_threat_report called for report_id: {report_id}")
    report_metadata = await threat_reports_collection.find_one({"id": report_id})

    if not report_metadata:
        print(f"ERROR: Report metadata not found for ID: {report_id}")
        raise HTTPException(status_code=404, detail="요청한 리포트를 찾을 수 없습니다.")

    gridfs_file_id_str = report_metadata.get("gridfs_file_id")
    if not gridfs_file_id_str:
        print(f"ERROR: GridFS file ID not found in metadata for report_id: {report_id}")
        raise HTTPException(status_code=404, detail="리포트 파일 ID를 찾을 수 없습니다.")
    
    try:
        gridfs_file_oid = ObjectId(gridfs_file_id_str)
        # 먼저 GridFS에서 실제 파일 삭제
        await asyncio.to_thread(fs.delete, gridfs_file_oid)
        print(f"DEBUG: Successfully deleted file from GridFS with OID: {gridfs_file_oid}")

        # 다음으로 메타데이터 컬렉션에서 문서 삭제
        delete_result = await threat_reports_collection.delete_one({"id": report_id})
        
        if delete_result.deleted_count == 1:
            print(f"DEBUG: Successfully deleted metadata for report_id: {report_id}")
            return {"message": "리포트가 성공적으로 삭제되었습니다."}
        else:
            print(f"ERROR: Metadata delete operation for report_id {report_id} failed: {delete_result.deleted_count} documents deleted.")
            raise HTTPException(status_code=500, detail="리포트 메타데이터 삭제에 실패했습니다.")

    except Exception as e:
        print(f"ERROR: Failed to delete report {report_id}: {e}")
        raise HTTPException(status_code=500, detail=f"리포트 삭제 실패: {e}")


# --- 데이터 생성 및 업데이트 로직 (MongoDB에 저장) ---
async def create_dummy_threat_reports():
    """
    더미 위협 리포트 PDF 내용을 GridFS에 저장하고 메타데이터를 DB에 추가합니다.
    """
    dummy_pdf_content_1 = b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj 3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<<>>>>endobj 4 0 obj<</Length 10>>stream\nBT/F1 12 Tf 0 0 Td(2023 Cyber Threat Trends Analysis Report)ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000055 00000 n\n0000000109 00000 n\n0000000216 00000 n\ntrailer<</Size 5/Root 1 0 R>>startxref\n304\n%%EOF"
    dummy_pdf_content_2 = b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj 3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<<>>>>endobj 4 0 obj<</Length 10>>stream\nBT/F1 12 Tf 0 0 Td(Latest Ransomware Attack Case Study Report)ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000055 00000 n\n0000000109 00000 n\n0000000216 00000 n\ntrailer<</Size 5/Root 1 0 R>>startxref\n304\n%%EOF"

    # 더미 PDF를 GridFS에 업로드 (asyncio.to_thread로 래핑)
    file_id_1 = await asyncio.to_thread(
        fs.upload_from_stream, "2023_cyber_threat_trends.pdf", io.BytesIO(dummy_pdf_content_1)
    )
    file_id_2 = await asyncio.to_thread(
        fs.upload_from_stream, "latest_ransomware_case_study.pdf", io.BytesIO(dummy_pdf_content_2)
    )

    # 메타데이터를 생성하고 GridFS 파일 ID와 함께 저장
    threat_reports_metadata_list = [
        ThreatReportMetadata(
            id=str(uuid.uuid4()),
            title="2023년 사이버 위협 동향 분석",
            upload_date=datetime.datetime(2023, 11, 15),
            gridfs_file_id=str(file_id_1)
        ).model_dump(),
        ThreatReportMetadata(
            id=str(uuid.uuid4()),
            title="최신 랜섬웨어 공격 사례 연구",
            upload_date=datetime.datetime(2024, 1, 20),
            gridfs_file_id=str(file_id_2)
        ).model_dump()
    ]
    await threat_reports_collection.insert_many(threat_reports_metadata_list)
    print("더미 위협 리포트가 GridFS에 저장되고 메타데이터가 MongoDB에 추가되었습니다.")

async def daily_data_update_job():
    """
    매일 자정(한국 시간)에 또는 서버 시작 시 한 번 MongoDB 데이터를 업데이트하는 스케줄링 작업.
    기존 데이터를 모두 삭제하고 새로운 시뮬레이션 데이터를 생성하여 저장합니다.
    """
    print(f"스케줄러: MongoDB 데이터 업데이트 시작 ({datetime.datetime.now()}).")
    
    await gsi_collection.delete_many({})
    print("스케줄러: 기존 데이터 삭제 완료.")

    current_year = datetime.datetime.now().year
    
    new_gci_data = []
    random.shuffle(GLOBAL_COUNTRIES)
    for i in range(8):
        country_info = GLOBAL_COUNTRIES[i]
        new_rank = i + 1
        new_score = round(random.uniform(0.7, 1.0), 3)
        new_gci_data.append(GCIRanking(country=country_info["country"], rank=new_rank, score=new_score, year=current_year).model_dump())
    for data in new_gci_data:
        data['type'] = 'gci_ranking'
    
    new_risky_countries = []
    num_risky = random.randint(15, len(GLOBAL_COUNTRIES)) # Increased number of risky countries
    for _ in range(num_risky):
        selected_country_info = random.choice(GLOBAL_COUNTRIES)
        selected_risk_level = random.choice(RISK_LEVELS)
        selected_alert_type = random.choice(ALERT_TYPES)
        random_minutes_ago = random.randint(0, 24*60) 
        alert_timestamp = datetime.datetime.now() - datetime.timedelta(minutes=random_minutes_ago)

        new_risky_countries.append(RiskyCountry(
            country=selected_country_info["country"],
            risk_level=selected_risk_level,
            alert_type=selected_alert_type,
            latitude=selected_country_info["latitude"],
            longitude=selected_country_info["longitude"],
            timestamp=alert_timestamp
        ).model_dump())
    for data in new_risky_countries:
        data['type'] = 'risky_country'

    all_new_data = new_gci_data + new_risky_countries
    if all_new_data:
        await gsi_collection.insert_many(all_new_data)
        print(f"스케줄러: 새 데이터 {len(new_gci_data)}개 GCI, {len(new_risky_countries)}개 위험 국가 MongoDB에 저장 완료.")
    else:
        print("스케줄러: 생성된 새 데이터가 없습니다.")

# --- 애플리케이션 시작 및 종료 이벤트 핸들러 ---
@app.on_event("startup")
async def startup_event():
    global db_client, db, gsi_collection, threat_reports_collection, fs
    print("FastAPI 애플리케이션 시작 중...")
    
    try:
        db_client = AsyncIOMotorClient(MONGO_DETAILS)
        await db_client.admin.command('ping')
        print("DEBUG: MongoDB 서버 핑 성공. 연결 확인됨.")

        db = db_client[DB_NAME]
        
        # db 객체가 AsyncIOMotorDatabase 타입인지 확인
        if not isinstance(db, AsyncIOMotorDatabase):
            raise Exception(f"MongoDB 데이터베이스 '{DB_NAME}' 객체가 예상된 타입이 아닙니다: {type(db)}. AsyncIOMotorDatabase여야 합니다.")

        gsi_collection = db[COLLECTION_NAME]
        threat_reports_collection = db["threat_reports"] 
        
        # GridFSBucket 초기화: pymongo의 GridFSBucket을 db_client.delegate를 통해 얻은 동기 DB에 연결
        # 이 fs 객체는 동기 메서드를 가지고 있으므로, 호출 시 asyncio.to_thread로 래핑해야 합니다.
        fs = GridFSBucket(db_client.delegate[DB_NAME])
        print(f"DEBUG: fs 초기화 성공 (gridfs.GridFSBucket 및 db_client.delegate[DB_NAME] 사용). Type: {type(fs)}")

        print(f"MongoDB에 연결됨: {MONGO_DETAILS}") 
        print(f"사용할 데이터베이스: {DB_NAME}, 컬렉션: {COLLECTION_NAME}, threat_reports")

        # 개발 중일 때는 항상 더미 리포트 데이터를 초기화
        print("DEBUG: Clearing existing threat reports for regeneration...")
        # 먼저 GridFS에 저장된 실제 파일들을 삭제
        existing_reports = await threat_reports_collection.find().to_list(length=None)
        for report in existing_reports:
            try:
                gridfs_file_oid = ObjectId(report['gridfs_file_id'])
                await asyncio.to_thread(fs.delete, gridfs_file_oid)
                print(f"DEBUG: Deleted GridFS file with OID: {gridfs_file_oid}")
            except Exception as delete_e:
                print(f"WARNING: Could not delete GridFS file {report.get('gridfs_file_id')}: {delete_e}")
        
        # 다음으로 메타데이터 컬렉션 삭제
        await threat_reports_collection.delete_many({})
        print("DEBUG: Existing threat reports metadata cleared.")

        # 위협 리포트 컬렉션이 비어 있으면 더미 리포트 생성
        if await threat_reports_collection.count_documents({}) == 0:
            print("위협 리포트 컬렉션이 비어 있습니다. 더미 리포트 생성 중...")
            # fs가 유효한지 다시 확인
            if fs is None or not (hasattr(fs, 'upload_from_stream') and hasattr(fs, 'open_download_stream')):
                raise Exception("GridFSBucket (fs)이 더미 리포트 생성 전에 적절히 초기화되지 않았습니다.")
            await create_dummy_threat_reports()
        else:
            print("위협 리포트 컬렉션에 이미 데이터가 있습니다. 더미 리포트 생성 건너김.")
            
        await daily_data_update_job()

        scheduler.add_job(daily_data_update_job, CronTrigger(hour=0, minute=0, timezone='Asia/Seoul'))
        scheduler.start()
        print("APScheduler 시작됨: 매일 자정에 데이터 업데이트 작업을 수행합니다.")

    except Exception as e:
        print(f"MongoDB 연결 또는 초기화 중 오류 발생: {e}")
        if "database must be an instance of Database" in str(e) or "MotorCollection object is not callable" in str(e):
             print("\n치명적 오류: GridFSBucket 초기화 실패. 'motor' 및 'pymongo' 라이브러리 버전을 확인하고 재설치해보세요. 예를 들어, 'pip install --upgrade motor pymongo'를 시도할 수 있습니다. Python 버전을 안정적인 3.9, 3.10, 3.11, 3.12 중 하나로 변경하는 것을 고려해보세요.")
        raise HTTPException(status_code=500, detail=f"서버 초기화 중 치명적인 오류 발생: {e}")


@app.on_event("shutdown")
async def shutdown_event():
    global db_client, scheduler
    if scheduler.running:
        scheduler.shutdown(wait=False)
        print("APScheduler 종료됨.")
    
    if db_client:
        db_client.close()
        print("MongoDB 연결이 종료되었습니다.")