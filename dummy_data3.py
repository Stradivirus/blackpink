import random
from datetime import datetime, timedelta
from pymongo import MongoClient
from faker import Faker

fake = Faker()


uri = "mongodb+srv://stradivirus:1q2w3e4r@cluster0.e7rvfpz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(uri)
db = client["blackpink"]

system_collection = db["sys_dev"]
admin_collection = db["admins"]  # admin 컬렉션 추가

# 회사 목록을 DB에서 불러오기
companies = list(db["companies"].find({}))

# admin 컬렉션에서 team이 "개발팀"인 담당자들 가져오기
dev_team_managers = list(admin_collection.find({"team": "개발팀"}))
print(f"개발팀 담당자 {len(dev_team_managers)}명 발견")

if not dev_team_managers:
    print("개발팀 담당자가 없습니다. 더미 담당자를 생성합니다.")
    # 더미 담당자 생성
    dev_managers = []
    for i in range(5):
        dev_managers.append({
            "name": fake.name(),
            "phone": fake.phone_number()
        })
else:
    # 개발팀 담당자들을 manager 형태로 변환
    dev_managers = []
    for manager in dev_team_managers:
        dev_managers.append({
            "name": manager["nickname"],
            "phone": manager.get("phone", fake.phone_number())  # phone이 없으면 더미 생성
        })
    print(f"개발팀 담당자 {len(dev_managers)}명을 담당자로 배정합니다.")

# company_id로 접근할 수 있도록 딕셔너리 생성
company_id_map = {c["company_name"]: c["company_id"] for c in companies}

# OS options - OS 종류와 버전을 분리
os_info = {
    "Windows": ["7", "8", "10", "11"],
    "Linux": ["Ubuntu 18.04", "Ubuntu 20.04", "Ubuntu 22.04", "Rocky 8", "Rocky 9"],
    "Android": ["10", "11", "12", "13"],
    "macOS": ["11", "12", "13", "14"],
    "iOS": ["15", "16", "17"]
}

# Statuses
dev_statuses = ["개발 완료", "개발 진행중", "개발 예정", "개발 중지"]
maintenance_statuses = ["정상 운영중", "점검 예정", "점검 진행중", "장애 발생"]
error_statuses = {
    "에러 없음": ["에러 없음"],
    "에러 있음": [
        "서버 에러",
        "외부 에러",
        "네트워크 에러",
        "데이터베이스 에러",
        "클라이언트 에러",
    ]
}

def generate_os_info():
    """하나의 OS 종류와 하나의 버전을 반환"""
    os_name = random.choice(list(os_info.keys()))
    version = random.choice(os_info[os_name])
    return os_name, version

def generate_projects(n=300):
    projects = []
    today = datetime.today().date()
    start_date_min = datetime(2023, 1, 1)
    
    for i in range(n):
        # 각 프로젝트마다 다른 회사 선택
        company = random.choice(companies)
        # 개발팀 담당자를 순환하면서 배정
        manager = dev_managers[i % len(dev_managers)]
        
        start_date = fake.date_between(start_date_min, today)
        dev_days = random.randint(30, 500)
        end_date = (start_date + timedelta(days=dev_days))
        end_date_str = end_date.strftime("%Y-%m-%d")
        end_date_fin = None if end_date > today else end_date_str
        handler_count = random.randint(2, 8)

        if end_date <= today:
            if random.random() < 0.8:
                dev_status = "개발 완료"
                maintenance = random.choice(maintenance_statuses)
                if maintenance == "정상 운영중":
                    error = "에러 없음"
                else:
                    error = random.choice(error_statuses["에러 있음"])
            else:
                dev_status = random.choice(["개발 진행중", "개발 중지", "개발 예정"])
                maintenance = None
                error = None
        else:
            dev_status = random.choice(["개발 진행중", "개발 중지", "개발 예정"])
            maintenance = None
            error = None

        # 하나의 OS와 하나의 버전만 선택
        os_type, os_version = generate_os_info()

        project = {
            "company_id": company["company_id"],
            "company_name": company["company_name"],
            "os": os_type,  # 단일 OS 종류 (문자열)
            "os_version": os_version,  # 단일 OS 버전 (문자열)
            "start_date": start_date.strftime("%Y-%m-%d"),
            "end_date": end_date.strftime("%Y-%m-%d"),
            "end_date_fin": end_date_fin,
            "dev_days": dev_days,
            "dev_status": dev_status,
            "maintenance": maintenance,
            "error": error,
            "handler_count": handler_count,
            "manager_name": manager["name"],  # 개발팀 담당자 이름 추가
            "manager_phone": manager["phone"]  # 개발팀 담당자 연락처 추가
        }

        projects.append(project)

    return projects

# Generate and preview
projects = generate_projects()
system_collection.delete_many({})
system_collection.insert_many(projects)
print("개발 프로젝트 300건 저장 완료")
print(f"사용된 담당자: {len(set([p['manager_name'] for p in projects]))}명")
for p in projects[:5]:
    print(p)