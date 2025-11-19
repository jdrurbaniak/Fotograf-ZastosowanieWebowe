# UUID + Thumbnail Generation Feature

## Implementacja z 19.11.2025

### Zmiany Backend:
- **requirements.txt**: dodano Pillow==11.0.0
- **models/photo.py**: dodano pole thumbnail_url (nullable)
- **schemas/photo.py**: dodano thumbnail_url w PhotoBase
- **crud/crud_photo.py**: zapisywanie thumbnail_url
- **endpoints/photos.py**: 
  - async funkcja create_new_photo
  - UUID dla nazw plików (zamiast timestamp)
  - Automatyczne generowanie miniaturek 300px
  - EXIF rotation fix
  - JPEG quality 85%, optimize=True
- **migration**: 2a3b4c5d6e78_add_thumbnail_url_to_photos.py

### Zmiany Frontend:
- Wszystkie komponenty (AdminDashboard, ImageGallery, AlbumView, GalleryPage)
- Dodano thumbnail_url do interface Photo
- Używają miniaturek w listach: thumbnail_url || image_url
- Pełny obraz w modalach: image_url
- Dodano loading="lazy" dla lepszej wydajności

### Przywracanie:
```bash
cd /home/wojciech/Dokumenty/Projekty\ studia/zastosowania\ webowe/Fotograf-ZastosowanieWebowe
cp .backups/uuid-thumbnails-feature/* backend/app/api/v1/endpoints/
# itd...
```
