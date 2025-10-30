from fastapi import APIRouter
from app.api.v1.endpoints import auth, albums, photos

api_router = APIRouter()


api_router.include_router(auth.router, tags=["Authentication"])
api_router.include_router(albums.router, prefix="/albums", tags=["Albums"])
api_router.include_router(photos.router, prefix="/photos", tags=["Photos"])
