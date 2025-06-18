from datetime import datetime, timedelta
from pymongo import MongoClient
import random

uri = "mongodb+srv://stradivirus:1q2w3e4r@cluster0.e7rvfpz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(uri)
db = client["blackpink"]

system_collection = db["company_dev"]

# 회사 목록을 DB에서 불러오기
companies = list(db["companies"].find({}))

# company_id로 접근할 수 있도록 딕셔너리 생성
company_id_map = {c["company_name"]: c["company_id"] for c in companies}

# OS 및 버전 정의
os_info = {
    "Windows": ["7", "8", "10", "11"],
    "Linux": ["Ubuntu 18.04", "Ubuntu 20.04", "Ubuntu 22.04", "Rocky 8", "Rocky 9"],
    "Android": ["10", "11", "12", "13"],
    "macOS": ["11", "12", "13", "14"],
    "iOS": ["15", "16", "17"]
}

# 운영 상태(유지보수) 5단계
maintenance_statuses = [
    "정상 운영중",
    "점검 예정",
    "점검 진행중",
    "장애 발생",
    "서비스 종료"
]

today = datetime(2025, 6, 18)
start_date = datetime(2023, 1, 1)
end_date = today

def random_date(start, end):
    delta = end - start
    return start + timedelta(days=random.randint(0, delta.days))

system_data = []

# 10% (30건) 다중 운영체제
for _ in range(30):
    company = random.choice(companies)
    os_types = random.sample(list(os_info.keys()), k=random.randint(2, 3))
    for os_type in os_types:
        os_version = random.choice(os_info[os_type])
        dev_start = random_date(start_date, end_date)
        dev_end = dev_start + timedelta(days=random.randint(30, 730))
        progress = random.randint(0, 100)
        maintenance = random.choice(maintenance_statuses)
        entry = {
            "company_id": company["company_id"],  # company_name → company_id로 변경
            "os": os_type,
            "os_version": os_version,
            "dev_start_date": dev_start.strftime("%Y-%m-%d"),
            "dev_end_date": dev_end.strftime("%Y-%m-%d"),
            "progress": progress,
            "maintenance": maintenance
        }
        system_data.append(entry)

# 나머지 270건 단일 운영체제
for _ in range(270):
    company = random.choice(companies)
    os_type = random.choice(list(os_info.keys()))
    os_version = random.choice(os_info[os_type])
    dev_start = random_date(start_date, end_date)
    dev_end = dev_start + timedelta(days=random.randint(30, 730))
    progress = random.randint(0, 100)
    maintenance = random.choice(maintenance_statuses)
    entry = {
        "company_id": company["company_id"],  # company_name → company_id로 변경
        "os": os_type,
        "os_version": os_version,
        "dev_start_date": dev_start.strftime("%Y-%m-%d"),
        "dev_end_date": dev_end.strftime("%Y-%m-%d"),
        "progress": progress,
        "maintenance": maintenance
    }
    system_data.append(entry)

system_collection.delete_many({})
system_collection.insert_many(system_data)
print("개발 데이터 300건 저장 완료")