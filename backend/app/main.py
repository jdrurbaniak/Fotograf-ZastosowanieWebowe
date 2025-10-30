from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Tutaj będziemy importować nasze routery API
from app.api.v1.api import api_router

app = FastAPI(
    title="Fotograf Portfolio API",
    description="Backend dla aplikacji portfolio fotografa w FastAPI.",
    version="0.1.0"
)
# --- Serwowanie plików statycznych (zdjęć) ---
# Zakładamy, że przesłane zdjęcia będą przechowywane w folderze 'uploads'
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads") 

# --- Konfiguracja CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], # Adres deweloperski Vite/React
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)

# --- Główny endpoint ---
@app.get("/", tags=["Root"])
def read_root():
    """Główny punkt wejścia - sprawdza czy API działa."""
    return {"message": "Witaj w API Portfolio Fotografa!"}


# routery API
app.include_router(api_router, prefix="/api/v1")