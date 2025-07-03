from datetime import datetime, timedelta
from pymongo import MongoClient
from faker import Faker
import random

uri = "mongodb+srv://stradivirus:1q2w3e4r@cluster0.e7rvfpz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(uri)
db = client["blackpink"]

incident_collection = db["incident_logs"]

# 회사 목록을 DB에서 불러오기 (company_id와 company_name 포함)
companies = list(db["companies"].find({}, {"company_id": 1, "company_name": 1, "_id": 0}))
print(f"회사 데이터 {len(companies)}개 로드됨")

# 보안팀 관리자 목록을 DB에서 불러오기
security_admins = list(db["admins"].find({"team": "보안팀"}, {"nickname": 1, "phone": 1, "_id": 0}))
print(f"보안팀 관리자 {len(security_admins)}명 로드됨")

# 사고 유형 및 기타 설정값들
threat_types = [
    "악성코드", "해킹공격", "피싱", "랜섬웨어", "DDoS",
    "웹취약점", "자격증명 탈취", "메시지 가로채기"
]
risk_levels = ["HIGH", "MEDIUM", "LOW"]
server_types = ["웹서버", "DB서버", "애플리케이션서버", "인증서버"]
statuses = ["처리중", "미처리", "처리완료"]
actions = [
    "ip 차단", "패치적용", "계정잠금", "백업복구", "접근제어 강화",
    "모니터링 강화", "보안 교육 실시", "방화벽 설정"
]

start_date = datetime(2024, 1, 1)
end_date = datetime(2026, 1, 1)
today = datetime(2025, 7, 3)

def random_date(start, end):
    delta = end - start
    return start + timedelta(days=random.randint(0, delta.days))

# 회사별 사고 건수 분배
company_data = [(c["company_id"], c["company_name"]) for c in companies]
random.shuffle(company_data)
incident_targets = []

# 20개: 0건 (사고 없음)
# 30개: 1~2건
for company_id, company_name in company_data[20:50]:
    for _ in range(random.randint(1, 2)):
        incident_targets.append((company_id, company_name))

# 30개: 3~5건
for company_id, company_name in company_data[50:80]:
    for _ in range(random.randint(3, 5)):
        incident_targets.append((company_id, company_name))

# 20개: 10~20건
for company_id, company_name in company_data[80:100]:
    for _ in range(random.randint(10, 20)):
        incident_targets.append((company_id, company_name))

# 나머지: 6~9건씩, 1000개 맞추기
remaining = 1000 - len(incident_targets)
for company_id, company_name in company_data[100:]:
    if remaining <= 0:
        break
    n = min(random.randint(6, 9), remaining)
    for _ in range(n):
        incident_targets.append((company_id, company_name))
    remaining -= n

# 최종적으로 1000개로 맞추기
random.shuffle(incident_targets)
incident_targets = incident_targets[:1000]

incident_data = []
# incident_date별로 순번 관리
date_counter = {}

for idx, (company_id, company_name) in enumerate(incident_targets, 1):
    incident_date = random_date(start_date, end_date)
    date_str = incident_date.strftime("%y%m%d")
    if date_str not in date_counter:
        date_counter[date_str] = 1
    else:
        date_counter[date_str] += 1
    seq = date_counter[date_str]
    incident_no = f"{date_str}{seq:04d}"

    handled = random.choice([True, False])
    # 처리일이 today(7월 3일) 이후면 None으로 저장
    if handled:
        temp_handled_date = incident_date + timedelta(days=random.randint(1, 10))
        if temp_handled_date <= today:
            handled_date = temp_handled_date
        else:
            handled_date = None
    else:
        handled_date = None

    # 상태 결정
    if handled_date:
        status = "처리완료"
    elif incident_date <= today:
        status = "진행중"
    else:
        status = "예정"

    risk_level = random.choice(risk_levels)
    if risk_level == "HIGH":
        handler_count = random.randint(7, 10)
    elif risk_level == "MEDIUM":
        handler_count = random.randint(4, 7)
    else:
        handler_count = random.randint(1, 4)

    # 보안팀 담당자 랜덤 선택
    if security_admins:
        selected_admin = random.choice(security_admins)
        manager_name = selected_admin["nickname"]
        manager_phone = selected_admin.get("phone", "")
    else:
        manager_name = "미배정"
        manager_phone = ""

    entry = {
        "incident_no": incident_no,
        "company_id": company_id,
        "company_name": company_name,  # 회사명 추가
        "threat_type": random.choice(threat_types),
        "risk_level": risk_level,
        "server_type": random.choice(server_types),
        "incident_date": incident_date.strftime("%Y-%m-%d"),
        "handled_date": handled_date.strftime("%Y-%m-%d") if handled_date else None,
        "status": status,
        "action": random.choice(actions),
        "handler_count": handler_count,
        "manager_name": manager_name,  # 담당자명 추가
        "manager_phone": manager_phone  # 담당자 연락처 추가
    }
    incident_data.append(entry)

# 기존 데이터 삭제 후 새 데이터 삽입
incident_collection.delete_many({})
incident_collection.insert_many(incident_data)

print(f"보안 사고 {len(incident_data)}건 저장 완료")
print(f"사용된 회사: {len(set(target[0] for target in incident_targets))}개")
print(f"보안팀 담당자: {len(security_admins)}명")
