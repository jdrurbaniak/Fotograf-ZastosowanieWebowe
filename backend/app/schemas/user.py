from pydantic import BaseModel, ConfigDict, EmailStr

# Schemat bazowy (wspólne pola)
class UserBase(BaseModel):
    email: EmailStr # Pydantic od razu waliduje, czy to poprawny email

# Schemat do tworzenia użytkownika (wymaga hasła)
class UserCreate(UserBase):
    password: str

# Schemat do odczytu (zwracany z API - NIGDY nie zwracaj hasła!)
class UserRead(UserBase):
    id: int
    is_active: bool
    
    # Mówi Pydantic, aby czytał dane z atrybutów obiektu (tryb ORM)
    model_config = ConfigDict(from_attributes=True)