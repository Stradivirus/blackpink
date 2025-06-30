from fastapi import APIRouter
from db import ncsi_collection

router = APIRouter(
    tags=["NCSI"]
)

# NCSI 상위 20개국 데이터 반환
@router.get("/api/ncsi/top20") 
def get_ncsi_top20():
    data = list(ncsi_collection.find({}, {"_id": 0}).limit(20))
    return {"count": len(data), "results": data}