from fastapi import APIRouter, HTTPException
from datetime import datetime
from bson.objectid import ObjectId
from db import comment_collection, member_collection, board_collection, admin_collection
from models import CommentCreateRequest, CommentResponse

router = APIRouter(prefix="/api")

def get_user_info(user_id: str):
    # user_id로 회원/관리자 닉네임과 팀 정보 조회
    member = member_collection.find_one({"userId": user_id})
    if member:
        return member["nickname"], None
    admin = admin_collection.find_one({"userId": user_id})
    if admin:
        return admin["nickname"], admin.get("team")
    return None, None

# 댓글 생성 엔드포인트
# 댓글 저장 후 CommentResponse 반환
@router.post("/comments", response_model=CommentResponse)
def create_comment(req: CommentCreateRequest):
    nickname, team = get_user_info(req.writerId)
    if not nickname:
        raise HTTPException(400, "존재하지 않는 사용자입니다.")

    post = board_collection.find_one({"_id": ObjectId(req.postId)})
    if not post or post.get("deleted"):
        raise HTTPException(404, "게시글을 찾을 수 없습니다.")

    # 관리자인지 확인
    admin = admin_collection.find_one({"userId": req.writerId})

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
        comment["team"] = team

    # 관리자가 isAnswered로 댓글 작성 시 게시글에 반영
    if getattr(req, "isAnswered", False) and admin:
        board_collection.update_one(
            {"_id": ObjectId(req.postId)},
            {"$set": {"isAnswered": True}}
        )

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
        deletedDate=comment["deletedDate"],
        deletedTime=comment["deletedTime"],
        team=comment.get("team", "")
    )

# 게시글별 댓글 목록 조회 엔드포인트
# post_id로 삭제되지 않은 댓글만 조회
@router.get("/comments/{post_id}")
def get_comments(post_id: str):
    # 해당 게시글의 삭제되지 않은 댓글만 조회
    comments = comment_collection.find({"postId": post_id, "deleted": False}).sort([("createdDate", 1), ("createdTime", 1)])
    result = []
    for comment in comments:
        result.append(CommentResponse(
            id=str(comment["_id"]), 
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

# 댓글 삭제(soft delete) 엔드포인트
# 댓글 soft delete, 성공 시 메시지 반환
@router.delete("/comments/{id}")
def delete_comment(id: str):
    # id로 댓글 조회 및 soft delete 처리
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