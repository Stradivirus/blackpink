from fastapi import APIRouter, HTTPException, Body
from db import member_collection, admin_collection
from passlib.hash import bcrypt

router = APIRouter()

@router.post("/api/change-password")
def change_password(
    userId: str = Body(...),
    old_password: str = Body(...),
    new_password: str = Body(...),
    accountType: str = Body("member")  # "member" 또는 "admin"
):
    if accountType == "admin":
        collection = admin_collection
    else:
        collection = member_collection

    user = collection.find_one({"userId": userId})
    if not user or not bcrypt.verify(old_password, user["password"]):
        raise HTTPException(400, "아이디 또는 비밀번호가 올바르지 않습니다.")
    hashed_new = bcrypt.hash(new_password)
    collection.update_one(
        {"userId": userId},
        {"$set": {"password": hashed_new}}
    )
    return {"message": "비밀번호가 성공적으로 변경되었습니다."}