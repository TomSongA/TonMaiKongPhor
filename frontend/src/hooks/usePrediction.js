import { useCallback, useEffect, useState } from 'react'
import { fetchPrediction } from '../lib/sensorApi'

export function usePrediction(initialHours = 3) {
  const [hoursAhead, setHoursAhead] = useState(initialHours)
  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const load = useCallback(
    async (hrs) => {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchPrediction(hrs)
        setPrediction(data)
        if (typeof data?.hours_ahead === 'number') {
          setHoursAhead(data.hours_ahead)
        }
      } catch (e) {
        const detail = e?.response?.data?.detail || e?.message || 'Failed to load prediction'
        setError(detail)
      } finally {
        setLoading(false)
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
