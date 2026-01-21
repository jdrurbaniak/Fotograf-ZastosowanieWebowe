import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://51.120.24.113:8000';

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const login = (email: string, password: string) =>
  api.post('/api/v1/login/token', new URLSearchParams({ username: email, password }));

// Albums
export const getAlbums = () => api.get('/api/v1/albums/');
export const getAlbum = (id: number) => api.get(`/api/v1/albums/${id}`);
export const createAlbum = (data: { title: string; description?: string; is_public?: boolean }) =>
  api.post('/api/v1/albums/', data);
export const updateAlbum = (id: number, data: { title?: string; description?: string; is_public?: boolean }) =>
  api.patch(`/api/v1/albums/${id}`, data);
export const deleteAlbum = (id: number) => api.delete(`/api/v1/albums/${id}`);
export const reorderAlbums = (albumIds: number[]) =>
  api.post('/api/v1/albums/reorder', { album_ids: albumIds });

// Photos
export const getPhotos = () => api.get('/api/v1/photos/');
export const getPhotosByAlbum = (albumId: number) => api.get(`/api/v1/photos/album/${albumId}`);
export const uploadPhoto = (formData: FormData) =>
  api.post('/api/v1/photos/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
export const updatePhoto = (id: number, data: { title?: string; description?: string; album_id?: number }) =>
  api.patch(`/api/v1/photos/${id}`, data);
export const deletePhoto = (id: number) => api.delete(`/api/v1/photos/${id}`);

// Bookings
export const createBooking = (data: {
  client_name: string;
  client_email: string;
  client_phone?: string;
  service_name: string;
  booking_date: string; // ISO format datetime string
  notes?: string;
}) => api.post('/api/v1/bookings/', data);

export const getBookings = () => api.get('/api/v1/bookings/'); // Admin - wymaga tokena
export const getPublicBookings = () => api.get('/api/v1/bookings/public'); // Publiczny - bez tokena
export const updateBookingStatus = (id: number, status: string) =>
  api.patch(`/api/v1/bookings/${id}`, { status });
export const deleteBooking = (id: number) => api.delete(`/api/v1/bookings/${id}`);
