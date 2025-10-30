import sys
import os
import getpass # Do bezpiecznego wpisywania hasła
from sqlalchemy.orm import Session

# --- To jest ten sam trik, co w alembic/env.py ---
# Dodaje folder 'backend' do ścieżki, abyśmy mogli importować 'app'
sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), '.')))
# --------------------------------------------------

from app.database import SessionLocal
from app import crud, schemas
from app.models.user import User # Potrzebne do sprawdzenia, czy istnieje

def main():
    print("--- Tworzenie konta administratora ---")
    
    # Pobierz dane od użytkownika
    email = input("Podaj e-mail administratora: ")
    
    # Użyj getpass, aby hasło nie było widoczne na ekranie
    password = getpass.getpass("Podaj hasło: ")
    password_confirm = getpass.getpass("Potwierdź hasło: ")

    if password != password_confirm:
        print("\n[BŁĄD] Hasła nie są zgodne. Przerwano.")
        return

    # Mamy dane, połączmy się z bazą
    db: Session = SessionLocal()
    
    try:
        # Sprawdź, czy użytkownik o tym e-mailu już istnieje
        existing_user = crud.crud_user.get_user_by_email(db, email=email)
        if existing_user:
            print(f"\n[BŁĄD] Użytkownik z e-mailem '{email}' już istnieje. Przerwano.")
            return

        # Stwórz schemat Pydantic z danymi
        user_in = schemas.user.UserCreate(email=email, password=password)
        
        # Użyj naszej funkcji CRUD, aby stworzyć użytkownika
        crud.crud_user.create_user(db, user=user_in)
        
        print(f"\n[SUKCES] Pomyślnie utworzono administratora dla: {email}")

    except Exception as e:
        print(f"\n[BŁĄD] Wystąpił nieoczekiwany błąd: {e}")
    finally:
        # Zawsze zamykaj sesję
        db.close()

if __name__ == "__main__":
    main()