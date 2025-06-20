from fastapi import APIRouter, HTTPException, Query, Body
from datetime import date, time, datetime
from bson.objectid import ObjectId
from db import board_collection, member_collection
from models import BoardCreateRequest, BoardResponse

router = APIRouter()

@router.post("/api/posts", response_model=BoardResponse)
def create_post(req: BoardCreateRequest):
    now = datetime.now()
    doc = req.dict()
    doc["writerId"] = req.writerId  # writerId는 ObjectId string이어야 함
    doc["writerNickname"] = req.writerNickname
    doc["createdDate"] = now.strftime("%Y-%m-%d")
    doc["createdTime"] = now.strftime("%H:%M:%S")
    doc["viewCount"] = 0
    doc["isNotice"] = req.isNotice or False
    doc["deletedDate"] = None
    doc["deletedTime"] = None

    result = board_collection.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    return BoardResponse(**doc)

@router.put("/api/posts/{id}", response_model=BoardResponse)
def update_post(id: str, req: BoardCreateRequest = Body(...)):
    prev = board_collection.find_one({"_id": id})
    if not prev:
        raise HTTPException(404, "게시글을 찾을 수 없습니다.")
    update_doc = req.dict(exclude_unset=True)
    # 기존 값 유지
    update_doc["writerId"] = prev.get("writerId", req.userId)
    update_doc["writerNickname"] = prev.get("writerNickname", getattr(req, "writerNickname", "알수없음"))
    update_doc["createdDate"] = prev.get("createdDate", "")
    update_doc["createdTime"] = prev.get("createdTime", "")
    update_doc["isNotice"] = req.isNotice or False
    board_collection.update_one({"_id": id}, {"$set": update_doc})
    updated = board_collection.find_one({"_id": id})
    updated["id"] = str(updated["_id"])
    return BoardResponse(**updated)

@router.get("/api/posts")
def get_posts(
    page: int = Query(0, ge=0),
    size: int = Query(30, ge=1, le=100),
):
    skip = page * size
    cursor = board_collection.find().sort([
        ("isNotice", -1),           # 공지 먼저
        ("createdDate", -1),        # 최신글이 위로
        ("createdTime", -1),        # 시간까지 내림차순
        ("_id", -1)                 # 혹시 날짜가 같으면 id 기준
    ]).skip(skip).limit(size)
    posts = []
    for doc in cursor:
        # 누락 필드 보정
        doc["isNotice"] = doc.get("isNotice", False)
        doc["writerId"] = doc.get("writerId", "")
        doc["writerNickname"] = doc.get("writerNickname", "")
        doc["createdDate"] = doc.get("createdDate", "")
        doc["createdTime"] = doc.get("createdTime", "")
        doc["viewCount"] = doc.get("viewCount", 0)
        doc["id"] = str(doc["_id"])
        posts.append(BoardResponse(**doc))
    return {
        "content": posts,
        "totalElements": board_collection.count_documents({}),
        "totalPages": 1  # 실제 페이지 계산 로직 필요
    }

@router.get("/api/posts/{id}", response_model=BoardResponse)
def get_post(id: str):
    b = board_collection.find_one({"_id": ObjectId(id)})
    if not b:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
    # viewCount가 없으면 0으로 초기화
    b["viewCount"] = b.get("viewCount", 0) + 1
    board_collection.update_one({"_id": ObjectId(id)}, {"$set": {"viewCount": b["viewCount"]}})
    # 누락 필드 보정
    b["isNotice"] = b.get("isNotice", False)
    b["writerId"] = b.get("writerId", "")
    b["writerNickname"] = b.get("writerNickname", "")
    b["createdDate"] = b.get("createdDate", "")
    b["createdTime"] = b.get("createdTime", "")
    b["deletedDate"] = b.get("deletedDate", None)
    b["deletedTime"] = b.get("deletedTime", None)
    b["id"] = str(b["_id"])
    return BoardResponse(**b)

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
    return {"message": "삭제되었습니다."}