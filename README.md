# Fotograf - Portfolio Fotografa

Aplikacja webowa portfolio fotografa z backendem FastAPI i frontendem React + Vite.

## 📋 Wymagania

- Docker (wersja 20.10 lub nowsza)
- Docker Compose (wersja 2.0 lub nowsza)

## 🚀 Uruchomienie aplikacji

### Metoda 1: Szybki start ze skryptem (NAJŁATWIEJSZA)

```bash
./start.sh
```

Skrypt automatycznie:
- Sprawdzi czy Docker działa
- Utworzy plik `.env` jeśli nie istnieje
- Zapyta o tryb (produkcyjny/deweloperski)
- Uruchomi wszystkie kontenery
- Wykona migracje bazy danych

Zatrzymanie:
```bash
./stop.sh
```

### Metoda 2: Ręczne uruchomienie z Dockerem

1. **Sklonuj repozytorium:**
```bash
git clone <repository-url>
cd Fotograf-ZastosowanieWebowe
```

2. **Skonfiguruj zmienne środowiskowe:**
```bash
cp backend/.env.example backend/.env
# Edytuj backend/.env jeśli chcesz zmienić domyślne ustawienia
```

3. **Uruchom wszystkie serwisy:**

**Tryb produkcyjny:**
```bash
docker compose up -d --build
```

**Tryb deweloperski (z hot-reload):**
```bash
docker compose -f docker-compose.dev.yml up -d --build
```

To polecenie uruchomi:
- **PostgreSQL** (port 5432) - baza danych
- **Backend FastAPI** (port 8000) - API
- **Frontend React** (port 80 lub 5173) - aplikacja webowa

4. **Sprawdź status:**
```bash
docker compose ps
```

5. **Migracje bazy danych:**

Po pierwszym uruchomieniu wykonaj migracje:
```bash
docker compose exec backend alembic upgrade head
```

6. **Utwórz użytkownika administratora (opcjonalnie):**
```bash
docker compose exec backend python create_admin.py
```

### Dostęp do aplikacji

- **Frontend:** http://localhost
- **Backend API:** http://localhost:8000
- **Dokumentacja API:** http://localhost:8000/docs
- **PostgreSQL:** localhost:5432

## 🛠️ Komendy Docker

### Dwa tryby pracy

**Produkcyjny** (`docker-compose.yml`):
- Frontend zbudowany i serwowany przez nginx
- Szybszy, zoptymalizowany
- Bez hot-reload

**Deweloperski** (`docker-compose.dev.yml`):
- Frontend w trybie dev z Vite (hot-reload)
- Backend z automatycznym przeładowywaniem
- Wolumeny montowane dla zmian w locie

### Podstawowe operacje

```bash
# Tryb produkcyjny
docker compose up -d
docker compose down

# Tryb deweloperski
docker compose -f docker-compose.dev.yml up -d
docker compose -f docker-compose.dev.yml down

# Przebudowanie obrazów
docker compose build
docker compose -f docker-compose.dev.yml build

# Przebudowanie i uruchomienie
docker compose up -d --build

# Wyświetlenie logów
docker compose logs -f

# Logi konkretnego serwisu
docker compose logs -f backend
docker compose logs -f frontend
```

### Zarządzanie danymi

```bash
# Zatrzymanie i usunięcie wolumenów (UWAGA: usuwa dane!)
docker compose down -v

# Backup bazy danych
docker compose exec db pg_dump -U fotograf fotograf_db > backup.sql

# Restore bazy danych
docker compose exec -T db psql -U fotograf fotograf_db < backup.sql
```

## 💻 Rozwój lokalny

### Tryb deweloperski z Docker (ZALECANY)

Używa hot-reload dla backendu i frontendu:

```bash
# Uruchom środowisko deweloperskie
docker compose -f docker-compose.dev.yml up -d

# Frontend będzie dostępny na: http://localhost:5173
# Backend będzie dostępny na: http://localhost:8000
```

Zmiany w kodzie będą automatycznie przeładowywane!

### Backend (FastAPI) - lokalnie bez Dockera

Jeśli chcesz pracować lokalnie bez Dockera:

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Skopiuj i edytuj zmienne środowiskowe
cp .env.example .env

# Uruchom serwer
uvicorn app.main:app --reload
```

### Frontend (React + Vite) - lokalnie bez Dockera

```bash
cd frontend
npm install
npm run dev
```

## 📦 Struktura projektu

```
├── backend/                # Backend FastAPI
│   ├── app/
│   │   ├── api/           # Endpointy API
│   │   ├── core/          # Konfiguracja i bezpieczeństwo
│   │   ├── crud/          # Operacje bazodanowe
│   │   ├── models/        # Modele SQLAlchemy
│   │   └── schemas/       # Schematy Pydantic
│   ├── alembic/           # Migracje bazy danych
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/              # Frontend React
│   ├── src/
│   │   ├── components/    # Komponenty React
│   │   ├── pages/         # Strony aplikacji
│   │   └── assets/        # Zasoby statyczne
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
└── docker-compose.yml     # Konfiguracja Docker
```

## 🔧 Konfiguracja

### Zmienne środowiskowe Backend

Edytuj `backend/.env`:

```env
DATABASE_URL=postgresql://fotograf:superhaslo@db:5432/fotograf_db
SECRET_KEY=your-secret-key-here-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## 🔍 Rozwiązywanie problemów

### Port już zajęty

Jeśli porty 80, 8000 lub 5432 są zajęte:

1. Zmień porty w `docker-compose.yml`:
```yaml
ports:
  - "8080:80"  # Frontend
  - "8001:8000"  # Backend
  - "5433:5432"  # PostgreSQL
```

### Problem z uprawnieniami

```bash
# Linux: dodaj użytkownika do grupy docker
sudo usermod -aG docker $USER
# Wyloguj się i zaloguj ponownie
```

### Czyszczenie i restart

```bash
# Zatrzymaj wszystkie kontenery
docker compose down

# Usuń wszystkie dane (UWAGA: tracisz dane!)
docker compose down -v

# Usuń obrazy
docker compose down --rmi all

# Przebuduj wszystko od nowa
docker compose build --no-cache
docker compose up -d
```

## 📝 Licencja

Projekt studencki - Zastosowania Webowe

## 👥 Autor

Projekt studencki
