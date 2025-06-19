# admin/dev.py
from fastapi import APIRouter, HTTPException
from db import dev_collection 

router = APIRouter(prefix="/api")

@router.get("/dev") # 최종 엔드포인트: /api/dev
async def get_dev_data():
    """
    개발팀(Dev) 데이터를 반환하는 API 엔드포인트
    dev_collection (db["company_dev"])에서 실제 데이터를 가져옵니다.
    """
    data = []
    try:
        for doc in dev_collection.find():
            doc.pop('_id', None)
            data.append(doc)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch dev data: {e}")
        
    return {"dev": data}

@router.get("/dev/columns")
async def get_dev_columns():
    """
    개발팀 데이터의 컬럼 정보를 반환하는 API 엔드포인트
    """
    sample = dev_collection.find_one()
    if not sample:
        return {"columns": []}
    
    columns = list(sample.keys())
    if "_id" in columns:
        columns.remove("_id") # _id 컬럼은 제외
    
    return {"columns": columns}