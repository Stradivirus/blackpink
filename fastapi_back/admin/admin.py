import random
import string
from datetime import datetime
from fastapi import APIRouter, HTTPException, Body
from db import member_collection, admin_collection
from passlib.hash import bcrypt
from bson.objectid import ObjectId
from models import AdminCreateRequest, AdminLoginRequest, AdminResponse, MemberResponse

import smtplib
from email.mime.text import MIMEText

router = APIRouter()

def generate_temp_password(length=10):
    chars = string.ascii_letters + string.digits
    return ''.join(random.choice(chars) for _ in range(length))

def send_email(to_email: str, user_id: str, temp_password: str):
    smtp_server = "smtp.naver.com"
    smtp_port = 587
    smtp_user = "stradivirus@naver.com"  # 실제 이메일로 변경
    smtp_password = "R6LZJP61QE4R"  # 앱 비밀번호 등으로 변경

    subject = "임시 비밀번호 안내"
    body = f"안녕하세요.\n\n아이디: {user_id}\n임시 비밀번호: {temp_password}\n로그인 후 비밀번호를 꼭 변경해주세요."
    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = smtp_user
    msg["To"] = to_email

    with smtplib.SMTP(smtp_server, smtp_port) as server:
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.sendmail(smtp_user, to_email, msg.as_string())

def create_member(userId: str, nickname: str, email: str, accountType: str = "member", team: str = None):
    temp_password = generate_temp_password()
    hashed_password = bcrypt.hash(temp_password)
    member = {
        "userId": userId,
        "nickname": nickname,
        "password": hashed_password,
        "email": email,
        "joinedAt": datetime.now()
    }
    if accountType == "admin":
        collection = admin_collection
        if team:
            member["team"] = team
    else:
        collection = member_collection
    if collection.find_one({"userId": userId}):
        raise ValueError("이미 존재하는 아이디입니다.")
    collection.insert_one(member)
    send_email(email, userId, temp_password)
    return member

@router.post("/api/admin/join", response_model=AdminResponse)
def admin_join(req: AdminCreateRequest):
    if admin_collection.find_one({"userId": req.userId}):
        raise HTTPException(400, "이미 존재하는 관리자입니다.")
    hashed_pw = bcrypt.hash(req.password)
    admin = {
        "userId": req.userId,
        "password": hashed_pw,
        "nickname": req.nickname,
        "team": req.team,
    }
    result = admin_collection.insert_one(admin)
    admin["id"] = str(result.inserted_id)
    return AdminResponse(
        id=admin["id"],
        userId=admin["userId"],
        nickname=admin["nickname"],
        team=admin["team"],
    )

@router.get("/api/admin/list", response_model=list[AdminResponse])
def admin_list():
    admins = admin_collection.find()
    return [
        AdminResponse(
            id=str(a["_id"]),
            userId=a["userId"],
            nickname=a["nickname"],
            team=a.get("team", "관리팀"),
        )
        for a in admins
    ]

@router.post("/api/admin/member-invite")
def admin_member_invite(
    userId: str = Body(...),
    nickname: str = Body(...),
    email: str = Body(...),
    accountType: str = Body("member"),
    team: str = Body(None)
):
    try:
        member = create_member(userId, nickname, email, accountType, team)
        return {"message": "임시 비밀번호가 이메일로 발송되었습니다.", "userId": userId}
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, f"오류 발생: {e}")

@router.get("/api/admin/check-duplicate")
def check_duplicate(field: str, value: str, accountType: str = "member"):
    if field not in ["userId", "nickname"]:
        raise HTTPException(400, "허용되지 않는 필드입니다.")
    collection = admin_collection if accountType == "admin" else member_collection
    exists = collection.find_one({field: value})
    return {"exists": bool(exists)}

@router.get("/api/member/list", response_model=list[MemberResponse])
def member_list():
    members = member_collection.find()
    return [
        MemberResponse(
            id=str(m["_id"]),
            userId=m["userId"],
            nickname=m["nickname"],
            email=m["email"],
            joinedAt=m["joinedAt"].date() if hasattr(m["joinedAt"], "date") else m["joinedAt"],
        )
        for m in members
    ]