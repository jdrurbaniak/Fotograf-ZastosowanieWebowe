import './App.css'

// Load all images from the ./images folder using Vite's glob import.
// Be defensive: depending on Vite version/config the glob may return either a module
// with a `default` export (the URL) or the URL string directly. Handle both.
// Use import.meta.glob with eager: true — some Vite setups don't expose globEager
const _mods = import.meta.glob('./images/*.{jpg,jpeg,png,svg}', { eager: true })
const images = Object.entries(_mods)
  .map(([path, mod]) => {
    if (!mod) return null
    if (typeof mod === 'string') return mod
    if (mod.default && typeof mod.default === 'string') return mod.default
    // fallback: sometimes the module itself is the URL in default-less setups
    return null
  })
  .filter(Boolean)

// Debug: print loaded image URLs to the console so you can verify HMR output
console.log('Loaded images:', images)

export default function App() {
  return (
    <div className="app-root">
      <header>
        <h1>Portfolio</h1>
      </header>

      <main>
        <section className="gallery">
          {images.length === 0 ? (
            <p>No images found in <code>src/images</code>.</p>
          ) : (
            images.map((src, i) => (
              <figure className="photo" key={i}>
                <img src={src} alt={`photo-${i + 1}`} loading="lazy" />
              </figure>
            ))
          )}
        </section>
      </main>
    </div>
  )
}
