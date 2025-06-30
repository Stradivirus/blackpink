from fastapi import APIRouter, HTTPException, Query, Body
from datetime import datetime
from bson.objectid import ObjectId
from db import board_collection
from models import BoardCreateRequest, BoardResponse

router = APIRouter(prefix="/api")

# 게시글 생성 엔드포인트
# 게시글 저장 후 BoardResponse 반환
@router.post("/posts", response_model=BoardResponse)
def create_post(req: BoardCreateRequest):
    now = datetime.now()
    doc = req.dict()
    doc["writerId"] = req.writerId   # userId 문자열로 저장
    doc["writerNickname"] = req.writerNickname
    doc["createdDate"] = now.strftime("%Y-%m-%d")
    doc["createdTime"] = now.strftime("%H:%M:%S")
    doc["viewCount"] = 0
    doc["isNotice"] = req.isNotice or False
    doc["isAnswered"] = req.isAnswered or False
    doc["deletedDate"] = None
    doc["deletedTime"] = None

    result = board_collection.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    return BoardResponse(**doc)

# 게시글 수정 엔드포인트
# 일부 필드만 갱신, BoardResponse 반환
@router.put("/posts/{id}", response_model=BoardResponse)
def update_post(id: str, req: BoardCreateRequest = Body(...)):
    prev = board_collection.find_one({"_id": ObjectId(id)})
    if not prev:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
    update_doc = req.dict(exclude_unset=True)
    update_doc["writerId"] = prev.get("writerId", req.writerId)
    update_doc["writerNickname"] = prev.get("writerNickname", getattr(req, "writerNickname", "알수없음"))
    update_doc["createdDate"] = prev.get("createdDate", "")
    update_doc["createdTime"] = prev.get("createdTime", "")
    update_doc["isNotice"] = req.isNotice or False
    update_doc["isAnswered"] = req.isAnswered if "isAnswered" in update_doc else prev.get("isAnswered", False)
    board_collection.update_one({"_id": ObjectId(id)}, {"$set": update_doc})
    updated = board_collection.find_one({"_id": ObjectId(id)})
    if not updated:
        raise HTTPException(status_code=404, detail="수정 후 게시글을 찾을 수 없습니다.")
    updated["id"] = str(updated["_id"])
    return BoardResponse(**updated)

# 게시글 목록 조회 엔드포인트 (페이징, 정렬)
# 공지 우선, 최신순, BoardResponse 리스트 반환
@router.get("/posts")
def get_posts(
    page: int = Query(0, ge=0),
    size: int = Query(15, ge=1, le=100),
):
    skip = page * size
    # 🔽 조건 추가: deleted가 False이거나 없을 때만 조회
    query = {"$or": [{"deleted": False}, {"deleted": {"$exists": False}}]}
    total_elements = board_collection.count_documents(query)
    total_pages = (total_elements + size - 1) // size if total_elements > 0 else 1
    cursor = board_collection.find(query).sort([
        ("isNotice", -1),
        ("createdDate", -1),
        ("createdTime", -1),
        ("_id", -1)
    ]).skip(skip).limit(size)
    posts = []
    for doc in cursor:
        doc["isNotice"] = doc.get("isNotice", False)
        doc["isAnswered"] = doc.get("isAnswered", False)
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
# id로 조회, viewCount 증가, BoardResponse 반환
@router.get("/posts/{id}", response_model=BoardResponse)
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
# 게시글/댓글 soft delete, 성공 시 메시지 반환
@router.delete("/posts/{id}")
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