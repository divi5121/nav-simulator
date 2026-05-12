/**
 * HowToUseModal.jsx — Beginner-friendly guide modal
 */
import React from 'react'

const Step = ({ num, title, desc }) => (
  <div style={{ display: 'flex', gap: 16, marginBottom: 18 }}>
    <div style={{
      width: 32, height: 32, borderRadius: '50%', background: '#0ea5e9',
      color: '#fff', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
      fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>{num}</div>
    <div>
      <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 15, color: '#1e293b', marginBottom: 3 }}>{title}</div>
      <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>{desc}</div>
    </div>
  </div>
)

const CtrlRow = ({ label, desc, color = '#1e293b' }) => (
  <div style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'flex-start' }}>
    <div style={{ minWidth: 130, fontWeight: 700, fontSize: 13, color, fontFamily: 'Rajdhani, sans-serif' }}>{label}</div>
    <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, flex: 1 }}>{desc}</div>
  </div>
)

const ColorCue = ({ color, label, desc }) => (
  <div style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'center' }}>
    <div style={{ width: 14, height: 14, borderRadius: '50%', background: color, flexShrink: 0, boxShadow: `0 0 8px ${color}88` }} />
    <div style={{ flex: 1 }}>
      <span style={{ fontWeight: 700, fontSize: 13, color: '#1e293b', fontFamily: 'Rajdhani, sans-serif' }}>{label}</span>
      <span style={{ fontSize: 13, color: '#64748b' }}> — {desc}</span>
    </div>
  </div>
)

const SectionTitle = ({ icon, title }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, marginTop: 24, paddingBottom: 8, borderBottom: '2px solid #e2e8f0' }}>
    <span style={{ fontSize: 18 }}>{icon}</span>
    <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 16, letterSpacing: '0.08em', color: '#1e293b', textTransform: 'uppercase' }}>{title}</span>
  </div>
)

export default function HowToUseModal({ onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)',
    }} onClick={onClose}>
      <div style={{
        background: '#ffffff', borderRadius: 16, width: 680, maxHeight: '88vh',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 80px rgba(0,0,0,0.25)',
        border: '1px solid #e2e8f0',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '20px 28px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc' }}>
          <div>
            <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 22, color: '#1e293b', letterSpacing: '0.06em' }}>📖 HOW TO USE THIS SIMULATOR</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>A step-by-step guide to UAV RF Jamming Simulation</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 18, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px 28px 28px' }}>

          <SectionTitle icon="🚀" title="Quick Start — 4 Steps" />
          <Step num={1} title="Select a Scenario"
            desc="Choose from OPEN (clear sky, low jamming), URBAN (multi-path interference), or BATTLEFIELD (intense, directed jamming). Each preset configures power levels, distances, and jamming type automatically. Find the Scenario buttons in the LEFT CONTROL PANEL." />
          <Step num={2} title="Adjust Signal & Jammer Parameters"
            desc="Use the sliders to tune TX Power (GCS transmitter), Jammer Power, and their distances from the UAV. Higher TX Power improves the communication link. Higher Jammer Power increases interference. The LEFT PANEL has all controls." />
          <Step num={3} title="Observe 3D Metrics in Real-Time"
            desc="Watch the 3D canvas in the CENTER — UAVs orbit and their link status is shown by color. The RIGHT PANEL shows live gauges for SNR and Link Quality, plus a UAV fleet overview with status per drone." />
          <Step num={4} title="Analyze the Graphs Below"
            desc="The BOTTOM ANALYSIS PANEL shows Signal vs Time, SNR vs Time, Jamming Effect, and Packet Loss graphs. The Simulation Interpretation box auto-updates with a plain-English explanation of current conditions." />

          <SectionTitle icon="🎛️" title="Control Reference" />
          <CtrlRow label="TX Power (W)" desc="Transmit power of the Ground Control Station (GCS). Higher values increase signal strength at the UAV. Typical range: 1–50W. Effect: S = Pt / d² (Friis free-space)." color="#0ea5e9" />
          <CtrlRow label="GCS Distance (u)" desc="Simulated distance from GCS to the UAV orbit centre. Longer distance weakens signal. Range: 2–30 units." color="#0ea5e9" />
          <CtrlRow label="Jammer Power (W)" desc="Power output of the RF jammer. Higher values increase interference received by the UAV. Range: 0–150W." color="#a855f7" />
          <CtrlRow label="Jammer Distance (u)" desc="Distance from the jammer to the UAV. Closer jammer = more effective. Same inverse-square attenuation applies." color="#a855f7" />
          <CtrlRow label="Frequency Match" desc="MATCH: Jammer is tuned to the same frequency — maximum interference. PARTIAL: Slight offset, bleed-through. MISMATCH: Different band, minimal effect." color="#ef4444" />
          <CtrlRow label="Jamming Type" desc="NOISE: Wideband flood. SPOT: Concentrated on one freq (×1.6). BARRAGE: Spread across all bands (×0.8). DECEPTION: Fake signals (×1.35). Each shows differently on the Spectrum chart." color="#a855f7" />
          <CtrlRow label="Directional Antenna" desc="When ON, jammer focuses power in a ±30° cone (2× gain inside cone, 0.2× outside). Rotate bearing to aim at a UAV." color="#ef4444" />
          <CtrlRow label="Noise Level (×)" desc="Manual multiplier for ambient RF noise floor. 1.0 = normal. 3.0 = very noisy RF environment (urban, industrial)." color="#ef4444" />
          <CtrlRow label="Countermeasures" desc="Freq Hopping: Switches carrier fast — reduces jamming by 82%. Spread Spectrum: Widens bandwidth — reduces J by 32%. Power Amplifier: Boosts GCS by 2.5×." color="#10b981" />

          <SectionTitle icon="🎨" title="Visual Cues" />
          <ColorCue color="#10b981" label="Green (UAV / Link)" desc="Link is SECURE. SNR ≥ 10 dB and Link Quality ≥ 75%. Communication is reliable." />
          <ColorCue color="#f59e0b" label="Amber / Yellow" desc="Link is DEGRADED. SNR 0–10 dB. Data transfer is possible but with errors." />
          <ColorCue color="#ef4444" label="Red" desc="Link is CRITICAL or LOST. SNR < 0 dB. UAV may become uncontrolled." />
          <ColorCue color="#a855f7" label="Purple waves" desc="Active jamming signal radiating from the jammer node." />
          <ColorCue color="#0ea5e9" label="Blue dashed ring" desc="GCS communication range boundary." />

          <div style={{ marginTop: 20, padding: '14px 16px', background: '#f0f9ff', borderRadius: 10, border: '1px solid #bae6fd' }}>
            <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 14, color: '#0369a1', marginBottom: 6 }}>💡 PRO TIP</div>
            <div style={{ fontSize: 13, color: '#0c4a6e', lineHeight: 1.6 }}>
              Enable <strong>Auto-ECM Mode</strong> (in the ECM tab of the left panel) to let the simulator automatically activate countermeasures when link quality drops. This is great for observing how electronic warfare systems respond under threat escalation.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
