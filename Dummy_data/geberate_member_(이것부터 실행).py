from faker import Faker
from passlib.hash import bcrypt  # hashlib 대신 bcrypt 사용
from db_connection import get_db_connection

# DB 연결
db = get_db_connection()
admin_collection = db["admins"]

# 기존 관리자 데이터 전체 삭제
admin_collection.delete_many({})
print("기존 관리자(admins) 데이터 전체 삭제 완료.")

teams = [
    ("관리팀", 10),
    ("사업팀", 10),
    ("보안팀", 20),
    ("개발팀", 20)
]
fake = Faker("ko_KR")

def hash_password(password: str) -> str:
    return bcrypt.hash(password)  # bcrypt 해싱 사용

# 최고관리자(admin/1q2w3e4r) 계정 생성
super_admin = {
    "userId": "admin",
    "password": hash_password("1q2w3e4r"),
    "nickname": "최고관리자",
    "team": "관리팀",
    "phone": "010-0000-0000"
}
admin_collection.insert_one(super_admin)
print("최고관리자(admin/1q2w3e4r) 계정 생성 완료.")

# 각 팀별 더미 관리자 생성
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

print("최고관리자 1명, 관리팀 10명, 사업팀 10명, 보안팀 20명, 개발팀 20명(전화번호 포함) 생성 완료!")