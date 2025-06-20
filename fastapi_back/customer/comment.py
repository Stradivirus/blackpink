from fastapi import APIRouter, HTTPException
from datetime import date, time, datetime
from bson.objectid import ObjectId
from db import comment_collection, member_collection, board_collection, admin_collection
from models import CommentCreateRequest, CommentResponse
from bson.errors import InvalidId

router = APIRouter()

@router.post("/api/comments", response_model=CommentResponse)
def create_comment(req: CommentCreateRequest):
    try:
        user_obj_id = ObjectId(req.writerId)
    except InvalidId:
        raise HTTPException(400, "writerId가 올바른 ObjectId 형식이 아닙니다.")

    member = member_collection.find_one({"_id": user_obj_id})
    admin = admin_collection.find_one({"_id": user_obj_id})
    team = None
    if member:
        nickname = member["nickname"]
    elif admin:
        nickname = admin["nickname"]
        team = admin.get("team")  # ← 관리자면 팀 정보 저장
    else:
        raise HTTPException(400, "존재하지 않는 사용자입니다.")

    try:
        post = board_collection.find_one({"_id": ObjectId(req.postId)})
    except InvalidId:
        raise HTTPException(400, "postId가 올바른 ObjectId 형식이 아닙니다.")
    if not post or post.get("deleted"):
        raise HTTPException(404, "게시글을 찾을 수 없습니다.")

    now = datetime.now()
    comment = {
        "postId": req.postId,
        "writerId": req.writerId,
        "writerNickname": nickname,
        "content": req.content,
        "createdDate": now.date().isoformat(),
        "createdTime": now.time().replace(microsecond=0).isoformat(),
        "deleted": False,
        "deletedDate": None,
        "deletedTime": None,
    }
    if team:
        comment["team"] = team  # ← team 필드 추가

    result = comment_collection.insert_one(comment)
    comment["id"] = str(result.inserted_id)
    return CommentResponse(
        id=comment["id"],
        postId=comment["postId"],
        writerId=comment["writerId"],
        writerNickname=comment["writerNickname"],
        content=comment["content"],
        createdDate=date.fromisoformat(comment["createdDate"]),
        createdTime=time.fromisoformat(comment["createdTime"]),
        deleted=comment["deleted"],
        deletedDate=None,
        deletedTime=None,
        team=comment.get("team")  # ← 반환에도 포함
    )

@router.get("/api/comments/{post_id}")
def get_comments(post_id: str):
    comments = comment_collection.find({"postId": post_id, "deleted": False}).sort([("createdDate", 1), ("createdTime", 1)])
    result = []
    for c in comments:
        result.append(CommentResponse(
            id=str(c["_id"]),
            postId=c["postId"],
            writerId=c["writerId"],
            writerNickname=c["writerNickname"],
            content=c["content"],
            createdDate=date.fromisoformat(c["createdDate"]),
            createdTime=time.fromisoformat(c["createdTime"]),
            deleted=c.get("deleted", False),
            deletedDate=date.fromisoformat(c["deletedDate"]) if c.get("deletedDate") else None,
            deletedTime=time.fromisoformat(c["deletedTime"]) if c.get("deletedTime") else None,
            team=c.get("team")  # ← team 필드도 반환
        ))
    return result

@router.delete("/api/comments/{id}")
def delete_comment(id: str):
    c = comment_collection.find_one({"_id": ObjectId(id)})
    if not c or c.get("deleted"):
        raise HTTPException(404, "댓글을 찾을 수 없습니다.")
    now = datetime.now()
    comment_collection.update_one(
        {"_id": ObjectId(id)},
        {"$set": {
            "deleted": True,
            "deletedDate": now.date().isoformat(),
            "deletedTime": now.time().replace(microsecond=0).isoformat()
        }}
    )
    return {"message": "삭제되었습니다."}