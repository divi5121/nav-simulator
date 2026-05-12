/**
 * DataPanel.jsx — Right sidebar: live metrics, gauges, fleet overview
 * FIXES: right-panel scroll + expandable section modals
 */
import React, { useMemo, useState } from 'react'
import {
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { useSimStore } from '../../store/simStore'

// ── Arc Gauge ──────────────────────────────────────────────────────────────────
function ArcGauge({ value, min = 0, max = 100, label, unit, color, size = 80 }) {
  const pct  = Math.min(1, Math.max(0, (value - min) / (max - min)))
  const r    = 30
  const circ = 2 * Math.PI * r
  const arc  = circ * 0.75
  const dash = arc * pct
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size * 0.75} viewBox="0 0 76 57" style={{ overflow: 'visible' }}>
        <circle cx="38" cy="42" r={r} fill="none" stroke="#e2e8f0" strokeWidth="5"
          strokeDasharray={`${arc} ${circ - arc}`}
          strokeDashoffset={-(circ * 0.125)}
          strokeLinecap="round" transform="rotate(135 38 42)" />
        <circle cx="38" cy="42" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeDashoffset={-(circ * 0.125)}
          strokeLinecap="round" transform="rotate(135 38 42)"
          style={{ transition: 'stroke-dasharray 0.4s ease' }} />
        <text x="38" y="44" textAnchor="middle" dominantBaseline="middle"
          fontSize="13" fontWeight="700" fill={color} fontFamily="JetBrains Mono">
          {typeof value === 'number' ? value.toFixed(0) : value}
        </text>
        <text x="38" y="55" textAnchor="middle" fontSize="8" fill="#8b949e" fontFamily="DM Sans">
          {unit}
        </text>
      </svg>
      <div className="text-[10px] mt-0.5 font-bold" style={{ color: '#64748b', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.04em' }}>{label}</div>
    </div>
  )
}

function LinearBar({ label, value, max = 100, color, sub }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color }}>
          {sub || `${pct.toFixed(0)}%`}
        </span>
      </div>
      <div style={{ height: 5, borderRadius: 3, overflow: 'hidden', background: '#e2e8f0' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.3s' }} />
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '6px 10px', fontSize: 11 }}>
      <div style={{ color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}>t={label}s</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontFamily: 'JetBrains Mono, monospace' }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
        </div>
      ))}
    </div>
  )
}

// ── Clickable Section Header ───────────────────────────────────────────────────
function SH({ label, icon, onExpand }) {
  return (
    <div
      onClick={onExpand}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '7px 12px', background: '#f8fafc',
        borderBottom: '1px solid #e2e8f0',
        cursor: onExpand ? 'pointer' : 'default',
        userSelect: 'none',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => { if (onExpand) e.currentTarget.style.background = '#eef2f7' }}
      onMouseLeave={e => { if (onExpand) e.currentTarget.style.background = '#f8fafc' }}
      title={onExpand ? `Click to expand ${label}` : undefined}
    >
      {icon && <span style={{ fontSize: 13 }}>{icon}</span>}
      <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: '0.12em', color: '#64748b', textTransform: 'uppercase', flex: 1 }}>{label}</span>
      {onExpand && (
        <span style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1 }} title="Expand">⤢</span>
      )}
    </div>
  )
}

const Panel = ({ children, style = {} }) => (
  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 8, flexShrink: 0, ...style }}>
    {children}
  </div>
)

// ── Modal Overlay ──────────────────────────────────────────────────────────────
function SectionModal({ title, icon, onClose, children }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15,23,42,0.65)',
        zIndex: 2000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.18s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: 14,
          width: 'min(560px, 92vw)',
          maxHeight: '82vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
          border: '1px solid #e2e8f0',
          animation: 'slideUp 0.22s ease',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '12px 16px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          flexShrink: 0,
        }}>
          {icon && <span style={{ fontSize: 17 }}>{icon}</span>}
          <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 14, letterSpacing: '0.1em', color: '#334155', textTransform: 'uppercase', flex: 1 }}>{title}</span>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 17, color: '#94a3b8', lineHeight: 1,
              padding: '3px 7px', borderRadius: 6,
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#ef4444' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#94a3b8' }}
            title="Close"
          >✕</button>
        </div>
        {/* Scrollable Body */}
        <div style={{ overflowY: 'auto', padding: '16px', flex: 1, scrollBehavior: 'smooth' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

// ── DataPanel ──────────────────────────────────────────────────────────────────
export default function DataPanel() {
  const [modal, setModal] = useState(null) // 'linkStatus' | 'uavFleet' | 'rfMetrics' | 'snrTrend'

  const {
    linkStatus, linkQuality, snr, signalStrength,
    jammingEffectiveness, bitErrorRate, threatLevel, time,
    history, uavs, activeUavId, setActiveUav,
  } = useSimStore()

  const lqColor   = linkQuality > 0.75 ? '#10b981' : linkQuality > 0.45 ? '#f59e0b' : '#ef4444'
  const snrColor  = snr > 10 ? '#10b981' : snr > 0 ? '#f59e0b' : '#ef4444'
  const berColor  = bitErrorRate < 0.0001 ? '#10b981' : bitErrorRate < 0.01 ? '#f59e0b' : '#ef4444'
  const statusCol = { SECURE: '#10b981', DEGRADED: '#f59e0b', CRITICAL: '#ef4444', LOST: '#6b7280' }[linkStatus]
  const threatCol = threatLevel > 0.7 ? '#ef4444' : threatLevel > 0.4 ? '#f59e0b' : '#10b981'

  const chartData = useMemo(() => {
    if (history.length <= 80) return history
    const step = Math.ceil(history.length / 80)
    return history.filter((_, i) => i % step === 0)
  }, [history])

  // ── Section content renderers (reused for panel + modal) ──────────────────
  const renderLinkStatus = (large = false) => (
    <div style={{ padding: large ? '16px 20px' : '10px 12px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: large ? 16 : 10 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: large ? '8px 28px' : '5px 16px',
          borderRadius: 24, border: `1.5px solid ${statusCol}44`, background: statusCol + '15',
          color: statusCol, fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
          fontSize: large ? 17 : 13, letterSpacing: '0.1em',
        }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: statusCol, boxShadow: `0 0 8px ${statusCol}` }} />
          {linkStatus}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-around' }}>
        <ArcGauge value={linkQuality * 100} min={0} max={100} label="Link Quality" unit="%" color={lqColor} size={large ? 110 : 80} />
        <ArcGauge value={snr} min={-40} max={40} label="SNR" unit="dB" color={snrColor} size={large ? 110 : 80} />
      </div>
      {large && (
        <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { label: 'Link Quality', value: `${(linkQuality * 100).toFixed(1)}%`, color: lqColor },
            { label: 'SNR', value: `${snr.toFixed(2)} dB`, color: snrColor },
            { label: 'Signal Strength', value: `${(signalStrength * 1000).toFixed(3)} mW`, color: '#10b981' },
            { label: 'Bit Error Rate', value: bitErrorRate === 0 ? '0' : bitErrorRate.toExponential(2), color: berColor },
          ].map(m => (
            <div key={m.label} style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>{m.label}</div>
              <div style={{ fontSize: 20, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: m.color }}>{m.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderUavFleet = (large = false) => (
    <div style={{ padding: large ? '8px 12px' : '8px 10px' }}>
      {uavs.map(uav => {
        const c = { SECURE: '#10b981', DEGRADED: '#f59e0b', CRITICAL: '#ef4444', LOST: '#6b7280' }[uav.linkStatus]
        const isActive = uav.id === activeUavId
        return (
          <div key={uav.id}
            onClick={() => { setActiveUav(uav.id); if (large) setModal(null) }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              marginBottom: large ? 10 : 6,
              padding: large ? '10px 12px' : '6px 8px',
              borderRadius: 10, background: '#f8fafc',
              border: `1.5px solid ${isActive ? uav.color + '88' : '#e2e8f0'}`,
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: uav.color, boxShadow: `0 0 6px ${uav.color}` }} />
            <span style={{ fontSize: large ? 14 : 12, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: uav.color, flexShrink: 0, minWidth: 54 }}>UAV-{uav.id}</span>
            <div style={{ flex: 1, height: large ? 6 : 4, borderRadius: 3, overflow: 'hidden', background: '#e2e8f0' }}>
              <div style={{ width: `${uav.linkQuality * 100}%`, height: '100%', background: c, borderRadius: 3, transition: 'width 0.3s' }} />
            </div>
            <span style={{ fontSize: large ? 12 : 10, fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: c, flexShrink: 0, minWidth: 58, textAlign: 'right' }}>{uav.linkStatus}</span>
            {large && <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'JetBrains Mono', flexShrink: 0 }}>{(uav.linkQuality * 100).toFixed(1)}%</span>}
          </div>
        )
      })}
    </div>
  )

  const renderRfMetrics = (large = false) => (
    <div style={{ padding: large ? '14px 18px' : '10px 12px' }}>
      <LinearBar label="Jamming Effectiveness" value={jammingEffectiveness * 100} max={100}
        color="#a855f7" sub={`${(jammingEffectiveness * 100).toFixed(1)}%`} />
      <LinearBar label="Signal Strength" value={signalStrength * 5000} max={100}
        color="#10b981" sub={`${(signalStrength * 1000).toFixed(3)} mW`} />
      <LinearBar label="Threat Level" value={threatLevel * 100} max={100}
        color={threatCol} sub={`${(threatLevel * 100).toFixed(0)}%`} />
      <div style={{ marginTop: 10, padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: `1px solid ${berColor}55` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>Bit Error Rate</span>
          <span style={{ fontSize: 13, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: berColor }}>
            {bitErrorRate === 0 ? '0' : bitErrorRate.toExponential(1)}
          </span>
        </div>
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
          {bitErrorRate === 0 ? 'Error-free link' : bitErrorRate < 0.001 ? 'Marginal — minor errors' : bitErrorRate < 0.1 ? 'Packet loss detected' : 'Link failure imminent'}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <span style={{ fontSize: 12, color: '#64748b' }}>Sim Time</span>
        <span style={{ fontSize: 13, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#0ea5e9' }}>{time.toFixed(1)}s</span>
      </div>
      {large && (
        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: 'Jamming Effectiveness', value: `${(jammingEffectiveness * 100).toFixed(1)}%`, color: '#a855f7' },
            { label: 'Signal Strength', value: `${(signalStrength * 1000).toFixed(4)} mW`, color: '#10b981' },
            { label: 'Threat Level', value: `${(threatLevel * 100).toFixed(0)}%`, color: threatCol },
            { label: 'Sim Time', value: `${time.toFixed(2)}s`, color: '#0ea5e9' },
          ].map(m => (
            <div key={m.label} style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>{m.label}</div>
              <div style={{ fontSize: 20, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: m.color }}>{m.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderSnrTrend = (large = false) => (
    <div style={{ padding: large ? '10px 12px' : '6px 6px 4px' }}>
      <ResponsiveContainer width="100%" height={large ? 220 : 70}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, left: large ? -10 : -22, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 2" stroke="#f1f5f9" />
          <XAxis dataKey="t" tick={{ fontSize: large ? 10 : 8, fill: '#94a3b8' }} />
          <YAxis domain={[-40, 40]} tick={{ fontSize: large ? 10 : 8, fill: '#94a3b8' }} />
          <RTooltip content={<CustomTooltip />} />
          <ReferenceLine y={10} stroke="#10b981" strokeDasharray="3 3" strokeWidth={0.8}
            label={large ? { value: 'Good', fontSize: 10, fill: '#10b981', position: 'right' } : undefined} />
          <ReferenceLine y={0} stroke="#f59e0b" strokeDasharray="3 3" strokeWidth={0.8}
            label={large ? { value: 'Threshold', fontSize: 10, fill: '#f59e0b', position: 'right' } : undefined} />
          <Line type="monotone" dataKey="snr" name="SNR" stroke={snrColor} strokeWidth={large ? 2.5 : 2}
            dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
      {large && (
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
          {[
            { color: '#10b981', label: 'Good (> 10 dB)' },
            { color: '#f59e0b', label: 'Marginal (0 – 10 dB)' },
            { color: '#ef4444', label: 'Poor (< 0 dB)' },
          ].map(i => (
            <div key={i.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 18, height: 3, borderRadius: 2, background: i.color }} />
              <span style={{ fontSize: 11, color: '#64748b' }}>{i.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* RIGHT PANEL — scrollable container */}
      <div style={{
        flex: 1,
        minHeight: 0,        /* CRITICAL flex scroll fix */
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        scrollBehavior: 'smooth',
      }}>
        <Panel>
          <SH label="Link Status" icon="📡" onExpand={() => setModal('linkStatus')} />
          {renderLinkStatus(false)}
        </Panel>

        <Panel>
          <SH label="UAV Fleet" icon="🚁" onExpand={() => setModal('uavFleet')} />
          {renderUavFleet(false)}
        </Panel>

        <Panel>
          <SH label="RF Metrics" icon="🔬" onExpand={() => setModal('rfMetrics')} />
          {renderRfMetrics(false)}
        </Panel>

        <Panel>
          <SH label="SNR Trend" icon="📈" onExpand={() => setModal('snrTrend')} />
          {renderSnrTrend(false)}
        </Panel>
      </div>

      {/* MODALS */}
      {modal === 'linkStatus' && (
        <SectionModal title="Link Status" icon="📡" onClose={() => setModal(null)}>
          {renderLinkStatus(true)}
        </SectionModal>
      )}
      {modal === 'uavFleet' && (
        <SectionModal title="UAV Fleet" icon="🚁" onClose={() => setModal(null)}>
          {renderUavFleet(true)}
        </SectionModal>
      )}
      {modal === 'rfMetrics' && (
        <SectionModal title="RF Metrics" icon="🔬" onClose={() => setModal(null)}>
          {renderRfMetrics(true)}
        </SectionModal>
      )}
      {modal === 'snrTrend' && (
        <SectionModal title="SNR Trend" icon="📈" onClose={() => setModal(null)}>
          {renderSnrTrend(true)}
        </SectionModal>
      )}
    </>
  )
}
