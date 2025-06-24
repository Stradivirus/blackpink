from fastapi import APIRouter, HTTPException
from datetime import datetime
from bson.objectid import ObjectId
from db import comment_collection, member_collection, board_collection, admin_collection
from models import CommentCreateRequest, CommentResponse

router = APIRouter()

# 댓글 생성 엔드포인트
# - writerId로 회원/관리자 정보 조회(닉네임, 팀 등)
# - 게시글 존재 및 삭제 여부 확인
# - 댓글 정보(작성자, 내용, 작성일시 등) DB에 저장
# - 저장된 댓글 정보를 CommentResponse로 반환
@router.post("/api/comments", response_model=CommentResponse)
def create_comment(req: CommentCreateRequest):
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

    # 답변완료 체크: 관리자가 댓글 작성 + isAnswered true일 때 게시글에 반영
    if hasattr(req, "isAnswered") and req.isAnswered and admin:
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
        deletedDate=None,
        deletedTime=None,
        team=comment.get("team", "") 
    )

# 게시글별 댓글 목록 조회 엔드포인트
# - post_id로 해당 게시글의 삭제되지 않은 댓글만 조회
# - 작성일/시간 기준 오름차순 정렬
# - 각 댓글을 CommentResponse로 변환하여 리스트 반환
@router.get("/api/comments/{post_id}")
def get_comments(post_id: str):
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
# - id로 댓글을 조회, 이미 삭제된 경우 404 반환
# - 댓글의 deleted, deletedDate, deletedTime 필드 갱신 (soft delete)
# - 삭제 성공 시 메시지 반환
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