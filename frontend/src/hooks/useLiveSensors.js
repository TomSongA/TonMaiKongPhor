import { useCallback, useEffect, useRef, useState } from 'react'
import {
  appendPoint,
  computePsi,
  evaluateStress,
  randomReading,
} from '../lib/sensorLogic'

const TICK_MS = 3500

export function useLiveSensors() {
  const [reading, setReading] = useState(() => randomReading())
  const [history, setHistory] = useState(() => {
    const h = []
    let r = randomReading()
    for (let i = 0; i < 24; i++) {
      r = randomReading({
        soil: r.soil + (Math.random() - 0.5) * 4,
        tempC: r.tempC + (Math.random() - 0.5) * 0.8,
        humidity: r.humidity + (Math.random() - 0.5) * 3,
        light: r.light + (Math.random() - 0.5) * 6,
        at: Date.now() - (24 - i) * TICK_MS,
      })
      h.push(r)
    }
    return h
  })
  const [lastUpdated, setLastUpdated] = useState(() => Date.now())
  const seedRef = useRef(reading)

  const tick = useCallback(() => {
    const prev = seedRef.current
    const next = randomReading({
      soil: prev.soil + (Math.random() - 0.5) * 6,
      tempC: prev.tempC + (Math.random() - 0.5) * 1.2,
      humidity: prev.humidity + (Math.random() - 0.5) * 5,
      light: prev.light + (Math.random() - 0.5) * 10,
      at: Date.now(),
    })
    seedRef.current = next
    setReading(next)
    setHistory((h) => appendPoint(h, next))
    setLastUpdated(next.at)
  }, [])

  useEffect(() => {
    const id = setInterval(tick, TICK_MS)
    return () => clearInterval(id)
  }, [tick])

  const psi = computePsi(reading)
  const stressReasons = evaluateStress(reading)

  return {
    reading,
    history,
    lastUpdated,
    psi,
    stressReasons,
    refresh: tick,
  }
}
