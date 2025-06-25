from fastapi import FastAPI, Request, Response
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from pymongo import MongoClient
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib
import seaborn as sns
import io
import base64
import plotly.express as px
import plotly.io as pio
import networkx as nx
from matplotlib import font_manager as fm

app = FastAPI()
templates = Jinja2Templates(directory="templates")

client = MongoClient("mongodb+srv://stradivirus:1q2w3e4r@cluster0.e7rvfpz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
db = client["blackpink"]
collection = db["incident_logs"]

# 폰트 및 스타일 설정
def set_plot_style():
    font_path = 'C:/Windows/Fonts/malgun.ttf'
    font_prop = fm.FontProperties(fname=font_path)
    matplotlib.rcParams['font.family'] = font_prop.get_name()
    matplotlib.rcParams['axes.unicode_minus'] = False
    matplotlib.rcParams['font.size'] = 14
    matplotlib.rcParams['axes.titlesize'] = 18
    matplotlib.rcParams['axes.labelsize'] = 18
    matplotlib.rcParams['xtick.labelsize'] = 16
    matplotlib.rcParams['ytick.labelsize'] = 16
    matplotlib.rcParams['legend.fontsize'] = 16
    sns.set_style("whitegrid")
    sns.set_palette("Set2")
    return font_prop

# MongoDB에서 데이터프레임 생성
def get_dataframe():
    data = list(collection.find())
    if not data:
        return pd.DataFrame()
    df = pd.DataFrame(data).drop(columns=['_id'], errors='ignore')
    df['incident_date'] = pd.to_datetime(df['incident_date'])
    df['year'] = df['incident_date'].dt.year
    df['month'] = df['incident_date'].dt.month
    return df

# matplotlib Figure를 base64 인코딩 문자열로 변환
def save_to_base64(fig):
    buf = io.BytesIO()
    plt.tight_layout()
    fig.savefig(buf, format="png")
    plt.close(fig)
    buf.seek(0)
    return base64.b64encode(buf.getvalue()).decode('utf-8')

# Plotly 기본 템플릿 및 폰트
pio.templates.default = "plotly_white"
plotly_font_family = "Malgun Gothic"

# 그래프 생성 함수
def create_plot(graph_type, threat_type=None):
    df = get_dataframe()
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
        yearly_counts = df.groupby(['year', 'threat_type']).size().reset_index(name='count')
        fig = px.bar(yearly_counts, x='year', y='count', color='threat_type', barmode='group', title="연도별 침해 현황")
        fig.update_layout(font_family=plotly_font_family, xaxis_title="연도", yaxis_title="발생 건수", title_font_size=22)
        img_bytes = pio.to_image(fig, format="png")
        img_data = base64.b64encode(img_bytes).decode("utf-8")
        plots.append(img_data)

    elif graph_type == 'threat_m':
        if threat_type is None:
            return None
        top_threats = df['threat_type'].value_counts().nlargest(5).index.tolist()
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
        sns.lineplot(
            x='month', y='count', data=monthly_counts,
            marker='o', ax=ax,
            color=color_map.get(threat_type, "#000000"),
            linestyle=linestyle_map.get(threat_type, '-'),
            alpha=1.0
        )
        ax.set_title(f"{threat_type}", fontproperties=font_prop, fontsize=16, fontweight='bold',
                     color=color_map.get(threat_type, "#000000"))
        ax.set_xticks(range(1, 8))
        ax.set_xlabel("월", fontproperties=font_prop, fontsize=14)
        ax.set_ylabel("발생 횟수", fontproperties=font_prop, fontsize=14)
        ax.grid(True, alpha=0.3)
        plots.append(save_to_base64(fig))

    elif graph_type == 'processed_threats':
        fig, ax = plt.subplots(figsize=(10, 6))
        processed_df = df[df['status'].isin(['처리중', '처리완료'])]
        threat_counts = processed_df['threat_type'].value_counts().reset_index()
        threat_counts.columns = ['threat_type', 'count']
        sns.barplot(x='threat_type', y='count', data=threat_counts, ax=ax,
                    palette=['#FF9999', '#66B3FF', '#99FF99', '#FFCC99'])
        ax.set_title("처리된 데이터 기준 위협종류 분포", fontproperties=font_prop)
        ax.set_xlabel("위협종류", fontproperties=font_prop)
        ax.set_ylabel("건수", fontproperties=font_prop)
        ax.set_xticklabels(ax.get_xticklabels(), rotation=45, fontproperties=font_prop)
        plots.append(save_to_base64(fig))

    elif graph_type == 'correl_threats_server':
        fig, ax = plt.subplots(figsize=(10, 6))
        pivot_table = df.pivot_table(index='threat_type', columns='server_type', aggfunc='size', fill_value=0)
        sns.heatmap(pivot_table, annot=True, fmt='d', cmap='YlGnBu', ax=ax)
        ax.set_title('서버별 발생 위협', fontproperties=font_prop)
        ax.set_xlabel("서버종류", fontproperties=font_prop)
        ax.set_ylabel("위협종류", fontproperties=font_prop)
        ax.set_xticklabels(ax.get_xticklabels(), rotation=45, fontproperties=font_prop)
        ax.set_yticklabels(ax.get_yticklabels(), fontproperties=font_prop)
        plots.append(save_to_base64(fig))

    elif graph_type == 'correl_risk_status':
        fig, ax = plt.subplots(figsize=(10, 6))
        crosstab = pd.crosstab(df['risk_level'], df['status'])
        crosstab.plot(kind='bar', stacked=True, colormap='Pastel1', ax=ax)
        ax.set_title('위협 등급별 처리 현황', fontproperties=font_prop)
        ax.set_xlabel("위험도", fontproperties=font_prop)
        ax.set_ylabel("건수", fontproperties=font_prop)
        ax.set_xticklabels(ax.get_xticklabels(), rotation=45, fontproperties=font_prop)
        legend = ax.legend()
        for text in legend.get_texts():
            text.set_fontproperties(font_prop)
        plots.append(save_to_base64(fig))

    elif graph_type == 'correl_threat_action':
        fig, ax = plt.subplots(figsize=(10, 6))
        cross = df.groupby(['threat_type', 'action']).size().reset_index(name='count')
        sns.scatterplot(x="threat_type", y="action", size="count", data=cross, sizes=(100, 1000), legend=False, ax=ax)
        ax.set_title('위협 유형과 조치 방법', fontproperties=font_prop)
        ax.set_xticklabels(ax.get_xticklabels(), rotation=45, fontproperties=font_prop)
        ax.set_yticklabels(ax.get_yticklabels(), fontproperties=font_prop)
        plots.append(save_to_base64(fig))

    elif graph_type == 'correl_threat_handler':
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
            ax.text(x, y, labels[node], fontsize=12, fontfamily=font_name,
                    horizontalalignment='center', verticalalignment='center', color=label_colors[node])
        ax.set_title('위협 유형별 투입 인원', fontproperties=font_prop)
        plots.append(save_to_base64(fig))

    elif graph_type == 'manpower':
        df = get_dataframe()
        font_prop = set_plot_style()
                
        if threat_type is None:
            return None
        
        if threat_type == "전체보기":
            filtered_df = df.copy()
        else:
            # Filter by threat_type
            filtered_df = df[df['threat_type'] == threat_type].copy()
            
        if filtered_df.empty:
            return None
        
        # 1. 데이터 전처리
        filtered_df['incident_date'] = pd.to_datetime(filtered_df['incident_date'])
        filtered_df['processed_date'] = pd.to_datetime(filtered_df['handled_date'])
        filtered_df['처리기간(일)'] = (filtered_df['processed_date'] - filtered_df['incident_date']).dt.days
        filtered_df['투입인원'] = filtered_df['handler_count'].astype(int)
        
        if filtered_df['처리기간(일)'].isnull().all():
            return None

        # 2. jointplot 생성
        #set_plot_style()  # 스타일 적용
        
        # 색상 지정: 모든 유형이면 hue 추가
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
                color="#0C81F5" # optionally fix color or assign dynamically
            )
        
        jp.fig.suptitle('위협유형별: 처리기간 vs 투입인원', fontproperties=font_prop, fontsize=20)
        # x축, y축 한글 폰트 직접 설정
        jp.ax_joint.set_xlabel('처리기간(일)', fontproperties=font_prop, fontsize=20)
        jp.ax_joint.set_ylabel('투입인원', fontproperties=font_prop, fontsize=20)
        
        if threat_type != "전체보기":
            jp.ax_joint.set_title(f"{threat_type}", fontproperties=font_prop, fontsize=18)

        # 여기 핵심 (jointplot은 fig.tight_layout() 다루기 까다로움)
        jp.fig.tight_layout()
        jp.fig.subplots_adjust(top=0.9)
        
        # 범례 텍스트 폰트 적용 (None 체크 필수!)
        if jp.ax_joint.legend_:
            for text in jp.ax_joint.legend_.get_texts():
                text.set_fontproperties(font_prop)

        # 저장할 때는 반드시 fig를 넘김
        plots.append(save_to_base64(jp.fig))

        plt.close(jp.fig)  # 여기 꼭 닫아줘야 메모리 누수 방지

    else:
        return None

    return plots


@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    df = get_dataframe()
    top_threats = df['threat_type'].value_counts().nlargest(5).index.tolist() if not df.empty else []
    return templates.TemplateResponse("security_index.html", {"request": request, "top_threats": top_threats})


@app.get("/api/top_threats")
async def get_top_threats():
    df = get_dataframe()
    top_threats = df['threat_type'].value_counts().nlargest(5).index.tolist() if not df.empty else []
    return JSONResponse({"top_threats": top_threats})

@app.get("/plot/threat_m/{threat_type}")
async def plot_threat_m_path(threat_type: str):
    plots = create_plot("threat_m", threat_type)
    if not plots:
        return Response(content="No data", status_code=404)
    image_binary = base64.b64decode(plots[0])
    return Response(content=image_binary, media_type="image/png")

@app.get("/plot/threat_m")
async def plot_threat_m_query(threat_type: str = None):
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
    graph_html = pio.to_html(fig, full_html=False)

    return templates.TemplateResponse("plotly_template.html", {
        "request": request,
        "graph_html": graph_html
    })

# 처리기간 vs 투입인원 (scatterplot)
@app.get("/plot/manpower")
async def plot_manpower(threat_type: str = None):
    print('1. threat_type=?',threat_type)
    if not threat_type:
        return Response(content="Missing threat_type", status_code=400)
    
    plots = create_plot("manpower", threat_type)
    if not plots:
        print('2. threat_type?', threat_type)
        return Response(content="No data for given threat_type", status_code=404)
    
    image_binary = base64.b64decode(plots[0])
    return Response(content=image_binary, media_type="image/png")


@app.get("/plot/{graph_type}")
async def plot(graph_type: str):
    plots = create_plot(graph_type)
    if not plots:
        return Response(content="Unknown graph type or no data", status_code=404)
    image_binary = base64.b64decode(plots[0])
    return Response(content=image_binary, media_type="image/png")