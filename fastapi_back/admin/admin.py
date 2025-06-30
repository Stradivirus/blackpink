import random
import string
from datetime import datetime
from fastapi import APIRouter, HTTPException, Body, Query
from db import member_collection, admin_collection, companies_collection
from passlib.hash import bcrypt
from models import AdminCreateRequest, AdminResponse, MemberResponse
from pydantic import BaseModel
import smtplib
from email.mime.text import MIMEText

router = APIRouter()

# 임시 비밀번호 생성 함수
# - 영문 대소문자+숫자 조합의 임시 비밀번호를 랜덤 생성
# - 회원/관리자 초대 시 사용
def generate_temp_password(length=10):
    chars = string.ascii_letters + string.digits
    return ''.join(random.choice(chars) for _ in range(length))

# 이메일 발송 함수
# - SMTP를 이용해 임시 비밀번호 안내 메일 발송
# - 실제 서비스에서는 보안상 앱 비밀번호 등 환경변수로 관리 필요
# - 네이버 SMTP 예시
def send_email(to_email: str, user_id: str, temp_password: str):
    smtp_server = "smtp.naver.com"
    smtp_port = 587
    smtp_user = "stradivirus@naver.com"
    smtp_password = "R6LZJP61QE4R"

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

# 회원/관리자 계정 생성 및 초대 메일 발송 함수
# - company_id, company_name 추가
def create_member(
    userId: str,
    nickname: str,
    email: str,
    accountType: str = "member",
    team: str = None,
    company_id: str = None,
    company_name: str = None
):
    # 관리자와 회원 컬렉션 모두에서 아이디 중복 체크
    if admin_collection.find_one({"userId": userId}) or member_collection.find_one({"userId": userId}):
        raise ValueError("이미 존재하는 아이디입니다.")
    
    temp_password = generate_temp_password()
    hashed_password = bcrypt.hash(temp_password)
    member = {
        "userId": userId,
        "nickname": nickname,
        "password": hashed_password,
        "email": email,
        "joinedAt": datetime.now(),
        "company_id": company_id,
        "company_name": company_name,
    }
    if accountType == "admin":
        collection = admin_collection
        if team:
            member["team"] = team
    else:
        collection = member_collection
    
    collection.insert_one(member)
    send_email(email, userId, temp_password)
    return member

# 관리자 회원가입 엔드포인트
# - 관리자 계정 신규 생성 (userId, password, nickname, team)
# - 관리자와 회원 컬렉션 모두에서 중복 체크 및 비밀번호 해시 저장
# - 생성된 관리자 정보를 AdminResponse로 반환
@router.post("/api/admin/join", response_model=AdminResponse)
def admin_join(req: AdminCreateRequest):
    # 관리자와 회원 컬렉션 모두에서 아이디 중복 체크
    if admin_collection.find_one({"userId": req.userId}) or member_collection.find_one({"userId": req.userId}):
        raise HTTPException(400, "이미 존재하는 관리자입니다.")
    hashed_pw = bcrypt.hash(req.password)
    admin = {
        "userId": req.userId,
        "password": hashed_pw,
        "nickname": req.nickname,
        "team": req.team,
        "phone": req.phone,  # 추가
    }
    result = admin_collection.insert_one(admin)
    admin["id"] = str(result.inserted_id)
    return AdminResponse(
        id=admin["id"],
        userId=admin["userId"],
        nickname=admin["nickname"],
        team=admin["team"],
        phone=admin["phone"],  # 추가
    )

# 관리자 목록 조회 엔드포인트
# - 모든 관리자 계정 정보를 AdminResponse 리스트로 반환
@router.get("/api/admin/list", response_model=list[AdminResponse])
def admin_list():
    admins = admin_collection.find()
    return [
        AdminResponse(
            id=str(a["_id"]),
            userId=a["userId"],
            nickname=a["nickname"],
            team=a.get("team", "관리팀"),
            phone=a.get("phone", ""),  # 추가
        )
        for a in admins
    ]

# 회원/관리자 초대(임시 비밀번호 발송) 엔드포인트
@router.post("/api/admin/member-invite")
def admin_member_invite(
    userId: str = Body(...),
    nickname: str = Body(...),
    email: str = Body(...),
    accountType: str = Body("member"),
    team: str = Body(None),
    company_id: str = Body(None),
    company_name: str = Body(None)
):
    try:
        member = create_member(userId, nickname, email, accountType, team, company_id, company_name)
        return {"message": "임시 비밀번호가 이메일로 발송되었습니다.", "userId": userId}
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, f"오류 발생: {e}")

# 아이디/닉네임 중복 체크 엔드포인트
# - field: userId 또는 nickname
# - 관리자와 회원 컬렉션 모두에서 중복 체크
# - 어느 쪽에라도 존재하면 exists: true 반환
@router.get("/api/admin/check-duplicate")
def check_duplicate(field: str, value: str, accountType: str = "member"):
    if field not in ["userId", "nickname"]:
        raise HTTPException(400, "허용되지 않는 필드입니다.")
    
    # 관리자와 회원 컬렉션 모두에서 중복 체크
    admin_exists = admin_collection.find_one({field: value})
    member_exists = member_collection.find_one({field: value})
    
    # 어느 쪽에라도 존재하면 중복으로 처리
    exists = bool(admin_exists or member_exists)
    return {"exists": exists}

# 회원 목록 조회 엔드포인트
# - 모든 회원 계정 정보를 MemberResponse 리스트로 반환
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
            company_id=m.get("company_id", ""),
            company_name=m.get("company_name", ""),
        )
        for m in members
    ]

class UserIdRequest(BaseModel):
    userId: str

# 관리자 삭제 엔드포인트
# - userId에 해당하는 관리자 계정 삭제
# - 삭제된 문서 수에 따라 성공/실패 응답
@router.post("/api/admin/delete")
def admin_delete(req: UserIdRequest):
    result = admin_collection.delete_one({"userId": req.userId})
    if result.deleted_count == 0:
        raise HTTPException(404, "관리자를 찾을 수 없습니다.")
    return {"message": "삭제 완료"}

# 멤버 삭제 엔드포인트
# - userId에 해당하는 멤버 계정 삭제
# - 삭제된 문서 수에 따라 성공/실패 응답
@router.post("/api/member/delete")
def member_delete(req: UserIdRequest):
    result = member_collection.delete_one({"userId": req.userId})
    if result.deleted_count == 0:
        raise HTTPException(404, "회원을 찾을 수 없습니다.")
    return {"message": "삭제 완료"}

@router.get("/api/company/search")
async def search_company(keyword: str = Query(...)):
    """
    회사명 또는 회사코드로 부분 검색 (프론트 검색창 대응)
    """
    query = {
        "$or": [
            {"company_name": {"$regex": keyword, "$options": "i"}},
            {"company_id": {"$regex": keyword, "$options": "i"}},
        ]
    }
    results = list(companies_collection.find(query, {"_id": 0}))
    return results

