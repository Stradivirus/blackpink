from datetime import datetime, timedelta
from pymongo import MongoClient
from faker import Faker
import random

uri = "mongodb+srv://stradivirus:1q2w3e4r@cluster0.e7rvfpz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(uri)
db = client["blackpink"]

incident_collection = db["incident_logs"]

# 회사 목록을 DB에서 불러오기
companies = list(db["companies"].find({}))

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

start_date = datetime(2025, 1, 1)
end_date = datetime(2025, 7, 1)
today = datetime(2025, 7, 1)

def random_date(start, end):
    delta = end - start
    return start + timedelta(days=random.randint(0, delta.days))

company_ids = [c["company_id"] for c in companies]
random.shuffle(company_ids)
incident_targets = []

# 20개: 0건
# 30개: 1~2건
for cid in company_ids[20:50]:
    for _ in range(random.randint(1,2)):
        incident_targets.append(cid)
# 30개: 3~5건
for cid in company_ids[50:80]:
    for _ in range(random.randint(3,5)):
        incident_targets.append(cid)
# 20개: 10~20건
for cid in company_ids[80:100]:
    for _ in range(random.randint(10,20)):
        incident_targets.append(cid)
# 나머지: 6~9건씩, 1000개 맞추기
remaining = 1000 - len(incident_targets)
for cid in company_ids[100:]:
    n = min(random.randint(6,9), remaining)
    for _ in range(n):
        incident_targets.append(cid)
    remaining -= n
    if remaining <= 0:
        break

random.shuffle(incident_targets)
incident_targets = incident_targets[:1000]

incident_data = []
# incident_date별로 순번 관리
date_counter = {}

for idx, cid in enumerate(incident_targets, 1):
    incident_date = random_date(start_date, end_date)
    date_str = incident_date.strftime("%y%m%d")
    if date_str not in date_counter:
        date_counter[date_str] = 1
    else:
        date_counter[date_str] += 1
    seq = date_counter[date_str]
    incident_no = f"{date_str}{seq:04d}"

    handled = random.choice([True, False])
    # 처리일이 today(7월 1일) 이후면 None으로 저장
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

    entry = {
        "incident_no": incident_no,
        "company_id": cid,
        "threat_type": random.choice(threat_types),
        "risk_level": risk_level,
        "server_type": random.choice(server_types),
        "incident_date": incident_date.strftime("%Y-%m-%d"),
        "handled_date": handled_date.strftime("%Y-%m-%d") if handled_date else None,
        "status": status,
        "action": random.choice(actions),
        "handler_count": handler_count
    }
    incident_data.append(entry)

incident_collection.delete_many({})
incident_collection.insert_many(incident_data)
print("보안 사고 1000건 저장 완료")
