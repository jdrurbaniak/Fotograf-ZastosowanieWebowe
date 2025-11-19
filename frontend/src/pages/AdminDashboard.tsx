import { useState, useEffect } from 'react';
import { getAlbums, createAlbum, updateAlbum, deleteAlbum, getPhotos, uploadPhoto, updatePhoto, deletePhoto, reorderAlbums, getBookings, updateBookingStatus, deleteBooking } from '../services/api';

interface Album {
  id: number;
  title: string;
  description?: string;
  is_public: boolean;
  sort_order?: number;
}

interface Photo {
  id: number;
  title: string;
  description?: string;
  image_url: string;
  thumbnail_url?: string;
  album_id: number;
}

interface Booking {
  id: number;
  client_name: string;
  client_email: string;
  client_phone?: string;
  service_name: string;
  booking_date: string;
  notes?: string;
  status: string;
}

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<'albums' | 'photos' | 'bookings'>('albums');
  const [albums, setAlbums] = useState<Album[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '', is_public: true });
  const [photoFormData, setPhotoFormData] = useState({ title: '', description: '', album_id: 1 });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [initialOrder, setInitialOrder] = useState<number[]>([]);

  useEffect(() => {
    loadAlbums();
    loadPhotos();
    loadBookings();
  }, []);

  const loadAlbums = async () => {
    try {
      const response = await getAlbums();
      const list = response.data as Album[];
      setAlbums(list);
      setInitialOrder(list.map(a => a.id));
      // Ustaw domyślny album do uploadu na pierwszy dostępny,
      // jeśli obecny album_id nie istnieje w liście.
      if (list.length > 0) {
        const exists = list.some(a => a.id === photoFormData.album_id);
        if (!exists) {
          setPhotoFormData(prev => ({ ...prev, album_id: list[0].id }));
        }
      }
    } catch (error) {
      console.error('Błąd ładowania albumów:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPhotos = async () => {
    try {
      const response = await getPhotos();
      setPhotos(response.data);
    } catch (error) {
      console.error('Błąd ładowania zdjęć:', error);
    }
  };

  const loadBookings = async () => {
    try {
      const response = await getBookings();
      setBookings(response.data);
    } catch (error) {
      console.error('Błąd ładowania rezerwacji:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAlbum) {
        await updateAlbum(editingAlbum.id, formData);
      } else {
        await createAlbum(formData);
      }
      setFormData({ title: '', description: '', is_public: true });
      setShowAddForm(false);
      setEditingAlbum(null);
      loadAlbums();
    } catch (error) {
      console.error('Błąd zapisu albumu:', error);
    }
  };

  const handleEdit = (album: Album) => {
    setEditingAlbum(album);
    setFormData({ title: album.title, description: album.description || '', is_public: album.is_public });
    setShowAddForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Czy na pewno chcesz usunąć ten album?')) return;
    try {
      await deleteAlbum(id);
      loadAlbums();
    } catch (error) {
      console.error('Błąd usuwania albumu:', error);
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingAlbum(null);
    setFormData({ title: '', description: '', is_public: true });
  };

  const handlePhotoUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      alert('Wybierz pliki do przesłania');
      return;
    }

    setUploading(true);

    try {
      // KROK 1: Zapisywanie na frontendzie (public/uploads)
      // Backend zapisuje do /app/uploads, który jest podmontowany do frontend/public/uploads
      // Nginx serwuje pliki bezpośrednio z /uploads jako statyczne
      
      // Upload każdego pliku osobno
      const uploadPromises = selectedFiles.map(file => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', photoFormData.title || file.name.replace(/\.[^/.]+$/, '')); // Jeśli brak tytułu, użyj nazwy pliku
        formData.append('description', photoFormData.description || '');
        formData.append('album_id', photoFormData.album_id.toString());
        return uploadPhoto(formData);
      });

      await Promise.all(uploadPromises);
      
      setShowPhotoUpload(false);
      setPhotoFormData({ title: '', description: '', album_id: 1 });
      setSelectedFiles([]);
      loadPhotos();
      alert(`Przesłano ${selectedFiles.length} zdjęć`);
    } catch (error) {
      console.error('Błąd uploadu zdjęć:', error);
      // Spróbuj pokazać szczegół błędu z backendu (np. 404 Album o ID ... nie istnieje.)
      const any = error as any;
      const detail = any?.response?.data?.detail || any?.message || '';
      alert(`Nie udało się przesłać niektórych zdjęć. ${detail}`.trim());
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoEdit = (photo: Photo) => {
    setEditingPhoto(photo);
    setPhotoFormData({ 
      title: photo.title, 
      description: photo.description || '', 
      album_id: photo.album_id 
    });
    setShowPhotoUpload(true);
  };

  const handlePhotoUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPhoto) return;

    try {
      await updatePhoto(editingPhoto.id, photoFormData);
      setShowPhotoUpload(false);
      setEditingPhoto(null);
      setPhotoFormData({ title: '', description: '', album_id: 1 });
      loadPhotos();
    } catch (error) {
      console.error('Błąd aktualizacji zdjęcia:', error);
      alert('Nie udało się zaktualizować zdjęcia');
    }
  };

  const handlePhotoDelete = async (id: number) => {
    if (!confirm('Czy na pewno chcesz usunąć to zdjęcie?')) return;
    try {
      await deletePhoto(id);
      loadPhotos();
    } catch (error) {
      console.error('Błąd usuwania zdjęcia:', error);
    }
  };

  const handleCancelPhoto = () => {
    setShowPhotoUpload(false);
    setEditingPhoto(null);
    setPhotoFormData({ title: '', description: '', album_id: 1 });
    setSelectedFiles([]);
  };

  const getImageUrl = (imageUrl: string) => {
    if (imageUrl.startsWith('http')) return imageUrl;
    // KROK 1: Zdjęcia są serwowane bezpośrednio przez nginx z /uploads
    // (później zmienimy na backend lub CDN)
    return imageUrl; // już zawiera /uploads/nazwa.jpg
  };

  if (loading) return <div className="admin-container">Ładowanie...</div>;

  const isOrderDirty = initialOrder.length > 0 && (initialOrder.join(',') !== albums.map(a => a.id).join(','));

  const renderTabs = () => (
    <div className="admin-tabs">
      <button
        className={`tab-button ${activeTab === 'albums' ? 'active' : ''}`}
        onClick={() => setActiveTab('albums')}
      >
        Albumy
      </button>
      <button
        className={`tab-button ${activeTab === 'photos' ? 'active' : ''}`}
        onClick={() => setActiveTab('photos')}
      >
        Zdjęcia
      </button>
      <button
        className={`tab-button ${activeTab === 'bookings' ? 'active' : ''}`}
        onClick={() => setActiveTab('bookings')}
      >
        Rezerwacje
      </button>
    </div>
  );

  const onDragStart = (e: React.DragEvent, id: number) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e: React.DragEvent, overId: number) => {
    e.preventDefault();
    if (draggingId === null || draggingId === overId) return;
    const newOrder = [...albums];
    const fromIndex = newOrder.findIndex(a => a.id === draggingId);
    const toIndex = newOrder.findIndex(a => a.id === overId);
    if (fromIndex === -1 || toIndex === -1) return;
    const [moved] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, moved);
    setAlbums(newOrder);
  };

  const onDragEnd = () => {
    setDraggingId(null);
  };

  const handleSaveOrder = async () => {
    try {
      const albumIds = albums.map(a => a.id);
      await reorderAlbums(albumIds);
      setInitialOrder(albumIds);
      alert('Kolejność albumów została zapisana');
    } catch (error) {
      console.error('Błąd zapisu kolejności:', error);
      const any = error as any;
      const detail = any?.response?.data?.detail || any?.message || '';
      alert(`Nie udało się zapisać kolejności. ${detail}`.trim());
    }
  };

  return (
    <div className="admin-container">
      <h1>Panel Administracyjny</h1>
      
      {renderTabs()}
      
      {activeTab === 'albums' && (
      <section className="admin-section">
        <div className="section-header">
          <h2>Albumy</h2>
          {!showAddForm && (
            <button className="btn-primary" onClick={() => setShowAddForm(true)}>
              + Dodaj album
            </button>
          )}
        </div>

        {showAddForm && (
          <form onSubmit={handleSubmit} className="admin-form">
            <h3>{editingAlbum ? 'Edytuj album' : 'Nowy album'}</h3>
            <input
              type="text"
              placeholder="Tytuł albumu"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="form-input"
              required
            />
            <textarea
              placeholder="Opis albumu (opcjonalnie)"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="form-textarea"
              rows={3}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <input
                type="checkbox"
                checked={formData.is_public}
                onChange={e => setFormData({ ...formData, is_public: e.target.checked })}
              />
              Widoczny publicznie
            </label>
            <div className="form-actions">
              <button type="submit" className="btn-primary">
                {editingAlbum ? 'Zapisz zmiany' : 'Dodaj album'}
              </button>
              <button type="button" className="btn-secondary" onClick={handleCancel}>
                Anuluj
              </button>
            </div>
          </form>
        )}

        <div className="albums-list">
          {isOrderDirty && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
              <button className="btn-primary" onClick={handleSaveOrder}>
                Zapisz kolejność
              </button>
            </div>
          )}
          {albums.length === 0 ? (
            <p>Brak albumów. Dodaj pierwszy album!</p>
          ) : (
            albums.map(album => (
              <div
                key={album.id}
                className="album-card"
                draggable
                onDragStart={(e) => onDragStart(e, album.id)}
                onDragOver={(e) => onDragOver(e, album.id)}
                onDragEnd={onDragEnd}
                style={{ cursor: 'grab', opacity: draggingId === album.id ? 0.6 : 1 }}
                title="Przeciągnij, aby zmienić kolejność"
              >
                <div className="album-info">
                  <h3>{album.title}</h3>
                  {album.description && <p>{album.description}</p>}
                  <span className="badge" style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: 12,
                    fontSize: 12,
                    background: album.is_public ? '#e6ffe6' : '#ffe6e6',
                    color: album.is_public ? '#147014' : '#8a1010',
                    marginTop: 6
                  }}>
                    {album.is_public ? 'Publiczny' : 'Ukryty'}
                  </span>
                </div>
                <div className="album-actions">
                  <button
                    className="btn-secondary"
                    onClick={async () => {
                      await updateAlbum(album.id, { is_public: !album.is_public });
                      loadAlbums();
                    }}
                    title={album.is_public ? 'Ukryj album' : 'Upublicznij album'}
                  >
                    {album.is_public ? 'Ukryj' : 'Upublicznij'}
                  </button>
                  <button className="btn-edit" onClick={() => handleEdit(album)}>
                    Edytuj
                  </button>
                  <button className="btn-delete" onClick={() => handleDelete(album.id)}>
                    Usuń
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
      )}

      {activeTab === 'photos' && (
      <section className="admin-section">
        <div className="section-header">
          <h2>Zdjęcia</h2>
          {!showPhotoUpload && (
            <button className="btn-primary" onClick={() => setShowPhotoUpload(true)}>
              + Dodaj zdjęcie
            </button>
          )}
        </div>

        {showPhotoUpload && (
          <form onSubmit={editingPhoto ? handlePhotoUpdate : handlePhotoUpload} className="admin-form">
            <h3>{editingPhoto ? 'Edytuj zdjęcie' : 'Dodaj zdjęcia'}</h3>
            
            {!editingPhoto && (
              <div>
                <label className="file-label">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={e => setSelectedFiles(Array.from(e.target.files || []))}
                    className="file-input"
                    required
                  />
                  <span className="file-button">Wybierz pliki</span>
                  <span className="file-name">
                    {selectedFiles.length > 0 
                      ? `Wybrano ${selectedFiles.length} plik(ów)` 
                      : 'Nie wybrano plików'}
                  </span>
                </label>
                {selectedFiles.length > 0 && (
                  <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                    {selectedFiles.map((file, idx) => (
                      <div key={idx}>• {file.name}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <input
              type="text"
              placeholder="Tytuł zdjęcia (opcjonalnie - zostanie użyta nazwa pliku)"
              value={photoFormData.title}
              onChange={e => setPhotoFormData({ ...photoFormData, title: e.target.value })}
              className="form-input"
            />
            
            <textarea
              placeholder="Opis zdjęcia (opcjonalnie)"
              value={photoFormData.description}
              onChange={e => setPhotoFormData({ ...photoFormData, description: e.target.value })}
              className="form-textarea"
              rows={2}
            />

            <select
              value={photoFormData.album_id}
              onChange={e => setPhotoFormData({ ...photoFormData, album_id: parseInt(e.target.value) })}
              className="form-input"
              required
            >
              <option value="">Wybierz album</option>
              {albums.map(album => (
                <option key={album.id} value={album.id}>{album.title}</option>
              ))}
            </select>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={uploading}>
                {uploading ? 'Przesyłanie...' : (editingPhoto ? 'Zapisz zmiany' : 'Dodaj zdjęcia')}
              </button>
              <button type="button" className="btn-secondary" onClick={handleCancelPhoto}>
                Anuluj
              </button>
            </div>
          </form>
        )}

        <div className="photos-grid">
          {photos.length === 0 ? (
            <p>Brak zdjęć. Dodaj pierwsze zdjęcie!</p>
          ) : (
            photos.map(photo => (
              <div key={photo.id} className="photo-card">
                <img src={getImageUrl(photo.thumbnail_url || photo.image_url)} alt={photo.title} className="photo-thumbnail" />
                <div className="photo-info">
                  <h4>{photo.title}</h4>
                  {photo.description && <p>{photo.description}</p>}
                  <span className="photo-album">
                    Album: {albums.find(a => a.id === photo.album_id)?.title || 'Nieznany'}
                  </span>
                </div>
                <div className="photo-actions">
                  <button className="btn-edit" onClick={() => handlePhotoEdit(photo)}>
                    Edytuj
                  </button>
                  <button className="btn-delete" onClick={() => handlePhotoDelete(photo.id)}>
                    Usuń
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
      )}

      {activeTab === 'bookings' && (
      <section className="admin-section">
        <div className="section-header">
          <h2>Rezerwacje</h2>
        </div>
        
        {bookings.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
            Brak rezerwacji.
          </p>
        ) : (
          <div className="bookings-list">
            {bookings.map(booking => (
              <div key={booking.id} className="booking-card">
                <div className="booking-info">
                  <h3>{booking.client_name}</h3>
                  <p><strong>Email:</strong> {booking.client_email}</p>
                  {booking.client_phone && <p><strong>Tel:</strong> {booking.client_phone}</p>}
                  <p><strong>Usługa:</strong> {booking.service_name}</p>
                  <p><strong>Data:</strong> {new Date(booking.booking_date).toLocaleString('pl-PL')}</p>
                  {booking.notes && <p><strong>Notatki:</strong> {booking.notes}</p>}
                  <span className="badge" style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: 12,
                    fontSize: 13,
                    marginTop: 8,
                    background: booking.status === 'potwierdzona' ? '#e6ffe6' : booking.status === 'odrzucona' ? '#ffe6e6' : '#fff3cd',
                    color: booking.status === 'potwierdzona' ? '#147014' : booking.status === 'odrzucona' ? '#8a1010' : '#856404',
                  }}>
                    {booking.status}
                  </span>
                </div>
                <div className="booking-actions">
                  {booking.status === 'oczekująca' && (
                    <>
                      <button
                        className="btn-edit"
                        onClick={async () => {
                          await updateBookingStatus(booking.id, 'potwierdzona');
                          loadBookings();
                        }}
                      >
                        Potwierdź
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={async () => {
                          await updateBookingStatus(booking.id, 'odrzucona');
                          loadBookings();
                        }}
                      >
                        Odrzuć
                      </button>
                    </>
                  )}
                  <button
                    className="btn-delete"
                    onClick={async () => {
                      if (!confirm('Czy na pewno chcesz usunąć tę rezerwację?')) return;
                      await deleteBooking(booking.id);
                      loadBookings();
                    }}
                  >
                    Usuń
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      )}
    </div>
  );
};

export default AdminDashboard;
