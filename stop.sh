#!/bin/bash

echo "🛑 Zatrzymywanie aplikacji Fotograf Portfolio..."
echo ""

# Zatrzymaj oba tryby (na wypadek gdyby któryś był uruchomiony)
docker compose down 2>/dev/null
docker compose -f docker-compose.dev.yml down 2>/dev/null

echo "✅ Aplikacja zatrzymana"
echo ""
echo "💾 Dane w wolumenach Docker zostały zachowane"
echo ""
echo "Jeśli chcesz również usunąć dane:"
echo "  docker compose down -v"
echo "  docker compose -f docker-compose.dev.yml down -v"
