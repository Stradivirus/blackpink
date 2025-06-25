from fastapi import APIRouter
from models import Project
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
from matplotlib import font_manager as fm
import io
from db import dev_collection
from .graph_utils import set_plot_style, image_response

router = APIRouter()  # prefix 제거
collection = dev_collection

def get_dataframe():
    data = list(collection.find())
    if not data:
        return pd.DataFrame()
    # Pydantic 모델로 검증
    projects = []
    for d in data:
        try:
            # _id 등 불필요한 필드는 제거
            d.pop('_id', None)
            project = Project(**d)
            projects.append(project.dict())
        except Exception:
            continue  # 검증 실패시 무시
    if not projects:
        return pd.DataFrame()
    df = pd.DataFrame(projects)
    return df

def save_to_png(fig):
    buf = io.BytesIO()
    plt.tight_layout()
    fig.savefig(buf, format="png")
    plt.close(fig)
    buf.seek(0)
    return buf.getvalue()

# --- 그래프별 함수 분리 ---
def plot_os_version_by_os(df, font_prop):
    fig, ax = plt.subplots(figsize=(10, 6))
    version_counts = df.groupby(['os', 'os_versions']).size().unstack(fill_value=0)
    version_counts.plot(kind='bar', stacked=True, ax=ax)
    ax.set_title("OS별 버전 분포", fontproperties=font_prop)
    ax.set_xlabel("OS", fontproperties=font_prop)
    ax.set_ylabel("Count", fontproperties=font_prop)
    ax.legend(title="OS Version", bbox_to_anchor=(1.05, 1), loc='upper left')
    return save_to_png(fig)

def plot_maintenance_by_os(df, font_prop):
    fig, ax = plt.subplots(figsize=(10, 6))
    version_counts = df.groupby(['os', 'maintenance']).size().unstack(fill_value=0)
    version_counts.plot(kind='bar', stacked=True, ax=ax)
    ax.set_title("OS별 관리 현황", fontproperties=font_prop)
    ax.set_xlabel("OS", fontproperties=font_prop)
    ax.set_ylabel("Count", fontproperties=font_prop)
    ax.legend(title="관리 현황", bbox_to_anchor=(1.05, 1), loc='upper left')
    return save_to_png(fig)

def plot_dev_duration_by_os(df, font_prop):
    fig, ax = plt.subplots(figsize=(10, 6))
    df['dev_days'] = pd.to_datetime(df['dev_days'])
    sns.boxplot(data=df_valid, x='os', y='dev_days', ax=ax)
    ax.set_title("OS별 개발기간", fontproperties=font_prop)
    ax.set_xlabel("OS", fontproperties=font_prop)
    ax.set_ylabel("개발기간(일)", fontproperties=font_prop)
    return save_to_png(fig)

# --- 그래프 타입별 함수 매핑 ---
dev_graph_func_map = {
    'os_version_by_os': plot_os_version_by_os,
    'maintenance_by_os': plot_maintenance_by_os,
    'dev_duration_by_os': plot_dev_duration_by_os,
}

def create_plot(graph_type):
    df = get_dataframe()
    if df.empty:
        return None
    font_prop = set_plot_style()
    func = dev_graph_func_map.get(graph_type)
    if not func:
        return None
    return func(df, font_prop)

@router.get("/api/dev/graph/{graph_type}")
async def plot(graph_type: str):
    img_data = create_plot(graph_type)
    return image_response(img_data)

