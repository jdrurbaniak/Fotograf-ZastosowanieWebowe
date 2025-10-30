from pydantic import BaseModel

class Token(BaseModel):
    """Schemat odpowiedzi - to co zwracamy użytkownikowi."""
    access_token: str
    token_type: str

class TokenData(BaseModel):
    """Schemat danych, które przechowujemy wewnątrz tokenu JWT."""
    email: str | None = None