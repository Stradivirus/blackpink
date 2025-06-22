from fastapi import APIRouter, Response
from models import Incident
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
from matplotlib import font_manager as fm
import io
from db import incident_collection

router = APIRouter(prefix="/graph")

collection = incident_collection

# 그래프 스타일(폰트, 색상 등)을 설정하는 함수
def set_plot_style():
    font_path = "/usr/share/fonts/truetype/nanum/NanumGothic.ttf"
    # font_path = 'C:/Windows/Fonts/malgun.ttf'
    font_prop = fm.FontProperties(fname=font_path)
    plt.rcParams['font.family'] = font_prop.get_name()
    plt.rcParams['axes.unicode_minus'] = False
    sns.set_style("whitegrid")
    sns.set_palette("Set2")

# MongoDB에서 incident 데이터를 불러와 DataFrame으로 변환하는 함수
# Pydantic 모델로 데이터 검증 및 전처리 포함
def get_dataframe():
    data = list(collection.find())
    if not data:
        return pd.DataFrame()
    # Pydantic 모델로 검증
    incidents = []
    for d in data:
        try:
            # _id 등 불필요한 필드는 제거
            d.pop('_id', None)
            incident = Incident(**d)
            incidents.append(incident.dict())
        except Exception as e:
            continue  # 검증 실패시 무시
    if not incidents:
        return pd.DataFrame()
    df = pd.DataFrame(incidents)
    df['incident_date'] = pd.to_datetime(df['incident_date'])
    df['year'] = df['incident_date'].dt.year
    df['month'] = df['incident_date'].dt.month
    return df

# 그래프 타입에 따라 시각화 이미지를 생성하는 함수
# 지원 타입: threat, risk, threat_y, threat_m
# 데이터가 없거나 타입이 잘못되면 None 반환
def create_plot(graph_type):
    df = get_dataframe()
    if df.empty:
        return None

    set_plot_style()
    fig, ax = plt.subplots(figsize=(10, 6))

    if graph_type == 'threat':
        sns.countplot(x='threat_type', data=df, ax=ax)
        ax.set_title('위협 유형 분포')
        ax.set_xticklabels(ax.get_xticklabels(), rotation=45)
    elif graph_type == 'risk':
        risk_counts = df['risk_level'].value_counts()
        ax.pie(risk_counts, labels=risk_counts.index, autopct='%1.1f%%', startangle=140)
        ax.set_title('위험 등급 분포')
    elif graph_type == 'threat_y':
        sns.countplot(x='year', hue='threat_type', data=df, ax=ax)
        ax.set_title("연도별 침해 현황")
        ax.set_xticklabels(ax.get_xticklabels(), rotation=45)
    elif graph_type == 'threat_m':
        # monthly_counts = df.groupby(['month', 'threat_type']).size().reset_index(name='count')
        # Top 5 threat_type 선택
        top_threats = df['threat_type'].value_counts().nlargest(5).index.tolist()
        # 상위 5개만 필터링
        df_filtered = df[df['threat_type'].isin(top_threats)]
        
        # 월별, 위협유형별 카운트
        monthly_counts = df_filtered.groupby(['month', 'threat_type']).size().reset_index(name='count')
        
        sns.lineplot(x='month', y='count', hue='threat_type', data=monthly_counts, marker='o', ax=ax)
        ax.set_title("월별 침해 현황")
        ax.set_xticks(range(1, 7))
        ax.set_xlabel("월")
        ax.set_ylabel("발생 횟수")
        ax.grid(True)
    else:
        plt.close(fig)
        return None

    plt.tight_layout()
    buf = io.BytesIO()
    plt.savefig(buf, format="png")
    plt.close(fig)
    buf.seek(0)
    return buf.getvalue()

# FastAPI 엔드포인트: 그래프 이미지를 반환
# /graph/{graph_type} 경로로 접근
@router.get("/{graph_type}")
async def plot(graph_type: str):
    img_data = create_plot(graph_type)
    if img_data is None:
        return Response(content="Unknown graph type or no data", status_code=404)
    return Response(content=img_data, media_type="image/png")