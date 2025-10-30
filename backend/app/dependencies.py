from app.database import SessionLocal

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