# admin/companies.py
from fastapi import APIRouter, HTTPException
from db import companies_collection 

router = APIRouter(prefix="/api")

@router.get("/companies") # 최종 엔드포인트: /api/companies
async def get_companies():
    """
    사업팀(Companies) 데이터를 반환하는 API 엔드포인트
    companies_collection에서 실제 데이터를 가져옵니다.
    """
    data = []
    try:
        for doc in companies_collection.find():
            doc.pop('_id', None) 
            data.append(doc)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch companies data: {e}")
        
    return {"companies": data}

@router.get("/companies/columns") # 최종 엔드포인트: /api/companies/columns
async def get_companies_columns():
    """
    사업팀 데이터의 컬럼 정보를 반환하는 API 엔드포인트
    """
    sample = companies_collection.find_one()
    if not sample:
        return {"columns": []}
    
    columns = list(sample.keys())
    if "_id" in columns:
        columns.remove("_id") # _id 컬럼은 제외
    
    return {"columns": columns}