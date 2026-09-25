import { useEffect, useRef, useState } from 'react'
import DitherVeil from './components/DitherVeil'
import './App.css'

// True only when WebGL is available and actually backed by a GPU — software
// rasterizers (SwiftShader, llvmpipe, the Windows "Basic Render Driver",
// browsers with hardware acceleration disabled) fall back to the plain logo.
function supportsHardwareWebGL() {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    if (!gl) return false
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
    const renderer = debugInfo
      ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      : gl.getParameter(gl.RENDERER)
    if (/swiftshader|llvmpipe|software|basic render|microsoft basic/i.test(String(renderer))) {
      return false
    }
    return true
  } catch {
    return false
  }
}

// Placeholder entries — swap `title`/`category`/`href` for each once you
// send over the real project names and destinations.
const PROJECTS = [
  { title: 'Volery', category: 'Concept Art', href: 'https://volery.vc' },
  { title: 'Anthill Ventures', category: 'Typography', href: 'https://www.anthillventures.com' },
  { title: 'Esthetic Insights', category: 'Experimental Media', href: 'https://www.estheticinsights.com' },
  { title: 'Flamingo Aerospace', category: 'Photography', href: 'https://flamingoaerospace.com' },
  { title: 'Lipi', category: 'Editorial Design', href: '#' },
  { title: 'Weekend', category: 'Sound Design', href: '#' },
  { title: 'Shattered Glass', category: 'Art Installations', href: '#' },
  { title: 'Quiet Static', category: 'Motion Graphics', href: '#' },
  { title: 'Velvet Horizon', category: 'Brand Identity', href: '#' },
  { title: 'Hollow Bloom', category: 'Type Foundry', href: '#' },
]

const COPIES = 3
const MIDDLE_COPY = 1

function App() {
  const trackRef = useRef(null)
  const rowRefs = useRef([])
  const activeIndexRef = useRef(0)
  const audioCtxRef = useRef(null)
  const frameRef = useRef(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [webglOk] = useState(supportsHardwareWebGL)

  const tripled = Array.from({ length: COPIES }, () => PROJECTS).flat()

  useEffect(() => {
    const enableAudio = () => {
      if (!audioCtxRef.current) {
        const Ctx = window.AudioContext || window.webkitAudioContext
        if (Ctx) audioCtxRef.current = new Ctx()
      }
    }
    window.addEventListener('pointerdown', enableAudio, { once: true })
    window.addEventListener('wheel', enableAudio, { once: true })
    return () => {
      window.removeEventListener('pointerdown', enableAudio)
      window.removeEventListener('wheel', enableAudio)
    }
  }, [])

  useEffect(() => {
    const track = trackRef.current
    const firstRow = rowRefs.current[0]
    if (!track || !firstRow) return
    const rowHeight = firstRow.offsetHeight
    track.scrollTop = rowHeight * PROJECTS.length * MIDDLE_COPY
  }, [])

  function playTick() {
    const ctx = audioCtxRef.current
    if (!ctx) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.value = 1500
    gain.gain.setValueAtTime(0.04, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.035)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.04)
  }

  function handleScroll() {
    if (frameRef.current) return
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null
      const track = trackRef.current
      const firstRow = rowRefs.current[0]
      if (!track || !firstRow) return

      const rowHeight = firstRow.offsetHeight
      const copyHeight = rowHeight * PROJECTS.length
      const scrollTop = track.scrollTop

      const centerY = scrollTop + track.clientHeight / 2
      const rawIndex = Math.floor(centerY / rowHeight)
      const nextActive = ((rawIndex % PROJECTS.length) + PROJECTS.length) % PROJECTS.length

      if (nextActive !== activeIndexRef.current) {
        activeIndexRef.current = nextActive
        setActiveIndex(nextActive)
        playTick()
      }

      if (scrollTop < copyHeight * 0.5) {
        track.scrollTop = scrollTop + copyHeight
      } else if (scrollTop > copyHeight * 1.5) {
        track.scrollTop = scrollTop - copyHeight
      }
    })
  }

  return (
    <main className="list-viewport">
      <div
        className="list-track"
        ref={trackRef}
        onScroll={handleScroll}
      >
        {tripled.map((item, i) => {
          const projectIndex = i % PROJECTS.length
          const isActive = projectIndex === activeIndex
          return (
            <a
              key={i}
              href={item.href}
              target={item.href !== '#' ? '_blank' : undefined}
              rel={item.href !== '#' ? 'noopener noreferrer' : undefined}
              className={`row${isActive ? ' active' : ''}`}
              ref={(el) => {
                if (i < PROJECTS.length) rowRefs.current[i] = el
              }}
            >
              <span className="title">{item.title}</span>
              <span className="tag">{item.category}</span>
            </a>
          )
        })}
      </div>
      <div className="logo-mark" aria-hidden="true">
        {webglOk ? (
          <DitherVeil
            src="/sprdlx-logo.svg"
            fit="contain"
            pattern="floyd"
            pixelSize={3}
            inkColor="#000000"
            paperColor="#ffffff"
            revealRadius={220}
            softness={0.6}
            linger={1}
            rim={0}
            clickBurst
          />
        ) : (
          <img src="/sprdlx-logo.svg" alt="" className="logo-mark-img" />
        )}
      </div>
    </main>
  )
}

export default App
