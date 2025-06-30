from pymongo import MongoClient
import certifi
import hashlib

# DB 연결
uri = "mongodb+srv://stradivirus:1q2w3e4r@cluster0.e7rvfpz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(uri, tlsCAFile=certifi.where())
db = client["blackpink"]
companies_collection = db["companies"]
admin_collection = db["admins"]

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

companies = companies_collection.find({})

# 이미 등록된 담당자(이름+전화번호) set
registered = set()
for company in companies:
    manager_name = company.get("manager_name")
    manager_phone = company.get("manager_phone")
    company_id = company.get("company_id")
    company_name = company.get("company_name")

    # 담당자 정보가 모두 있을 때만 등록
    if manager_name and manager_phone:
        key = (manager_name, manager_phone)
        if key in registered:
            print(f"중복 담당자: {manager_name} / {manager_phone} (스킵)")
            continue
        userId = f"{company_id}_manager"
        password = hash_password("test1234")
        admin = {
            "userId": userId,
            "password": password,
            "nickname": manager_name,
            "team": "사업팀",
            "phone": manager_phone,
            "company_id": company_id,
            "company_name": company_name
        }
        if not admin_collection.find_one({"userId": userId}):
            admin_collection.insert_one(admin)
            print(f"등록 완료: {userId} / {manager_name} / {manager_phone} / {company_name}")
        else:
            print(f"이미 존재: {userId}")
        registered.add(key)

print("중복 담당자 제외, 회사 담당자 사업팀 어드민 등록 완료!")