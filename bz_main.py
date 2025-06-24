from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, Response
from fastapi.templating import Jinja2Templates
from pymongo import MongoClient

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import io
import matplotlib
from matplotlib import font_manager as fm

# ---------- CONFIGURATION ----------

# MongoDB connection (adjust your URL)
client = MongoClient("mongodb+srv://stradivirus:1q2w3e4r@cluster0.e7rvfpz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
db = client["blackpink"]
collection = db["companies"]

# FastAPI app
app = FastAPI()
templates = Jinja2Templates(directory="templates")

# Font setup (Korean)
def set_plot_style():
    font_path = 'C:/Windows/Fonts/malgun.ttf'
    font_prop = fm.FontProperties(fname=font_path)
    matplotlib.rcParams['font.family'] = font_prop.get_name()
    matplotlib.rcParams['axes.unicode_minus'] = False
    matplotlib.rcParams['axes.titlesize'] = 20  # title font size
    matplotlib.rcParams['axes.labelsize'] = 16  # x/y label font size
    matplotlib.rcParams['xtick.labelsize'] = 12
    matplotlib.rcParams['ytick.labelsize'] = 12
    sns.set_style("whitegrid")
    return font_prop

# ---------- DATA LOADING & PROCESSING ----------

def load_data():
    data = list(collection.find())
    if not data:
        return pd.DataFrame()
    df = pd.DataFrame(data)
    df.drop(columns=['_id'], inplace=True, errors='ignore')
    df['contract_start'] = pd.to_datetime(df['contract_start'])
    df['contract_end'] = pd.to_datetime(df['contract_end'])
    df['months'] = (df['contract_end'].dt.to_period('M') - df['contract_start'].dt.to_period('M')).apply(lambda x: x.n + 1)
    # df['plan'] = df['plan'].replace({'엔터프라이즈': 'Enterprise'})  # unify names
    # df['plan'] = df['plan'].replace({'프로': 'Pro'})  # unify names
    # df['plan'] = df['plan'].replace({'베이직': 'Basic'})  # unify names
    return df

def calculate_revenue(row):
    if row['months'] <= 3:
        return {'베이직': 30, '프로': 50, '엔터프라이즈': 80}.get(row['plan'], np.nan)
    elif row['months'] >= 12:
        return {'베이직': 120, '프로': 200, '엔터프라이즈': 320}.get(row['plan'], np.nan)
    return np.nan

# ---------- PLOT FUNCTIONS ----------

def create_bar_plot(df):
    font_prop = set_plot_style()
    df['revenue'] = df.apply(calculate_revenue, axis=1)
    group = df.groupby('plan')['revenue'].sum().reset_index()

    fig, ax = plt.subplots(figsize=(10,8))
    sns.barplot(x='plan', y='revenue', data=group, palette=['#66b3ff', '#99ff99', '#ff9999'], ax=ax)
    ax.set_title('계약종류별 수익', fontproperties=font_prop,fontsize=24)
    ax.set_xlabel("계약종류", fontproperties=font_prop, fontsize=20)
    ax.set_ylabel("수익 (단위:만원)", fontproperties=font_prop,fontsize=20)

    # 한글 폰트 적용 (tick label)
    for label in ax.get_xticklabels():
        label.set_fontproperties(font_prop)
        label.set_fontsize(16)
    for label in ax.get_yticklabels():
        label.set_fontproperties(font_prop)
        label.set_fontsize(16)

    buf = io.BytesIO()
    plt.tight_layout()
    plt.savefig(buf, format="png")
    plt.close()
    buf.seek(0)
    return buf.getvalue()

def create_heatmap(df):
    font_prop = set_plot_style()
    df['revenue'] = df.apply(calculate_revenue, axis=1)
    pivot = df.groupby(['industry', 'plan'])['revenue'].sum().unstack().fillna(0)

    fig, ax = plt.subplots(figsize=(10,8))
    sns.heatmap(
        pivot, annot=True, fmt=".0f", cmap="YlGnBu", ax=ax,
        annot_kws={"size": 20, "weight": "bold"}  # 히트맵 숫자 크기 키움
    )
    ax.set_title('수익 히트맵 차트', fontproperties=font_prop,fontsize=24)
    ax.set_xlabel("계약종류", fontproperties=font_prop,fontsize=20)
    ax.set_ylabel("업종", fontproperties=font_prop,fontsize=20)

    # 한글 폰트 적용 (tick label)
    for label in ax.get_xticklabels():
        label.set_fontproperties(font_prop)
        label.set_fontsize(16)
    for label in ax.get_yticklabels():
        label.set_fontproperties(font_prop)
        label.set_fontsize(16)

    buf = io.BytesIO()
    plt.tight_layout()
    plt.savefig(buf, format="png")
    plt.close()
    buf.seek(0)
    return buf.getvalue()

def create_annual_sales_plot(df):
    font_prop = set_plot_style()
    df['revenue'] = df.apply(calculate_revenue, axis=1)
    df['year'] = df['contract_start'].dt.year

    # 전체 회사별 총 매출 계산 후 상위 5개 회사 선택
    top_companies = df.groupby('company_name')['revenue'].sum().nlargest(7).index.tolist()

    # 상위 5개 회사만 필터링
    df_top = df[df['company_name'].isin(top_companies)]

    # group = df_top.groupby(['year', 'company_name'])['revenue'].sum().reset_index()
    group = df_top.groupby(['company_name', 'year'])['revenue'].sum().reset_index()

    fig, ax = plt.subplots(figsize=(12, 8))
    sns.barplot(x='company_name', y='revenue', hue='year', data=group, ax=ax)

    ax.set_title('회사별 연매출 비교', fontproperties=font_prop, fontsize=24)
    ax.set_xlabel("회사", fontproperties=font_prop, fontsize=20)
    ax.set_ylabel("매출 (단위:만원)", fontproperties=font_prop, fontsize=20)

    for label in ax.get_xticklabels():
        label.set_fontproperties(font_prop)
        label.set_fontsize(16)
    for label in ax.get_yticklabels():
        label.set_fontproperties(font_prop)
        label.set_fontsize(16)
    legend = ax.legend()
    for text in legend.get_texts():
        text.set_fontproperties(font_prop)
        text.set_fontsize(14)

    buf = io.BytesIO()
    plt.tight_layout()
    plt.savefig(buf, format="png")
    plt.close()
    buf.seek(0)
    return buf.getvalue()

# 회사별 계약종류+금액 히트맵
def create_company_plan_heatmap(df):
    font_prop = set_plot_style()
    df['revenue'] = df.apply(calculate_revenue, axis=1)
    
    # 전체 회사별 총 매출 계산 후 상위 7개 회사 선택
    top_companies = df.groupby('company_name')['revenue'].sum().nlargest(7).index.tolist()
    # 상위 5개 회사만 필터링
    df_top = df[df['company_name'].isin(top_companies)]
    
    pivot = df_top.groupby(['company_name', 'plan'])['revenue'].sum().unstack().fillna(0)

    fig, ax = plt.subplots(figsize=(12,10))
    sns.heatmap(pivot, annot=True, fmt=".0f", cmap="OrRd", ax=ax, annot_kws={"size": 20})# , "weight": "bold"})
    ax.set_title('회사별 계약종류+수익 히트맵', fontproperties=font_prop, fontsize=24)
    ax.set_xlabel("계약종류", fontproperties=font_prop, fontsize=24)
    ax.set_ylabel("회사명", fontproperties=font_prop, fontsize=24)

    for label in ax.get_xticklabels():
        label.set_fontproperties(font_prop)
        label.set_fontsize(20)
    for label in ax.get_yticklabels():
        label.set_fontproperties(font_prop)
        label.set_fontsize(20)

    buf = io.BytesIO()
    plt.tight_layout()
    plt.savefig(buf, format="png")
    plt.close()
    buf.seek(0)
    return buf.getvalue()

# 회사별 계약종류별 파이 그래프
def create_nested_pie_chart(df):
    font_prop = set_plot_style()
    df['revenue'] = df.apply(calculate_revenue, axis=1)
    df['year'] = df['contract_start'].dt.year

    colors_dict = {'베이직': "#1fa0f7", '프로': "#e6551c", '엔터프라이즈': "#016E5C"}
    plans = ['베이직', '프로', '엔터프라이즈']

    # 데이터 분리
    inner_df = df[df['year'].isin([2023, 2024])]
    # inner (2023+2024) 집계
    inner_group = inner_df.groupby('plan')['revenue'].sum().reindex(plans).fillna(0)
    
    outer_df = df[df['year'] == 2025]
    # outer (2025) 집계
    outer_group = outer_df.groupby('plan')['revenue'].sum().reindex(plans).fillna(0)

    # 그림 그리기
    fig, ax = plt.subplots(figsize=(8, 8))

    # outer ring (2025)
    wedges_outer, _, autotexts_outer = ax.pie(
        outer_group.values, 
        radius=1,
        labels=None, 
        startangle=90, 
        colors=[colors_dict[plan] for plan in plans],
        autopct='%1.1f%%',
        pctdistance=0.85,
        labeldistance=1.3,
        textprops={'fontproperties': font_prop, 'fontsize': 18, 'color':"#ffffff"},
        wedgeprops=dict(width=0.3, edgecolor='white')
    )
    ax.text(0, 1.15, "2025", ha='center', va='center', fontproperties=font_prop, fontsize=16, weight='bold')

    # Inner ring (2023+2024)
    wedges_inner, _, autotexts_inner = ax.pie(
        inner_group.values, 
        radius=0.6, 
        labels=None, 
        startangle=90, 
        colors=[colors_dict[plan] for plan in plans],
        autopct='%1.1f%%', 
        pctdistance=0.55,
        labeldistance=1.6,
        textprops={'fontproperties': font_prop, 'fontsize': 18, 'color':"#e1fa04"}
    )
    ax.text(0, -0.6, "2023+2024", ha='center', va='center', fontproperties=font_prop, fontsize=16, weight='bold')
    # Add legend
    handles = [plt.Line2D([0], [0], marker='o', color='w', label=plan,
                markerfacecolor=colors_dict[plan], markersize=12) for plan in plans]
    ax.legend(handles=handles, loc='upper right', bbox_to_anchor=(1.25, 1), prop=font_prop, fontsize=12)

    ax.set(aspect="equal")
    ax.set_title("2025 vs 2023+2024 계약종류별 비교", fontproperties=font_prop, fontsize=20)

    buf = io.BytesIO()
    plt.tight_layout()
    plt.savefig(buf, format="png")
    plt.close()
    buf.seek(0)
    return buf.getvalue()

def create_terminated_contract_duration_plot(df):
    font_prop = set_plot_style()
    
    # 계약상태 'terminated' 필터링
    df_term = df[df['status'] == '만료'].copy()
    
    # 계약 기간 계산 (개월 단위)
    df_term['duration_months'] = (df_term['contract_end'].dt.to_period('M') - df_term['contract_start'].dt.to_period('M')).apply(lambda x: x.n + 1)
    
    # 시각화 — Boxplot
    fig, ax = plt.subplots(figsize=(10, 8))
    sns.boxplot(x='plan', y='duration_months', data=df_term, palette=['#66b3ff', '#99ff99', '#ff9999'], ax=ax)
    
    ax.set_title('계약 종료된 계약의 계약기간 분포 (개월)', fontproperties=font_prop, fontsize=24)
    ax.set_xlabel("계약종류", fontproperties=font_prop, fontsize=20)
    ax.set_ylabel("계약기간 (개월)", fontproperties=font_prop, fontsize=20)
    
    # 한글 tick label 폰트 적용
    for label in ax.get_xticklabels():
        label.set_fontproperties(font_prop)
        label.set_fontsize(16)
    for label in ax.get_yticklabels():
        label.set_fontproperties(font_prop)
        label.set_fontsize(16)
    
    buf = io.BytesIO()
    plt.tight_layout()
    plt.savefig(buf, format="png")
    plt.close()
    buf.seek(0)
    return buf.getvalue()

def create_suspended_contract_plan_plot(df):
    font_prop = set_plot_style()
    
    # 계약상태 '해지' 필터링
    df_suspend = df[df['status'] == '해지'].copy()

    # 계약종류별 개수 집계
    plan_counts = df_suspend['plan'].value_counts().reset_index()
    plan_counts.columns = ['plan', 'count']

    fig, axs = plt.subplots(1, 2, figsize=(14, 8))

    # Bar Chart
    sns.barplot(x='plan', y='count', data=plan_counts, palette=['#66b3ff', '#99ff99', '#ff9999'], ax=axs[0])
    axs[0].set_title('해지된 계약의 계약종류별 건수', fontproperties=font_prop, fontsize=24)
    axs[0].set_xlabel("계약종류", fontproperties=font_prop, fontsize=22)
    axs[0].set_ylabel("건수", fontproperties=font_prop, fontsize=22)

    for label in axs[0].get_xticklabels():
        label.set_fontproperties(font_prop)
        label.set_fontsize(20)
    for label in axs[0].get_yticklabels():
        label.set_fontproperties(font_prop)
        label.set_fontsize(20)

    # Pie Chart
    axs[1].pie(
        plan_counts['count'],
        labels=plan_counts['plan'],
        autopct='%1.1f%%',
        startangle=90,
        colors=['#66b3ff', '#99ff99', '#ff9999'],
        textprops={'fontproperties': font_prop, 'fontsize': 18},
        wedgeprops=dict(width=0.4)
    )
    axs[1].set_title('해지된 계약 Plan 비율', fontproperties=font_prop, fontsize=24)

    buf = io.BytesIO()
    plt.tight_layout()
    plt.savefig(buf, format="png")
    plt.close()
    buf.seek(0)
    return buf.getvalue()


# ---------- ROUTES ----------

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("bz_index.html", {"request": request})

@app.get("/plot/bar")
async def plot_bar():
    df = load_data()
    if df.empty:
        return Response(content="No Data", status_code=404)
    img = create_bar_plot(df)
    return Response(content=img, media_type="image/png")

@app.get("/plot/heatmap")
async def plot_heatmap():
    df = load_data()
    if df.empty:
        return Response(content="No Data", status_code=404)
    img = create_heatmap(df)
    return Response(content=img, media_type="image/png")

@app.get("/plot/annual_sales")
async def plot_annual_sales():
    df = load_data()
    if df.empty:
        return Response(content="No Data", status_code=404)
    img = create_annual_sales_plot(df)
    return Response(content=img, media_type="image/png")

@app.get("/plot/company_plan_heatmap")
async def plot_company_plan_heatmap():
    df = load_data()
    if df.empty:
        return Response(content="No Data", status_code=404)
    img = create_company_plan_heatmap(df)
    return Response(content=img, media_type="image/png")

@app.get("/plot/company_plan_donut_multi")
async def plot_company_plan_donut_multi():
    df = load_data()
    if df.empty:
        return Response(content="No Data", status_code=404)
    img = create_nested_pie_chart(df)
    return Response(content=img, media_type="image/png")

@app.get("/plot/terminated_duration")
async def plot_terminated_duration():
    df = load_data()
    # print(df['status'].unique())
    # df_term = df[df['status'] == '만료']
    # print(len(df_term))
    if df.empty:
        return Response(content="No Data", status_code=404)
    img = create_terminated_contract_duration_plot(df)
    return Response(content=img, media_type="image/png")

@app.get("/plot/suspended_plan", response_class=Response)
async def plot_suspended_plan():
    df = load_data()
    if df.empty:
        return Response(content="No Data", status_code=404)
    img = create_suspended_contract_plan_plot(df)
    return Response(content=img, media_type="image/png")
