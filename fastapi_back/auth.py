from fastapi import APIRouter, HTTPException, Body
from db import member_collection, admin_collection
from passlib.hash import bcrypt
from models import MemberLoginRequest

router = APIRouter()
# 이 엔드포인트는 회원과 관리자가 동일한 비밀번호 변경 로직을 사용하도록 통합
# 회원은 member_collection에서, 관리자는 admin_collection에서 사용자 정보를 조회

# 회원/관리자 통합 로그인 엔드포인트
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
@router.post("/api/change-password")
def change_password(
    userId: str = Body(...),
    old_password: str = Body(...),
    new_password: str = Body(...),
    accountType: str = Body("member")
):
    if accountType == "admin":
        collection = admin_collection
    else:
        collection = member_collection

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
@router.post("/api/change-nickname")
def change_nickname(
    userId: str = Body(...),
    new_nickname: str = Body(...),
    accountType: str = Body("member")
):
    if accountType == "admin":
        collection = admin_collection
    else:
        collection = member_collection

    user = collection.find_one({"userId": userId})
    if not user:
        raise HTTPException(400, "사용자를 찾을 수 없습니다.")
    collection.update_one(
        {"userId": userId},
        {"$set": {"nickname": new_nickname}}
    )
    return {"message": "닉네임이 성공적으로 변경되었습니다.", "nickname": new_nickname}