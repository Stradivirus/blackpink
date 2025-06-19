from fastapi import APIRouter
from models import IncidentListResponse
from db import incident_collection

router = APIRouter(prefix="/api")

@router.get("/incident", response_model=IncidentListResponse)
async def get_incidents():
    data = list(incident_collection.find())
    for d in data:
        d.pop('_id', None)
    return {"incidents": data}

@router.get("/columns")
async def get_columns():
    sample = incident_collection.find_one()
    if not sample:
        return {"columns": []}
    columns = list(sample.keys())
    if "_id" in columns:
        columns.remove("_id")
    return {"columns": columns}

