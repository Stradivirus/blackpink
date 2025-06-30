from fastapi import APIRouter
from fastapi.responses import JSONResponse
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
from matplotlib import font_manager as fm
import networkx as nx
from db import incident_collection
from .graph_utils import set_plot_style, image_response, save_fig_to_png

router = APIRouter(prefix="/api")
collection = incident_collection

# MongoDB에서 데이터프레임 생성
def get_dataframe():
    data = list(collection.find())
    if not data:
        return pd.DataFrame()
    df = pd.DataFrame(data).drop(columns=['_id'], errors='ignore')
    df['incident_date'] = pd.to_datetime(df['incident_date'], errors='coerce')
    df['year'] = df['incident_date'].dt.year
    df['month'] = df['incident_date'].dt.month
    return df

# 한글 폰트 일괄 적용
def set_font_all(ax, font_prop):
    ax.set_title(ax.get_title(), fontproperties=font_prop)
    ax.set_xlabel(ax.get_xlabel(), fontproperties=font_prop)
    ax.set_ylabel(ax.get_ylabel(), fontproperties=font_prop)
    for label in ax.get_xticklabels():
        label.set_fontproperties(font_prop)
    for label in ax.get_yticklabels():
        label.set_fontproperties(font_prop)

# --- 그래프별 함수 분리 ---

# 위험 등급 비율 파이차트
def plot_risk(df, font_prop):
    risk_counts = df['risk_level'].value_counts().reset_index()
    risk_counts.columns = ['risk_level', 'count']
    fig, ax = plt.subplots(figsize=(6, 6))
    colors = ['#F54343', '#0C81F5', '#F5A608', '#08FA08', '#7F09F5']
    # 가장 큰 부분만 강조
    explode = [0.1 if i == risk_counts['count'].idxmax() else 0 for i in range(len(risk_counts))]
    wedges, texts, autotexts = ax.pie(
        risk_counts['count'],
        labels=risk_counts['risk_level'],
        autopct='%1.1f%%',
        startangle=90,
        colors=colors[:len(risk_counts)],
        textprops={'fontsize': 14, 'fontproperties': font_prop},
        explode=explode
    )
    ax.set_title("위험 등급 비율", fontproperties=font_prop, fontsize=22)
    return save_fig_to_png(fig, backend="matplotlib")

# 연도별 침해 현황 바차트
def plot_threat_y(df, font_prop):
    yearly_counts = df.groupby(['year', 'threat_type']).size().reset_index(name='count')
    fig, ax = plt.subplots(figsize=(10, 6))
    sns.barplot(
        data=yearly_counts,
        x='year',
        y='count',
        hue='threat_type',
        ax=ax
    )
    ax.set_title("연도별 침해 현황", fontproperties=font_prop, fontsize=22)
    ax.set_xlabel("연도", fontproperties=font_prop, fontsize=16)
    ax.set_ylabel("발생 건수", fontproperties=font_prop, fontsize=16)
    ax.tick_params(axis='x', labelsize=12)
    ax.tick_params(axis='y', labelsize=12)
    set_font_all(ax, font_prop)
    if ax.legend_:
        for text in ax.legend_.get_texts():
            text.set_fontproperties(font_prop)
    return save_fig_to_png(fig, backend="matplotlib")

# 처리된 위협종류 분포 바차트
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
    return save_fig_to_png(fig, backend="matplotlib")

# 서버별 발생 위협 히트맵
def plot_correl_threats_server(df, font_prop):
    fig, ax = plt.subplots(figsize=(10,6))
    pivot_table = df.pivot_table(index='threat_type', columns='server_type', aggfunc='size', fill_value=0)
    sns.heatmap(pivot_table, annot=True, fmt='d', cmap='YlGnBu', ax=ax)
    ax.set_title('서버별 발생 위협', fontproperties=font_prop)
    ax.set_xlabel("서버종류", fontproperties=font_prop)
    ax.set_ylabel("위협종류", fontproperties=font_prop)
    ax.tick_params(axis='x', rotation=45)
    set_font_all(ax, font_prop)
    return save_fig_to_png(fig, backend="matplotlib")

# 범례 폰트 적용
def set_legend_font(ax, font_prop):
    legend = ax.legend()
    if legend:
        for text in legend.get_texts():
            text.set_fontproperties(font_prop)

# 위험 등급별 처리 현황 스택 바차트
def plot_correl_risk_status(df, font_prop):
    fig, ax = plt.subplots(figsize=(10, 6))
    crosstab = pd.crosstab(df['risk_level'], df['status'])
    crosstab.plot(kind='bar', stacked=True, colormap='Pastel1', ax=ax)
    ax.set_title('위협 등급별 처리 현황', fontproperties=font_prop)
    ax.set_xlabel("위험도",  fontproperties=font_prop)
    ax.set_ylabel("건수", fontproperties=font_prop)
    ax.tick_params(axis='x', rotation=45)
    set_font_all(ax, font_prop)
    set_legend_font(ax, font_prop)
    return save_fig_to_png(fig, backend="matplotlib")

# 위협 유형과 조치 방법 산점도
def plot_correl_threat_action(df, font_prop):
    fig, ax = plt.subplots(figsize=(10, 6))
    cross = df.groupby(['threat_type', 'action']).size().reset_index(name='count')
    sns.scatterplot(x="threat_type", y="action", size="count", data=cross, sizes=(100, 1000), legend=False, ax=ax)
    ax.set_title('위협 유형과 조치 방법', fontproperties=font_prop)
    ax.tick_params(axis='x', rotation=45)
    set_font_all(ax, font_prop)
    return save_fig_to_png(fig, backend="matplotlib")

# 위협 유형별 투입 인원 네트워크 그래프
def plot_correl_threat_handler(df, font_prop):
    fig, ax = plt.subplots(figsize=(10, 6))
    G = nx.Graph()
    for _, row in df.iterrows():
        G.add_node(row['threat_type'])
        G.add_node(f"{row['handler_count']}명")
        G.add_edge(row['threat_type'], f"{row['handler_count']}명")
    pos = nx.spring_layout(G, seed=42)
    node_colors = ['#FF9999' if node in df['threat_type'].unique() else 'skyblue' for node in G.nodes()]
    nx.draw_networkx_nodes(G, pos, node_color=node_colors, node_size=2000, ax=ax)
    nx.draw_networkx_edges(G, pos, ax=ax)
    labels = {node: node for node in G.nodes()}
    label_colors = {node: ('red' if node in df['threat_type'].unique() else 'black') for node in G.nodes()}
    for node, (x, y) in pos.items():
        ax.text(
            x, y, labels[node], fontsize=12,
            fontproperties=font_prop,  # 한글 폰트 적용
            ha='center', va='center', color=label_colors[node]
        )
    ax.set_title('위협 유형별 투입 인원', fontproperties=font_prop)
    return save_fig_to_png(fig, backend="matplotlib")

# 월별 위협유형 발생 추이 라인차트
def plot_threat_m(df, font_prop, threat_type):
    if threat_type is None:
        return None
    top_threats = df['threat_type'].value_counts().nlargest(5).index.tolist()
    default_colors = ["#F54343", "#0C81F5", "#F5A608", "#08FA08", "#7F09F5"]
    color_map = {t: default_colors[i] for i, t in enumerate(top_threats)}
    default_styles = ["-", "--", "-", "--", (0, (5, 1))]
    linestyle_map = {t: default_styles[i] for i, t in enumerate(top_threats)}
    threat_df = df[df['threat_type'] == threat_type]
    if threat_df.empty:
        return None
    fig, ax = plt.subplots(figsize=(10, 6))
    monthly_counts = threat_df.groupby(['month']).size().reset_index(name='count')
    sns.lineplot(
        x='month', y='count', data=monthly_counts,
        marker='o', ax=ax,
        color=color_map.get(threat_type, "#000000"),
        linestyle=linestyle_map.get(threat_type, '-'),
        alpha=1.0
    )
    ax.set_title(f"{threat_type} 월별 발생 추이", fontproperties=font_prop, fontsize=16, fontweight='bold',
                 color=color_map.get(threat_type, "#000000"))
    ax.set_xlabel("월", fontproperties=font_prop, fontsize=14)
    ax.set_ylabel("발생 횟수", fontproperties=font_prop, fontsize=14)
    ax.grid(True, alpha=0.3)
    if not monthly_counts['month'].empty:
        ax.set_xticks(sorted(monthly_counts['month'].unique()))
    return save_fig_to_png(fig, backend="matplotlib")

# 위협유형별 처리기간 vs 투입인원 jointplot
def plot_manpower(df, font_prop, threat_type=None):
    if threat_type is None:
        return None
    if threat_type == "전체보기":
        filtered_df = df.copy()
    else:
        filtered_df = df[df['threat_type'] == threat_type].copy()
    if filtered_df.empty:
        return None
    filtered_df['incident_date'] = pd.to_datetime(filtered_df['incident_date'])
    filtered_df['processed_date'] = pd.to_datetime(filtered_df['handled_date'])
    filtered_df['처리기간(일)'] = (filtered_df['processed_date'] - filtered_df['incident_date']).dt.days
    filtered_df['투입인원'] = filtered_df['handler_count'].astype(int)
    if filtered_df['처리기간(일)'].isnull().all():
        return None
    set_plot_style()
    import matplotlib.pyplot as plt
    import seaborn as sns
    if threat_type == "전체보기":
        jp = sns.jointplot(
            data=filtered_df,
            x='처리기간(일)',
            y='투입인원',
            hue='threat_type',
            kind='scatter',
            palette='Set2',
            height=8
        )
    else:
        jp = sns.jointplot(
            data=filtered_df,
            x='처리기간(일)',
            y='투입인원',
            kind='scatter',
            height=8,
            color="#0C81F5"
        )
    jp.fig.suptitle('위협유형별: 처리기간 vs 투입인원', fontproperties=font_prop, fontsize=20)
    jp.ax_joint.set_xlabel('처리기간(일)', fontproperties=font_prop, fontsize=20)
    jp.ax_joint.set_ylabel('투입인원', fontproperties=font_prop, fontsize=20)
    if threat_type != "전체보기":
        jp.ax_joint.set_title(f"{threat_type}", fontproperties=font_prop, fontsize=18)
    jp.fig.tight_layout()
    jp.fig.subplots_adjust(top=0.9)
    if jp.ax_joint.legend_:
        for text in jp.ax_joint.legend_.get_texts():
            text.set_fontproperties(font_prop)
    return save_fig_to_png(jp.fig, backend="matplotlib")

# 그래프 타입별 함수 매핑
graph_func_map = {
    'risk': plot_risk,
    'threat_y': plot_threat_y,
    'threat_m': plot_threat_m,
    'processed_threats': plot_processed_threats,
    'correl_threats_server': plot_correl_threats_server,
    'correl_risk_status': plot_correl_risk_status,
    'correl_threat_action': plot_correl_threat_action,
    'correl_threat_handler': plot_correl_threat_handler,
    'manpower': plot_manpower,
}

# 그래프 생성 및 반환
def create_plot(graph_type, threat_type=None):
    df = get_dataframe()
    if df.empty:
        return None
    font_prop = set_plot_style()
    func = graph_func_map.get(graph_type)
    if func:
        if graph_type == "threat_m" or graph_type == "manpower":
            return func(df, font_prop, threat_type)
        else:
            return func(df, font_prop)
    return None

# 그래프 이미지 반환 엔드포인트
@router.get("/security/graph/{graph_type}")
async def plot(graph_type: str, threat_type: str = None):
    img_data = create_plot(graph_type, threat_type)
    if img_data is None:
        return JSONResponse(content={"error": "데이터가 없습니다."}, status_code=404)
    return image_response(img_data)

# 위협유형 목록 반환 엔드포인트
@router.get("/security/graph/threat_types")
async def get_threat_types():
    df = get_dataframe()
    if df.empty or 'threat_type' not in df.columns:
        return JSONResponse(content=[])
    types = df['threat_type'].dropna().unique().tolist()
    return JSONResponse(content=types)