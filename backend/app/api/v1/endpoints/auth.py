from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm 
from sqlalchemy.orm import Session
from datetime import timedelta

from app import crud, schemas 
from app.core.security import create_access_token, verify_password, ACCESS_TOKEN_EXPIRE_MINUTES
from app.dependencies import get_db_session

router = APIRouter()

@router.post("/login/token", response_model=schemas.token.Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db_session)
):
    """
    Loguje użytkownika i zwraca token JWT.
    """
    # Pobieramy użytkownika z bazy danych na podstawie e-maila
    user = crud.crud_user.get_user_by_email(db, email=form_data.username)
    
    # Sprawdzamy, czy użytkownik istnieje i czy hasło się zgadza
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Niepoprawny e-mail lub hasło",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Jeśli wszystko OK, tworzymy token JWT
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}