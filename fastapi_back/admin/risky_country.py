# 위험 국가 지도 데이터 (GeoJSON 형태)
from fastapi import APIRouter
from db import db  # 기존 db.py에서 db 객체 import
from datetime import datetime

router = APIRouter()

@router.get("/api/risky_countries/map_data")
def get_risky_countries_map_data():
    collection = db["global_security_index"]
    countries = list(collection.find({"type": "risky_country"}))
    features = [
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [c["longitude"], c["latitude"]]
            },
            "properties": {
                "country": c["country"],
                "risk_level": c["risk_level"],
                "alert_type": c.get("alert_type"),
                "timestamp": c["timestamp"].isoformat() if isinstance(c["timestamp"], datetime) else str(c["timestamp"])
            }
        } for c in countries
    ]
    return {
        "type": "FeatureCollection",
        "features": features
    }

@router.get("/api/gci_rankings")
def get_gci_rankings(year: int = None):
    query = {"type": "gci_ranking"}
    if year:
        query["year"] = year
    rankings = list(db["global_security_index"].find(query).sort([("year", -1), ("rank", 1)]))
    for r in rankings:
        r["id"] = str(r["_id"])
        r.pop("_id", None)
    return rankings