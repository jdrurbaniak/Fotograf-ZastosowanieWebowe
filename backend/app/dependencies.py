from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt

from app.database import SessionLocal
from app import crud, models, schemas
from app.core.config import settings
from app.core.security import ALGORITHM, SECRET_KEY



def get_db_session():
    """
    Zależność FastAPI do zarządzania sesjami bazy danych.
    Otwiera sesję przy żądaniu, zamyka ją po zakończeniu.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/login/token")

def get_current_user(
    db: Session = Depends(get_db_session), 
    token: str = Depends(oauth2_scheme)
) -> models.user.User:
    """
    Zależność do weryfikacji tokenu JWT i pobrania bieżącego użytkownika.
    Nasz "zamek" do zabezpieczania endpointów.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Nie można zweryfikować poświadczeń",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Dekodujemy token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # 'sub' (subject) to email, który tam wstawiliśmy
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
            
        # Tworzymy schemat Pydantic z danych tokena
        token_data = schemas.token.TokenData(email=email)
        
    except JWTError:
        raise credentials_exception
    
    # Mamy email, pobierzmy użytkownika z bazy
    user = crud.crud_user.get_user_by_email(db, email=token_data.email)
    
    if user is None:
        # Użytkownik mógł zostać usunięty po wydaniu tokenu
        raise credentials_exception
        
    # Zwracamy obiekt użytkownika z bazy
    return user