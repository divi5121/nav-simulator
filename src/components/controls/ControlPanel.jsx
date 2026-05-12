/**
 * ControlPanel.jsx — Left sidebar with all simulation controls
 * Enhanced: larger fonts, better spacing, improved contrast
 */
import React, { useState } from 'react'
import { useSimStore } from '../../store/simStore'

const Tip = ({ children, text }) => (
  <span className="tooltip inline-flex items-center gap-0.5 cursor-default">
    {children}
    <span style={{ fontSize: 10, opacity: 0.5, marginLeft: 2 }}>ⓘ</span>
    <span className="tooltip-content">{text}</span>
  </span>
)

const Slider = ({ label, value, min, max, step = 1, onChange, unit = '', tip, color = '#0ea5e9' }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
        {tip ? <Tip text={tip}>{label}</Tip> : label}
      </span>
      <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color }}>
        {typeof value === 'number' ? (Number.isInteger(value) ? value : value.toFixed(2)) : value}{unit}
      </span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value}
      onChange={e => onChange(e.target.value)}
      style={{ accentColor: color }} />
  </div>
)

function Btn({ label, active, onClick, color = '#0ea5e9', sm }) {
  return (
    <button onClick={onClick} style={{
      padding: sm ? '4px 10px' : '6px 12px',
      fontSize: sm ? 11 : 12,
      fontFamily: 'Rajdhani, sans-serif',
      fontWeight: 700,
      letterSpacing: '0.05em',
      borderRadius: 6,
      border: `1.5px solid ${active ? color : '#d1d5db'}`,
      background: active ? color + '20' : '#fafafa',
      color: active ? color : '#64748b',
      cursor: 'pointer',
      transition: 'all 0.15s',
    }}>
      {label}
    </button>
  )
}

const Card = ({ title, icon, children, accent }) => (
  <div className="panel" style={{ marginBottom: 8, ...(accent ? { borderLeft: `3px solid ${accent}` } : {}) }}>
    <div className="panel-header">{icon && <span>{icon}</span>} {title}</div>
    <div style={{ padding: '10px 12px' }}>{children}</div>
  </div>
)

const Section = ({ label }) => (
  <div style={{
    fontSize: 10, fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
    letterSpacing: '0.1em', textTransform: 'uppercase',
    color: '#94a3b8', borderBottom: '1px solid #e2e8f0',
    paddingBottom: 4, marginBottom: 8, marginTop: 12,
  }}>
    {label}
  </div>
)

const evColour = {
  SECURE: '#10b981', DEGRADED: '#f59e0b', CRITICAL: '#ef4444',
  LOST: '#6b7280', ECM: '#a855f7', OK: '#0ea5e9',
}

export default function ControlPanel() {
  const [tab, setTab] = useState('controls')

  const {
    running, toggle, reset,
    scenario, setScenario,
    perfMode, setPerfMode,
    viewMode, setViewMode,
    gcsPower, setGcsPower,
    jammerPower, setJammerPower,
    distGCS, setDistGCS,
    distJammer, setDistJammer,
    freqMatch, setFreqMatch,
    jammingType, setJammingType,
    directional, setDirectional,
    jamBearing, setJamBearing,
    noiseLevel, setNoiseLevel,
    countermeasures, setCountermeasure,
    realism, setRealism,
    autoCountermeasure, setAutoCountermeasure,
    missionMode, toggleMission,
    missionPhase, missionScore,
    events, threatLevel,
    linkStatus, linkQuality, snr,
    uavs, activeUavId, setUavRadius, setUavSpeed,
  } = useSimStore()

  const threatPct   = Math.round(threatLevel * 100)
  const threatColor = threatPct > 70 ? '#ef4444' : threatPct > 40 ? '#f59e0b' : '#10b981'
  const statusColor = { SECURE:'#10b981', DEGRADED:'#f59e0b', CRITICAL:'#ef4444', LOST:'#6b7280' }[linkStatus]

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ flexShrink: 0, marginBottom: 8 }}>
        <div className="panel" style={{ padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 17, letterSpacing: '0.06em', color: '#1e293b' }}>
                UAV JAM SIM
              </div>
              <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', marginTop: 2, color: '#64748b' }}>RF Interference Simulator v2</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={toggle} style={{
                padding: '6px 10px', fontSize: 14, fontWeight: 700, borderRadius: 7,
                border: `2px solid ${running ? '#059669' : '#d97706'}`,
                background: running ? '#05966922' : '#d9770622',
                color: running ? '#059669' : '#d97706', cursor: 'pointer',
              }}>{running ? '⏸' : '▶'}</button>
              <button onClick={reset} style={{
                padding: '6px 10px', fontSize: 14, fontWeight: 700, borderRadius: 7,
                border: '2px solid #d1d5db', background: '#f8fafc', color: '#64748b', cursor: 'pointer',
              }}>↺</button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: statusColor, boxShadow: `0 0 6px ${statusColor}` }} />
            <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', color: statusColor }}>
              {linkStatus}
            </span>
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#64748b' }}>
              {(linkQuality * 100).toFixed(0)}% LQ
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: '0.08em', color: '#94a3b8' }}>THREAT</span>
            <div style={{ flex: 1, height: 5, borderRadius: 3, background: '#e2e8f0' }}>
              <div style={{ height: '100%', borderRadius: 3, transition: 'all 0.3s', width: `${threatPct}%`, background: threatColor }} />
            </div>
            <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: threatColor }}>{threatPct}%</span>
          </div>
        </div>
      </div>

      {/* Scenario */}
      <div style={{ flexShrink: 0, marginBottom: 8 }}>
        <div className="panel" style={{ padding: '10px 12px' }}>
          <div style={{ fontSize: 10, fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 8 }}>
            SCENARIO
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            {['open', 'urban', 'battlefield'].map(s => (
              <Btn key={s} label={s.toUpperCase()} active={scenario === s}
                onClick={() => setScenario(s)}
                color={s === 'open' ? '#10b981' : s === 'urban' ? '#f59e0b' : '#ef4444'} sm />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <Btn label="2D" active={viewMode === '2d'} onClick={() => setViewMode('2d')} color="#0ea5e9" sm />
            <Btn label="3D" active={viewMode === '3d'} onClick={() => setViewMode('3d')} color="#0ea5e9" sm />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ flexShrink: 0, display: 'flex', gap: 4, marginBottom: 8 }}>
        {['controls', 'ecm', 'events', 'mission'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '5px 0', fontSize: 10,
            fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            borderRadius: 6, border: `1.5px solid ${tab === t ? '#0284c7' : '#d1d5db'}`,
            background: tab === t ? '#0284c720' : '#ffffff',
            color: tab === t ? '#0284c7' : '#64748b', cursor: 'pointer',
          }}>
            {t}
          </button>
        ))}
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* CONTROLS */}
        {tab === 'controls' && (
          <div>
            <Card title="GCS Transmitter" icon="📡" accent="#0ea5e9">
              <Slider label="TX Power" value={gcsPower} min={1} max={50} step={0.5}
                onChange={setGcsPower} unit="W" color="#0ea5e9"
                tip="Ground Control Station transmit power. Higher = longer range." />
              <Slider label="GCS Distance" value={distGCS} min={2} max={30} step={0.5}
                onChange={setDistGCS} unit=" u" color="#0ea5e9"
                tip="Distance from GCS to UAV orbit centre. S = Pt/d²" />
            </Card>

            <Card title="Jammer" icon="📻" accent="#a855f7">
              <Slider label="Jam Power" value={jammerPower} min={0} max={150} step={1}
                onChange={setJammerPower} unit="W" color="#a855f7"
                tip="Jammer transmit power. J = Pj/dj²" />
              <Slider label="Jammer Distance" value={distJammer} min={1} max={30} step={0.5}
                onChange={setDistJammer} unit=" u" color="#a855f7"
                tip="Distance from jammer to UAV orbit centre." />

              <Section label="Jamming Type" />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
                {['noise', 'spot', 'barrage', 'deception'].map(t => (
                  <Btn key={t} label={t} active={jammingType === t}
                    onClick={() => setJammingType(t)} color="#a855f7" sm />
                ))}
              </div>

              <Section label="Frequency Match" />
              <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
                {['match', 'partial', 'mismatch'].map(f => (
                  <Btn key={f} label={f} active={freqMatch === f}
                    onClick={() => setFreqMatch(f)}
                    color={f === 'match' ? '#ef4444' : f === 'partial' ? '#f59e0b' : '#10b981'} sm />
                ))}
              </div>

              <Section label="Antenna Mode" />
              <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
                <Btn label="Omni" active={!directional} onClick={() => setDirectional(false)} color="#a855f7" sm />
                <Btn label="Directional" active={directional} onClick={() => setDirectional(true)} color="#ef4444" sm />
              </div>
              {directional && (
                <Slider label="Bearing" value={(jamBearing * 180 / Math.PI).toFixed(0)} min={-180} max={180} step={1}
                  onChange={v => setJamBearing(Number(v) * Math.PI / 180)} unit="°" color="#a855f7"
                  tip="Direction jammer antenna points. UAVs inside ±30° cone get 2× jamming." />
              )}

              <Slider label="Noise Level" value={noiseLevel} min={0} max={3} step={0.05}
                onChange={setNoiseLevel} unit="×" color="#ef4444"
                tip="Manual noise floor multiplier. 1.0 = normal, 3.0 = very noisy RF env." />
            </Card>

            <Card title="UAV Fleet" icon="🚁">
              {uavs.map(uav => (
                <div key={uav.id} style={{ marginBottom: 12, padding: 8, borderRadius: 8, background: '#f8fafc', border: `1.5px solid ${uav.color}55` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: uav.color }} />
                    <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: uav.color }}>UAV-{uav.id}</span>
                    <span style={{ fontSize: 11, fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, marginLeft: 'auto', color: { SECURE:'#10b981', DEGRADED:'#f59e0b', CRITICAL:'#ef4444', LOST:'#6b7280' }[uav.linkStatus] }}>
                      {uav.linkStatus}
                    </span>
                  </div>
                  <Slider label="Orbit Radius" value={uav.radius} min={3} max={20} step={0.5}
                    onChange={v => setUavRadius(uav.id, v)} unit=" u" color={uav.color} />
                  <Slider label="Speed" value={uav.speed} min={0.05} max={1.0} step={0.01}
                    onChange={v => setUavSpeed(uav.id, v)} unit="×" color={uav.color} />
                </div>
              ))}
            </Card>

            <Card title="Performance" icon="⚙️">
              <div style={{ display: 'flex', gap: 5, marginBottom: 8 }}>
                {['low', 'medium', 'high'].map(m => (
                  <Btn key={m} label={m} active={perfMode === m} onClick={() => setPerfMode(m)} color="#0ea5e9" sm />
                ))}
              </div>
              <div style={{ display: 'flex', gap: 5 }}>
                <Btn label="Realism" active={realism} onClick={() => setRealism(!realism)} color="#f59e0b" sm />
              </div>
            </Card>
          </div>
        )}

        {/* ECM */}
        {tab === 'ecm' && (
          <div>
            <Card title="Countermeasures" icon="🛡️" accent="#10b981">
              <div style={{ fontSize: 12, marginBottom: 12, lineHeight: 1.6, color: '#64748b' }}>
                Electronic Counter-Measures protect the UAV datalink from jamming. Each trades complexity for effectiveness.
              </div>
              {[
                { key: 'freqHopping', label: 'Frequency Hopping', desc: 'Rapidly switches carrier frequency faster than jammer can track. Reduces jamming by 82%.', color: '#10b981' },
                { key: 'encryption',  label: 'Spread Spectrum',   desc: 'Spreads signal energy over wide bandwidth. Improves SNR threshold. Reduces J by 32%.', color: '#0284c7' },
                { key: 'powerBoost',  label: 'Power Amplifier',   desc: 'Boosts GCS TX power by 2.5×. Burns more battery but restores link margin.', color: '#f59e0b' },
              ].map(cm => (
                <div key={cm.key} style={{ marginBottom: 10, padding: 10, borderRadius: 8, background: '#f8fafc', border: `1.5px solid ${countermeasures[cm.key] ? cm.color + '55' : '#e2e8f0'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', color: countermeasures[cm.key] ? cm.color : '#94a3b8' }}>{cm.label}</span>
                    <Btn label={countermeasures[cm.key] ? 'ON' : 'OFF'} active={countermeasures[cm.key]}
                      onClick={() => setCountermeasure(cm.key, !countermeasures[cm.key])} color={cm.color} sm />
                  </div>
                  <p style={{ fontSize: 11, lineHeight: 1.5, color: '#64748b', margin: 0 }}>{cm.desc}</p>
                </div>
              ))}
              <div style={{ marginTop: 10, padding: 10, borderRadius: 8, background: '#f8fafc', border: `1.5px solid ${autoCountermeasure ? '#a855f7' : '#e2e8f0'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', color: autoCountermeasure ? '#a855f7' : '#94a3b8' }}>Auto-ECM Mode</span>
                  <Btn label={autoCountermeasure ? 'ON' : 'OFF'} active={autoCountermeasure}
                    onClick={() => setAutoCountermeasure(!autoCountermeasure)} color="#a855f7" sm />
                </div>
                <p style={{ fontSize: 11, lineHeight: 1.5, color: '#64748b', margin: 0 }}>AI automatically activates countermeasures when link quality drops below thresholds.</p>
              </div>
            </Card>

            <Card title="RF Environment" icon="📊">
              {[
                { label: 'Signal (S)',   val: (useSimStore.getState().signalStrength * 1000).toFixed(3), unit: ' mW', color: '#10b981' },
                { label: 'Jamming (J)', val: (useSimStore.getState().jammingStrength * 1000).toFixed(3), unit: ' mW', color: '#a855f7' },
                { label: 'SNR',         val: `${snr.toFixed(1)}`, unit: ' dB', color: snr >= 10 ? '#10b981' : snr >= 0 ? '#f59e0b' : '#ef4444' },
                { label: 'Link Quality', val: `${(linkQuality * 100).toFixed(1)}`, unit: '%', color: '#0284c7' },
              ].map(m => (
                <div key={m.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{m.label}</span>
                  <span style={{ fontSize: 13, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: m.color }}>{m.val}{m.unit}</span>
                </div>
              ))}
            </Card>
          </div>
        )}

        {/* EVENTS */}
        {tab === 'events' && (
          <div>
            <Card title="Event Log" icon="📋">
              {useSimStore.getState().events.length === 0 && (
                <div style={{ fontSize: 12, textAlign: 'center', padding: '16px 0', color: '#64748b' }}>No events yet…</div>
              )}
              {useSimStore.getState().events.slice(0, 20).map((ev) => (
                <div key={ev.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }} className="fade-in">
                  <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: '#94a3b8', marginTop: 2, flexShrink: 0 }}>{ev.t}s</span>
                  <span style={{ fontSize: 12, lineHeight: 1.5, color: evColour[ev.type] || '#475569' }}>{ev.msg}</span>
                </div>
              ))}
            </Card>
          </div>
        )}

        {/* MISSION */}
        {tab === 'mission' && (
          <div>
            <Card title="Mission Mode" icon="🎯" accent={missionMode ? '#f59e0b' : undefined}>
              <div style={{ fontSize: 12, marginBottom: 12, lineHeight: 1.6, color: '#64748b' }}>
                In mission mode the jammer automatically escalates power every 10 seconds. Keep all UAV links alive to maintain score.
              </div>
              <Btn label={missionMode ? 'ABORT MISSION' : 'START MISSION'}
                active={missionMode} onClick={toggleMission}
                color={missionMode ? '#ef4444' : '#10b981'} />

              {missionMode && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: '#64748b' }}>Score</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 16, color: missionScore > 70 ? '#10b981' : missionScore > 40 ? '#f59e0b' : '#ef4444' }}>
                      {missionScore.toFixed(0)}
                    </span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, marginBottom: 14, background: '#e2e8f0' }}>
                    <div style={{ height: '100%', borderRadius: 4, transition: 'all 0.3s', width: `${missionScore}%`, background: missionScore > 70 ? '#10b981' : missionScore > 40 ? '#f59e0b' : '#ef4444' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: '#64748b' }}>Phase</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 14, color: '#f59e0b' }}>{missionPhase}/5</span>
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
                    {[0,1,2,3,4].map(i => (
                      <div key={i} style={{ flex: 1, height: 6, borderRadius: 3, background: i <= missionPhase ? '#d97706' : '#e2e8f0' }} />
                    ))}
                  </div>
                  <div style={{ padding: 10, borderRadius: 8, textAlign: 'center', background: '#fef3c7', border: '1px solid #fde68a' }}>
                    <div style={{ fontSize: 11, color: '#92400e' }}>Jammer Power</div>
                    <div style={{ fontSize: 18, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#dc2626' }}>
                      {(8 + missionPhase * 16).toFixed(0)}W
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
