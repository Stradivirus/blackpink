from fastapi import APIRouter, HTTPException
from datetime import date, time, datetime
from bson.objectid import ObjectId
from db import comment_collection, member_collection, board_collection, admin_collection
from models import CommentCreateRequest, CommentResponse
from bson.errors import InvalidId

router = APIRouter()

@router.post("/api/comments", response_model=CommentResponse)
def create_comment(req: CommentCreateRequest):
    # userId로 조회
    member = member_collection.find_one({"userId": req.writerId})
    admin = admin_collection.find_one({"userId": req.writerId})
    team = None
    if member:
        nickname = member["nickname"]
    elif admin:
        nickname = admin["nickname"]
        team = admin.get("team")
    else:
        raise HTTPException(400, "존재하지 않는 사용자입니다.")

    post = board_collection.find_one({"_id": ObjectId(req.postId)})
    if not post or post.get("deleted"):
        raise HTTPException(404, "게시글을 찾을 수 없습니다.")

    now = datetime.now()
    comment = {
        "postId": req.postId,         # 문자열로 저장
        "writerId": req.writerId,     # userId 문자열로 저장
        "writerNickname": nickname,
        "content": req.content,
        "createdDate": now.date().isoformat(),
        "createdTime": now.time().replace(microsecond=0).isoformat(),
        "deleted": False,
        "deletedDate": None,
        "deletedTime": None,
    }
    if team:
        comment["team"] = team

    result = comment_collection.insert_one(comment)
    comment["id"] = str(result.inserted_id)
    return CommentResponse(
        id=comment["id"],
        postId=comment["postId"],
        writerId=comment["writerId"],
        writerNickname=comment["writerNickname"],
        content=comment["content"],
        createdDate=comment["createdDate"],
        createdTime=comment["createdTime"],
        deleted=comment["deleted"],
        deletedDate=None,
        deletedTime=None,
        team=comment.get("team", "")   # ← None이 아니라 ""로!
    )

@router.get("/api/comments/{post_id}")
def get_comments(post_id: str):
    comments = comment_collection.find({"postId": post_id, "deleted": False}).sort([("createdDate", 1), ("createdTime", 1)])
    result = []
    for comment in comments:
        result.append(CommentResponse(
            id=str(comment["_id"]),  # ← 여기!
            postId=comment["postId"],
            writerId=comment["writerId"],
            writerNickname=comment["writerNickname"],
            content=comment["content"],
            createdDate=comment["createdDate"],
            createdTime=comment["createdTime"],
            deleted=comment["deleted"],
            deletedDate=comment.get("deletedDate"),
            deletedTime=comment.get("deletedTime"),
            team=comment.get("team", "") or ""
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