import { useEffect, useState, type CSSProperties } from 'react'

const stages = [
  { n: 100, alphaC: '4.7%', criticalCount: '≈5', visibleHeads: 26, reachedHeads: 4, harmfulHeads: 1, particles: 3, spread: 24, label: 'A harmful agent appears', shortLabel: 'N = 100', reach: 'Local', state: 'stable' },
  { n: 300, alphaC: '3.7%', criticalCount: '≈11', visibleHeads: 40, reachedHeads: 12, harmfulHeads: 2, particles: 5, spread: 43, label: 'Harmful influence spreads', shortLabel: 'N = 300', reach: 'Growing', state: 'stable' },
  { n: 1000, alphaC: '3.0%', criticalCount: '≈30', visibleHeads: 52, reachedHeads: 27, harmfulHeads: 3, particles: 8, spread: 67, label: 'More agents are affected', shortLabel: 'N = 1,000', reach: 'Broad', state: 'warning' },
  { n: 2000, alphaC: '2.2%', criticalCount: '≈44', visibleHeads: 64, reachedHeads: 48, harmfulHeads: 4, particles: 10, spread: 104, label: 'The boundary is crossed', shortLabel: 'N = 2,000', reach: 'System-wide', state: 'collapse' },
] as const

type Point = { x: number; y: number }

const headPositions: Point[] = Array.from({ length: 64 }, (_, index) => {
  if (index === 0) return { x: 50, y: 50 }
  const angle = index * 2.399963229728653
  const radius = 7 + Math.sqrt(index / 63) * 43
  return {
    x: 50 + Math.cos(angle) * radius,
    y: 50 + Math.sin(angle) * radius * 0.68,
  }
})

const harmfulOrder = [0, 17, 38, 55]
const harmfulPositions = new Set(harmfulOrder)

const reachedOrder = headPositions
  .map((point, index) => ({ index, distance: Math.hypot(point.x - 50, (point.y - 50) / 0.68) }))
  .filter(({ index }) => !harmfulPositions.has(index))
  .sort((a, b) => a.distance - b.distance)
  .map(({ index }) => index)

const particleAngles = [15, 196, 308, 92, 245, 42, 155, 334, 116, 274]

export function OpeningAnimation() {
  const [activeStage, setActiveStage] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)

  useEffect(() => {
    if (!isPlaying || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => {
      setActiveStage((current) => (current + 1) % stages.length)
    }, 2400)
    return () => window.clearInterval(timer)
  }, [isPlaying])

  const stage = stages[activeStage]

  return (
    <section className="opening-animation" aria-labelledby="opening-animation-title">
      <div className={`opening-scene opening-scene--${stage.state}`}>
        <div className="opening-scene__header">
          <div>
            <span className="opening-kicker">Measured scaling points · schematic diffusion</span>
            <h2 id="opening-animation-title">When harmful influence reaches a tipping point</h2>
          </div>
          <output aria-live="polite">
            <span>{stage.label}</span>
            <small>N = {stage.n.toLocaleString()} · α<sub>c</sub> = {stage.alphaC}</small>
          </output>
        </div>

        <div
          className="agent-society agent-society--diffusion"
          role="img"
          aria-label={`Schematic diffusion among agents at society size ${stage.n.toLocaleString()}, with a measured 50% collapse boundary of ${stage.alphaC} and a corresponding harmful count of ${stage.criticalCount}`}
        >
          <div className="diffusion-field" aria-hidden="true">
            <div className="diffusion-legend">
              <span><i className="legend-normal" />Normal agent</span>
              <span><i className="legend-harmful" />Harmful agent</span>
              <span><i className="legend-reached" />Reached agent</span>
            </div>

            <span
              className="infection-wave"
              key={`wave-${stage.n}`}
              style={{ '--spread': `${stage.spread}%` } as CSSProperties}
            ><i /><i /></span>

            <div className="infection-particles">
              {particleAngles.map((angle, index) => {
                const radius = stage.spread * (0.22 + (index % 4) * 0.07)
                const radians = angle * Math.PI / 180
                return (
                  <i
                    className={index < stage.particles ? 'is-visible' : ''}
                    key={angle}
                    style={{
                      left: `${50 + Math.cos(radians) * radius}%`,
                      top: `${50 + Math.sin(radians) * radius * 0.62}%`,
                      '--particle-delay': `${index * -0.16}s`,
                    } as CSSProperties}
                  />
                )
              })}
            </div>

            <div className="head-cloud">
              {headPositions.map((point, index) => {
                const reachedRank = reachedOrder.indexOf(index)
                const harmfulRank = harmfulOrder.indexOf(index)
                const isHarmful = harmfulRank >= 0 && harmfulRank < stage.harmfulHeads
                const isVisible = index < stage.visibleHeads || isHarmful
                const isReached = !isHarmful && isVisible && reachedRank >= 0 && reachedRank < stage.reachedHeads
                const isFront = isReached && reachedRank >= Math.max(0, stage.reachedHeads - 5)
                const style = {
                  left: `${point.x}%`,
                  top: `${point.y}%`,
                  '--head-delay': `${(index % 9) * -0.11}s`,
                  '--collapse-delay': `${(index % 7) * 0.025}s`,
                  '--collapse-x': `${((index * 19) % 17) - 8}px`,
                  '--collapse-y': `${10 + (index * 13) % 24}px`,
                  '--collapse-angle': `${((index * 31) % 46) - 23}deg`,
                } as CSSProperties

                return (
                  <span
                    className={`agent-head-node${isVisible ? ' is-visible' : ''}${isReached ? ' is-reached' : ''}${isFront ? ' is-front' : ''}${isHarmful ? ' is-harmful' : ''}`}
                    key={index}
                    style={style}
                  >
                    <span className="agent-face-dot"><i /><i /><b /></span>
                  </span>
                )
              })}
            </div>

            <div className="collapse-impact">
              <i /><i />
              <strong>COLLAPSE</strong>
              <span>boundary crossed</span>
            </div>
          </div>

          <div className="society-readout" key={`${stage.n}-${stage.alphaC}`} aria-hidden="true">
            <span>Society size <b>N = {stage.n.toLocaleString()}</b></span>
            <span>50% boundary <b>α<sub>c</sub> = {stage.alphaC}</b></span>
            <span>Harmful count <b>K<sub>c</sub> {stage.criticalCount}</b></span>
            <span>Visual spread <b>{stage.reach}</b></span>
          </div>
        </div>

        <div className="opening-controls" aria-label="Select a measured society size">
          {stages.map((item, index) => (
            <button
              key={item.n}
              type="button"
              className={activeStage === index ? 'is-active' : ''}
              aria-pressed={activeStage === index}
              onClick={() => {
                setActiveStage(index)
                setIsPlaying(false)
              }}
            >
              <i aria-hidden="true" />
              {item.shortLabel}
            </button>
          ))}
          <button
            type="button"
            className="opening-playback"
            aria-label={isPlaying ? 'Pause scaling animation' : 'Play scaling animation'}
            onClick={() => setIsPlaying((current) => !current)}
          >
            <span aria-hidden="true">{isPlaying ? 'Ⅱ' : '▶'}</span>
            {isPlaying ? 'Pause' : 'Play'}
          </button>
        </div>
      </div>
      <p>As society size grows, the measured collapse boundary falls even though the corresponding harmful count rises. The diffusion shown here is schematic.</p>
    </section>
  )
}
