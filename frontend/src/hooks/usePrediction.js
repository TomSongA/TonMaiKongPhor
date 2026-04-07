import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchPrediction } from '../lib/sensorApi'

export function usePrediction(initialHours = 3) {
  const [hoursAhead, setHoursAhead] = useState(initialHours)
  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const latestRequestId = useRef(0)

  const load = useCallback(
    async (hrs) => {
      const requestId = ++latestRequestId.current
      setLoading(true)
      setError(null)
      try {
        const data = await fetchPrediction(hrs)
        if (requestId === latestRequestId.current) {
          setPrediction(data)
          if (typeof data?.hours_ahead === 'number' && data.hours_ahead !== hrs) {
            setHoursAhead(data.hours_ahead)
          }
        }
      } catch (e) {
        const detail = e?.response?.data?.detail || e?.message || 'Failed to load prediction'
        if (requestId === latestRequestId.current) {
          setError(detail)
        }
      } finally {
        if (requestId === latestRequestId.current) {
          setLoading(false)
        }
      }
    },
    []
  )

  useEffect(() => {
    void load(hoursAhead)
  }, [hoursAhead, load])

  const updateHoursAhead = useCallback((next) => {
    setHoursAhead(next)
  }, [])

  return {
    prediction,
    loading,
    error,
    hoursAhead,
    setHoursAhead: updateHoursAhead,
    refresh: () => load(hoursAhead),
  }
}
