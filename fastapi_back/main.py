from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from customer.post import router as post_router
from admin.admin import router as admin_router
from login import router as login_router
from customer.comment import router as comment_router
from admin.generate_member import create_member
from password import router as change_password_router
from admin.graph import router as graph_router
from admin.incident import router as incident_router
from admin.companies import router as companies_router
from admin.dev import router as dev_router
from admin.risky_country import router as risky_country_router


# main.py

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(post_router)
app.include_router(comment_router)
app.include_router(admin_router)
app.include_router(login_router)
app.include_router(change_password_router)
app.include_router(graph_router)
app.include_router(incident_router)
app.include_router(companies_router)
app.include_router(dev_router)
app.include_router(risky_country_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)