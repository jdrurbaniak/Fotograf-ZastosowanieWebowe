import './App.css'

const _mods = import.meta.glob('./webp/*.{jpg,jpeg,png,svg,webp}', { eager: true })
const images = Object.entries(_mods)
  .map(([path, mod]) => {
    if (!mod) return null
    if (typeof mod === 'string') return mod
    if (mod.default && typeof mod.default === 'string') return mod.default
    return null
  })
  .filter(Boolean)



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
