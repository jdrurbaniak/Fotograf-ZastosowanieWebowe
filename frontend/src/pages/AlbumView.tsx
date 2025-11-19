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
        <div className="gallery-grid">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="gallery-item"
              onClick={() => setSelectedImage(photo)}
            >
              <img src={getImageUrl(photo.thumbnail_url || photo.image_url)} alt={photo.title} loading="lazy" />
            </div>
          ))}
        </div>
      )}

      {selectedImage && (
        <div className="modal" onClick={() => setSelectedImage(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <img src={getImageUrl(selectedImage.image_url)} alt={selectedImage.title} />
            <h2>{selectedImage.title}</h2>
            {selectedImage.description && <p>{selectedImage.description}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default AlbumView;
