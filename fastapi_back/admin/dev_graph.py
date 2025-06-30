from fastapi import APIRouter, Response
from models import Project
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
from db import dev_collection
from .graph_utils import set_plot_style, save_fig_to_png, image_response

router = APIRouter(prefix="/api")
collection = dev_collection

# MongoDB에서 프로젝트 데이터프레임 생성
def get_dataframe():
    data = list(collection.find())
    if not data:
        return pd.DataFrame()
    projects = []
    for d in data:
        try:
            d.pop('_id', None)
            project = Project(**d)  # Pydantic 모델로 검증
            projects.append(project.dict())
        except Exception:
            continue
    if not projects:
        return pd.DataFrame()
    df = pd.DataFrame(projects)
    return df

# --- 그래프별 함수 분리 ---

# OS별 버전 분포(스택 바차트)
def plot_os_version_by_os(df, font_prop):
    fig, ax = plt.subplots(figsize=(10, 6))
    version_counts = df.groupby(['os', 'os_versions']).size().unstack(fill_value=0)
    version_counts = version_counts.sort_index()
    version_counts.plot(kind='bar', stacked=True, ax=ax)
    ax.set_title("OS별 버전 분포", fontproperties=font_prop)
    ax.set_xlabel("OS", fontproperties=font_prop)
    ax.set_ylabel("Count", fontproperties=font_prop)
    ax.legend(title="OS Version", bbox_to_anchor=(1.05, 1), loc='upper left', prop=font_prop)
    plt.xticks(rotation=45)
    return save_fig_to_png(fig)

# OS별 관리 현황(스택 바차트)
def plot_maintenance_by_os(df, font_prop):
    fig, ax = plt.subplots(figsize=(10, 6))
    version_counts = df.groupby(['os', 'maintenance']).size().unstack(fill_value=0)
    version_counts = version_counts.sort_index()
    version_counts.plot(kind='bar', stacked=True, ax=ax)
    ax.set_title("OS별 관리 현황", fontproperties=font_prop)
    ax.set_xlabel("OS", fontproperties=font_prop)
    ax.set_ylabel("Count", fontproperties=font_prop)
    ax.legend(title="관리 현황", bbox_to_anchor=(1.05, 1), loc='upper left', prop=font_prop, title_fontproperties=font_prop)
    plt.xticks(rotation=45)
    return save_fig_to_png(fig)

# OS별 개발기간(박스플롯)
def plot_dev_duration_by_os(df, font_prop):
    fig, ax = plt.subplots(figsize=(10, 6))
    df['dev_days'] = pd.to_numeric(df['dev_days'], errors='coerce')
    # OS 이름 알파벳순 정렬
    os_order = sorted(df['os'].dropna().unique())
    sns.boxplot(data=df, x='os', y='dev_days', ax=ax, palette="Set1", order=os_order)
    ax.set_title("OS별 개발기간", fontproperties=font_prop, fontsize=16)
    ax.set_xlabel("OS", fontproperties=font_prop, fontsize=12)
    ax.set_ylabel("개발기간 (일)", fontproperties=font_prop, fontsize=12)
    plt.xticks(rotation=45)
    sns.despine()
    plt.tight_layout()
    return save_fig_to_png(fig)

# OS별 에러 유형 분포(카운트플롯)
def plot_error_by_os(df, font_prop):
    df_valid = df[(df['error'].notnull()) & (df['error'] != "에러 없음")]
    fig, ax = plt.subplots(figsize=(12, 6))
    os_order = sorted(df_valid['os'].dropna().unique())
    sns.countplot(data=df_valid, x='os', hue='error', ax=ax, order=os_order)
    ax.set_title("OS별 에러 유형 분포", fontproperties=font_prop)
    ax.set_xlabel("OS", fontproperties=font_prop)
    ax.set_ylabel("에러 수", fontproperties=font_prop)
    ax.legend(title='에러 유형', prop=font_prop, title_fontproperties=font_prop)
    return save_fig_to_png(fig)

# 담당 인원 수와 개발기간 관계(산점도+회귀선)
def scatter_dev_days_by_handler_count(df, font_prop):
    df_valid = df[df['dev_days'].notnull() & df['handler_count'].notnull()]
    fig, ax = plt.subplots(figsize=(10, 6))
    sns.scatterplot(
        data=df_valid,
        x='handler_count',
        y='dev_days',
        hue='os',
        palette='Set2',
        alpha=0.7,
        s=80,
        ax=ax
    )
    sns.regplot(
        data=df_valid,
        x='handler_count',
        y='dev_days',
        scatter=False,
        ax=ax,
        line_kws={"color": "gray", "linestyle": "--"}
    )
    ax.set_title("담당 인원 수와 개발기간 관계", fontproperties=font_prop, fontsize=16)
    ax.set_xlabel("담당 인원 수", fontproperties=font_prop, fontsize=12)
    ax.set_ylabel("개발기간 (일)", fontproperties=font_prop, fontsize=12)
    ax.legend(title="OS", bbox_to_anchor=(1.05, 1), loc='upper left', prop=font_prop)
    sns.despine()
    plt.tight_layout()
    return save_fig_to_png(fig)

# --- 그래프 타입별 함수 매핑 ---
dev_graph_func_map = {
    'os_version_by_os': plot_os_version_by_os,
    'maintenance_by_os': plot_maintenance_by_os,
    'dev_duration_by_os': plot_dev_duration_by_os,
    'error_by_os': plot_error_by_os,
    'dev_by_handler': scatter_dev_days_by_handler_count,
}

# 그래프 생성 및 반환
def create_plot(graph_type):
    df = get_dataframe()
    if df.empty:
        return None
    font_prop = set_plot_style()
    func = dev_graph_func_map.get(graph_type)
    if not func:
        return None
    return func(df, font_prop)

# 그래프 이미지 반환 엔드포인트
@router.get("/dev/graph/{graph_type}")
async def plot(graph_type: str):
    img_data = create_plot(graph_type)
    return image_response(img_data)

