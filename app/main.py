from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.api.demo import router as demo_router

from dotenv import load_dotenv
load_dotenv()


def create_app() -> FastAPI:
    app = FastAPI(title="Audio Demo", version="0.1.0")

    app.mount("/static", StaticFiles(directory="static"), name="static")
    app.include_router(demo_router)

    return app


app = create_app()