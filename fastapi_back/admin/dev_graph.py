from fastapi import APIRouter, Response
from models import Project
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
from matplotlib import font_manager as fm
import plotly.express as px
import plotly.graph_objects as go
import io
from db import dev_collection

router = APIRouter()  # prefix 제거
collection = dev_collection

def set_plot_style():
    font_path = 'C:/Windows/Fonts/malgun.ttf'
    font_prop = fm.FontProperties(fname=font_path)
    plt.rcParams['font.family'] = font_prop.get_name()
    plt.rcParams['axes.unicode_minus'] = False
    sns.set_style("whitegrid")
    sns.set_palette("Set2")
    return font_prop

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
    plt.xticks(rotation=45)
    return save_to_png(fig)

def plot_maintenance_by_os(df, font_prop):
    fig, ax = plt.subplots(figsize=(10, 6))
    version_counts = df.groupby(['os', 'maintenance']).size().unstack(fill_value=0)
    version_counts.plot(kind='bar', stacked=True, ax=ax)
    ax.set_title("OS별 관리 현황", fontproperties=font_prop)
    ax.set_xlabel("OS", fontproperties=font_prop)
    ax.set_ylabel("Count", fontproperties=font_prop)
    ax.legend(title="관리 현황", bbox_to_anchor=(1.05, 1), loc='upper left', prop=font_prop, title_fontproperties=font_prop)
    plt.xticks(rotation=45)
    return save_to_png(fig)

def plot_dev_duration_by_os(df, font_prop):
    sns.set(style="whitegrid", palette="pastel", font="NanumGothic")
    fig, ax = plt.subplots(figsize=(10, 6))
    df['dev_days'] = pd.to_numeric(df['dev_days'], errors='coerce')
    sns.boxplot(data=df, x='os', y='dev_days', ax=ax, palette="Set2")
    ax.set_title("OS별 개발기간", fontproperties=font_prop, fontsize=16)
    ax.set_xlabel("OS", fontproperties=font_prop, fontsize=12)
    ax.set_ylabel("개발기간 (일)", fontproperties=font_prop, fontsize=12)
    plt.xticks(rotation=30)
    sns.despine()
    plt.tight_layout()
    return save_to_png(fig)

def plot_error_by_os(df, font_prop):
    df_valid = df[df['error'].notnull()]
    fig, ax = plt.subplots(figsize=(12, 6))
    sns.countplot(data=df_valid, x='os', hue='error', ax=ax)
    ax.set_title("OS별 에러 유형 분포", fontproperties=font_prop)
    ax.set_xlabel("OS", fontproperties=font_prop)
    ax.set_ylabel("에러 수", fontproperties=font_prop)
    ax.legend(title='에러 유형', prop=font_prop)
    return save_to_png(fig)

def scatter_dev_days_by_handler_count(df):
    df = df[df['dev_days'].notnull() & df['handler_count'].notnull()]

    # Create base figure with all data
    fig = px.scatter(
        df,
        x="handler_count",
        y="dev_days",
        color="os",
        hover_data=["company_name", "dev_status"],
        title="담당 인원 수와 개발기간 관계 (OS별 필터 가능)",
        labels={
            "handler_count": "담당 인원 수",
            "dev_days": "개발기간 (일)"
        }
    )

    # Create dropdown buttons for each OS
    os_list = df["os"].dropna().unique().tolist()
    buttons = []

    for os_name in os_list:
        visible = df["os"] == os_name
        button = dict(
            label=os_name,
            method="update",
            args=[
                {"x": [df[visible]["handler_count"]],
                "y": [df[visible]["dev_days"]],
                "hovertext": [df[visible]["company_name"]],
                "marker": {"color": px.colors.qualitative.Set2[os_list.index(os_name) % 8]}},
                {"title": f"담당 인원 수와 개발기간 관계 — {os_name}"}
            ]
        )
        buttons.append(button)

    # Add a button to show all OS
    buttons.insert(0, dict(
        label="모두 보기",
        method="update",
        args=[
            {"x": [df["handler_count"]],
            "y": [df["dev_days"]],
            "hovertext": [df["company_name"]],
            "marker": {"color": "lightgrey"}},
            {"title": "담당 인원 수와 개발기간 관계 (전체)"}
        ]
    ))

    # Update layout with dropdown
    fig.update_layout(
        updatemenus=[dict(
            buttons=buttons,
            direction="down",
            x=1.15,
            y=1,
            showactive=True
        )],
        xaxis=dict(title="담당 인원 수"),
        yaxis=dict(title="개발기간 (일)"),
        margin=dict(t=50, b=50, l=50, r=50)
    )

    fig.show()





# --- 그래프 타입별 함수 매핑 ---
dev_graph_func_map = {
    'os_version_by_os': plot_os_version_by_os,
    'maintenance_by_os': plot_maintenance_by_os,
    'dev_duration_by_os': plot_dev_duration_by_os,
    'error_by_os': plot_error_by_os,
    'dev_by_handler': scatter_dev_days_by_handler_count,
    
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

def image_response(img_data):
    if img_data is None:
        return Response(content="Unknown graph type or no data", status_code=404)
    return Response(content=img_data, media_type="image/png")

@router.get("/api/dev/graph/{graph_type}")
async def plot(graph_type: str):
    img_data = create_plot(graph_type)
    return image_response(img_data)

