import { useState } from 'react';

interface Photo {
  id: number;
  url: string;
  title: string;
}

// Przykładowe dane - później możesz zastąpić je prawdziwymi zdjęciami
const samplePhotos: Photo[] = [
  { id: 1, url: 'https://tinyurl.com/p4brrusm', title: 'Train' },
  { id: 2, url: 'https://tinyurl.com/yetwufbx', title: 'Fish' },
  { id: 3, url: 'https://tinyurl.com/3spj5wt7', title: 'Winter' },
  { id: 4, url: 'https://tinyurl.com/4fzc2x5h', title: 'Bicycle' },
  { id: 5, url: 'https://tinyurl.com/bdhfw3yc', title: 'River' },
  { id: 6, url: 'https://tinyurl.com/58hzem78', title: 'Garden' },
  { id: 7, url: 'https://tinyurl.com/25sxj5kj', title: 'Restaurant' },
  { id: 8, url: 'https://tinyurl.com/3973k7v7', title: 'Tunnel' },
  { id: 9, url: 'https://tinyurl.com/4jm7fdzj', title: 'City' },
  { id: 10, url: 'https://tinyurl.com/5bj969jd', title: 'Basket' },
  { id: 11, url: 'https://tinyurl.com/4btjz8bv', title: 'Meadow' },
  { id: 12, url: 'https://tinyurl.com/43c48eyp', title: 'Cherry' },
  { id: 13, url: 'https://tinyurl.com/2udc6t7t', title: 'Ice' },
  { id: 14, url: 'https://tinyurl.com/ms98tpx5', title: 'Leaf' }

];

const ImageGallery = () => {
  const [selectedImage, setSelectedImage] = useState<Photo | null>(null);

  return (
    <div className="gallery-container">
      <div className="gallery-grid">
        {samplePhotos.map((photo) => (
          <div
            key={photo.id}
            className="gallery-item"
            onClick={() => setSelectedImage(photo)}
          >
            <img src={photo.url} alt={photo.title} />
          </div>
        ))}
      </div>

      {selectedImage && (
        <div className="modal" onClick={() => setSelectedImage(null)}>
          <div className="modal-content">
            <img src={selectedImage.url} alt={selectedImage.title} />
            <h2>{selectedImage.title}</h2>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;