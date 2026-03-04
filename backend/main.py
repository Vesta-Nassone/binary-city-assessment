from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

from backend.database import engine, Base
from backend.routers.clients import router as clients_router
from backend.routers.contacts import router as contacts_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Binary City Assessment")

app.include_router(clients_router)
app.include_router(contacts_router)

FRONTEND_DIR = Path(__file__).parent.parent / "frontend"
app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")


@app.get("/")
def serve_index():
    return FileResponse(FRONTEND_DIR / "index.html")
