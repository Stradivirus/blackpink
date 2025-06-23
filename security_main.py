from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, Response, JSONResponse
from fastapi.templating import Jinja2Templates
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
import matplotlib
from matplotlib import font_manager as fm
from pymongo import MongoClient
import io
import base64
import networkx as nx
import numpy as np
import plotly.express as px
import plotly.io as pio
import plotly.graph_objects as go


app = FastAPI()
templates = Jinja2Templates(directory="templates")

client = MongoClient("mongodb+srv://stradivirus:1q2w3e4r@cluster0.e7rvfpz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
db = client["blackpink"]
collection = db["incident_logs"]

def set_plot_style():
    font_path = 'C:/Windows/Fonts/malgun.ttf'
    font_prop = fm.FontProperties(fname=font_path)
    matplotlib.rcParams['font.family'] = font_prop.get_name()
    matplotlib.rcParams['axes.unicode_minus'] = False
    matplotlib.rcParams['font.size'] = 14  # default font size for everything
    # matplotlib.rcParams['font.weight'] = 'bold' 
    matplotlib.rcParams['axes.titlesize'] = 18  # title font size
    matplotlib.rcParams['axes.labelsize'] = 18  # x/y label font size
    matplotlib.rcParams['xtick.labelsize'] = 16
    matplotlib.rcParams['ytick.labelsize'] = 16
    matplotlib.rcParams['legend.fontsize'] = 16
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

# 그래프를 base64로 변환
def save_to_base64(fig):
    buf = io.BytesIO()
    plt.tight_layout()
    fig.savefig(buf, format="png")
    plt.close(fig)
    buf.seek(0)
    return base64.b64encode(buf.getvalue()).decode('utf-8')

# Plotly 한국어 폰트 설정
pio.templates.default = "plotly_white"
plotly_font_family = "Malgun Gothic"

def create_plot(graph_type, threat_type=None):
    df = get_dataframe()
    print(df.shape)
    if df.empty:
        return None

    font_prop = set_plot_style()
    plots = []
    
    if graph_type == 'threat':
        fig, ax = plt.subplots(figsize=(10, 6))
        sns.countplot(x='threat_type', data=df, ax=ax)
        ax.set_title('위협 유형 분포', fontproperties=font_prop)
        ax.set_xticklabels(ax.get_xticklabels(), rotation=45, fontproperties=font_prop)
        plots.append(save_to_base64(fig))

    elif graph_type == 'risk':
        # --- Plotly 적용 ---
        risk_counts = df['risk_level'].value_counts().reset_index()
        risk_counts.columns = ['risk_level', 'count']

        fig = px.pie(risk_counts, names='risk_level', values='count', title="위험 등급 비율",
                     color_discrete_sequence=px.colors.qualitative.Set2)
        fig.update_traces(textposition='inside', textinfo='percent+label')
        fig.update_layout(font_family=plotly_font_family, title_font_size=22)

        img_bytes = pio.to_image(fig, format="png")
        img_data = base64.b64encode(img_bytes).decode("utf-8")
        plots.append(img_data)

    elif graph_type == 'threat_y':
        # --- Plotly 적용 ---
        yearly_counts = df.groupby(['year', 'threat_type']).size().reset_index(name='count')

        fig = px.bar(yearly_counts, x='year', y='count', color='threat_type',
                     barmode='group', title="연도별 침해 현황")
        fig.update_layout(font_family=plotly_font_family, xaxis_title="연도", yaxis_title="발생 건수", title_font_size=22)

        img_bytes = pio.to_image(fig, format="png")
        img_data = base64.b64encode(img_bytes).decode("utf-8")
        plots.append(img_data)

    elif graph_type == 'threat_m':
        top_threats = df['threat_type'].value_counts().nlargest(5).index.tolist()
        if threat_type is None:
            return None

        color_map = {
            top_threats[0]: "#F54343",
            top_threats[1]: "#0C81F5",
            top_threats[2]: "#F5A608",
            top_threats[3]: "#08FA08",
            top_threats[4]: "#7F09F5"
        }
        linestyle_map = {top_threats[i]: s for i, s in enumerate(["-", "--", "-", "--", (0, (5, 1))])}

        threat_df = df[df['threat_type'] == threat_type]
        if threat_df.empty:
            return None

        fig, ax = plt.subplots(figsize=(10, 6))
        monthly_counts = threat_df.groupby(['month']).size().reset_index(name='count')
        line_color = color_map.get(threat_type, "#000000")  # default: 검정
        line_style = linestyle_map.get(threat_type, '-')
        
        sns.lineplot(
            x='month',
            y='count',
            data=monthly_counts,
            marker='o',
            ax=ax,
            color=line_color,
            linestyle=line_style,
            alpha=1.0
        )
        ax.set_title(f"{threat_type}", 
                     fontproperties=font_prop, 
                     fontsize=16, fontweight='bold',
                     color=line_color)
        ax.set_xticks(range(1, 8))
        ax.set_xlabel("월", fontproperties=font_prop, fontsize=14)
        ax.set_ylabel("발생 횟수", fontproperties=font_prop, fontsize=14)
        ax.grid(True, alpha=0.3)
        plots.append(save_to_base64(fig))
            
    elif graph_type == 'processed_threats':
        fig, ax = plt.subplots(figsize=(10, 6))
        # 1. 필터링: 처리중 또는 처리완료만
        processed_df = df[df['status'].isin(['처리중', '처리완료'])]

        # 2. 그룹핑: 위협종류별 카운트
        threat_counts = processed_df['threat_type'].value_counts().reset_index()
        threat_counts.columns = ['threat_type', 'count']

        # 3. 시각화
        palette = ['#FF9999', '#66B3FF', '#99FF99', '#FFCC99']
        sns.barplot(x='threat_type', y='count', data=threat_counts, ax=ax, palette=palette)
        
        ax.set_title("처리된 데이터 기준 위협종류 분포", fontproperties=font_prop)
        ax.set_xlabel("위협종류", fontproperties=font_prop)
        ax.set_ylabel("건수", fontproperties=font_prop)
        ax.set_xticklabels(ax.get_xticklabels(), rotation=45, fontproperties=font_prop)
        plots.append(save_to_base64(fig))
        
    elif graph_type == 'correl_threats_server': #heatmap
        fig, ax = plt.subplots(figsize=(10,6))
        
        # 1. Threat Type vs Server Type
        pivot_table = df.pivot_table(index='threat_type', columns='server_type', aggfunc='size', fill_value=0)
        sns.heatmap(pivot_table, annot=True, fmt='d', cmap='YlGnBu', ax=ax)
        ax.set_title('서버별 발생 위협', fontproperties=font_prop)
        ax.set_xlabel("서버종류", fontproperties=font_prop)
        ax.set_ylabel("위협종류", fontproperties=font_prop)
        ax.set_xticklabels(ax.get_xticklabels(), rotation=45, fontproperties=font_prop)
        ax.set_yticklabels(ax.get_yticklabels(), fontproperties=font_prop)
        plots.append(save_to_base64(fig))
        
    elif graph_type == 'correl_risk_status': # stacked bar
        fig, ax = plt.subplots(figsize=(10, 6))
        # 2. Threat Level vs Processing Status
        crosstab = pd.crosstab(df['risk_level'], df['status'])
        crosstab.plot(kind='bar', stacked=True, colormap='Pastel1', ax=ax)
        ax.set_title('위협 등급별 처리 현황', fontproperties=font_prop)
        ax.set_xlabel("위험도",  fontproperties=font_prop)
        ax.set_ylabel("건수", fontproperties=font_prop)
        ax.set_xticklabels(ax.get_xticklabels(), rotation=45, fontproperties=font_prop)
        # ax.legend(fontsize=12)
        legend = ax.legend()
        for text in legend.get_texts():
            text.set_fontproperties(font_prop)
        plots.append(save_to_base64(fig))
        
    elif graph_type == 'correl_threat_action': # bubble
        fig, ax = plt.subplots(figsize=(10, 6))
        # 3. Threat Type vs Action Taken
        cross = df.groupby(['threat_type', 'action']).size().reset_index(name='count')
        sns.scatterplot(x="threat_type", y="action", size="count", data=cross, sizes=(100, 1000), legend=False, ax=ax)
        ax.set_title('위협 유형과 조치 방법', fontproperties=font_prop)
        ax.set_xticklabels(ax.get_xticklabels(), rotation=45, fontproperties=font_prop)
        ax.set_yticklabels(ax.get_yticklabels(), fontproperties=font_prop)
        plots.append(save_to_base64(fig))
        
    elif graph_type == 'correl_threat_handler': # network
        fig, ax = plt.subplots(figsize=(10, 6))
        # 4. Threat Type vs Number of Responders
        G = nx.Graph()
        for _, row in df.iterrows():
            G.add_node(row['threat_type'])
            G.add_node(f"{row['handler_count']}명")
            G.add_edge(row['threat_type'], f"{row['handler_count']}명")
        pos = nx.spring_layout(G, seed=42)
        
        # 폰트 이름 가져오기
        font_name = font_prop.get_name()
        
        # 노드 색상 지정: threat_type 노드는 빨간색, 나머지는 파랑
        node_colors = []
        for node in G.nodes():
            if node in df['threat_type'].unique():
                node_colors.append('#FF9999')  # threat_type은 빨간색
            else:
                node_colors.append('skyblue')  # handler_count는 파랑

        # 1. 노드 그리기 (색깔: 동일하게 skyblue)
        nx.draw_networkx_nodes(G, pos, node_color=node_colors, node_size=2000, ax=ax)

        # 2. 엣지 그리기
        nx.draw_networkx_edges(G, pos, ax=ax)

        # 3. 라벨 그리기 (여기서 글자색 다르게)
        labels = {node: node for node in G.nodes()}
        label_colors = {}
        for node in G.nodes():
            if node in df['threat_type'].unique():
                label_colors[node] = 'red'  # threat_type 노드는 글자색 빨강
            else:
                label_colors[node] = 'black'  # 인원수는 검정

        # 라벨을 노드별로 색깔 다르게 그리기
        for node, (x, y) in pos.items():
            ax.text(
                x, y, labels[node],
                fontsize=12, fontfamily=font_name,
                horizontalalignment='center',
                verticalalignment='center',
                color=label_colors[node]
            )   
        ax.set_title('위협 유형별 투입 인원', fontproperties=font_prop)
        plots.append(save_to_base64(fig))

    else:
        plt.close(fig)
        return None

    return plots

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    df = get_dataframe()
    if df.empty:
        top_threats = []
    else:
        top_threats = df['threat_type'].value_counts().nlargest(5).index.tolist()
    return templates.TemplateResponse("security_index.html", {"request": request, "top_threats": top_threats})

@app.get("/api/top_threats")
async def get_top_threats():
    df = get_dataframe()
    if df.empty:
        return JSONResponse({"top_threats": []})
    top_threats = df['threat_type'].value_counts().nlargest(5).index.tolist()
    return JSONResponse({"top_threats": top_threats})

@app.get("/plot/{graph_type}")
async def plot(graph_type: str):
    plots = create_plot(graph_type)
    if plots is None:
        return Response(content="Unknown graph type or no data", status_code=404)
    img_data = plots[0]  # 이번엔 하나씩만 반환
    image_binary = base64.b64decode(img_data)
    return Response(content=image_binary, media_type="image/png")

# 월별 그래프: path 방식
@app.get("/plot/threat_m/{threat_type}")
async def plot_threat_m_path(threat_type: str):
    plots = create_plot("threat_m", threat_type)
    if plots is None:
        return Response(content="No data", status_code=404)
    # return Response(content=img_data, media_type="image/png")
    img_data = plots[0]
    image_binary = base64.b64decode(img_data)
    return Response(content=image_binary, media_type="image/png")
    
# 월별 그래프: query 방식도 지원
@app.get("/plot/threat_m")
async def plot_threat_m_query(threat_type: str=None):
    if not threat_type:
        return Response(content="Missing threat_type", status_code=400)
    return await plot_threat_m_path(threat_type)

@app.get("/plot/threat_action", response_class=HTMLResponse)
async def plot_threat_action(request: Request):
    df = get_dataframe()
    if df.empty:
        return Response(content="No data", status_code=404)

    cross = df.groupby(['threat_type', 'action']).size().reset_index(name='count')

    fig = px.scatter(
        cross,
        x='threat_type',
        y='action',
        size='count',
        color='threat_type',
        size_max=60,
        title='위협 유형과 조치 방법',
    )

    fig.update_layout(
        font=dict(family='Malgun Gothic', size=14),
        title_font=dict(size=20),
        margin=dict(l=20, r=20, t=50, b=20)
    )

    # plotly html 변환
    graph_html = pio.to_html(fig, full_html=False)

    return templates.TemplateResponse("plotly_template.html", {
        "request": request,
        "graph_html": graph_html
    })
