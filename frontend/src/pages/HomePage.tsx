import descriptionHome from '../data/descriptionHome';

const HomePage = () => {
  return (
    <section className="hero hero-grid">
      <div className="hero-info">
        <h1>Jan Kowalski</h1>
        <h2>Professional photographer and artist</h2>
        <p>{descriptionHome}</p>
      </div>
      <div className="hero-photo">
        <img src="https://tinyurl.com/26sukdr6" alt="Photographer photo" />
      </div>
  </section>
  );
};

export default HomePage;

