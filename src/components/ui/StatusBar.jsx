/**
 * StatusBar.jsx — Top navigation bar with scrolling event ticker + How-to-Use / Rules buttons
 */
import React, { useEffect, useRef } from 'react'
import { useSimStore } from '../../store/simStore'

function TickerItem({ msg, type }) {
  const col = {
    LOST: '#ef4444', CRITICAL: '#f59e0b', DEGRADED: '#f59e0b',
    SECURE: '#10b981', ECM: '#a855f7', OK: '#0ea5e9',
  }[type] || '#8b949e'
  return (
    <span className="inline-flex items-center gap-2 px-4" style={{ color: col }}>
      <span style={{ color: '#475569' }}>◆</span>
      {msg}
    </span>
  )
}

export default function StatusBar({ onHowTo, onRules }) {
  const {
    linkStatus, linkQuality, snr, time, running,
    jammingType, countermeasures, scenario, events,
    jammerPower, uavs,
  } = useSimStore()

  const tickerRef = useRef()

  const lqPct     = (linkQuality * 100).toFixed(1)
  const statusCol = { SECURE:'#10b981', DEGRADED:'#f59e0b', CRITICAL:'#ef4444', LOST:'#6b7280' }[linkStatus]
  const activeECM = Object.entries(countermeasures)
    .filter(([, v]) => v)
    .map(([k]) => k === 'freqHopping' ? 'HOP' : k === 'encryption' ? 'SSD' : 'PWR')

  useEffect(() => {
    if (!tickerRef.current) return
    let x = 0
    const id = setInterval(() => {
      if (!tickerRef.current) return
      const w = tickerRef.current.scrollWidth / 2
      x += 0.5
      if (x >= w) x = 0
      tickerRef.current.style.transform = `translateX(-${x}px)`
    }, 16)
    return () => clearInterval(id)
  }, [events.length])

  const tickerItems = events.length > 0
    ? events.slice(0, 8)
    : [{ id: 0, type: 'OK', msg: `Scenario: ${scenario.toUpperCase()} | Jam: ${jammingType.toUpperCase()} | ${uavs.length} UAVs active` }]

  const btnBase = {
    padding: '4px 14px',
    fontSize: 11,
    fontFamily: 'Rajdhani, sans-serif',
    fontWeight: 700,
    letterSpacing: '0.08em',
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'all 0.15s',
  }

  return (
    <div className="flex items-stretch overflow-hidden flex-shrink-0"
      style={{ height: 40, background: '#1e293b', borderBottom: '1px solid #334155' }}>

      {/* Logo */}
      <div className="flex items-center gap-2 px-3 flex-shrink-0" style={{ borderRight: '1px solid #334155' }}>
        <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: '#0ea5e9' }}>
          <svg viewBox="0 0 20 20" fill="none" width="11" height="11">
            <path d="M2 10L10 3l8 7M5 10v7h10v-7" stroke="white" strokeWidth="1.8" strokeLinejoin="round"/>
          </svg>
        </div>
        <span className="font-display font-bold text-xs tracking-widest" style={{ color: '#f8fafc' }}>UAV-JAM SIM</span>
      </div>

      {/* Status pill */}
      <div className="flex items-center gap-1.5 px-3 flex-shrink-0" style={{ borderRight: '1px solid #334155' }}>
        <div className="w-2 h-2 rounded-full" style={{ background: statusCol, boxShadow: `0 0 5px ${statusCol}` }} />
        <span className="text-[11px] font-mono font-bold" style={{ color: statusCol }}>{linkStatus}</span>
      </div>

      {/* Metrics */}
      {[
        { k: 'LQ',   v: `${lqPct}%`,                   col: statusCol },
        { k: 'SNR',  v: `${snr.toFixed(1)}dB`,          col: snr >= 10 ? '#10b981' : snr >= 0 ? '#f59e0b' : '#ef4444' },
        { k: 'JAM',  v: `${jammerPower.toFixed(0)}W`,   col: '#a855f7' },
        { k: 'TYPE', v: jammingType.toUpperCase(),       col: '#c4b5fd' },
        { k: 'T',    v: `${Math.floor(time)}s`,          col: '#8b949e' },
        { k: 'UAVs', v: `${uavs.length}`,               col: '#0ea5e9' },
      ].map(m => (
        <div key={m.k} className="flex items-center gap-1 px-2 flex-shrink-0" style={{ borderRight: '1px solid #334155' }}>
          <span className="text-[9px] font-mono" style={{ color: '#94a3b8' }}>{m.k}</span>
          <span className="text-[11px] font-mono font-semibold" style={{ color: m.col }}>{m.v}</span>
        </div>
      ))}

      {/* ECM badges */}
      {activeECM.map(e => (
        <div key={e} className="flex items-center px-1.5 flex-shrink-0" style={{ borderRight: '1px solid #334155' }}>
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded"
            style={{ background: '#05966920', color: '#34d399', border: '1px solid #34d39950' }}>
            {e}
          </span>
        </div>
      ))}

      {/* Event ticker */}
      <div className="flex-1 flex items-center overflow-hidden relative">
        <div className="absolute inset-y-0 left-0 w-8 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(90deg, #1e293b, transparent)' }} />
        <div className="overflow-hidden w-full">
          <div ref={tickerRef} className="flex whitespace-nowrap text-[10px] font-mono will-change-transform">
            {[...tickerItems, ...tickerItems].map((ev, i) => (
              <TickerItem key={i} msg={ev.msg} type={ev.type} />
            ))}
          </div>
        </div>
        <div className="absolute inset-y-0 right-0 w-8 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(270deg, #1e293b, transparent)' }} />
      </div>

      {/* How-to-Use button */}
      <button onClick={onHowTo} style={{
        ...btnBase,
        background: '#0ea5e922',
        border: '1px solid #0ea5e966',
        color: '#7dd3fc',
        margin: '5px 4px',
        flexShrink: 0,
      }}>
        📖 How to Use
      </button>

      {/* Rules & Analysis button */}
      <button onClick={onRules} style={{
        ...btnBase,
        background: '#a855f722',
        border: '1px solid #a855f766',
        color: '#d8b4fe',
        margin: '5px 8px 5px 0',
        flexShrink: 0,
      }}>
        📊 Rules & Analysis
      </button>

      {/* Sim status */}
      <div className="flex items-center gap-1.5 px-3 flex-shrink-0" style={{ borderLeft: '1px solid #334155' }}>
        <div className={`w-2 h-2 rounded-full ${running ? 'blink' : ''}`}
          style={{ background: running ? '#10b981' : '#f59e0b' }} />
        <span className="text-[10px] font-mono" style={{ color: running ? '#10b981' : '#f59e0b' }}>
          {running ? 'LIVE' : 'PAUSED'}
        </span>
      </div>
    </div>
  )
}
