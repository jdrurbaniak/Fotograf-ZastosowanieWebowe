# Używamy oficjalnego obrazu Python 3.11
FROM python:3.11-slim

# Ustawiamy katalog roboczy
WORKDIR /app

# Kopiujemy plik wymagań
COPY requirements.txt .

# Instalujemy zależności
RUN pip install --no-cache-dir -r requirements.txt

# Kopiujemy całą aplikację
COPY . .

# Copy entrypoint script that applies DB migrations before starting the app
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Tworzymy katalog na przesłane pliki
RUN mkdir -p /app/uploads

# Otwieramy port 8000
EXPOSE 8000

# Uruchamiamy aplikację za pomocą uvicorn
CMD ["/bin/sh", "/app/entrypoint.sh"]
