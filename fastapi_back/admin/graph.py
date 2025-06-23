from fastapi import APIRouter, Response
from fastapi.responses import JSONResponse
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
from matplotlib import font_manager as fm
import matplotlib
import io
import plotly.express as px
import plotly.io as pio
import networkx as nx
from db import incident_collection

router = APIRouter()  # prefix 제거
collection = incident_collection

# 스타일/폰트 설정
FONT_PATH = 'C:/Windows/Fonts/malgun.ttf'
def set_plot_style():
    font_prop = fm.FontProperties(fname=FONT_PATH)
    matplotlib.rcParams.update({
        'font.family': font_prop.get_name(),
        'axes.unicode_minus': False,
        'font.size': 14,
        'axes.titlesize': 18,
        'axes.labelsize': 18,
        'xtick.labelsize': 16,
        'ytick.labelsize': 16,
        'legend.fontsize': 16
    })
    sns.set_style("whitegrid")
    sns.set_palette("Set2")
    return font_prop

def get_dataframe():
    data = list(collection.find())
    if not data:
        return pd.DataFrame()
    df = pd.DataFrame(data).drop(columns=['_id'], errors='ignore')
    df['incident_date'] = pd.to_datetime(df['incident_date'])
    df['year'] = df['incident_date'].dt.year
    df['month'] = df['incident_date'].dt.month
    return df

def save_to_png(fig):
    buf = io.BytesIO()
    plt.tight_layout()
    fig.savefig(buf, format="png")
    plt.close(fig)
    buf.seek(0)
    return buf.getvalue()

def save_plotly_to_png(fig):
    return pio.to_image(fig, format="png")

def set_font_all(ax, font_prop):
    ax.set_title(ax.get_title(), fontproperties=font_prop)
    ax.set_xlabel(ax.get_xlabel(), fontproperties=font_prop)
    ax.set_ylabel(ax.get_ylabel(), fontproperties=font_prop)
    for label in ax.get_xticklabels():
        label.set_fontproperties(font_prop)
    for label in ax.get_yticklabels():
        label.set_fontproperties(font_prop)

# --- 그래프별 함수 분리 ---
def plot_threat(df, font_prop):
    fig, ax = plt.subplots(figsize=(10, 6))
    sns.countplot(x='threat_type', data=df, ax=ax)
    ax.set_title('위협 유형 분포', fontproperties=font_prop)
    ax.tick_params(axis='x', rotation=45)
    set_font_all(ax, font_prop)
    return save_to_png(fig)

def plot_risk(df, font_prop):
    risk_counts = df['risk_level'].value_counts().reset_index()
    risk_counts.columns = ['risk_level', 'count']
    fig = px.pie(risk_counts, names='risk_level', values='count', title="위험 등급 비율",
                 color_discrete_sequence=px.colors.qualitative.Set2)
    fig.update_traces(textposition='inside', textinfo='percent+label')
    fig.update_layout(font_family="Malgun Gothic", title_font_size=22)
    return save_plotly_to_png(fig)

def plot_threat_y(df, font_prop):
    yearly_counts = df.groupby(['year', 'threat_type']).size().reset_index(name='count')
    fig = px.bar(yearly_counts, x='year', y='count', color='threat_type',
                 barmode='group', title="연도별 침해 현황")
    fig.update_layout(font_family="Malgun Gothic", xaxis_title="연도", yaxis_title="발생 건수", title_font_size=22)
    return save_plotly_to_png(fig)

def plot_threat_m(df, font_prop, threat_type):
    top_threats = df['threat_type'].value_counts().nlargest(5).index.tolist()
    color_map = dict(zip(top_threats, ["#F54343", "#0C81F5", "#F5A608", "#08FA08", "#7F09F5"]))
    linestyle_map = dict(zip(top_threats, ["-", "--", "-", "--", (0, (5, 1))]))
    threat_df = df[df['threat_type'] == threat_type]
    if threat_df.empty:
        return None
    fig, ax = plt.subplots(figsize=(10, 6))
    monthly_counts = threat_df.groupby(['month']).size().reset_index(name='count')
    sns.lineplot(
        x='month', y='count', data=monthly_counts, marker='o', ax=ax,
        color=color_map.get(threat_type, "#000000"), linestyle=linestyle_map.get(threat_type, '-')
    )
    ax.set_title(f"{threat_type}", fontproperties=font_prop, fontsize=16, fontweight='bold', color=color_map.get(threat_type, "#000"))
    ax.set_xticks(range(1, 13))
    ax.set_xlabel("월", fontproperties=font_prop, fontsize=14)
    ax.set_ylabel("발생 횟수", fontproperties=font_prop, fontsize=14)
    ax.grid(True, alpha=0.3)
    set_font_all(ax, font_prop)
    return save_to_png(fig)

def plot_processed_threats(df, font_prop):
    fig, ax = plt.subplots(figsize=(10, 6))
    processed_df = df[df['status'].isin(['처리중', '처리완료'])]
    threat_counts = processed_df['threat_type'].value_counts().reset_index()
    threat_counts.columns = ['threat_type', 'count']
    palette = ['#FF9999', '#66B3FF', '#99FF99', '#FFCC99', '#F54343', '#0C81F5', '#F5A608', '#08FA08']
    sns.barplot(x='threat_type', y='count', data=threat_counts, ax=ax, palette=palette, hue='threat_type', legend=False)
    ax.set_title("처리된 데이터 기준 위협종류 분포", fontproperties=font_prop)
    ax.set_xlabel("위협종류", fontproperties=font_prop)
    ax.set_ylabel("건수", fontproperties=font_prop)
    ax.tick_params(axis='x', rotation=45)
    set_font_all(ax, font_prop)
    return save_to_png(fig)

def plot_correl_threats_server(df, font_prop):
    fig, ax = plt.subplots(figsize=(10,6))
    pivot_table = df.pivot_table(index='threat_type', columns='server_type', aggfunc='size', fill_value=0)
    sns.heatmap(pivot_table, annot=True, fmt='d', cmap='YlGnBu', ax=ax)
    ax.set_title('서버별 발생 위협', fontproperties=font_prop)
    ax.set_xlabel("서버종류", fontproperties=font_prop)
    ax.set_ylabel("위협종류", fontproperties=font_prop)
    ax.tick_params(axis='x', rotation=45)
    set_font_all(ax, font_prop)
    return save_to_png(fig)

def plot_correl_risk_status(df, font_prop):
    fig, ax = plt.subplots(figsize=(10, 6))
    crosstab = pd.crosstab(df['risk_level'], df['status'])
    crosstab.plot(kind='bar', stacked=True, colormap='Pastel1', ax=ax)
    ax.set_title('위협 등급별 처리 현황', fontproperties=font_prop)
    ax.set_xlabel("위험도",  fontproperties=font_prop)
    ax.set_ylabel("건수", fontproperties=font_prop)
    ax.tick_params(axis='x', rotation=45)
    set_font_all(ax, font_prop)
    legend = ax.legend()
    for text in legend.get_texts():
        text.set_fontproperties(font_prop)
    return save_to_png(fig)

def plot_correl_threat_action(df, font_prop):
    fig, ax = plt.subplots(figsize=(10, 6))
    cross = df.groupby(['threat_type', 'action']).size().reset_index(name='count')
    sns.scatterplot(x="threat_type", y="action", size="count", data=cross, sizes=(100, 1000), legend=False, ax=ax)
    ax.set_title('위협 유형과 조치 방법', fontproperties=font_prop)
    ax.tick_params(axis='x', rotation=45)
    set_font_all(ax, font_prop)
    return save_to_png(fig)

def plot_correl_threat_handler(df, font_prop):
    fig, ax = plt.subplots(figsize=(10, 6))
    G = nx.Graph()
    for _, row in df.iterrows():
        G.add_node(row['threat_type'])
        G.add_node(f"{row['handler_count']}명")
        G.add_edge(row['threat_type'], f"{row['handler_count']}명")
    pos = nx.spring_layout(G, seed=42)
    font_name = font_prop.get_name()
    node_colors = ['#FF9999' if node in df['threat_type'].unique() else 'skyblue' for node in G.nodes()]
    nx.draw_networkx_nodes(G, pos, node_color=node_colors, node_size=2000, ax=ax)
    nx.draw_networkx_edges(G, pos, ax=ax)
    labels = {node: node for node in G.nodes()}
    label_colors = {node: ('red' if node in df['threat_type'].unique() else 'black') for node in G.nodes()}
    for node, (x, y) in pos.items():
        ax.text(x, y, labels[node], fontsize=12, fontfamily=font_name, ha='center', va='center', color=label_colors[node])
    ax.set_title('위협 유형별 투입 인원', fontproperties=font_prop)
    return save_to_png(fig)

# 그래프 타입별 함수 매핑
graph_func_map = {
    'threat': plot_threat,
    'risk': plot_risk,
    'threat_y': plot_threat_y,
    'processed_threats': plot_processed_threats,
    'correl_threats_server': plot_correl_threats_server,
    'correl_risk_status': plot_correl_risk_status,
    'correl_threat_action': plot_correl_threat_action,
    'correl_threat_handler': plot_correl_threat_handler
}

def create_plot(graph_type, threat_type=None):
    df = get_dataframe()
    if df.empty:
        return None
    font_prop = set_plot_style()
    if graph_type == 'threat_m':
        if not threat_type:
            return None
        return plot_threat_m(df, font_prop, threat_type)
    func = graph_func_map.get(graph_type)
    if func:
        return func(df, font_prop)
    return None

# 공통 Response 처리
def image_response(img_data):
    if img_data is None:
        return Response(content="Unknown graph type or no data", status_code=404)
    return Response(content=img_data, media_type="image/png")

@router.get("/api/graph/{graph_type}")
async def plot(graph_type: str):
    if graph_type == "threat_m":
        return Response(content="threat_type required", status_code=404)
    img_data = create_plot(graph_type)
    return image_response(img_data)

@router.get("/api/graph/threat_m/{threat_type}")
async def plot_threat_m_path(threat_type: str):
    img_data = create_plot("threat_m", threat_type)
    if img_data is None:
        return Response(content="No data", status_code=404)
    return Response(content=img_data, media_type="image/png")

@router.get("/api/graph/top_threats")
async def get_top_threats():
    df = get_dataframe()
    if df.empty:
        return JSONResponse(content={"top_threats": []})
    top_threats = df['threat_type'].value_counts().nlargest(5).index.tolist()
    return JSONResponse(content={"top_threats": top_threats})