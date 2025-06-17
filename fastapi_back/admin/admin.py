from fastapi import APIRouter, HTTPException, Body
from db import admin_collection
from passlib.hash import bcrypt
from bson.objectid import ObjectId
from models import AdminCreateRequest, AdminLoginRequest, AdminResponse

router = APIRouter()

@router.post("/api/admin/join", response_model=AdminResponse)
def admin_join(req: AdminCreateRequest):
    if admin_collection.find_one({"userId": req.userId}):
        raise HTTPException(400, "이미 존재하는 관리자입니다.")
    hashed_pw = bcrypt.hash(req.password)
    admin = {
        "userId": req.userId,
        "password": hashed_pw,
        "nickname": req.nickname,
    }
    result = admin_collection.insert_one(admin)
    admin["id"] = str(result.inserted_id)
    return AdminResponse(id=admin["id"], userId=admin["userId"], nickname=admin["nickname"])

@router.get("/api/admin/list", response_model=list[AdminResponse])
def admin_list():
    admins = admin_collection.find()
    return [
        AdminResponse(id=str(a["_id"]), userId=a["userId"], nickname=a["nickname"])
        for a in admins
    ]