from pymongo import MongoClient
import certifi
from faker import Faker
import hashlib

# DB 연결
uri = "mongodb+srv://stradivirus:1q2w3e4r@cluster0.e7rvfpz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(uri, tlsCAFile=certifi.where())
db = client["blackpink"]
admin_collection = db["admins"]

teams = [
    ("관리팀", 10),
    ("보안팀", 20),
    ("개발팀", 20)
]
fake = Faker("ko_KR")

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

for team, count in teams:
    for i in range(1, count + 1):
        userId = f"{team[:2]}admin{i:02d}"
        nickname = fake.name()
        phone = fake.phone_number()
        password = hash_password("test1234")
        admin = {
            "userId": userId,
            "password": password,
            "nickname": nickname,
            "team": team,
            "phone": phone
        }
        admin_collection.insert_one(admin)
        print(f"Inserted: {userId} / {nickname} / {team} / {phone}")

print("관리팀 10명, 보안팀 20명, 개발팀 20명(전화번호 포함) 생성 완료!")