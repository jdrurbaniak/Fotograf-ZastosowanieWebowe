import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getAlbum, getPhotosByAlbum } from '../services/api';

interface Photo {
  id: number;
  image_url: string;
  thumbnail_url?: string;
  title: string;
  description?: string;
}

interface Album {
  id: number;
  title: string;
  description?: string;
}

const AlbumView = () => {
  const { albumId } = useParams<{ albumId: string }>();
  const [album, setAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedImage, setSelectedImage] = useState<Photo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlbumData();
  }, [albumId]);

  const loadAlbumData = async () => {
    if (!albumId) return;
    try {
      const [albumRes, photosRes] = await Promise.all([
        getAlbum(parseInt(albumId)),
        getPhotosByAlbum(parseInt(albumId))
      ]);
      setAlbum(albumRes.data);
      setPhotos(photosRes.data);
    } catch (error) {
      console.error('Błąd ładowania albumu:', error);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (imageUrl: string) => {
    if (imageUrl.startsWith('http')) return imageUrl;
    // KROK 1: Zdjęcia serwowane bezpośrednio przez nginx
    return imageUrl;
  };

  if (loading) {
    return <div className="album-view-container">Ładowanie...</div>;
  }

  if (!album) {
    return <div className="album-view-container">Album nie znaleziony</div>;
  }

  return (
    <div className="album-view-container">
      <div className="album-header">
        <h1>{album.title}</h1>
        {album.description && <p className="album-description">{album.description}</p>}
        <p className="photo-count">{photos.length} {photos.length === 1 ? 'zdjęcie' : 'zdjęć'}</p>
      </div>

      {photos.length === 0 ? (
        <p className="no-photos">Brak zdjęć w tym albumie</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <button key={photo.id} onClick={() => setSelectedImage(photo)} className="focus:outline-none" aria-label={`Otwórz ${photo.title}`}>
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
      )}

      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setSelectedImage(null)}>
          <div className="bg-white rounded max-w-3xl w-full mx-4 p-4" onClick={e => e.stopPropagation()}>
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

export default AlbumView;
