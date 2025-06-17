from fastapi import APIRouter, HTTPException, Body
from db import admin_collection
from passlib.hash import bcrypt
from bson.objectid import ObjectId
from models import AdminCreateRequest, AdminLoginRequest, AdminResponse
from admin.generate_member import create_member
import traceback

router = APIRouter()

@router.post("/api/admin/join", response_model=AdminResponse)
def admin_join(req: AdminCreateRequest):
    if admin_collection.find_one({"userId": req.userId}):
        raise HTTPException(400, "이미 존재하는 관리자입니다.")
    hashed_pw = bcrypt.hash(req.password)
    admin = {
        "userId": req.userId,
        "password": hashed_pw,
        "nickname": req.nickname,
    }
    result = admin_collection.insert_one(admin)
    admin["id"] = str(result.inserted_id)
    return AdminResponse(id=admin["id"], userId=admin["userId"], nickname=admin["nickname"])

@router.get("/api/admin/list", response_model=list[AdminResponse])
def admin_list():
    admins = admin_collection.find()
    return [
        AdminResponse(id=str(a["_id"]), userId=a["userId"], nickname=a["nickname"])
        for a in admins
    ]

@router.post("/api/admin/member-invite")
def admin_member_invite(
    userId: str = Body(...),
    nickname: str = Body(...),
    email: str = Body(...)
):
    try:
        member = create_member(userId, nickname, email)
        return {"message": "임시 비밀번호가 이메일로 발송되었습니다.", "userId": userId}
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        traceback.print_exc()  # 에러 전체 로그를 터미널에 출력
        raise HTTPException(500, f"회원 생성 또는 이메일 발송에 실패했습니다: {e}")