# UAV RF Jamming Simulator v2 — Enhanced Edition

## 🚀 Quick Start

```bash
npm install
npm run dev
```
Open http://localhost:5173 in your browser.

## 📁 Project Structure

```
src/
├── App.jsx                          # Root layout (3-panel + bottom analysis)
├── main.jsx                         # React entry point
├── index.css                        # Global styles
├── store/simStore.js                # Zustand simulation state & RF physics
├── hooks/useSimLoop.js              # RAF-driven sim tick
└── components/
    ├── controls/ControlPanel.jsx    # Left panel — all controls & sliders
    ├── charts/
    │   ├── DataPanel.jsx            # Right panel — live metrics & gauges
    │   └── BottomAnalysis.jsx       # Bottom panel — graphs + interpretation
    ├── scene/Scene3D.jsx            # Three.js 3D simulation canvas
    └── ui/
        ├── StatusBar.jsx            # Top bar with buttons
        ├── HowToUseModal.jsx        # 📖 How to Use guide modal
        └── RulesModal.jsx           # 📊 Rules & Analysis modal
```

## 🆕 What's New in Enhanced Edition

### Layout Redesign
- **Left Panel** (240px) — Controls, sliders, scenario selector
- **Center** (~55% viewport height) — 3D canvas with legend
- **Right Panel** (260px) — Live metrics, arc gauges, fleet overview
- **Bottom Panel** — Full-width 4-chart analysis + dynamic interpretation

### New Features
1. **"How to Use" Modal** — Step-by-step guide, control reference, visual cues
2. **"Rules & Analysis" Modal** — Input ranges, expected behaviour, graph interpretation, SNR rules
3. **BottomAnalysis Panel** — 4 large charts: Signal vs Jamming, SNR vs Time, Jamming Effect vs Packet Loss, Frequency Spectrum
4. **Dynamic Simulation Interpretation** — Auto-updating plain-English analysis box with recommended actions

### UI Improvements
- Larger fonts and improved contrast throughout
- Professional white theme with subtle shadows
- Bold labels and clear section separation
- Consistent spacing and padding
- Enhanced slider thumb styling
- Improved panel headers with accent borders

## 📊 SNR Decision Rules

| SNR Range     | Status    | Meaning                                  |
|--------------|-----------|------------------------------------------|
| > 20 dB      | Excellent | Full bandwidth, zero packet loss         |
| 10–20 dB     | Good      | Secure link, reliable comms              |
| 0–10 dB      | Moderate  | Degraded — activate countermeasures      |
| -10–0 dB     | Critical  | Severe jamming — high packet loss        |
| < -10 dB     | Lost      | Link failure — UAV uncontrolled          |
