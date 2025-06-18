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
    "악성코드", "해킹공격", "피싱", "APT공격", "랜섬웨어", "DDoS", "내부자위협",
    "공급망공격", "웹취약점", "소셜엔지니어링", "자격증명 탈취", "메시지 가로채기", "스팸"
]
risk_levels = ["HIGH", "MEDIUM", "LOW"]
server_types = ["웹서버", "DB서버", "파일서버", "애플리케이션서버", "메일서버", "FTP서버", "인증서버"]
statuses = ["처리중", "미처리", "처리완료"]
actions = [
    "ip 차단", "패치적용", "로그삭제", "계정잠금", "백업복구", "접근제어 강화",
    "모니터링 강화", "보안 교육 실시", "다중 인증 적용", "방화벽 설정"
]

start_date = datetime(2025, 1, 1)
end_date = datetime(2025, 6, 18)

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
# 나머지: 6~9건씩, 500개 맞추기
remaining = 500 - len(incident_targets)
for cid in company_ids[100:]:
    n = min(random.randint(6,9), remaining)
    for _ in range(n):
        incident_targets.append(cid)
    remaining -= n
    if remaining <= 0:
        break

random.shuffle(incident_targets)
incident_targets = incident_targets[:500]

incident_data = []
for idx, cid in enumerate(incident_targets, 1):
    incident_date = random_date(start_date, end_date)
    handled = random.choice([True, False])
    handled_date = (incident_date + timedelta(days=random.randint(1, 10))) if handled else None
    status = "처리완료" if handled else random.choice(["처리중", "미처리"])
    risk_level = random.choice(risk_levels)
    
    # 위험도에 따라 담당 인원 수 결정
    if risk_level == "HIGH":
        handler_count = random.randint(7, 10)
    elif risk_level == "MEDIUM":
        handler_count = random.randint(4, 7)
    else:  # LOW
        handler_count = random.randint(1, 4)
    
    entry = {
        "incident_no": idx,
        "company_id": cid,
        "threat_type": random.choice(threat_types),
        "risk_level": risk_level,
        "server_type": random.choice(server_types),
        "incident_date": incident_date.strftime("%Y-%m-%d"),
        "handled_date": handled_date.strftime("%Y-%m-%d") if handled_date else None,
        "status": status,
        "action": random.choice(actions),
        "handler_count": handler_count  # 담당 인원 수만 추가
    }
    incident_data.append(entry)

incident_collection.delete_many({})
incident_collection.insert_many(incident_data)
print("보안 사고 500건 저장 완료")
