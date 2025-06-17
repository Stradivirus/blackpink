from fastapi import APIRouter, HTTPException
from db import member_collection, admin_collection
from passlib.hash import bcrypt
from models import MemberLoginRequest

router = APIRouter()

@router.post("/api/login")
def universal_login(req: MemberLoginRequest):
    # 1. 일반 회원 조회
    member = member_collection.find_one({"userId": req.userId})
    if member and bcrypt.verify(req.password, member["password"]):
        return {
            "id": str(member["_id"]),
            "userId": member["userId"],
            "nickname": member["nickname"],
            "type": "member"  # 여기만 "member"로 변경
        }
    # 2. 관리자 조회
    admin = admin_collection.find_one({"userId": req.userId})
    if admin and bcrypt.verify(req.password, admin["password"]):
        return {
            "id": str(admin["_id"]),
            "userId": admin["userId"],
            "nickname": admin["nickname"],
            "type": "admin"
        }
    raise HTTPException(400, "아이디 또는 비밀번호가 올바르지 않습니다.")