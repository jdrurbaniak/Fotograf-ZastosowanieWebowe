import { useState, useEffect } from 'react';
import { getPhotosByAlbum } from '../services/api';

interface Photo {
  id: number;
  image_url: string;
  thumbnail_url?: string;
  title: string;
  description?: string;
}

const ImageGallery = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedImage, setSelectedImage] = useState<Photo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      // Pobieramy zdjęcia z albumu o id=1 (album "Strona główna")
      const response = await getPhotosByAlbum(1);
      setPhotos(response.data);
    } catch (error) {
      console.error('Błąd ładowania zdjęć:', error);
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="gallery-container">Ładowanie zdjęć...</div>;
  }

  if (photos.length === 0) {
    return (
      <div className="gallery-container">
        <p>Brak zdjęć w galerii. Dodaj zdjęcia przez panel administracyjny.</p>
      </div>
    );
  }

  const getImageUrl = (imageUrl: string) => {
    // Jeśli URL zaczyna się od http, zwróć go bez zmian
    if (imageUrl.startsWith('http')) return imageUrl;
    // KROK 1: Zdjęcia serwowane bezpośrednio przez nginx z /uploads
    return imageUrl; // już zawiera /uploads/nazwa.jpg
  };

  return (
    <div className="gallery-container">
      <div className="gallery-grid">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="gallery-item"
            onClick={() => setSelectedImage(photo)}
          >
            {/* Fixed-height container to reserve space and avoid CLS; image is cropped via object-cover */}
            <div className="h-48 bg-gray-200 overflow-hidden rounded">
              <img
                src={getImageUrl(photo.thumbnail_url || photo.image_url)}
                alt={photo.title}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        ))}
      </div>

      {selectedImage && (
        <div className="modal" onClick={() => setSelectedImage(null)}>
          <div className="modal-content">
            <img src={getImageUrl(selectedImage.image_url)} alt={selectedImage.title} />
            <h2>{selectedImage.title}</h2>
            {selectedImage.description && <p>{selectedImage.description}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;