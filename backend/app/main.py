from contextlib import asynccontextmanager
from fastapi import FastAPI

from app.db.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

    
app = FastAPI(title="TonMaiKongPhor API")

@app.get("/")
def root():
    return {"message": "TonMaiKongPhor API is running"}