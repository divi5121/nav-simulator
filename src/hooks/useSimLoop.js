import { useEffect, useRef } from 'react'
import { useSimStore } from '../store/simStore'

/**
 * Drives the simulation at the target frame rate.
 * Uses requestAnimationFrame for smooth rendering, but only calls
 * tick_sim() at the configured interval to control CPU usage.
 */
export function useSimLoop() {
  const tickSim  = useSimStore(s => s.tick_sim)
  const running  = useSimStore(s => s.running)
  const perfMode = useSimStore(s => s.perfMode)
  const rafRef   = useRef(null)
  const lastRef  = useRef(null)
  const lastTickRef = useRef(0)

  useEffect(() => {
    // Target intervals in ms: low=100ms (~10fps), medium=33ms (~30fps), high=16ms (~60fps)
    const interval = perfMode === 'low' ? 100 : perfMode === 'high' ? 16 : 33

    const loop = (now) => {
      rafRef.current = requestAnimationFrame(loop)
      if (!running) return

      if (now - lastTickRef.current >= interval) {
        const dt = Math.min((now - (lastRef.current || now)) / 1000, 0.1)
        lastRef.current   = now
        lastTickRef.current = now
        tickSim(dt)
      }
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [running, perfMode, tickSim])
}
