from fastapi import FastAPI

app = FastAPI(title="TonMaiKongPhor API")

@app.get("/")
def root():
    return {"message": "TonMaiKongPhor API is running"}