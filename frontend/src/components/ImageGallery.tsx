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
      {/* Use a responsive CSS Grid and preserve aspect ratio to avoid CLS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {photos.map((photo) => (
          <button
            key={photo.id}
            onClick={() => setSelectedImage(photo)}
            className="focus:outline-none"
            aria-label={`Otwórz ${photo.title}`}
          >
            {/* Aspect ratio box — reserves space before image loads */}
            <div className="aspect-square bg-gray-200 overflow-hidden rounded">
              <img
                src={getImageUrl(photo.thumbnail_url || photo.image_url)}
                alt={photo.title}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
          </button>
        ))}
      </div>

      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setSelectedImage(null)}>
          <div className="bg-white rounded max-w-3xl w-full mx-4 p-4">
            <div className="w-full aspect-video bg-gray-100 overflow-hidden">
              <img src={getImageUrl(selectedImage.image_url)} alt={selectedImage.title} className="w-full h-full object-contain" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">{selectedImage.title}</h2>
            {selectedImage.description && <p className="mt-2">{selectedImage.description}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;