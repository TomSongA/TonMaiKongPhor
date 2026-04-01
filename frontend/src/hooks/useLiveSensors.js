import { useCallback, useEffect, useRef, useState } from 'react'
import {
  appendPoint,
  computePsi,
  evaluateStress,
  randomReading,
} from '../lib/sensorLogic'

const TICK_MS = 3500

export function useLiveSensors() {
  const [reading, setReading] = useState(null)
  const [history, setHistory] = useState([])
  const [lastUpdated, setLastUpdated] = useState(null)
  const seedRef = useRef(null)

  // ย้าย init ทั้งหมดมาไว้ใน useEffect — รันฝั่ง client อย่างเดียว
  useEffect(() => {
    const initial = randomReading()
    const h = []
    let r = initial
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
    seedRef.current = initial
    setReading(initial)
    setHistory(h)
    setLastUpdated(Date.now())
  }, [])

  const tick = useCallback(() => {
    const prev = seedRef.current
    if (!prev) return
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

  // reading เป็น null ตอน SSR
  if (!reading) return null

  return {
    reading,
    history,
    lastUpdated,
    psi: computePsi(reading),
    stressReasons: evaluateStress(reading),
    refresh: tick,
  }
}