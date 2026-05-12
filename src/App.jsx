/**
 * App.jsx — Enhanced Root Layout
 */
import React, { Suspense, useState } from 'react'
import ControlPanel       from './components/controls/ControlPanel'
import DataPanel          from './components/charts/DataPanel'
import StatusBar          from './components/ui/StatusBar'
import Scene3D            from './components/scene/Scene3D'
import BottomAnalysis     from './components/charts/BottomAnalysis'
import HowToUseModal      from './components/ui/HowToUseModal'
import RulesModal         from './components/ui/RulesModal'
import { useSimLoop }     from './hooks/useSimLoop'
import { useSimStore }    from './store/simStore'

function SimLoop() { useSimLoop(); return null }

function Legend() {
  const { threatLevel } = useSimStore()
  const threatPct = Math.round(threatLevel * 100)
  const threatCol = threatPct > 70 ? '#ef4444' : threatPct > 40 ? '#f59e0b' : '#10b981'
  const items = [
    { color: '#10b981', label: 'Secure' },
    { color: '#f59e0b', label: 'Degraded' },
    { color: '#ef4444', label: 'Critical' },
    { color: '#a855f7', label: 'Jam Waves' },
    { color: '#0ea5e9', label: 'GCS Range', dashed: true },
    { color: '#a855f7', label: 'Jam Zone',  dashed: true },
  ]
  return (
    <div className="flex-shrink-0 flex items-center gap-4 px-4 py-2"
      style={{ background: '#ffffff', borderTop: '1px solid #e2e8f0', borderRadius: '0 0 10px 10px' }}>
      <span className="text-[10px] font-display font-bold tracking-widest uppercase mr-1" style={{ color: '#94a3b8' }}>LEGEND</span>
      {items.map(item => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div className="w-4 h-2 rounded-sm" style={item.dashed ? { background: 'transparent', border: `1.5px dashed ${item.color}` } : { background: item.color }} />
          <span className="text-[10px] font-medium" style={{ color: '#64748b' }}>{item.label}</span>
        </div>
      ))}
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-medium" style={{ color: '#64748b' }}>Threat</span>
        <div className="w-20 h-2 rounded-full overflow-hidden" style={{ background: '#e2e8f0' }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${threatPct}%`, background: threatCol }} />
        </div>
        <span className="text-[10px] font-mono font-bold" style={{ color: threatCol }}>{threatPct}%</span>
      </div>
      <span className="text-[10px] font-mono hidden lg:block" style={{ color: '#94a3b8' }}>Drag · Scroll · Right-drag</span>
    </div>
  )
}

export default function App() {
  const [showHowTo, setShowHowTo] = useState(false)
  const [showRules, setShowRules] = useState(false)

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#f1f5f9' }}>
      <SimLoop />
      <StatusBar onHowTo={() => setShowHowTo(true)} onRules={() => setShowRules(true)} />

      <div style={{ display: 'flex', gap: 8, padding: '8px 8px 0 8px', height: 'calc(55vh - 36px)', flexShrink: 0 }}>
        <div style={{ width: 240, flexShrink: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <ControlPanel />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
          <Suspense fallback={
            <div className="flex-1 panel flex items-center justify-center" style={{flex:1}}>
              <div className="text-sm font-mono animate-pulse" style={{ color: '#64748b' }}>Initializing 3D renderer…</div>
            </div>
          }>
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }} className="panel">
              <Scene3D />
            </div>
          </Suspense>
          <Legend />
        </div>
        <div style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <DataPanel />
        </div>
      </div>

      <div style={{ flex: 1, padding: '8px', overflow: 'hidden', minHeight: 0 }}>
        <BottomAnalysis />
      </div>

      {/* Footer */}
      <footer style={{
        flexShrink: 0,
        textAlign: 'center',
        padding: '6px 12px',
        borderTop: '1px solid #e2e8f0',
        background: '#f8fafc',
        fontSize: 12,
        color: '#94a3b8',
        fontFamily: 'DM Sans, sans-serif',
        letterSpacing: '0.03em',
      }}>
        Developed by <span style={{ fontWeight: 700, color: '#64748b' }}>DIVIYA SRI S</span>
      </footer>

      {showHowTo && <HowToUseModal onClose={() => setShowHowTo(false)} />}
      {showRules  && <RulesModal   onClose={() => setShowRules(false)}  />}
    </div>
  )
}
