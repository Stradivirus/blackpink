# admin/team_data.py
from fastapi import APIRouter, HTTPException
from db import companies_collection, dev_collection, incident_collection

router = APIRouter(prefix="/api")

# 컬렉션의 모든 데이터를 반환 (단순 조회, 회사명 조인 없음)
def fetch_all_data(collection, key):
    data = []
    try:
        for doc in collection.find():
            doc.pop('_id', None)
            data.append(doc)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch {key} data: {e}")
    return {key: data}

# company_id → company_name 조인하여 반환 (incident, dev 등에서 사용)
def fetch_all_data_with_company_name(collection, key):
    data = []
    # 회사 id-이름 매핑 딕셔너리 생성 (company_id → company_name)
    company_map = {c["company_id"]: c.get("company_name", "") for c in companies_collection.find() if c.get("company_id")}
    try:
        for doc in collection.find():
            doc.pop('_id', None)
            # company_id가 있으면 company_name 필드 추가
            if "company_id" in doc and doc["company_id"] in company_map:
                doc["company_name"] = company_map[doc["company_id"]]
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

# 사업팀 전체 데이터 조회 (회사명 조인 없음)
@router.get("/companies")
async def get_companies():
    return fetch_all_data(companies_collection, "companies")

# 사업팀 컬럼 정보 조회
@router.get("/companies/columns")
async def get_companies_columns():
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
@router.get("/incident")
async def get_incidents():
    return fetch_all_data_with_company_name(incident_collection, "incidents")

# 보안 사고 컬럼 정보 조회
@router.get("/incident/columns")
async def get_incident_columns():
    return fetch_columns(incident_collection)
