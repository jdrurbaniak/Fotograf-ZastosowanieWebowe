# Raport z aktualizacji systemu cache'owania i optymalizacji

## 1. Problem: Niespójność danych w Dashboardzie
Użytkownicy zgłaszali problem polegający na tym, że usunięte zdjęcia "powracały" na listę w panelu administracyjnym mimo ich poprawnego usunięcia z bazy danych. Problem występował nawet po "twardym" odświeżeniu strony (Ctrl+Shift+R).

**Przyczyna:**
Zastosowany wcześniej mechanizm cache'owania (`fastapi-cache` z Redisem) oraz domyślne zachowanie przeglądarek powodowały, że:
1.  Serwer Redis przechowywał starą listę zdjęć przez 60 sekund.
2.  Przeglądarka klienta otrzymywała nagłówek `Cache-Control`, który instruował ją, aby nie pytała serwera o nowe dane przez określony czas, tylko korzystała z własnej pamięci podręcznej.
3.  Nawet po wyczyszczeniu cache'u na serwerze (Redis), przeglądarka wciąż mogła serwować nieaktualne dane z pamięci lokalnej.

## 2. Zastosowane rozwiązanie: Hybrydowa strategia cache'owania

Aby pogodzić wysoką wydajność z poprawnością danych, wdrożyliśmy dwie odrębne strategie dla różnych typów zasobów.

### A. Dane dynamiczne (API - Listy zdjęć)
Dla endpointów zwracających listy zdjęć (`GET /api/v1/photos/` oraz `GET /api/v1/photos/album/{id}`) **całkowicie wyłączyliśmy cache'owanie**.

*   **Działanie:** Każde wejście na stronę lub odświeżenie dashboardu wymusza pobranie aktualnego stanu bezpośrednio z bazy danych.
*   **Implementacja:**
    *   Usunięto dekorator `@cache` z endpointów.
    *   Dodano nagłówki HTTP wymuszające świeżość danych:
        ```http
        Cache-Control: no-cache, no-store, must-revalidate
        Pragma: no-cache
        Expires: 0
        ```
*   **Cel:** Gwarancja, że administrator zawsze widzi rzeczywisty stan systemu (np. czy zdjęcie zostało usunięte).

### B. Zasoby statyczne (Pliki zdjęć i miniaturek)
Dla plików serwowanych ze ścieżki `/uploads` zastosowaliśmy **agresywne cache'owanie**.

*   **Działanie:** Raz pobrane zdjęcie jest przechowywane w przeglądarce użytkownika przez rok.
*   **Implementacja:**
    *   Middleware `CacheControlMiddleware` oraz klasa `CacheControlStaticFiles` w `main.py`.
    *   Nagłówek: `Cache-Control: public, max-age=31536000, immutable`.
*   **Cel:** Drastyczne odciążenie serwera i przyspieszenie ładowania galerii. Ponieważ pliki zdjęć rzadko się zmieniają (a jeśli tak, to zazwyczaj zmienia się ich nazwa/URL), jest to bezpieczne i wydajne.

## 3. Optymalizacja wydajności serwera (Azure B1s)

Dodatkowo, aby zapobiec zawieszaniu się serwera (który posiada tylko 1GB RAM) podczas operacji na zdjęciach, wprowadziliśmy zmiany w `backend/app/api/v1/endpoints/photos.py`:

1.  **Przetwarzanie sekwencyjne:** Zmniejszono liczbę wątków generujących miniaturki (`max_workers=1`). Dzięki temu serwer przetwarza tylko jedno zdjęcie na raz, co zapobiega nagłym skokom zużycia pamięci RAM.
2.  **Zarządzanie pamięcią:** Dodano wymuszone czyszczenie pamięci (`gc.collect()`) po przetworzeniu każdego zdjęcia, aby natychmiast zwalniać zasoby zajmowane przez bibliotekę przetwarzania obrazu.

## Podsumowanie
Obecna konfiguracja zapewnia:
*   **Spójność:** Dashboard zawsze pokazuje prawdę.
*   **Szybkość:** Zdjęcia ładują się błyskawicznie z cache'u przeglądarki.
*   **Stabilność:** Serwer nie zawiesza się nawet przy przesyłaniu wielu dużych plików.
