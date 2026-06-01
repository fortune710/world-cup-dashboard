from fastapi import FastAPI

app = FastAPI(title="World Cup Dashboard API")

@app.get("/")
def read_root():
    return {"message": "Welcome to the World Cup Dashboard API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
