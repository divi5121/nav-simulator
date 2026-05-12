/**
 * BottomAnalysis.jsx — Bottom panel: large graphs + dynamic interpretation
 */
import React, { useMemo } from 'react'
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { useSimStore } from '../../store/simStore'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
      <div style={{ color: '#94a3b8', marginBottom: 4, fontFamily: 'JetBrains Mono, monospace' }}>t = {label}s</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontFamily: 'JetBrains Mono, monospace' }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
        </div>
      ))}
    </div>
  )
}

function ChartCard({ title, icon, children, accentColor = '#0ea5e9' }) {
  return (
    <div style={{
      background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden',
      display: 'flex', flexDirection: 'column', flex: 1,
    }}>
      <div style={{
        padding: '8px 14px', background: '#f8fafc', borderBottom: `2px solid ${accentColor}`,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 12, letterSpacing: '0.1em', color: '#1e293b', textTransform: 'uppercase' }}>{title}</span>
      </div>
      <div style={{ flex: 1, padding: '8px 8px 4px', minHeight: 0 }}>
        {children}
      </div>
    </div>
  )
}

function SimInterpretation({ snr, linkQuality, bitErrorRate, jammingEffectiveness, linkStatus }) {
  const lq = linkQuality * 100
  const je = jammingEffectiveness * 100
  const pl = bitErrorRate * 100

  let mainColor = '#10b981'
  let bgColor   = '#f0fdf4'
  let bdColor   = '#86efac'
  let icon      = '✅'
  let headline  = ''
  let body      = ''
  let advise    = ''

  if (snr >= 20) {
    mainColor = '#10b981'; bgColor = '#f0fdf4'; bdColor = '#86efac'; icon = '✅'
    headline  = 'COMMUNICATION LINK IS EXCELLENT'
    body      = `SNR is ${snr.toFixed(1)} dB — well above the secure threshold of 10 dB. Signal dominates the RF environment with ${lq.toFixed(0)}% link quality. Telemetry, video feed, and command uplink are operating at full capacity.`
    advise    = 'No action required. The jammer has negligible effect at current power and distance settings.'
  } else if (snr >= 10) {
    mainColor = '#10b981'; bgColor = '#f0fdf4'; bdColor = '#86efac'; icon = '🟢'
    headline  = 'COMMUNICATION LINK IS STABLE'
    body      = `SNR is ${snr.toFixed(1)} dB — above the secure threshold of 10 dB. Link quality is ${lq.toFixed(0)}%. Interference is present but manageable. No data loss expected under current conditions.`
    advise    = 'System is secure. Monitor for changes in jammer power or distance.'
  } else if (snr >= 0) {
    mainColor = '#f59e0b'; bgColor = '#fffbeb'; bdColor = '#fde68a'; icon = '⚠️'
    headline  = 'MODERATE INTERFERENCE DETECTED — LINK DEGRADED'
    body      = `SNR has dropped to ${snr.toFixed(1)} dB, below the secure threshold. Link quality is ${lq.toFixed(0)}%. Jamming effectiveness is ${je.toFixed(0)}%. Data packets may be corrupted — expect intermittent command delays and telemetry gaps.`
    advise    = 'Recommended: Enable Frequency Hopping countermeasure or increase GCS TX Power to restore link margin.'
  } else if (snr >= -10) {
    mainColor = '#ef4444'; bgColor = '#fef2f2'; bdColor = '#fca5a5'; icon = '🔴'
    headline  = 'SEVERE JAMMING DETECTED — LINK CRITICAL'
    body      = `SNR is ${snr.toFixed(1)} dB — significantly negative. Jamming power dominates with ${je.toFixed(0)}% effectiveness. Link quality has collapsed to ${lq.toFixed(0)}%. Estimated packet loss: ${pl > 10 ? pl.toFixed(0) + '%' : 'high'}. The UAV may be losing command authority.`
    advise    = 'URGENT: Activate Frequency Hopping + Power Boost immediately. Consider changing GCS distance or jammer frequency mismatch.'
  } else {
    mainColor = '#6b7280'; bgColor = '#f8fafc'; bdColor = '#cbd5e1'; icon = '💀'
    headline  = 'COMMUNICATION LINK LOST — UAV UNCONTROLLED'
    body      = `SNR is ${snr.toFixed(1)} dB — extreme negative value indicating total link failure. The jammer has completely suppressed the GCS signal. The UAV cannot receive commands or transmit telemetry. Link quality: ${lq.toFixed(0)}%.`
    advise    = 'CRITICAL FAILURE: All countermeasures activated. Consider relocating GCS or activating emergency beacon fallback protocol.'
  }

  // Packet loss addendum
  if (pl > 20 && snr >= 0) {
    body += ` Additionally, packet loss is elevated at approximately ${pl.toFixed(1)}%, indicating unreliable data transfer.`
  }

  return (
    <div style={{
      background: bgColor, border: `2px solid ${bdColor}`, borderRadius: 12,
      padding: '14px 20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 14, letterSpacing: '0.08em', color: mainColor, textTransform: 'uppercase' }}>
          SIMULATION INTERPRETATION
        </span>
        <div style={{ marginLeft: 'auto', padding: '3px 12px', background: mainColor + '22', border: `1px solid ${mainColor}66`, borderRadius: 20 }}>
          <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 12, color: mainColor }}>{linkStatus}</span>
        </div>
      </div>
      <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 15, color: mainColor, marginBottom: 6 }}>
        {headline}
      </div>
      <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.65, marginBottom: 8 }}>{body}</div>
      <div style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic', borderTop: `1px solid ${bdColor}`, paddingTop: 6 }}>
        🔧 <strong>Recommended Action:</strong> {advise}
      </div>
    </div>
  )
}

export default function BottomAnalysis() {
  const {
    history, snr, linkQuality, bitErrorRate,
    jammingEffectiveness, linkStatus, spectrum,
  } = useSimStore()

  const snrColor = snr > 10 ? '#10b981' : snr > 0 ? '#f59e0b' : '#ef4444'
  const lqColor  = linkQuality > 0.75 ? '#10b981' : linkQuality > 0.45 ? '#f59e0b' : '#ef4444'

  const chartData = useMemo(() => {
    if (history.length <= 80) return history
    const step = Math.ceil(history.length / 80)
    return history.filter((_, i) => i % step === 0)
  }, [history])

  // Derive packet loss % from BER for the chart
  const chartWithPL = useMemo(() => chartData.map(d => ({
    ...d,
    packetLoss: Math.min(100, d.ber > 0 ? (d.ber > 10 ? 99 : d.ber > 1 ? 60 + d.ber * 3 : d.ber * 20) : 0),
    je: Math.max(0, Math.min(100, 100 - d.lq)),
  })), [chartData])

  const specData = useMemo(() => {
    if (spectrum.length <= 20) return spectrum
    return spectrum.filter((_, i) => i % 2 === 0)
  }, [spectrum])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 8 }}>

      {/* Charts row */}
      <div style={{ display: 'flex', gap: 8, flex: 1, minHeight: 0 }}>

        {/* Signal vs Jamming */}
        <ChartCard title="Signal vs Jamming — Power (mW)" icon="📈" accentColor="#10b981">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -14, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 3" stroke="#f1f5f9" />
              <XAxis dataKey="t" tick={{ fontSize: 9, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} />
              <RTooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="signal"  name="Signal (mW)"  stroke="#10b981" fill="#10b98118" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Area type="monotone" dataKey="jamming" name="Jamming (mW)" stroke="#a855f7" fill="#a855f718" strokeWidth={2} dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* SNR vs Time */}
        <ChartCard title="SNR (dB) vs Time — Link Quality" icon="📊" accentColor={snrColor}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 4, right: 8, left: -14, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 3" stroke="#f1f5f9" />
              <XAxis dataKey="t" tick={{ fontSize: 9, fill: '#94a3b8' }} />
              <YAxis domain={[-40, 40]} tick={{ fontSize: 9, fill: '#94a3b8' }} />
              <RTooltip content={<CustomTooltip />} />
              <ReferenceLine y={20} stroke="#10b981" strokeDasharray="4 2" strokeWidth={1} label={{ value: 'Excellent', position: 'right', fontSize: 9, fill: '#10b981' }} />
              <ReferenceLine y={10} stroke="#34d399" strokeDasharray="4 2" strokeWidth={1} label={{ value: 'Secure', position: 'right', fontSize: 9, fill: '#34d399' }} />
              <ReferenceLine y={0}  stroke="#f59e0b" strokeDasharray="4 2" strokeWidth={1} label={{ value: 'Degrade', position: 'right', fontSize: 9, fill: '#f59e0b' }} />
              <ReferenceLine y={-10} stroke="#ef4444" strokeDasharray="4 2" strokeWidth={1} label={{ value: 'Critical', position: 'right', fontSize: 9, fill: '#ef4444' }} />
              <Line type="monotone" dataKey="snr" name="SNR (dB)" stroke={snrColor} strokeWidth={2.5} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Jamming Effectiveness */}
        <ChartCard title="Jamming Effect vs Packet Loss" icon="📉" accentColor="#a855f7">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartWithPL} margin={{ top: 4, right: 8, left: -14, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 3" stroke="#f1f5f9" />
              <XAxis dataKey="t" tick={{ fontSize: 9, fill: '#94a3b8' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#94a3b8' }} unit="%" />
              <RTooltip content={<CustomTooltip />} />
              <ReferenceLine y={70} stroke="#a855f7" strokeDasharray="3 3" strokeWidth={0.8} />
              <Area type="monotone" dataKey="je"         name="Jam Effect %"  stroke="#a855f7" fill="#a855f718" strokeWidth={1.5} dot={false} isAnimationActive={false} />
              <Area type="monotone" dataKey="packetLoss" name="Packet Loss %"  stroke="#ef4444" fill="#ef444418" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Frequency Spectrum */}
        <ChartCard title="Frequency Spectrum — RF Band" icon="〰️" accentColor="#0ea5e9">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={specData} margin={{ top: 4, right: 8, left: -14, bottom: 0 }} barGap={0} barCategoryGap="0%">
              <CartesianGrid strokeDasharray="2 3" stroke="#f1f5f9" />
              <XAxis dataKey="freq" tick={{ fontSize: 8, fill: '#94a3b8' }} interval={4} />
              <YAxis tick={{ fontSize: 8, fill: '#94a3b8' }} />
              <RTooltip content={<CustomTooltip />} />
              <Bar dataKey="signal"  name="Signal"  fill="#10b981" opacity={0.85} isAnimationActive={false} />
              <Bar dataKey="jamming" name="Jamming" fill="#a855f7" opacity={0.85} isAnimationActive={false} />
              <Bar dataKey="noise"   name="Noise"   fill="#ef4444" opacity={0.45} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Interpretation panel */}
      <div style={{ flexShrink: 0 }}>
        <SimInterpretation
          snr={snr}
          linkQuality={linkQuality}
          bitErrorRate={bitErrorRate}
          jammingEffectiveness={jammingEffectiveness}
          linkStatus={linkStatus}
        />
      </div>
    </div>
  )
}
