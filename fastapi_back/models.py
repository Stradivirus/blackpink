from pydantic import BaseModel, EmailStr
from datetime import date, time
from typing import Optional, List, Literal

class MemberJoinRequest(BaseModel):
    userId: str
    nickname: str
    password: str
    email: EmailStr

class MemberLoginRequest(BaseModel):
    userId: str
    password: str

class MemberResponse(BaseModel):
    id: str
    userId: str
    nickname: str
    email: EmailStr
    joinedAt: date

class BoardCreateRequest(BaseModel):
    title: str
    content: str
    userId: str

class BoardResponse(BaseModel):
    id: str
    title: str
    content: str
    writerId: str
    writerNickname: str
    viewCount: int
    createdDate: date
    createdTime: time
    deleted: Optional[bool] = False
    deletedDate: Optional[date] = None
    deletedTime: Optional[time] = None

class CommentCreateRequest(BaseModel):
    postId: str
    writerId: str
    content: str

class CommentResponse(BaseModel):
    id: str
    postId: str
    writerId: str
    writerNickname: str
    content: str
    createdDate: date
    createdTime: time
    deleted: Optional[bool] = False
    deletedDate: Optional[date] = None
    deletedTime: Optional[time] = None

class AdminCreateRequest(BaseModel):
    userId: str
    password: str
    nickname: str
    team: Literal["관리팀", "보안팀", "사업팀", "개발팀"]

class AdminLoginRequest(BaseModel):
    userId: str
    password: str

class AdminResponse(BaseModel):
    id: str
    userId: str
    nickname: str
    team: Literal["관리팀", "보안팀", "사업팀", "개발팀"]

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

class IncidentListResponse(BaseModel):
    incidents: List[Incident]