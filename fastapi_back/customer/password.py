from fastapi import APIRouter, HTTPException, Body
from db import member_collection
from passlib.hash import bcrypt

router = APIRouter()

@router.post("/api/member/change-password")
def change_password(
    userId: str = Body(...),
    old_password: str = Body(...),
    new_password: str = Body(...)
):
    member = member_collection.find_one({"userId": userId})
    if not member or not bcrypt.verify(old_password, member["password"]):
        raise HTTPException(400, "아이디 또는 비밀번호가 올바르지 않습니다.")
    hashed_new = bcrypt.hash(new_password)
    member_collection.update_one(
        {"userId": userId},
        {"$set": {"password": hashed_new}}
    )
    return {"message": "비밀번호가 성공적으로 변경되었습니다."}