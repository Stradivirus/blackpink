import random
from datetime import datetime, timedelta
from pymongo import MongoClient
from faker import Faker

fake = Faker()


uri = "mongodb+srv://stradivirus:1q2w3e4r@cluster0.e7rvfpz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(uri)
db = client["blackpink"]

system_collection = db["sys_dev"]

# 회사 목록을 DB에서 불러오기
companies = list(db["companies"].find({}))

# company_id로 접근할 수 있도록 딕셔너리 생성
company_id_map = {c["company_name"]: c["company_id"] for c in companies}

# OS options
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

def generate_os_list(multiple=False):
    os_list = random.sample(list(os_info.items()), k=random.randint(2, 3) if multiple else 1)
    result = []
    for os_name, versions in os_list:
        version = random.choice(versions)
        result.append(f"{os_name} {version}")
    return result

def generate_projects(n=300):
    projects = []
    today = datetime.today().date()
    start_date_min = datetime(2023, 1, 1)
    company = random.choice(companies)
    for i in range(n):
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

        multiple_os = i < 30  # first 30 have multiple OS
        os_versions = generate_os_list(multiple=multiple_os)

        project = {
            "company_id": company["company_id"],
            "company_name": company["company_name"],
            "os": os_versions,
            "start_date": start_date.strftime("%Y-%m-%d"),
            "end_date": end_date.strftime("%Y-%m-%d"),
            "end_date_fin": end_date_fin,
            "dev_days": dev_days,
            "dev_status": dev_status,
            "maintenance": maintenance,
            "error": error,
            "handler_count": handler_count
        }

        projects.append(project)

    return projects

# Generate and preview
projects = generate_projects()
system_collection.delete_many({})
system_collection.insert_many(projects)
for p in projects[:5]:
    print(p)