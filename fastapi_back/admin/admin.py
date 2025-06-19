from fastapi import APIRouter, HTTPException, Body
from db import member_collection, admin_collection
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
        "team": req.team,  # team 추가
    }
    result = admin_collection.insert_one(admin)
    admin["id"] = str(result.inserted_id)
    return AdminResponse(
        id=admin["id"],
        userId=admin["userId"],
        nickname=admin["nickname"],
        team=admin["team"],  # team 추가
    )

@router.get("/api/admin/list", response_model=list[AdminResponse])
def admin_list():
    admins = admin_collection.find()
    return [
        AdminResponse(
            id=str(a["_id"]),
            userId=a["userId"],
            nickname=a["nickname"],
            team=a.get("team", "관리팀"),  # team이 없으면 "관리팀" 기본값
        )
        for a in admins
    ]

@router.post("/api/admin/member-invite")
def admin_member_invite(
    userId: str = Body(...),
    nickname: str = Body(...),
    email: str = Body(...),
    accountType: str = Body("member"),  # 기본값 "member"
    team: str = Body(None)  # team 파라미터 추가
):
    try:
        member = create_member(userId, nickname, email, accountType, team)  # team 전달
        return {"message": "임시 비밀번호가 이메일로 발송되었습니다.", "userId": userId}
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"회원 생성 또는 이메일 발송에 실패했습니다: {e}")

@router.get("/api/admin/check-duplicate")
def check_duplicate(field: str, value: str, accountType: str = "member"):
    if field not in ["userId", "nickname"]:
        raise HTTPException(400, "허용되지 않는 필드입니다.")
    collection = admin_collection if accountType == "admin" else member_collection
    exists = collection.find_one({field: value})
    return {"exists": bool(exists)}