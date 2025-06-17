from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
from pymongo import MongoClient
from bson import ObjectId
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

app = FastAPI()

# CORS 설정 추가
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB 연결 설정
client = MongoClient("mongodb+srv://stradivirus:1q2w3e4r@cluster0.e7rvfpz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
db = client["Todo"]
collection = db["todo"]

# Pydantic 모델 정의
class Todo(BaseModel):
    title: str
    description: str = ""
    completed: bool = False
    due_date: str = ""  # 기한 필드 추가
    status: str = "등록됨"  # 상태 필드 추가
    created_at: str = ""  # 등록일 필드 추가

class TodoInDB(Todo):
    id: str

def build_todoindb_from_item(item) -> 'TodoInDB':
    return TodoInDB(
        id=str(item["_id"]),
        title=item["title"],
        description=item.get("description", ""),
        completed=item.get("completed", False),
        due_date=item.get("due_date", ""),
        status=item.get("status", "등록됨"),
        created_at=item.get("created_at", "")
    )

# 할 일 등록
@app.post("/todo/", response_model=TodoInDB)
def create_todo(todo: Todo):
    todo_dict = todo.dict()
    todo_dict["created_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    result = collection.insert_one(todo_dict)
    return TodoInDB(id=str(result.inserted_id), **todo_dict)

# 할 일 전체 조회
@app.get("/todo/", response_model=List[TodoInDB])
def read_todos():
    todos = []
    for item in collection.find():
        todos.append(build_todoindb_from_item(item))
    return todos

# 할 일 단일 조회
@app.get("/todo/{todo_id}", response_model=TodoInDB)
def read_todo(todo_id: str):
    item = collection.find_one({"_id": ObjectId(todo_id)})
    if not item:
        raise HTTPException(status_code=404, detail="Todo not found")
    return build_todoindb_from_item(item)

# 할 일 완료 상태 변경
@app.put("/todo/{todo_id}", response_model=TodoInDB)
def update_todo(todo_id: str, todo: Todo):
    result = collection.update_one({"_id": ObjectId(todo_id)}, {"$set": todo.dict()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Todo not found")
    item = collection.find_one({"_id": ObjectId(todo_id)})
    return build_todoindb_from_item(item)

# 할 일 삭제
@app.delete("/todo/{todo_id}")
def delete_todo(todo_id: str):
    result = collection.delete_one({"_id": ObjectId(todo_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Todo not found")
    return {"message": "Todo deleted"}
