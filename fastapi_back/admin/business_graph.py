import matplotlib
matplotlib.use('Agg')  # 서버 환경에서 Tkinter 에러 방지

from fastapi import APIRouter
import pandas as pd
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt
from db import companies_collection
from .graph_utils import set_plot_style, image_response, save_fig_to_png

router = APIRouter(prefix="/api")

# MongoDB에서 회사 데이터프레임 생성
def load_data():
    data = list(companies_collection.find())
    if not data:
        return pd.DataFrame()
    df = pd.DataFrame(data)
    df.drop(columns=['_id'], inplace=True, errors='ignore')
    df['contract_start'] = pd.to_datetime(df['contract_start'], errors='coerce')
    df['contract_end'] = pd.to_datetime(df['contract_end'], errors='coerce')
    def safe_months(x):
        try:
            return x.n + 1
        except Exception:
            return np.nan
    df['months'] = (df['contract_end'].dt.to_period('M') - df['contract_start'].dt.to_period('M')).apply(safe_months)
    return df

# 계약 기간에 따라 예상 수익 계산
def calculate_revenue(row):
    if row['months'] <= 3:
        return {'베이직': 30, '프로': 50, '엔터프라이즈': 80}.get(row['plan'], np.nan)
    elif row['months'] >= 12:
        return {'베이직': 120, '프로': 200, '엔터프라이즈': 320}.get(row['plan'], np.nan)
    return np.nan

# 헬퍼: 축 폰트 일괄 적용
def set_tick_font(ax, font_prop, size=16):
    for label in ax.get_xticklabels():
        label.set_fontproperties(font_prop)
        label.set_fontsize(size)
    for label in ax.get_yticklabels():
        label.set_fontproperties(font_prop)
        label.set_fontsize(size)

# 계약종류별 수익 바차트
def create_bar_plot(df):
    font_prop = set_plot_style()
    df['revenue'] = df.apply(calculate_revenue, axis=1)
    plans = ['베이직', '프로', '엔터프라이즈']
    group = df.groupby('plan')['revenue'].sum().reindex(plans).reset_index()
    fig, ax = plt.subplots(figsize=(10,8))
    sns.barplot(x='plan', y='revenue', data=group, order=plans, palette=['#66b3ff', '#99ff99', '#ff9999'], ax=ax)
    ax.set_title('계약종류별 수익', fontproperties=font_prop, fontsize=24)
    ax.set_xlabel("계약종류", fontproperties=font_prop, fontsize=20)
    ax.set_ylabel("수익 (단위:만원)", fontproperties=font_prop, fontsize=20)
    set_tick_font(ax, font_prop)
    return save_fig_to_png(fig, backend="matplotlib")

# 업종-계약종류별 수익 히트맵
def create_heatmap(df):
    font_prop = set_plot_style()
    df['revenue'] = df.apply(calculate_revenue, axis=1)
    plans = ['베이직', '프로', '엔터프라이즈']
    pivot = df.groupby(['industry', 'plan'])['revenue'].sum().unstack().reindex(columns=plans).fillna(0)
    fig, ax = plt.subplots(figsize=(10,8))
    sns.heatmap(
        pivot, annot=True, fmt=".0f", cmap="YlGnBu", ax=ax,
        annot_kws={"size": 20, "weight": "bold"}
    )
    ax.set_title('수익 히트맵 차트', fontproperties=font_prop, fontsize=24)
    ax.set_xlabel("계약종류", fontproperties=font_prop, fontsize=20)
    ax.set_ylabel("업종", fontproperties=font_prop, fontsize=20)
    set_tick_font(ax, font_prop)
    return save_fig_to_png(fig, backend="matplotlib")

# 회사별 연매출 비교 바차트
def create_annual_sales_plot(df):
    font_prop = set_plot_style()
    df['revenue'] = df.apply(calculate_revenue, axis=1)
    df['year'] = df['contract_start'].dt.year
    top_companies = df.groupby('company_name')['revenue'].sum().nlargest(7).index.tolist()
    df_top = df[df['company_name'].isin(top_companies)]
    group = df_top.groupby(['company_name', 'year'])['revenue'].sum().reset_index()
    fig, ax = plt.subplots(figsize=(12, 8))
    sns.barplot(x='company_name', y='revenue', hue='year', data=group, ax=ax)
    ax.set_title('회사별 연매출 비교', fontproperties=font_prop, fontsize=24)
    ax.set_xlabel("회사", fontproperties=font_prop, fontsize=20)
    ax.set_ylabel("매출 (단위:만원)", fontproperties=font_prop, fontsize=20)
    set_tick_font(ax, font_prop)
    legend = ax.legend()
    for text in legend.get_texts():
        text.set_fontproperties(font_prop)
        text.set_fontsize(14)
    return save_fig_to_png(fig, backend="matplotlib")

# 회사별 계약종류+수익 히트맵
def create_company_plan_heatmap(df):
    font_prop = set_plot_style()
    df['revenue'] = df.apply(calculate_revenue, axis=1)
    plans = ['베이직', '프로', '엔터프라이즈']
    top_companies = df.groupby('company_name')['revenue'].sum().nlargest(7).index.tolist()
    df_top = df[df['company_name'].isin(top_companies)]
    pivot = df_top.groupby(['company_name', 'plan'])['revenue'].sum().unstack().reindex(columns=plans).fillna(0)
    fig, ax = plt.subplots(figsize=(12,10))
    sns.heatmap(pivot, annot=True, fmt=".0f", cmap="OrRd", ax=ax, annot_kws={"size": 20})
    ax.set_title('회사별 계약종류+수익 히트맵', fontproperties=font_prop, fontsize=24)
    ax.set_xlabel("계약종류", fontproperties=font_prop, fontsize=24)
    ax.set_ylabel("회사명", fontproperties=font_prop, fontsize=24)
    set_tick_font(ax, font_prop, size=20)
    return save_fig_to_png(fig, backend="matplotlib")

# 2025 vs 2023+2024 계약종류별 비교 도넛형 파이차트
def create_nested_pie_chart(df):
    font_prop = set_plot_style()
    df['revenue'] = df.apply(calculate_revenue, axis=1)
    df['year'] = df['contract_start'].dt.year
    colors_dict = {'베이직': "#1fa0f7", '프로': "#e6551c", '엔터프라이즈': "#016E5C"}
    plans = ['베이직', '프로', '엔터프라이즈']
    inner_df = df[df['year'].isin([2023, 2024])]
    inner_group = inner_df.groupby('plan')['revenue'].sum().reindex(plans).fillna(0)
    outer_df = df[df['year'] == 2025]
    outer_group = outer_df.groupby('plan')['revenue'].sum().reindex(plans).fillna(0)
    fig, ax = plt.subplots(figsize=(8, 8))
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
    ax.text(0, 1.05, "2025", ha='center', va='center', fontproperties=font_prop, fontsize=16, weight='bold')
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
    ax.text(0, -0.65, "2023+2024", ha='center', va='center', fontproperties=font_prop, fontsize=16, weight='bold')
    handles = [plt.Line2D([0], [0], marker='o', color='w', label=plan,
                markerfacecolor=colors_dict[plan], markersize=12) for plan in plans]
    ax.legend(handles=handles, loc='upper right', bbox_to_anchor=(1.25, 1), prop=font_prop, fontsize=12)
    ax.set(aspect="equal")
    ax.set_title("2025 vs 2023+2024 계약종류별 비교", fontproperties=font_prop, fontsize=20)
    return save_fig_to_png(fig, backend="matplotlib")

# 만료된 계약의 계약기간 분포(박스+스트립플롯)
def create_terminated_contract_duration_plot(df):
    font_prop = set_plot_style()
    df_term = df[df['status'] == '만료'].copy()
    plans = ['베이직', '프로', '엔터프라이즈']
    def safe_months(x):
        try:
            return x.n + 1
        except Exception:
            return np.nan
    df_term['duration_months'] = (df_term['contract_end'].dt.to_period('M') - df_term['contract_start'].dt.to_period('M')).apply(safe_months)
    fig, ax = plt.subplots(figsize=(10, 8))
    sns.boxplot(x='plan', y='duration_months', data=df_term, order=plans, palette=['#66b3ff', '#99ff99', '#ff9999'], ax=ax)
    sns.stripplot(x='plan', y='duration_months', data=df_term, order=plans, color='black', size=7, jitter=True, alpha=0.5, ax=ax)
    ax.set_title('계약 종료된 계약의 계약기간 분포', fontproperties=font_prop, fontsize=24)
    ax.set_xlabel("계약종류", fontproperties=font_prop, fontsize=20)
    ax.set_ylabel("계약기간 (개월)", fontproperties=font_prop, fontsize=20)
    set_tick_font(ax, font_prop)
    return save_fig_to_png(fig, backend="matplotlib")

# 해지된 계약의 계약종류별 건수/비율(바+파이)
def create_suspended_contract_plan_plot(df):
    font_prop = set_plot_style()
    df_suspend = df[df['status'] == '해지'].copy()
    plans = ['베이직', '프로', '엔터프라이즈']
    plan_counts = df_suspend['plan'].value_counts().reindex(plans).fillna(0).reset_index()
    plan_counts.columns = ['plan', 'count']
    fig, axs = plt.subplots(1, 2, figsize=(14, 8))
    sns.barplot(x='plan', y='count', data=plan_counts, order=plans, palette=['#66b3ff', '#99ff99', '#ff9999'], ax=axs[0])
    axs[0].set_title('해지된 계약의 계약종류별 건수', fontproperties=font_prop, fontsize=24)
    axs[0].set_xlabel("계약종류", fontproperties=font_prop, fontsize=22)
    axs[0].set_ylabel("건수", fontproperties=font_prop, fontsize=22)
    set_tick_font(axs[0], font_prop, size=20)
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
    return save_fig_to_png(fig, backend="matplotlib")

# --- 통합 라우터 및 함수 매핑 ---

business_graph_func_map = {
    'bar': create_bar_plot,
    'heatmap': create_heatmap,
    'annual_sales': create_annual_sales_plot,
    'company_plan_heatmap': create_company_plan_heatmap,
    'company_plan_donut_multi': create_nested_pie_chart,
    'terminated_duration': create_terminated_contract_duration_plot,
    'suspended_plan': create_suspended_contract_plan_plot,
}

# 그래프 생성 및 반환
def create_business_plot(graph_type):
    df = load_data()
    if df.empty:
        return None
    func = business_graph_func_map.get(graph_type)
    if func:
        return func(df)
    return None

# 그래프 이미지 반환 엔드포인트
@router.get("/business/graph/{graph_type}")
async def plot_business_graph(graph_type: str):
    img_data = create_business_plot(graph_type)
    return image_response(img_data)
