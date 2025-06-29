from fastapi import APIRouter
from db import ncsi_collection

router = APIRouter(
    prefix="/ncsi",
    tags=["NCSI"]
)

@router.get("/top20")
def get_ncsi_top20():
    """
    NCSI 상위 20개국 데이터 반환 (최신 MongoDB 기준)
    """
    data = list(ncsi_collection.find({}, {"_id": 0}))
    return {"count": len(data), "results": data}