from db import admin_collection
from passlib.hash import bcrypt

def create_admin(userId: str, password: str, nickname: str):
    if admin_collection.find_one({"userId": userId}):
        print("이미 존재하는 관리자입니다.")
        return
    hashed_pw = bcrypt.hash(password)
    admin = {
        "userId": userId,
        "password": hashed_pw,
        "nickname": nickname,
    }
    result = admin_collection.insert_one(admin)
    print(f"관리자 계정 생성 완료! id: {result.inserted_id}")

if __name__ == "__main__":
    # 여기에 원하는 관리자 계정 정보 입력
    userId = "admin1"
    password = "1q2w3e4r"
    nickname = "최고관리자"

    create_admin(userId, password, nickname)