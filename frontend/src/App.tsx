import './App.css'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import SocialMediaIcons from './components/SocialMediaIcons';
import GalleryPage from './pages/GalleryPage';
import ContactPage from './pages/ContactPage';

function App() {
  return (
    <BrowserRouter>
      <SocialMediaIcons />
      <nav className="navbar">
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/gallery">Gallery</Link></li>
          <li><Link to="/contact">Contact</Link></li>
        </ul>
      </nav>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Routes>
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