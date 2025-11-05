import ImageGallery from '../components/ImageGallery';
import descriptionGallery from '../data/descriptionGallery';

const GalleryPage = () => {
  return (
    <div className="gallery-page">
      <h1>My creations</h1>
      <p className="gallery-description">
        {descriptionGallery}
      </p>
      <ImageGallery />
    </div>
  );
};

export default GalleryPage;