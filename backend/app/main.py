from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

# Redis async client and FastAPI cache
# Redis async client and FastAPI cache
import redis.asyncio as aioredis
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend

# Import settings
from app.core.config import settings

# Tutaj będziemy importować nasze routery API
from app.api.v1.api import api_router

# Dummy backend for when caching is disabled
class NullBackend:
    async def get(self, key):
        return None
    async def set(self, key, value, expire=None):
        pass
    async def clear(self, namespace=None, key=None):
        pass

# Custom StaticFiles that adds Cache-Control header for browser caching
class CacheControlStaticFiles(StaticFiles):
    async def get_response(self, path, scope):
        response = await super().get_response(path, scope)
        try:
            if response.status_code == 200:
                # Remove conflicting headers first
                response.headers.pop('cache-control', None)
                response.headers.pop('pragma', None)
                # Set long-lived cache header
                response.headers['Cache-Control'] = 'public, max-age=31536000, immutable'
        except Exception:
            pass
        return response


# Middleware to add Cache-Control header for /uploads
class CacheControlMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        if request.url.path.startswith("/uploads") and response.status_code == 200:
            response.headers['Cache-Control'] = 'public, max-age=31536000, immutable'
        return response


# Lifespan context to initialize Redis-backed FastAPI cache
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Determine if caching should be enabled
    mode = settings.OPTIMIZATION_MODE.lower()
    caching_enabled = mode in ["caching", "all"]

    if caching_enabled:
        redis_url = os.getenv("REDIS_URL", "redis://redis:6379")
        redis_client = aioredis.from_url(redis_url)
        # Initialize FastAPI cache with Redis backend
        FastAPICache.init(RedisBackend(redis_client), prefix="fastapi-cache")
        try:
            yield
        finally:
            try:
                await redis_client.close()
            except Exception:
                pass
    else:
        # Initialize with NullBackend to avoid errors in @cache decorators
        FastAPICache.init(NullBackend(), prefix="fastapi-cache")
        yield


app = FastAPI(
    title="Fotograf Portfolio API",
    description="Backend dla aplikacji portfolio fotografa w FastAPI.",
    version="0.1.0",
    lifespan=lifespan,
)

# --- Serwowanie plików statycznych (zdjęć) ---
# Check caching mode for StaticFiles
if settings.OPTIMIZATION_MODE.lower() in ["caching", "all"]:
    app.mount("/uploads", CacheControlStaticFiles(directory="uploads"), name="uploads")
else:
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# --- Konfiguracja CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",      # Vite dev server
        "http://127.0.0.1:5173",      # Vite dev server
        "http://localhost",           # Frontend w Docker (port 80)
        "http://localhost:3000",      # Alternatywny port
        "http://frontend",            # Nazwa serwisu Docker
        "*"                          # Dla testów - zezwala na wszystkie domeny
    ],
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)

# Add cache header middleware for uploads ONLY if caching is enabled
if settings.OPTIMIZATION_MODE.lower() in ["caching", "all"]:
    app.add_middleware(CacheControlMiddleware)

# --- Główny endpoint ---
@app.get("/", tags=["Root"])
def read_root():
    """Główny punkt wejścia - sprawdza czy API działa."""
    return {"message": "Witaj w API Portfolio Fotografa!"}


# routery API
app.include_router(api_router, prefix="/api/v1")