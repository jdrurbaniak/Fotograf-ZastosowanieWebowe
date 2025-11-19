
import './App.css';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import SocialMediaIcons from './components/SocialMediaIcons';
import GalleryPage from './pages/GalleryPage';
import AlbumView from './pages/AlbumView';
import ContactPage from './pages/ContactPage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import { useState, useEffect } from 'react';

function App() {
  const [showLogin, setShowLogin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('token'));
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setShowLogin(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    window.location.href = '/';
  };

  return (
    <BrowserRouter>
      <SocialMediaIcons />
      <nav className="navbar">
        <div className="navbar-content">
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/gallery">Gallery</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
          {isLoggedIn ? (
            <div className="admin-nav-buttons">
              <Link to="/admin" className="dashboard-btn">
                Dashboard
              </Link>
              <button className="login-btn" onClick={handleLogout}>
                Wyloguj
              </button>
            </div>
          ) : (
            <button className="login-btn" onClick={() => setShowLogin(true)}>
              Zaloguj się
            </button>
          )}
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/gallery/:albumId" element={<AlbumView />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
      {showLogin && (
        <div className="modal" onClick={() => setShowLogin(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <LoginPage onLoginSuccess={handleLoginSuccess} />
          </div>
        </div>
      )}
    </BrowserRouter>
  );
}

export default App;


// import './App.css'

// const _mods = import.meta.glob('./webp/*.{jpg,jpeg,png,svg,webp}', { eager: true })
// const images = Object.entries(_mods)
//   .map(([path, mod]) => {
//     if (!mod) return null
//     if (typeof mod === 'string') return mod
//     if (mod.default && typeof mod.default === 'string') return mod.default
//     return null
//   })
//   .filter(Boolean)



// export default function App() {
//   return (
//     <div className="app-root">
//       <header>
//         <h1>Portfolio</h1>
//       </header>

//       <main>
//         <section className="gallery">
//           {images.length === 0 ? (
//             <p>No images found in <code>src/images</code>.</p>
//           ) : (
//             images.map((src, i) => (
//               <figure className="photo" key={i}>
//                 <img src={src} alt={`photo-${i + 1}`} loading="lazy" />
//               </figure>
//             ))
//           )}
//         </section>
//       </main>
//     </div>
//   )
// }