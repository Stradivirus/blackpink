from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from customer.member import router as member_router
from customer.post import router as post_router
from admin.admin import router as admin_router
from login import router as login_router
from comment import router as comment_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(member_router)
app.include_router(post_router)
app.include_router(comment_router)
app.include_router(admin_router)
app.include_router(login_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)