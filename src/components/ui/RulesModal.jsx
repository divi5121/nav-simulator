/**
 * RulesModal.jsx — Rules, input ranges, expected behaviours, and graph interpretation
 */
import React from 'react'

const SectionTitle = ({ icon, title, color = '#1e293b' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, marginTop: 22, paddingBottom: 8, borderBottom: '2px solid #e2e8f0' }}>
    <span style={{ fontSize: 18 }}>{icon}</span>
    <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 16, letterSpacing: '0.08em', color, textTransform: 'uppercase' }}>{title}</span>
  </div>
)

const RangeRow = ({ param, range, effect, color = '#1e293b' }) => (
  <div style={{ display: 'flex', gap: 0, marginBottom: 8, fontSize: 13 }}>
    <div style={{ width: 160, fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', color, flexShrink: 0, fontSize: 13 }}>{param}</div>
    <div style={{ width: 160, color: '#475569', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, flexShrink: 0 }}>{range}</div>
    <div style={{ color: '#64748b', lineHeight: 1.5 }}>{effect}</div>
  </div>
)

const BehaviourCard = ({ condition, result, type }) => {
  const bg = type === 'good' ? '#f0fdf4' : type === 'bad' ? '#fef2f2' : '#fffbeb'
  const border = type === 'good' ? '#86efac' : type === 'bad' ? '#fca5a5' : '#fde68a'
  const icon = type === 'good' ? '✅' : type === 'bad' ? '🔴' : '⚠️'
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: '12px 16px', marginBottom: 10 }}>
      <div style={{ fontSize: 13, color: '#374151', marginBottom: 4 }}><strong>Condition:</strong> {condition}</div>
      <div style={{ fontSize: 13, color: '#374151' }}>{icon} <strong>Result:</strong> {result}</div>
    </div>
  )
}

const GraphRow = ({ chart, meaning, good, bad }) => (
  <div style={{ marginBottom: 16, padding: '14px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
    <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 14, color: '#1e293b', marginBottom: 6 }}>📈 {chart}</div>
    <div style={{ fontSize: 13, color: '#475569', marginBottom: 8, lineHeight: 1.6 }}>{meaning}</div>
    <div style={{ display: 'flex', gap: 12 }}>
      <div style={{ flex: 1, padding: '8px 12px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #86efac', fontSize: 12, color: '#166534' }}>
        <strong>GOOD:</strong> {good}
      </div>
      <div style={{ flex: 1, padding: '8px 12px', background: '#fef2f2', borderRadius: 8, border: '1px solid #fca5a5', fontSize: 12, color: '#991b1b' }}>
        <strong>CONCERN:</strong> {bad}
      </div>
    </div>
  </div>
)

const SNRRule = ({ range, label, color, desc }) => (
  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10, padding: '10px 14px', borderRadius: 8, background: '#f8fafc', border: `2px solid ${color}44` }}>
    <div style={{ width: 90, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 13, color, flexShrink: 0 }}>{range}</div>
    <div style={{ width: 80, fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', fontSize: 14, color, flexShrink: 0 }}>{label}</div>
    <div style={{ fontSize: 13, color: '#64748b' }}>{desc}</div>
  </div>
)

export default function RulesModal({ onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)',
    }} onClick={onClose}>
      <div style={{
        background: '#ffffff', borderRadius: 16, width: 720, maxHeight: '88vh',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 80px rgba(0,0,0,0.25)',
        border: '1px solid #e2e8f0',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '20px 28px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc' }}>
          <div>
            <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 22, color: '#1e293b', letterSpacing: '0.06em' }}>📊 RULES & ANALYSIS GUIDE</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Input ranges, expected behaviour, and graph interpretation</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 18, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px 28px 28px' }}>

          <SectionTitle icon="📡" title="Input Ranges & Parameters" />
          <div style={{ marginBottom: 6, display: 'flex', gap: 0, fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em' }}>
            <div style={{ width: 160 }}>PARAMETER</div>
            <div style={{ width: 160 }}>RANGE</div>
            <div>EFFECT</div>
          </div>
          <RangeRow param="TX Power (GCS)" range="1 – 50 W" effect="Signal strength at UAV. Doubles link margin every +3 dB. High power counters jamming but draws more battery." color="#0ea5e9" />
          <RangeRow param="Jamming Power" range="0 – 150 W" effect="Interference received at UAV. Values above ~60W can break a 10W GCS link at close range." color="#a855f7" />
          <RangeRow param="GCS Distance" range="2 – 30 u" effect="Distance from GCS to UAV. Signal ∝ 1/d². At 20u, even 50W GCS has weak signal." color="#0ea5e9" />
          <RangeRow param="Jammer Distance" range="1 – 30 u" effect="Distance from jammer to UAV. Halving distance quadruples jamming power." color="#a855f7" />
          <RangeRow param="Frequency" range="Match / Partial / Mismatch" effect="Full match: 100% jamming effectiveness. Partial: 55%. Mismatch: 12%. Frequency hopping forces mismatch." color="#ef4444" />
          <RangeRow param="Noise Level" range="0 – 3×" effect="Ambient RF noise multiplier. Above 1.5× begins to degrade link even without a jammer." color="#64748b" />

          <SectionTitle icon="📊" title="Expected System Behaviour" />
          <BehaviourCard
            type="good"
            condition="High GCS power (≥20W) + Low jammer power (≤20W) + Frequency mismatch"
            result="Strong, stable communication link. SNR typically exceeds 20 dB. UAV shows GREEN. Packet loss near zero." />
          <BehaviourCard
            type="warn"
            condition="Moderate jammer power (40–70W) at medium distance + Frequency partial match"
            result="Degraded link. SNR drops to 0–10 dB. UAV shows AMBER. Data corruption begins. Enable countermeasures." />
          <BehaviourCard
            type="bad"
            condition="High jammer power (≥80W) + Close distance (≤5u) + Frequency match + Spot jamming"
            result="Severe link loss. SNR goes negative. UAV becomes CRITICAL/LOST (red). Use Freq Hopping immediately." />
          <BehaviourCard
            type="good"
            condition="Any jamming + Frequency Hopping countermeasure enabled"
            result="Jamming reduced by 82%. Even high-power jammers become ineffective. SNR recovers significantly." />
          <BehaviourCard
            type="warn"
            condition="Directional antenna enabled + UAV within ±30° cone"
            result="Jamming power doubled inside the beam. UAV must maneuver outside cone or activate countermeasures." />

          <SectionTitle icon="📉" title="Graph Interpretation" />
          <GraphRow
            chart="Signal vs Time"
            meaning="Shows GCS signal strength (green) and jamming interference (purple) arriving at the UAV over time. The gap between signal and jamming lines represents the link margin."
            good="Signal line stays above jamming line. Wide gap = reliable link."
            bad="Jamming line rises above signal. Lines crossing = link failure imminent." />
          <GraphRow
            chart="SNR (dB) vs Time"
            meaning="Signal-to-Noise Ratio in decibels. The most important single metric for link quality. Green reference line at +10 dB = secure threshold. Amber at 0 dB = degrade threshold."
            good="SNR above green line (10 dB). Link is reliable."
            bad="SNR below amber line (0 dB). Severe interference — expect data loss." />
          <GraphRow
            chart="Jamming Effectiveness"
            meaning="Percentage of received RF energy that comes from the jammer vs total. 0% = no jamming. 100% = jammer completely dominates the band."
            good="Below 25%. Signal dominates the band."
            bad="Above 70%. Jammer dominates. Communication unreliable." />
          <GraphRow
            chart="Packet Loss %"
            meaning="Estimated data packet loss rate derived from Bit Error Rate. Reflects how many data packets are dropped due to RF interference."
            good="Near 0%. Error-free telemetry and command link."
            bad="Above 10%. Command delay and data gaps. Above 50% = link failure." />

          <SectionTitle icon="📌" title="SNR Decision Rules" color="#0369a1" />
          <SNRRule range="SNR > 20 dB" label="EXCELLENT" color="#10b981" desc="Link is strong. Full telemetry, video, and command bandwidth available." />
          <SNRRule range="SNR 10–20 dB" label="GOOD" color="#34d399" desc="Secure link. Reliable command and control. Minor noise, no data loss." />
          <SNRRule range="SNR 0–10 dB" label="MODERATE" color="#f59e0b" desc="Degraded link. Some packet loss possible. Activate countermeasures." />
          <SNRRule range="SNR −10–0 dB" label="CRITICAL" color="#ef4444" desc="Severe interference. High packet loss. Command link at risk of failure." />
          <SNRRule range="SNR < −10 dB" label="LOST" color="#6b7280" desc="Link lost. UAV is uncontrolled. Jammer dominates the entire band." />

          <div style={{ marginTop: 20, padding: '14px 16px', background: '#faf5ff', borderRadius: 10, border: '1px solid #d8b4fe' }}>
            <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 14, color: '#7c3aed', marginBottom: 6 }}>⚡ ELECTRONIC WARFARE PRINCIPLE</div>
            <div style={{ fontSize: 13, color: '#4c1d95', lineHeight: 1.7 }}>
              The fundamental EW equation is: <strong style={{ fontFamily: 'JetBrains Mono, monospace' }}>SNR = 10 × log₁₀(S / (Noise + J))</strong>. To win the link, either increase S (power boost, reduce GCS distance) or reduce J (frequency hopping, directional evasion, encryption). Frequency hopping remains the single most effective countermeasure, reducing J by 82%.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
