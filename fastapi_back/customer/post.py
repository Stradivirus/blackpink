from fastapi import APIRouter, HTTPException, Query, Body
from datetime import datetime
from bson.objectid import ObjectId
from db import board_collection
from models import BoardCreateRequest, BoardResponse

router = APIRouter()

# 게시글 생성 엔드포인트
# - 클라이언트에서 전달받은 게시글 정보를 DB에 저장
# - 작성자 정보, 작성일시, 조회수, 공지여부, 삭제여부 등 필드 자동 세팅
# - 저장 후 BoardResponse 형태로 반환
@router.post("/api/posts", response_model=BoardResponse)
def create_post(req: BoardCreateRequest):
    now = datetime.now()
    doc = req.dict()
    doc["writerId"] = req.writerId   # userId 문자열로 저장
    doc["writerNickname"] = req.writerNickname
    doc["createdDate"] = now.strftime("%Y-%m-%d")
    doc["createdTime"] = now.strftime("%H:%M:%S")
    doc["viewCount"] = 0
    doc["isNotice"] = req.isNotice or False
    doc["isAnswered"] = req.isAnswered or False  # 답변완료 여부 저장
    doc["deletedDate"] = None
    doc["deletedTime"] = None

    result = board_collection.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    return BoardResponse(**doc)

# 게시글 수정 엔드포인트
# - id로 기존 게시글을 조회 후, 전달받은 값으로 일부 필드만 갱신
# - 작성자/작성일 등 주요 정보는 기존 값 유지
# - 수정 후 BoardResponse 형태로 반환
@router.put("/api/posts/{id}", response_model=BoardResponse)
def update_post(id: str, req: BoardCreateRequest = Body(...)):
    prev = board_collection.find_one({"_id": id})
    if not prev:
        raise HTTPException(404, "게시글을 찾을 수 없습니다.")
    update_doc = req.dict(exclude_unset=True)
    update_doc["writerId"] = prev.get("writerId", req.userId)
    update_doc["writerNickname"] = prev.get("writerNickname", getattr(req, "writerNickname", "알수없음"))
    update_doc["createdDate"] = prev.get("createdDate", "")
    update_doc["createdTime"] = prev.get("createdTime", "")
    update_doc["isNotice"] = req.isNotice or False
    update_doc["isAnswered"] = req.isAnswered if "isAnswered" in update_doc else prev.get("isAnswered", False)  # 답변완료 여부
    board_collection.update_one({"_id": id}, {"$set": update_doc})
    updated = board_collection.find_one({"_id": id})
    updated["id"] = str(updated["_id"])
    return BoardResponse(**updated)

# 게시글 목록 조회 엔드포인트 (페이징, 정렬)
# - page, size 파라미터로 페이징 처리
# - 공지글 우선, 최신순 정렬
# - 누락 필드 보정 및 BoardResponse 리스트 반환
# - totalElements: 전체 게시글 수, totalPages: (임시 1)
@router.get("/api/posts")
def get_posts(
    page: int = Query(0, ge=0),
    size: int = Query(15, ge=1, le=100),
):
    skip = page * size
    total_elements = board_collection.count_documents({})
    total_pages = (total_elements + size - 1) // size if total_elements > 0 else 1
    cursor = board_collection.find().sort([
        ("isNotice", -1),           # 공지 먼저
        ("createdDate", -1),        # 최신글이 위로
        ("createdTime", -1),        # 시간까지 내림차순
        ("_id", -1)                 # 혹시 날짜가 같으면 id 기준
    ]).skip(skip).limit(size)
    posts = []
    for doc in cursor:
        doc["isNotice"] = doc.get("isNotice", False)
        doc["isAnswered"] = doc.get("isAnswered", False)  # 답변완료 여부 보정
        doc["writerId"] = doc.get("writerId", "")
        doc["writerNickname"] = doc.get("writerNickname", "")
        doc["createdDate"] = doc.get("createdDate", "")
        doc["createdTime"] = doc.get("createdTime", "")
        doc["viewCount"] = doc.get("viewCount", 0)
        doc["id"] = str(doc["_id"])
        posts.append(BoardResponse(**doc))
    return {
        "content": posts,
        "totalElements": total_elements,
        "totalPages": total_pages
    }

# 게시글 단건 조회 및 조회수 증가 엔드포인트
# - id로 게시글을 조회, 없으면 404 반환
# - 조회 시 viewCount 1 증가 및 DB 반영
# - 누락 필드 보정 후 BoardResponse 반환
@router.get("/api/posts/{id}", response_model=BoardResponse)
def get_post(id: str):
    b = board_collection.find_one({"_id": ObjectId(id)})
    if not b:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
    b["viewCount"] = b.get("viewCount", 0) + 1
    board_collection.update_one({"_id": ObjectId(id)}, {"$set": {"viewCount": b["viewCount"]}})
    b["isNotice"] = b.get("isNotice", False)
    b["isAnswered"] = b.get("isAnswered", False)  # 답변완료 여부 보정
    b["writerId"] = b.get("writerId", "")
    b["writerNickname"] = b.get("writerNickname", "")
    b["createdDate"] = b.get("createdDate", "")
    b["createdTime"] = b.get("createdTime", "")
    b["deletedDate"] = b.get("deletedDate", None)
    b["deletedTime"] = b.get("deletedTime", None)
    b["id"] = str(b["_id"])
    return BoardResponse(**b)

# 게시글 삭제(soft delete) 및 관련 댓글 soft delete 엔드포인트
# - id로 게시글을 조회, 이미 삭제된 경우 404 반환
# - 게시글의 deleted, deletedDate, deletedTime 필드 갱신 (soft delete)
# - 해당 게시글의 댓글도 soft delete 처리
# - 삭제 성공 시 메시지 반환
@router.delete("/api/posts/{id}")
def delete_post(id: str):
    b = board_collection.find_one({"_id": ObjectId(id)})
    if not b or b.get("deleted"):
        raise HTTPException(404, "게시글을 찾을 수 없습니다.")
    now = datetime.now()
    board_collection.update_one(
        {"_id": ObjectId(id)},
        {"$set": {
            "deleted": True,
            "deletedDate": now.date().isoformat(),
            "deletedTime": now.time().replace(microsecond=0).isoformat()
        }}
    )
    from db import comment_collection
    comment_collection.update_many(
        {"postId": id, "deleted": False},
        {"$set": {
            "deleted": True,
            "deletedDate": now.date().isoformat(),
            "deletedTime": now.time().replace(microsecond=0).isoformat()
        }}
    )
    return {"message": "삭제되었습니다."}