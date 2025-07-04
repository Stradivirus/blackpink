from fastapi import APIRouter, HTTPException, Body
from db import member_collection, admin_collection
from passlib.hash import bcrypt
from models import MemberLoginRequest

router = APIRouter()

# 회원은 member_collection에서, 관리자는 admin_collection에서 사용자 정보를 조회
# account_type이 "admin"이면 admin_collection, 아니면 member_collection 반환
def get_collection(account_type: str):
    return admin_collection if account_type == "admin" else member_collection

def is_duplicate(field: str, value: str):
    # admin과 member 컬렉션 모두에서 중복 값이 있는지 확인
    return bool(
        admin_collection.find_one({field: value}) or
        member_collection.find_one({field: value})
    )
    
# 회원/관리자 통합 로그인 엔드포인트
# userId와 password로 회원 또는 관리자를 인증하여 로그인 처리
@router.post("/api/login")
def universal_login(req: MemberLoginRequest):
    member = member_collection.find_one({"userId": req.userId})
    if member and bcrypt.verify(req.password, member["password"]):
        return {
            "id": str(member["_id"]),
            "userId": member["userId"],
            "nickname": member["nickname"],
            "type": "member",
            "team": member.get("team", None)
        }
    admin = admin_collection.find_one({"userId": req.userId})
    if admin and bcrypt.verify(req.password, admin["password"]):
        return {
            "id": str(admin["_id"]),
            "userId": admin["userId"],
            "nickname": admin["nickname"],
            "type": "admin",
            "team": admin.get("team", "관리팀")
        }
    raise HTTPException(400, "아이디 또는 비밀번호가 올바르지 않습니다.")

# 회원/관리자 비밀번호 변경 엔드포인트
# userId, 기존 비밀번호, 새 비밀번호, 계정 타입을 받아 비밀번호를 변경
@router.post("/api/change-password")
def change_password(
    userId: str = Body(...),
    old_password: str = Body(...),
    new_password: str = Body(...),
    accountType: str = Body("member")
):
    collection = get_collection(accountType)

    user = collection.find_one({"userId": userId})
    if not user or not bcrypt.verify(old_password, user["password"]):
        raise HTTPException(400, "아이디 또는 비밀번호가 올바르지 않습니다.")
    hashed_new = bcrypt.hash(new_password)
    collection.update_one(
        {"userId": userId},
        {"$set": {"password": hashed_new}}
    )
    return {"message": "비밀번호가 성공적으로 변경되었습니다."}

# 회원/관리자 닉네임 변경 엔드포인트
# userId, 새 닉네임, 계정 타입을 받아 닉네임을 변경
@router.post("/api/change-nickname")
def change_nickname(
    userId: str = Body(...),
    new_nickname: str = Body(...),
    accountType: str = Body("member")
):
    collection = get_collection(accountType)
    if is_duplicate("nickname", new_nickname):
        raise HTTPException(400, "이미 사용 중인 닉네임입니다.")
    user = collection.find_one({"userId": userId})
    if not user:
        raise HTTPException(400, "사용자를 찾을 수 없습니다.")
    collection.update_one(
        {"userId": userId},
        {"$set": {"nickname": new_nickname}}
    )
    return {"message": "닉네임이 성공적으로 변경되었습니다.", "nickname": new_nickname}