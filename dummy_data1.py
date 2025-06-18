from pymongo import MongoClient
from faker import Faker
import random
from datetime import datetime, timedelta

uri = "mongodb+srv://stradivirus:1q2w3e4r@cluster0.e7rvfpz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(uri)
db = client["blackpink"]
company_collection = db["companies"]

faker = Faker("ko_KR")

industries = ["IT", "제조", "금융", "유통"]
industry_prefix = {
    "IT": "I",
    "제조": "M",
    "금융": "F",
    "유통": "D"
}
plans = ["베이직", "프로", "엔터프라이즈"]

# 담당자 10명 생성
manager_list = []
for _ in range(10):
    name = faker.name()
    phone = faker.phone_number()
    manager_list.append({"name": name, "phone": phone})

# 업종별 일련번호 카운터
industry_counter = {k: 1 for k in industries}

# 회사 200개 생성
companies = []
for idx in range(1, 201):
    industry = random.choice(industries)
    prefix = industry_prefix[industry]
    company_id = f"{prefix}{industry_counter[industry]:05d}"
    industry_counter[industry] += 1
    company = {
        "company_id": company_id,
        "company_name": faker.company(),
        "industry": industry,
        "plan": random.choice(plans),
        "manager_name": manager_list[idx % 10]["name"],
        "manager_phone": manager_list[idx % 10]["phone"]
    }
    companies.append(company)

# 계약 상태 리스트
contract_statuses = ['진행중', '만료', '해지', '예정']

def random_date(start, end):
    """start~end 사이의 랜덤 날짜 반환"""
    delta = end - start
    random_days = random.randint(0, delta.days)
    return start + timedelta(days=random_days)

# 예시: 2023년 1월 1일 ~ 2025년 6월 18일 사이 랜덤 계약 시작일
today = datetime(2025, 6, 18)
start_date = datetime(2023, 1, 1)
end_date = today

for company in companies:
    contract_start = random_date(start_date, end_date)
    # 계약 종료일은 시작일 이후 1~365일 사이
    contract_end = contract_start + timedelta(days=random.randint(1, 365))
    # 계약 상태 결정
    if contract_start > today:
        status = "예정"
    elif contract_start <= today <= contract_end:
        status = "진행중"
    elif today > contract_end:
        status = "만료"
    # 해지 상태는 랜덤하게 일부만 부여 (예시)
    if random.random() < 0.1:
        status = "해지"
    company["contract_start"] = contract_start
    company["contract_end"] = contract_end
    company["status"] = status

company_collection.delete_many({})
company_collection.insert_many(companies)
print("회사 200개 저장 완료")
