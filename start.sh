#!/bin/bash

echo "🚀 Uruchamianie aplikacji Fotograf Portfolio..."
echo ""

# Sprawdź czy Docker działa
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker nie jest uruchomiony!"
    echo "Uruchom Docker i spróbuj ponownie."
    exit 1
fi

# Sprawdź czy plik .env istnieje
if [ ! -f backend/.env ]; then
    echo "📝 Tworzenie pliku .env z przykładowej konfiguracji..."
    cp backend/.env.example backend/.env
    echo "✅ Plik .env utworzony"
    echo "⚠️  Pamiętaj aby zmienić SECRET_KEY w produkcji!"
    echo ""
fi

# Wybór trybu
echo "Wybierz tryb uruchomienia:"
echo "1) Produkcyjny (nginx + zoptymalizowany build)"
echo "2) Deweloperski (hot-reload dla backendu i frontendu)"
echo ""
read -p "Wybór [1/2]: " mode

if [ "$mode" = "2" ]; then
    echo ""
    echo "🔧 Uruchamianie w trybie deweloperskim..."
    docker compose -f docker-compose.dev.yml up -d --build
    
    echo ""
    echo "✅ Aplikacja uruchomiona!"
    echo ""
    echo "🌐 Adresy:"
    echo "   Frontend (dev):  http://localhost:5173"
    echo "   Backend API:     http://localhost:8000"
    echo "   API Docs:        http://localhost:8000/docs"
    echo ""
    echo "📊 Logi: docker compose -f docker-compose.dev.yml logs -f"
    echo "🛑 Stop:  docker compose -f docker-compose.dev.yml down"
else
    echo ""
    echo "🏭 Uruchamianie w trybie produkcyjnym..."
    docker compose up -d --build
    
    echo ""
    echo "✅ Aplikacja uruchomiona!"
    echo ""
    echo "🌐 Adresy:"
    echo "   Frontend:        http://localhost"
    echo "   Backend API:     http://localhost:8000"
    echo "   API Docs:        http://localhost:8000/docs"
    echo ""
    echo "📊 Logi: docker compose logs -f"
    echo "🛑 Stop:  docker compose down"
fi

echo ""
echo "⏳ Czekam aż serwisy będą gotowe..."
sleep 5

echo ""
echo "🔧 Wykonywanie migracji bazy danych..."
if [ "$mode" = "2" ]; then
    docker compose -f docker-compose.dev.yml exec -T backend alembic upgrade head
else
    docker compose exec -T backend alembic upgrade head
fi

echo ""
echo "✨ Gotowe! Aplikacja jest uruchomiona."
