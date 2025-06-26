from fastapi import Response
from matplotlib import font_manager as fm
import matplotlib
import seaborn as sns
import os
import warnings

warnings.filterwarnings("ignore", category=UserWarning, module="matplotlib")

# 공통 스타일/폰트 설정 함수
def set_plot_style(font_path='../font/malgun.ttf'):
    # font_path가 상대경로면 현재 파일 기준 절대경로로 변환
    if not os.path.isabs(font_path):
        base_dir = os.path.dirname(os.path.abspath(__file__))
        font_path = os.path.abspath(os.path.join(base_dir, font_path))
    font_prop = fm.FontProperties(fname=font_path)
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

# 공통 이미지 응답 함수
def image_response(img_data):
    if img_data is None:
        return Response(content="Unknown graph type or no data", status_code=404)
    return Response(content=img_data, media_type="image/png")

def save_fig_to_png(fig, backend="matplotlib"):
    import io
    buf = io.BytesIO()
    import matplotlib.pyplot as plt
    plt.tight_layout()
    fig.savefig(buf, format="png")
    plt.close(fig)
    buf.seek(0)
    return buf.getvalue()