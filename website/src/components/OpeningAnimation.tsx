import { useEffect, useState, type CSSProperties } from 'react'

const stages = [
  { n: 100, alphaC: '4.7%', criticalCount: '≈5', visibleAgents: 24, visibleSpecks: 32, exposedAgents: 5, activeRoutes: 14, harmfulSources: 1, waveWidth: 31, waveHeight: 38, label: 'A local harmful signal', shortLabel: 'N = 100', reach: 'Local', state: 'stable' },
  { n: 300, alphaC: '3.7%', criticalCount: '≈11', visibleAgents: 40, visibleSpecks: 70, exposedAgents: 16, activeRoutes: 32, harmfulSources: 2, waveWidth: 52, waveHeight: 56, label: 'The network grows', shortLabel: 'N = 300', reach: 'Growing', state: 'stable' },
  { n: 1000, alphaC: '3.0%', criticalCount: '≈30', visibleAgents: 56, visibleSpecks: 108, exposedAgents: 36, activeRoutes: 52, harmfulSources: 3, waveWidth: 76, waveHeight: 76, label: 'Signals reach distant groups', shortLabel: 'N = 1,000', reach: 'Broad', state: 'warning' },
  { n: 2000, alphaC: '2.2%', criticalCount: '≈44', visibleAgents: 72, visibleSpecks: 144, exposedAgents: 62, activeRoutes: 64, harmfulSources: 4, waveWidth: 102, waveHeight: 98, label: 'A smaller fraction reaches the boundary', shortLabel: 'N = 2,000', reach: 'System-wide', state: 'collapse' },
] as const

type Point = { x: number; y: number }

const pathSpecs = [
  [7, 51, 93, 51],
  [50, 8, 50, 92],
  [13, 19, 88, 81],
  [14, 82, 87, 17],
  [17, 28, 84, 28],
  [16, 73, 85, 73],
  [27, 14, 27, 88],
  [75, 14, 75, 88],
] as const

function jitter(index: number, salt: number) {
  return (Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453 % 1) * 1.5
}

const agentPositions: Point[] = pathSpecs.flatMap(([x1, y1, x2, y2], pathIndex) =>
  Array.from({ length: 9 }, (_, pointIndex) => {
    const t = (pointIndex + 0.5) / 9
    const index = pathIndex * 9 + pointIndex
    return {
      x: x1 + (x2 - x1) * t + jitter(index, 1),
      y: y1 + (y2 - y1) * t + jitter(index, 2),
    }
  }),
)

const routePairs = pathSpecs.flatMap((_, pathIndex) =>
  Array.from({ length: 8 }, (_, pointIndex) => [pathIndex * 9 + pointIndex, pathIndex * 9 + pointIndex + 1] as const),
)

const orderedRoutePairs = [...routePairs].sort(([fromA, toA], [fromB, toB]) => {
  const midpointA = {
    x: (agentPositions[fromA].x + agentPositions[toA].x) / 2,
    y: (agentPositions[fromA].y + agentPositions[toA].y) / 2,
  }
  const midpointB = {
    x: (agentPositions[fromB].x + agentPositions[toB].x) / 2,
    y: (agentPositions[fromB].y + agentPositions[toB].y) / 2,
  }
  return Math.hypot(midpointA.x - 50, midpointA.y - 50) - Math.hypot(midpointB.x - 50, midpointB.y - 50)
})

const revealOrder = agentPositions
  .map((point, index) => ({ index, distance: Math.hypot(point.x - 50, point.y - 50) }))
  .sort((a, b) => a.distance - b.distance)
  .map(({ index }) => index)

const harmfulOrder = [4, 22, 49, 67]
const harmfulPositions = new Set(harmfulOrder)
const exposureOrder = revealOrder.filter((index) => !harmfulPositions.has(index))

const populationSpecks = Array.from({ length: 144 }, (_, index) => {
  const [x1, y1, x2, y2] = pathSpecs[index % pathSpecs.length]
  const step = Math.floor(index / pathSpecs.length)
  const t = (step + 0.35 + Math.abs(jitter(index, 4)) * 0.12) / 18
  return {
    x: x1 + (x2 - x1) * t + jitter(index, 5) * 2.4,
    y: y1 + (y2 - y1) * t + jitter(index, 6) * 2.4,
  }
})

function routeStyle(from: number, to: number, index: number) {
  const start = agentPositions[from]
  const end = agentPositions[to]
  const deltaX = end.x - start.x
  const adjustedY = (end.y - start.y) * 0.39

  return {
    '--route-x': `${start.x}%`,
    '--route-y': `${start.y}%`,
    '--route-length': `${Math.hypot(deltaX, adjustedY)}%`,
    '--route-angle': `${Math.atan2(adjustedY, deltaX) * 180 / Math.PI}deg`,
    '--route-delay': `${(index % 11) * -0.13}s`,
  } as CSSProperties
}

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
            <span className="opening-kicker">Measured scaling points · schematic network</span>
            <h2 id="opening-animation-title">How harmful influence spreads as society scales</h2>
          </div>
          <output aria-live="polite">
            <span>{stage.label}</span>
            <small>N = {stage.n.toLocaleString()} · α<sub>c</sub> = {stage.alphaC}</small>
          </output>
        </div>

        <div
          className="agent-society agent-society--network-map"
          role="img"
          aria-label={`Schematic social network at society size ${stage.n.toLocaleString()}, with a measured 50% collapse boundary of ${stage.alphaC} and a corresponding harmful count of ${stage.criticalCount}`}
        >
          <div className="network-map" aria-hidden="true">
            <div className="network-legend">
              <span><i className="legend-source" />Harmful source</span>
              <span><i className="legend-reached" />Reached agent</span>
              <span><i className="legend-route" />Active path</span>
            </div>

            <span
              className="diffusion-wave"
              key={stage.n}
              style={{ '--wave-width': `${stage.waveWidth}%`, '--wave-height': `${stage.waveHeight}%` } as CSSProperties}
            ><i /><i /></span>

            <div className="population-specks">
              {populationSpecks.map((point, index) => (
                <i
                  className={`${index < stage.visibleSpecks ? 'is-visible' : ''}${index < stage.exposedAgents * 2 ? ' is-reached' : ''}`}
                  key={index}
                  style={{ left: `${point.x}%`, top: `${point.y}%`, '--speck-delay': `${(index % 17) * -0.08}s` } as CSSProperties}
                />
              ))}
            </div>

            <div className="communication-network">
              {orderedRoutePairs.map(([from, to], index) => (
                <span
                  className={`communication-route${index < stage.activeRoutes ? ' is-active' : ''}`}
                  key={`${from}-${to}`}
                  style={routeStyle(from, to, index)}
                >
                  <i />
                </span>
              ))}
            </div>

            <div className="agent-cloud">
              {agentPositions.map((point, index) => {
                const revealRank = revealOrder.indexOf(index)
                const harmfulRank = harmfulOrder.indexOf(index)
                const isHarmful = harmfulRank >= 0 && harmfulRank < stage.harmfulSources
                const exposureRank = exposureOrder.indexOf(index)
                const isVisible = revealRank < stage.visibleAgents || isHarmful
                const isExposed = isVisible && !isHarmful && exposureRank >= 0 && exposureRank < stage.exposedAgents
                const pose = index % 4
                const style = {
                  left: `${point.x}%`,
                  top: `${point.y}%`,
                  '--agent-delay': `${(index % 12) * -0.09}s`,
                  '--exposure-delay': `${(Math.max(exposureRank, 0) % 10) * -0.12}s`,
                } as CSSProperties

                return (
                  <span
                    key={index}
                    className={`society-agent society-agent--pose-${pose}${isVisible ? ' is-visible' : ''}${isExposed ? ' society-agent--exposed' : ''}${isHarmful ? ' society-agent--harmful' : ''}`}
                    style={style}
                  >
                    <svg viewBox="0 0 24 38" focusable="false">
                      {isHarmful && <path className="agent-horns" d="M7.5 3 5 0.8l.3 5M16.5 3 19 .8l-.3 5" />}
                      <circle className="agent-head" cx="12" cy="6" r="4.3" />
                      {isHarmful ? (
                        <path className="agent-face agent-face--harmful" d="m9 5 1.8 1M15 5l-1.8 1M9.6 8.2q2.4-1.7 4.8 0" />
                      ) : (
                        <path className="agent-face" d="M10 5.6h.1M13.9 5.6h.1M10.2 8q1.8 1.2 3.6 0" />
                      )}
                      <path className="agent-body" d="M12 11v12M12 23 6.2 34M12 23l5.8 11" />
                      {pose === 0 && <path className="agent-arms" d="M12 17 5 21M12 17l7 4" />}
                      {pose === 1 && <path className="agent-arms" d="M12 18 5.5 14 3 9M12 18l7 2" />}
                      {pose === 2 && <path className="agent-arms" d="M12 17 6 13M12 17l6-4" />}
                      {pose === 3 && <path className="agent-arms" d="M12 18 5 17M12 18l7-5 1-4" />}
                    </svg>
                  </span>
                )
              })}
            </div>
          </div>

          <div className="society-readout" key={`${stage.n}-${stage.alphaC}`} aria-hidden="true">
            <span>Society size <b>N = {stage.n.toLocaleString()}</b></span>
            <span>50% boundary <b>α<sub>c</sub> = {stage.alphaC}</b></span>
            <span>Harmful count <b>K<sub>c</sub> {stage.criticalCount}</b></span>
            <span>Visual reach <b>{stage.reach}</b></span>
          </div>

          <strong className="collapse-signal" aria-hidden="true">COLLAPSE BOUNDARY</strong>
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
      <p>The boundary fraction falls as society size grows, even as the corresponding harmful count rises. The people-and-path network is schematic; the values shown for N, α<sub>c</sub>, and K<sub>c</sub> are measured results.</p>
    </section>
  )
}
