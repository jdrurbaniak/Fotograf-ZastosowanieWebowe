import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAlbums, getPhotosByAlbum } from '../services/api';
import descriptionGallery from '../data/descriptionGallery';

interface Album {
  id: number;
  title: string;
  description?: string;
}

interface Photo {
  id: number;
  image_url: string;
  thumbnail_url?: string;
  title: string;
}

const GalleryPage = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [albumPhotos, setAlbumPhotos] = useState<{ [key: number]: Photo[] }>({});
  const [hoveredAlbum, setHoveredAlbum] = useState<number | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<{ [key: number]: number }>({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadAlbums();
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (hoveredAlbum !== null && albumPhotos[hoveredAlbum]?.length > 1) {
      interval = setInterval(() => {
        setCurrentPhotoIndex(prev => ({
          ...prev,
          [hoveredAlbum]: ((prev[hoveredAlbum] || 0) + 1) % albumPhotos[hoveredAlbum].length
        }));
      }, 1000); // Zmiana co 1 sekundę
    }
    return () => clearInterval(interval);
  }, [hoveredAlbum, albumPhotos]);

  const loadAlbums = async () => {
    try {
      const response = await getAlbums();
      const albumsData = response.data;
      setAlbums(albumsData);

      // Pobierz zdjęcia dla każdego albumu
      const photosPromises = albumsData.map((album: Album) =>
        getPhotosByAlbum(album.id).then(res => ({ albumId: album.id, photos: res.data }))
      );
      const photosResults = await Promise.all(photosPromises);
      
      const photosMap: { [key: number]: Photo[] } = {};
      photosResults.forEach(result => {
        photosMap[result.albumId] = result.photos;
      });
      setAlbumPhotos(photosMap);
    } catch (error) {
      console.error('Błąd ładowania albumów:', error);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (imageUrl: string) => {
    if (imageUrl.startsWith('http')) return imageUrl;
    // KROK 1: Zdjęcia serwowane bezpośrednio przez nginx
    return imageUrl;
  };

  const handleAlbumClick = (albumId: number) => {
    navigate(`/gallery/${albumId}`);
  };

  if (loading) {
    return <div className="gallery-page">Ładowanie albumów...</div>;
  }

  return (
    <div className="gallery-page">
      <h1>My creations</h1>
      <p className="gallery-description">
        {descriptionGallery}
      </p>

      {albums.length === 0 ? (
        <p>Brak albumów. Administrator może dodać albumy przez panel administracyjny.</p>
      ) : (
        <div className="albums-grid">
          {albums.map(album => {
            const photos = albumPhotos[album.id] || [];
            const currentIndex = currentPhotoIndex[album.id] || 0;
            const currentPhoto = photos[currentIndex];

            return (
              <div
                key={album.id}
                className="album-card-preview"
                onClick={() => handleAlbumClick(album.id)}
                onMouseEnter={() => setHoveredAlbum(album.id)}
                onMouseLeave={() => {
                  setHoveredAlbum(null);
                  setCurrentPhotoIndex(prev => ({ ...prev, [album.id]: 0 }));
                }}
              >
                <div className="album-thumbnail">
                  {currentPhoto ? (
                    <img
                      src={getImageUrl(currentPhoto.thumbnail_url || currentPhoto.image_url)}
                      alt={album.title}
                      className="album-preview-image"
                    />
                  ) : (
                    <div className="album-no-photo">Brak zdjęć</div>
                  )}
                </div>
                <div className="album-card-info">
                  <h3>{album.title}</h3>
                  {album.description && <p>{album.description}</p>}
                  <span className="photo-count">{photos.length} zdjęć</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GalleryPage;