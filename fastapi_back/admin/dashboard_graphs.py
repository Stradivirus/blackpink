from fastapi import APIRouter
from db import member_collection, dev_collection, incident_collection, companies_collection
from datetime import datetime, timedelta
from collections import defaultdict, Counter
import pandas as pd
import math

router = APIRouter()

# 최근 3개월(포함) 월 리스트 생성

def get_recent_months(n=3):
    now = datetime.now()
    months = []
    for i in range(n-1, -1, -1):
        year = (now.year if now.month - i > 0 else now.year - 1)
        month = (now.month - i) if (now.month - i) > 0 else (12 + (now.month - i))
        months.append(f"{year}-{month:02d}")
    return months

def get_biz_data(df_comp, recent_months):
    biz_data = {"labels": recent_months}
    plans = ["베이직", "프로", "엔터프라이즈", "미지정"]
    for plan in plans:
        biz_data[plan] = []
    for ym in recent_months:
        y, m = map(int, ym.split("-"))
        # 해당 월의 마지막 날
        if m == 12:
            last_day = pd.Timestamp(year=y+1, month=1, day=1) - pd.Timedelta(days=1)
        else:
            last_day = pd.Timestamp(year=y, month=m+1, day=1) - pd.Timedelta(days=1)
        # 유효한 계약: 시작 <= last_day, (종료가 없거나 last_day <= 종료)
        mask = (df_comp['contract_start'] <= last_day) & (df_comp['contract_end'].isna() | (df_comp['contract_end'] >= last_day))
        df_valid = df_comp[mask] if not df_comp.empty else pd.DataFrame()
        for plan in plans:
            if plan == "미지정":
                cnt = df_valid[(df_valid['plan'].isna()) | (df_valid['plan'] == "")].shape[0] if not df_valid.empty else 0
            else:
                cnt = df_valid[df_valid['plan'] == plan].shape[0] if not df_valid.empty else 0
            biz_data[plan].append(int(cnt))
    return biz_data

def get_dev_data(df_dev, recent_months):
    dev_data = {"labels": recent_months}
    all_os_types = set()
    month_os_counts = []
    for ym in recent_months:
        y, m = map(int, ym.split("-"))
        start_day = pd.Timestamp(year=y, month=m, day=1)
        if m == 12:
            end_day = pd.Timestamp(year=y+1, month=1, day=1) - pd.Timedelta(days=1)
        else:
            end_day = pd.Timestamp(year=y, month=m+1, day=1) - pd.Timedelta(days=1)
        # 해당 월에 시작된 프로젝트만
        mask = (
            (df_dev['dev_status'] == "개발 진행중") &
            (df_dev['start_date'] >= start_day) & (df_dev['start_date'] <= end_day)
        )
        df_valid = df_dev[mask].copy() if not df_dev.empty else pd.DataFrame()
        if not df_valid.empty:
            # OS명을 'Linux' 등으로 통일 (대소문자, 공백 등)
            df_valid['os'] = df_valid['os'].astype(str).str.strip().str.capitalize()
            df_valid.loc[df_valid['os'].isna(), 'os'] = '미지정'
            df_valid.loc[df_valid['os'] == '', 'os'] = '미지정'
        os_counts = df_valid['os'].value_counts().to_dict() if not df_valid.empty else {}
        # value_counts 결과를 int로 강제 변환
        os_counts = {k: int(v) for k, v in os_counts.items()}
        all_os_types.update(os_counts.keys())
        month_os_counts.append(os_counts)
    if not all_os_types:
        all_os_types = {"미지정"}
    for os_name in all_os_types:
        arr = []
        for i in range(len(recent_months)):
            v = month_os_counts[i].get(os_name, 0)
            # 혹시라도 float/NaN이 들어오면 0으로
            if isinstance(v, float):
                if math.isnan(v):
                    v = 0
                else:
                    v = int(v)
            arr.append(int(v))
        dev_data[os_name] = arr
    return dev_data

def get_security_data(df_incident, recent_months):
    security_data = {"labels": recent_months}
    levels = ["LOW", "MEDIUM", "HIGH", "미지정"]
    for level in levels:
        security_data[level] = []
    for ym in recent_months:
        # status=="진행중"만
        mask = (df_incident['status'] == '진행중') if not df_incident.empty else False
        df_valid = df_incident[mask] if not df_incident.empty else pd.DataFrame()
        for level in levels:
            if level == "미지정":
                cnt = df_valid[(df_valid['risk_level'].isna()) | (df_valid['risk_level'] == "") & (df_valid['ym'] == ym)].shape[0] if not df_valid.empty else 0
            else:
                cnt = df_valid[(df_valid['risk_level'] == level) & (df_valid['ym'] == ym)].shape[0] if not df_valid.empty else 0
            security_data[level].append(int(cnt))
    return security_data

@router.get("/api/dashboard/summary-graphs")
def dashboard_summary_graphs():
    # 사업팀: companies_collection에서 플랜별 월별 카운트
    companies_data = list(companies_collection.find())
    df_comp = pd.DataFrame(companies_data)
    if not df_comp.empty:
        if 'contract_start' not in df_comp.columns:
            df_comp['contract_start'] = pd.NaT
        df_comp['contract_start'] = pd.to_datetime(df_comp['contract_start'], errors='coerce')
        # contract_end도 날짜형으로 변환
        if 'contract_end' not in df_comp.columns:
            df_comp['contract_end'] = pd.NaT
        df_comp['contract_end'] = pd.to_datetime(df_comp['contract_end'], errors='coerce')
        df_comp['ym'] = df_comp['contract_start'].dt.strftime('%Y-%m')
        if 'plan' not in df_comp.columns:
            df_comp['plan'] = None
    else:
        df_comp['ym'] = []
        df_comp['plan'] = []
    recent_months = get_recent_months(3)
    biz_data = get_biz_data(df_comp, recent_months)

    # 개발팀: dev_status별 월별 카운트 (여러 상태)
    dev_data_raw = list(dev_collection.find())
    df_dev = pd.DataFrame(dev_data_raw)
    if not df_dev.empty:
        if 'start_date' not in df_dev.columns:
            df_dev['start_date'] = pd.NaT
        if 'end_date_fin' not in df_dev.columns:
            df_dev['end_date_fin'] = pd.NaT
        df_dev['start_date'] = pd.to_datetime(df_dev['start_date'], errors='coerce')
        df_dev['end_date_fin'] = pd.to_datetime(df_dev['end_date_fin'], errors='coerce')
        df_dev['ym'] = df_dev['start_date'].dt.strftime('%Y-%m')
        if 'dev_status' not in df_dev.columns:
            df_dev['dev_status'] = None
    else:
        df_dev['ym'] = []
        df_dev['dev_status'] = []
    dev_data = get_dev_data(df_dev, recent_months)

    # 보안팀: 위험등급별 월별 사고 카운트
    incident_data = list(incident_collection.find())
    df_incident = pd.DataFrame(incident_data)
    if not df_incident.empty:
        df_incident['incident_date'] = pd.to_datetime(df_incident['incident_date'], errors='coerce')
        df_incident['ym'] = df_incident['incident_date'].dt.strftime('%Y-%m')
        if 'risk_level' not in df_incident.columns:
            df_incident['risk_level'] = None
    else:
        df_incident['ym'] = []
        df_incident['risk_level'] = []
    security_data = get_security_data(df_incident, recent_months)

    return {
        "biz": biz_data,
        "dev": dev_data,
        "security": security_data
    }

@router.get("/api/dashboard/summary")
def dashboard_summary():
    # 1. 사업팀: 플랜별 계약 건수 (companies) - 오늘 기준 유효한 계약만 카운트
    today = pd.Timestamp(datetime.now().date())
    biz_docs = list(companies_collection.find({}))
    df_biz = pd.DataFrame(biz_docs)
    if not df_biz.empty:
        if 'contract_start' not in df_biz.columns:
            df_biz['contract_start'] = pd.NaT
        df_biz['contract_start'] = pd.to_datetime(df_biz['contract_start'], errors='coerce')
        if 'contract_end' not in df_biz.columns:
            df_biz['contract_end'] = pd.NaT
        df_biz['contract_end'] = pd.to_datetime(df_biz['contract_end'], errors='coerce')
        if 'plan' not in df_biz.columns:
            df_biz['plan'] = None
        # 오늘 기준 유효한 계약만 필터
        valid_mask = (df_biz['contract_start'] <= today) & (df_biz['contract_end'].isna() | (df_biz['contract_end'] >= today))
        df_biz = df_biz[valid_mask]
    biz = {}
    for _, doc in df_biz.iterrows():
        plan = doc.get("plan", "미지정")
        biz[plan] = biz.get(plan, 0) + 1

    # 2. 개발팀: 진행중(dev_status=="개발 진행중") 프로젝트 수 (sys_dev)
    dev_docs = list(dev_collection.find({"dev_status": "개발 진행중"}))
    dev_count = len(dev_docs)
    dev_os = {}
    for doc in dev_docs:
        os_name = doc.get("os") or "미지정"
        dev_os[os_name] = dev_os.get(os_name, 0) + 1

    # 3. 보안팀: 진행중(status=="진행중") 사고를 risk_level별로 group by (incident_logs)
    incident_docs = list(incident_collection.find({"status": "진행중"}))
    security = {}
    for doc in incident_docs:
        level = doc.get("risk_level") or "미지정"
        security[level] = security.get(level, 0) + 1

    return {
        "biz": biz,
        "dev": {
            "total": dev_count,
            "os": dev_os
        },
        "security": security
    }
