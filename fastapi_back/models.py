from pydantic import BaseModel, EmailStr
from datetime import date, time, datetime
from typing import Optional, List, Literal

# 회원 가입 요청 모델
class MemberJoinRequest(BaseModel):
    userId: str
    nickname: str
    password: str
    email: EmailStr

# 회원 로그인 요청 모델
class MemberLoginRequest(BaseModel):
    userId: str
    password: str

# 회원 정보 응답 모델
class MemberResponse(BaseModel):
    id: str
    userId: str
    nickname: str
    email: EmailStr
    joinedAt: date

# 게시글 생성 요청 모델
class BoardCreateRequest(BaseModel):
    title: str
    content: str
    writerId: str
    writerNickname: str = ""
    isNotice: Optional[bool] = False  
    isAnswered: Optional[bool] = False  # 답변완료 여부 추가

# 게시글 정보 응답 모델
class BoardResponse(BaseModel):
    id: str
    title: str
    content: str
    writerId: str
    writerNickname: str
    createdDate: str
    createdTime: str
    viewCount: int
    isNotice: Optional[bool] = False
    isAnswered: Optional[bool] = False  # 답변완료 여부 추가
    deleted: Optional[bool] = False
    deletedDate: Optional[date] = None
    deletedTime: Optional[time] = None

# 댓글 생성 요청 모델
class CommentCreateRequest(BaseModel):
    postId: str
    writerId: str
    content: str
    isAnswered: Optional[bool] = False  # 답변완료 여부(관리자용)

# 댓글 정보 응답 모델
class CommentResponse(BaseModel):
    id: str
    postId: str
    writerId: str
    writerNickname: str
    content: str
    createdDate: str
    createdTime: str
    team: str = ""

# 관리자 생성 요청 모델
class AdminCreateRequest(BaseModel):
    userId: str
    password: str
    nickname: str
    team: Literal["관리팀", "보안팀", "사업팀", "개발팀"]

# 관리자 로그인 요청 모델
class AdminLoginRequest(BaseModel):
    userId: str
    password: str

# 관리자 정보 응답 모델
class AdminResponse(BaseModel):
    id: str
    userId: str
    nickname: str
    team: Literal["관리팀", "보안팀", "사업팀", "개발팀"]

# 보안 사고 정보 모델
class Incident(BaseModel):
    incident_no: int
    company_id: str
    threat_type: str
    risk_level: str
    server_type: str
    incident_date: date
    handled_date: Optional[date] = None
    status: str
    action: str
    handler_count: int

# 보안 사고 목록 응답 모델
class IncidentListResponse(BaseModel):
    incidents: List[Incident]

# 위험 국가 정보 모델
class RiskyCountry(BaseModel):
    country: str
    risk_level: str
    alert_type: Optional[str]
    latitude: float
    longitude: float
    timestamp: datetime

class Project(BaseModel):
    company_id: str
    company_name: str
    os: str
    os_versions: str
    start_date: date
    end_date: date
    end_date_fin: Optional [date]
    dev_days: int
    dev_status: str
    maintenance: Optional[str]
    error: Optional[str]
    handler_count: int
    # 필요에 따라 필드 추가
