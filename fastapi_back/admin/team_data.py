# admin/team_data.py
from fastapi import APIRouter, HTTPException, Request, Body, Query
from db import companies_collection, dev_collection, incident_collection
from bson import ObjectId
from datetime import datetime, date, time
from models import Project, Incident

router = APIRouter(prefix="/api")

# 컬렉션 맵핑 상단에 선언
collection_map = {
    "dev": dev_collection,
    "biz": companies_collection,
    "security": incident_collection,
}

# 공통 insert 함수
def insert_item(collection, item: dict):
    item.pop("_id", None)
    result = collection.insert_one(item)
    return {"id": str(result.inserted_id)}

# 공통 update 함수
def update_item_by_id(collection, item_id: str, item: dict):
    item.pop("_id", None)
    try:
        object_id = ObjectId(item_id)
    except Exception:
        raise HTTPException(status_code=400, detail="유효하지 않은 ObjectId입니다.")
    result = collection.update_one({"_id": object_id}, {"$set": item})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"status": "success"}

# 사업팀 전체 데이터 조회 (회사명 조인 없음)
@router.get("/biz")
async def get_biz():
    return fetch_all_data(companies_collection, "biz")

# 사업팀 컬럼 정보 조회
@router.get("/biz/columns")
async def get_biz_columns():
    return fetch_columns(companies_collection)

# 개발팀 전체 데이터 조회 (company_id → company_name 조인)
@router.get("/dev")
async def get_dev_data():
    return fetch_all_data_with_company_name(dev_collection, "dev")

# 개발팀 컬럼 정보 조회
@router.get("/dev/columns")
async def get_dev_columns():
    return fetch_columns(dev_collection)

# 보안 사고 전체 데이터 조회 (company_id → company_name 조인)
@router.get("/security")
async def get_security():
    return fetch_all_data_with_company_name(incident_collection, "incidents")

# 보안 사고 컬럼 정보 조회
@router.get("/security/columns")
async def get_security_columns():
    return fetch_columns(incident_collection)

# 사업팀 등록
@router.post("/biz")
async def create_company(item: dict):
    return insert_item(companies_collection, item)

@router.put("/biz/{item_id}")
async def update_company(item_id: str, item: dict = Body(...)):
    return update_item_by_id(companies_collection, item_id, item)

# 개발팀 등록
@router.post("/dev")
async def create_dev(item: dict):
    # 최소 한 개 이상의 필수값이 있는지 체크 (예: company_id, start_date 등)
    required_keys = ["company_id", "company_name", "start_date", "dev_status"]
    if not any(item.get(k) for k in required_keys):
        raise HTTPException(status_code=400, detail="필수값이 없습니다.")
    # end_date_fin이 빈 문자열/None이면 아예 필드에서 제거 (MongoDB에 null로 저장 방지)
    if not item.get("end_date_fin"):
        item.pop("end_date_fin", None)
    return insert_item(dev_collection, item)

@router.put("/dev/{item_id}")
async def update_dev(item_id: str, item: dict):
    return update_item_by_id(dev_collection, item_id, item)

# 보안팀 등록
@router.post("/security")
async def create_security(item: dict):
    return insert_item(incident_collection, item)

@router.put("/security/{item_id}")
async def update_security(item_id: str, item: dict):
    return update_item_by_id(incident_collection, item_id, item)

# 삭제 함수 collection_map 사용
@router.delete("/{team}")
async def delete_items(team: str, request: Request):
    try:
        body = await request.json()
        print("Request body:", body)
    except Exception as e:
        print("Request body parse error:", e)
        raise HTTPException(status_code=400, detail="잘못된 요청 형식입니다.")
    
    ids = body.get("ids")
    if not ids or not isinstance(ids, list):
        raise HTTPException(status_code=400, detail="삭제할 ID 리스트가 필요합니다.")
    
    try:
        object_ids = [ObjectId(id_str) for id_str in ids]
    except Exception:
        raise HTTPException(status_code=400, detail="유효하지 않은 ObjectId입니다.")

    collection = collection_map.get(team)
    if collection is None:
        raise HTTPException(status_code=400, detail="잘못된 팀명입니다.")

    result = collection.delete_many({"_id": {"$in": object_ids}})
    return {"deleted_count": result.deleted_count}

# 컬렉션의 모든 데이터를 반환 (단순 조회, 회사명 조인 없음)
def fetch_all_data(collection, key):
    data = []
    try:
        for doc in collection.find():
            doc["_id"] = str(doc["_id"])
            data.append(doc)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch {key} data: {e}")
    return {key: data}

def fetch_all_data_with_company_name(collection, key):
    """
    company_id → company_name 조인하여 반환 (incident, dev 등에서 사용)
    """
    data = []
    company_map = None
    try:
        for doc in collection.find():
            doc["_id"] = str(doc["_id"])
            company_id = doc.get("company_id")
            if company_id:
                if company_map is None:
                    # company_map을 필요할 때 한 번만 생성
                    company_map = {c["company_id"]: c.get("company_name", "") for c in companies_collection.find() if c.get("company_id")}
                doc["company_name"] = company_map.get(company_id, "")
            data.append(doc)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch {key} data: {e}")
    return {key: data}

# 컬렉션의 컬럼 정보 반환 (샘플 문서 기준, _id 제외)
def fetch_columns(collection):
    sample = collection.find_one()
    if not sample:
        return {"columns": []}
    columns = list(sample.keys())
    if "_id" in columns:
        columns.remove("_id")
    return {"columns": columns}

@router.get("/biz/next-company-id")
async def get_next_company_id(industry: str):
    """
    업종(industry)별 다음 company_id 반환 (예: IT → I00012)
    """
    import re
    prefix_map = {"IT": "I", "제조": "M", "금융": "F", "유통": "D"}
    prefix = prefix_map.get(industry)
    if not prefix:
        raise HTTPException(status_code=400, detail="유효하지 않은 업종입니다.")

    # find_one으로 가장 큰 company_id 찾기
    doc = companies_collection.find_one(
        {"company_id": {"$regex": f"^{prefix}"}},
        sort=[("company_id", -1)]
    )
    last_id = doc["company_id"] if doc and "company_id" in doc else None

    if last_id:
        m = re.match(rf"^{prefix}(\d+)$", last_id)
        if m:
            next_num = int(m.group(1)) + 1
        else:
            next_num = 1
    else:
        next_num = 1

    next_id = prefix + str(next_num).zfill(5)
    return {"next_company_id": next_id}
