from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from customer.post import router as post_router
from customer.comment import router as comment_router
from admin.admin import router as admin_router
from admin.security_graph import router as security_graph_router
from admin.business_graph import router as business_graph_router
from admin.dev_graph import router as dev_graph_router
from admin.team_data import router as team_data_router
from admin.dashboard_graphs import router as dashboard_graphs_router
from auth import router as auth_router
from api_ncsi import router as ncsi_router

app = FastAPI()

# CORS 미들웨어 설정 
# 현재는 개발용으로 모든 Origin, Method, Header 허용
# 실제 배포 환경에서는 사용하는 도메인만 적용
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# FastAPI 라우터 등록 (엔드포인트별 URL 연결)
app.include_router(auth_router)
app.include_router(post_router)
app.include_router(comment_router)
app.include_router(admin_router)
app.include_router(security_graph_router)
app.include_router(business_graph_router)
app.include_router(dev_graph_router)
app.include_router(team_data_router)
app.include_router(dashboard_graphs_router)
app.include_router(ncsi_router)  


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)