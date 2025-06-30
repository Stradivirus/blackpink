from pydantic import BaseModel, EmailStr
from datetime import date, time, datetime
from typing import Optional, List, Literal

# 회원 가입 요청 모델
class MemberJoinRequest(BaseModel):
    userId: str  # 사용자 ID
    nickname: str  # 닉네임
    password: str  # 비밀번호
    email: EmailStr  # 이메일

# 회원 로그인 요청 모델
class MemberLoginRequest(BaseModel):
    userId: str  # 사용자 ID
    password: str  # 비밀번호

# 회원 정보 응답 모델
class MemberResponse(BaseModel):
    id: str  # 회원 고유 ID
    userId: str  # 사용자 ID
    nickname: str  # 닉네임
    email: EmailStr  # 이메일
    joinedAt: date  # 가입일
    company_id: str  # 소속 회사 ID
    company_name: str  # 소속 회사명

# 게시글 생성 요청 모델
class BoardCreateRequest(BaseModel):
    title: str  # 게시글 제목
    content: str  # 게시글 내용
    writerId: str  # 작성자 ID
    writerNickname: str = ""  # 작성자 닉네임(선택)
    isNotice: Optional[bool] = False  # 공지 여부(선택)
    isAnswered: Optional[bool] = False  # 답변 여부(선택)

# 게시글 정보 응답 모델
class BoardResponse(BaseModel):
    id: str  # 게시글 고유 ID
    title: str  # 게시글 제목
    content: str  # 게시글 내용
    writerId: str  # 작성자 ID
    writerNickname: str  # 작성자 닉네임
    createdDate: str  # 생성일(문자열)
    createdTime: str  # 생성시간(문자열)
    viewCount: int  # 조회수
    isNotice: Optional[bool] = False  # 공지 여부(선택)
    isAnswered: Optional[bool] = False  # 답변 여부(선택)
    deleted: Optional[bool] = False  # 삭제 여부(선택)
    deletedDate: Optional[date] = None  # 삭제일(선택)
    deletedTime: Optional[time] = None  # 삭제시간(선택)

# 댓글 생성 요청 모델
class CommentCreateRequest(BaseModel):
    postId: str  # 게시글 ID
    writerId: str  # 작성자 ID
    content: str  # 댓글 내용
    isAnswered: Optional[bool] = False  # 답변 여부(선택)

# 댓글 정보 응답 모델
class CommentResponse(BaseModel):
    id: str  # 댓글 고유 ID
    postId: str  # 게시글 ID
    writerId: str  # 작성자 ID
    writerNickname: str  # 작성자 닉네임
    content: str  # 댓글 내용
    createdDate: str  # 생성일(문자열)
    createdTime: str  # 생성시간(문자열)
    team: str = ""  # 소속 팀(선택)
    deleted: bool = False  # 삭제 여부
    deletedDate: Optional[str] = None  # 삭제일(선택)
    deletedTime: Optional[str] = None  # 삭제시간(선택)

# 관리자 생성 요청 모델
class AdminCreateRequest(BaseModel):
    userId: str  # 관리자 ID
    password: str  # 비밀번호
    nickname: str  # 닉네임
    team: Literal["관리팀", "보안팀", "사업팀", "개발팀"]  # 소속 팀

# 관리자 로그인 요청 모델
class AdminLoginRequest(BaseModel):
    userId: str  # 관리자 ID
    password: str  # 비밀번호

# 관리자 정보 응답 모델
class AdminResponse(BaseModel):
    id: str  # 관리자 고유 ID
    userId: str  # 관리자 ID
    nickname: str  # 닉네임
    team: Literal["관리팀", "보안팀", "사업팀", "개발팀"]  # 소속 팀
    phone: str  # 전화번호

# 보안 사고 정보 모델
class Incident(BaseModel):
    incident_no: int  # 사고 고유 번호
    company_id: str  # 회사 고유 ID
    company_name: str  # 회사 이름
    threat_type: str  # 위협 유형
    risk_level: str  # 위험 수준
    server_type: str  # 서버 종류
    incident_date: date  # 사고 발생 일자
    handled_date: Optional[date] = None  # 사고 처리 일자(선택)
    status: str  # 사고 상태
    action: str  # 조치 내용
    manager_name: Optional[str] = None  # 담당자 이름(선택)
    handler_count: int  # 처리 인원 수

# 보안 사고 목록 응답 모델
class IncidentListResponse(BaseModel):
    incidents: List[Incident]  # 보안 사고 정보 리스트

# 위험 국가 정보 모델
class RiskyCountry(BaseModel):
    country: str  # 국가명
    risk_level: str  # 위험 수준
    alert_type: Optional[str]  # 경보 유형(선택)
    latitude: float  # 위도
    longitude: float  # 경도
    timestamp: datetime  # 정보 생성 시각

class Project(BaseModel):
    company_id: str  # 회사 고유 ID
    company_name: str  # 회사 이름
    os: str  # 운영체제
    os_versions: str  # 운영체제 버전
    start_date: date  # 프로젝트 시작일
    end_date: date  # 프로젝트 종료 예정일
    end_date_fin: Optional[date] = None  # 실제 종료일(선택)
    dev_days: int  # 개발 기간(일)
    dev_status: str  # 개발 상태
    maintenance: Optional[str] = None  # 유지보수 정보(선택)
    error: Optional[str] = None  # 오류 정보(선택)
    handler_count: int  # 담당 인원 수
    manager_name: Optional[str] = None  # 담당자 이름(선택)
