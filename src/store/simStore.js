/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  UAV JAM SIM — Central Zustand Store  (v2 Enhanced)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  HOW JAMMING WORKS  (read this!)
 *  ─────────────────────────────────────────────────────────────────────────
 *  1. SIGNAL POWER  — The GCS transmits at power Pt (watts).
 *     As the signal travels through free space it loses energy with distance:
 *
 *       S = Pt / d²        (Friis free-space path loss, simplified)
 *
 *     At long range (d = 20 m in sim units) a 10 W transmitter delivers
 *     S = 10/400 = 0.025 "signal units".
 *
 *  2. JAMMING INTERFERENCE — The jammer also radiates power Pj.
 *     It follows the same inverse-square law from ITS position:
 *
 *       J = Pj / dj²
 *
 *     J is then multiplied by:
 *       • freqMod  — frequency overlap (1.0 = full match, 0.12 = mismatch)
 *       • typeMod  — jamming type bonus (spot/deception most effective)
 *       • dirMod   — directional jammer focuses power in a cone (×2 if in cone)
 *       • cmMod    — countermeasures reduce effectiveness (freq-hop cuts by 82%)
 *
 *  3. SNR  — Signal-to-Noise Ratio in decibels:
 *
 *       SNR (dB) = 10 × log10( S / (Noise + J) )
 *
 *     Positive SNR → signal dominates.  Negative SNR → noise/jamming dominates.
 *
 *  4. LINK STATUS thresholds:
 *       SNR ≥ 10 dB  AND  LQ ≥ 0.75  →  SECURE
 *       SNR ≥  0 dB  AND  LQ ≥ 0.45  →  DEGRADED
 *       LQ  ≥ 0.20                    →  CRITICAL
 *       else                          →  LOST  (UAV becomes uncontrolled)
 *
 *  5. DIRECTIONAL JAMMING — jammer has a beam-width of ±30°.
 *     If the UAV falls within that cone, jamming power is doubled.
 *     This simulates a high-gain directional antenna.
 *
 *  6. MULTIPLE UAVs — each UAV is independent; it has its own orbital
 *     radius, speed, and receives its own SNR/link calculation.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { create } from 'zustand'

// ── Constants ─────────────────────────────────────────────────────────────────
const MAX_TRAIL   = 120
const HISTORY_LEN = 100
const NOISE_FLOOR = 0.002   // ambient RF noise always present

// Positions of fixed entities in 3-D sim space
export const GCS_POS  = [-10, 0, 0]
export const JAM_POS  = [8,   0, 5]

// ── RF Physics Helpers ────────────────────────────────────────────────────────

/** Free-space path loss: S = Pt / d²  (simplified Friis) */
function computeSignal(Pt, d, realism, time) {
  let S = d <= 0 ? Pt : Pt / (d * d)

  if (realism) {
    // Multipath fading — realistic RF environments have reflections that
    // cause the signal to oscillate (Rayleigh fading model, simplified)
    const fading = 0.70 + 0.30 * Math.abs(Math.sin(time * 1.3 + d * 0.7))
    // Atmospheric absorption varies slightly over time
    const atmos  = 0.88 + 0.12 * (0.5 + 0.5 * Math.sin(time * 0.4))
    S *= fading * atmos
  }

  return Math.max(S, 0)
}

/**
 * Compute jamming power received at UAV position.
 *
 * J = (Pj / dj²) × freqMod × typeMod × dirMod × cmMod
 *
 * @param {number}   Pj           - Jammer transmit power (0–100 "units")
 * @param {number}   dj           - Distance from jammer to UAV
 * @param {string}   freqMatch    - 'match' | 'partial' | 'mismatch'
 * @param {string}   jammingType  - 'noise' | 'spot' | 'barrage' | 'deception'
 * @param {boolean}  directional  - Whether jammer uses directional antenna
 * @param {number}   angleToUAV   - Angle (rad) from jammer bearing to UAV
 * @param {object}   cm           - Active countermeasures
 * @param {boolean}  realism      - Whether realistic noise is applied
 * @param {number}   time         - Simulation time (for time-varying effects)
 */
function computeJamming(Pj, dj, freqMatch, jammingType, directional, angleToUAV, cm, realism, time) {
  let J = dj <= 0 ? Pj : Pj / (dj * dj)

  // ── Frequency Overlap ──────────────────────────────────────────────────
  // A jammer tuned to a DIFFERENT frequency barely affects the receiver.
  // Partial overlap still bleeds through adjacent channels.
  const freqMod = { match: 1.0, partial: 0.55, mismatch: 0.12 }
  J *= freqMod[freqMatch] ?? 1.0

  // ── Jamming Type Modifier ──────────────────────────────────────────────
  // Spot jamming concentrates all energy on one frequency → very effective.
  // Barrage spreads energy across many frequencies → moderate but broad.
  // Deception sends fake GPS/telemetry signals → confuses rather than blocks.
  // Noise flooding covers the band with wideband noise.
  const typeMod = { noise: 1.0, deception: 1.35, spot: 1.6, barrage: 0.80 }
  J *= typeMod[jammingType] ?? 1.0

  // Time-varying effects per jamming type
  if (jammingType === 'barrage')   J *= 0.7 + 0.3 * Math.abs(Math.sin(time * 2.1))
  if (jammingType === 'spot')      J *= 0.6 + 0.4 * (Math.sin(time * 3.7) > 0.3 ? 1 : 0.2)
  if (jammingType === 'deception') J *= 0.5 + 0.5 * Math.abs(Math.sin(time * 1.1))

  // ── Directional Antenna Gain ───────────────────────────────────────────
  // A directional jammer has a 60° beam-width half-angle (±30°).
  // Within the cone it has 2× gain (3 dB); outside the cone it falls to 20%.
  if (directional) {
    const HALF_BEAM = Math.PI / 6  // 30°
    const inCone = Math.abs(angleToUAV) <= HALF_BEAM
    J *= inCone ? 2.0 : 0.20
  }

  // ── Countermeasure Attenuation ─────────────────────────────────────────
  // Frequency hopping: UAV rapidly switches frequencies faster than the
  // jammer can track → reduces effective jamming by ~82%.
  if (cm.freqHopping) J *= 0.18
  // Encryption doesn't reduce raw RF interference but adds error-correction
  // that recovers ~32% of degraded packets.
  if (cm.encryption)  J *= 0.68
  // Power boost on GCS side (handled in signal calc), small reciprocal effect
  if (cm.powerBoost)  J *= 0.88

  if (realism) J *= (0.80 + 0.25 * Math.random())

  return Math.max(J, 0)
}

/**
 * Link Quality: fraction of signal over total RF power in band.
 * LQ = S / (S + J + Noise)   ranges 0..1
 */
function computeLinkQuality(S, J) {
  const total = S + J + NOISE_FLOOR
  return Math.min(S / total, 1)
}

/**
 * Signal-to-Noise Ratio in dB.
 * SNR = 10 × log10( S / (Noise + J) )
 * Clamped to [-40, +40] dB for display.
 */
function computeSNR(S, J) {
  const denominator = NOISE_FLOOR + J
  if (denominator <= 0) return 40
  if (S <= 0)           return -40
  return Math.max(Math.min(10 * Math.log10(S / denominator), 40), -40)
}

/** Link status based on SNR and LQ thresholds */
function getLinkStatus(lq, snr) {
  if (lq >= 0.75 && snr >= 10) return 'SECURE'
  if (lq >= 0.45 && snr >= 0)  return 'DEGRADED'
  if (lq >= 0.20)               return 'CRITICAL'
  return 'LOST'
}

/** Bit Error Rate increases sharply below ~10 dB SNR */
function getBitErrorRate(snr) {
  if (snr >= 15) return 0
  if (snr >= 10) return 0.00001
  if (snr >= 5)  return 0.001
  if (snr >= 0)  return 0.01
  if (snr >= -5) return 0.1
  return 0.5
}

/**
 * Frequency Spectrum — 20-bin representation of the RF environment.
 * Shows how signal and jamming energy distributes across frequency bins.
 */
function buildSpectrum(S, J, freqMatch, hopping, time, jammingType) {
  const bins   = 20
  const center = 10
  const data   = []

  for (let i = 0; i < bins; i++) {
    const freq = 300 + i * 60
    // Signal has Gaussian shape centred at bin 10 (main frequency)
    let signal  = S * Math.exp(-0.04 * Math.pow(i - center, 2))
    let jamming = 0
    const noise = (S + J) * 0.03 * (0.8 + 0.4 * Math.random())

    if (freqMatch === 'match') {
      if (jammingType === 'spot')
        // Spot jammer puts ALL energy on one frequency bin
        jamming = J * Math.exp(-0.08 * Math.pow(i - center, 2))
      else if (jammingType === 'barrage')
        // Barrage spreads energy uniformly across ALL bins
        jamming = J * 0.4 * (1 + 0.3 * Math.sin(time * 2 + i * 0.5))
      else if (jammingType === 'noise')
        jamming = J * (0.3 + 0.7 * Math.exp(-0.05 * Math.pow(i - center, 2)))
      else
        // Deception creates a close-replica signal → deceptive peak
        jamming = J * Math.exp(-0.06 * Math.pow(i - center, 2)) * (0.5 + 0.5 * Math.sin(time * 1.5))
    } else if (freqMatch === 'partial') {
      // Off-frequency jammer leaks into adjacent 3 bins
      jamming = J * 0.4 * Math.exp(-0.05 * Math.pow(i - (center + 3), 2))
    } else {
      // Mismatch: minimal bleed-through from jammer harmonics
      jamming = J * 0.06 * (1 + 0.5 * Math.sin(time + i * 0.8))
    }

    // Frequency hopping: UAV "jumps" to a new bin every 250 ms
    // The jammer can't follow fast enough → signal survives, jamming decimated
    if (hopping) {
      const hopBin = Math.floor(time * 4) % bins
      signal  = i === hopBin ? S * 1.8 : S * 0.03
      jamming *= 0.12
    }

    data.push({
      freq:    `${freq}`,
      signal:  +(signal  * 100).toFixed(2),
      jamming: +(jamming * 100).toFixed(2),
      noise:   +(noise   * 100).toFixed(2),
    })
  }
  return data
}

/**
 * Compute angle from jammer to UAV relative to jammer's forward direction.
 * Used for directional jamming cone check.
 */
function getAngleToUAV(uavPos, jamPos, jamBearing) {
  const dx = uavPos[0] - jamPos[0]
  const dz = uavPos[2] - jamPos[2]
  const angleToUAV = Math.atan2(dz, dx)
  return angleToUAV - jamBearing
}

// ── Initial UAV fleet ─────────────────────────────────────────────────────────
function makeUAV(id, radius, speed, startAngle, color) {
  return {
    id, radius, speed, startAngle, color,
    pos: [0, 3, 0], trail: [],
    linkStatus: 'SECURE', linkQuality: 1, snr: 30,
    signalStrength: 0, jammingStrength: 0,
    threatLevel: 0, bitErrorRate: 0,
  }
}

const INITIAL_UAVS = [
  makeUAV(0, 8,  0.40, 0,            '#10b981'),  // green
  makeUAV(1, 12, 0.28, Math.PI * 0.6, '#0ea5e9'), // blue
  makeUAV(2, 5,  0.55, Math.PI * 1.2, '#f59e0b'), // amber
]

// ── Zustand Store ─────────────────────────────────────────────────────────────
export const useSimStore = create((set, get) => ({
  // ── Sim state ──────────────────────────────────────────────────────────
  running: true,
  tick: 0,
  time: 0,
  viewMode: '3d',          // '3d' | '2d'
  scenario: 'open',
  perfMode: 'medium',

  // ── UAV fleet ──────────────────────────────────────────────────────────
  uavs: INITIAL_UAVS,
  activeUavId: 0,          // which UAV the data panels focus on

  // ── GCS params ─────────────────────────────────────────────────────────
  gcsPower: 10,

  // ── Jammer params ──────────────────────────────────────────────────────
  jammerPower:   50,
  jammingType:   'noise',   // 'noise' | 'spot' | 'barrage' | 'deception'
  freqMatch:     'match',   // 'match' | 'partial' | 'mismatch'
  distGCS:       12,
  distJammer:    8,
  directional:   false,     // directional vs omnidirectional jammer
  jamBearing:    0,         // jammer antenna bearing angle (radians)
  noiseLevel:    0.5,       // manual noise floor multiplier 0..2

  // ── Countermeasures ────────────────────────────────────────────────────
  countermeasures: { freqHopping: false, encryption: false, powerBoost: false },
  realism:            false,
  autoCountermeasure: false,
  autoECMCooldown:    0,

  // ── Derived RF metrics (for active UAV) ────────────────────────────────
  signalStrength:       0.1,
  jammingStrength:      0,
  linkQuality:          1,
  snr:                  30,
  linkStatus:           'SECURE',
  jammingEffectiveness: 0,
  bitErrorRate:         0,
  threatLevel:          0,

  // ── Time-series history & spectrum ─────────────────────────────────────
  history:  [],
  spectrum: [],
  heatmapData: [],   // grid of jamming intensity for mini-map heatmap

  // ── Mission mode ───────────────────────────────────────────────────────
  missionMode:   false,
  missionPhase:  0,
  missionScore:  100,

  // ── Event log ──────────────────────────────────────────────────────────
  events: [],

  // ══════════════════════════════════════════════════════════════════════
  //  Actions
  // ══════════════════════════════════════════════════════════════════════
  toggle:   () => set(s => ({ running: !s.running })),
  setViewMode: (v) => set({ viewMode: v }),

  reset: () => set({
    time: 0, tick: 0, history: [], events: [], heatmapData: [],
    missionScore: 100, missionPhase: 0,
    uavs: INITIAL_UAVS.map(u => ({ ...u, trail: [], pos: [0, 3, 0] })),
    countermeasures: { freqHopping: false, encryption: false, powerBoost: false },
  }),

  setScenario: (scenario) => {
    const presets = {
      open:        { gcsPower: 10, jammerPower: 25, freqMatch: 'mismatch', jammingType: 'noise',     distGCS: 12, distJammer: 12, directional: false },
      urban:       { gcsPower: 18, jammerPower: 60, freqMatch: 'partial',  jammingType: 'barrage',   distGCS: 8,  distJammer: 5,  directional: false },
      battlefield: { gcsPower: 25, jammerPower: 85, freqMatch: 'match',    jammingType: 'spot',      distGCS: 15, distJammer: 4,  directional: true  },
    }
    set({ scenario, ...(presets[scenario] ?? {}), history: [], events: [], missionScore: 100 })
  },

  setPerfMode:       (v) => set({ perfMode: v }),
  setJammerPower:    (v) => set({ jammerPower:  Number(v) }),
  setGcsPower:       (v) => set({ gcsPower:     Number(v) }),
  setDistGCS:        (v) => set({ distGCS:      Number(v) }),
  setDistJammer:     (v) => set({ distJammer:   Number(v) }),
  setFreqMatch:      (v) => set({ freqMatch: v }),
  setJammingType:    (v) => set({ jammingType: v }),
  setDirectional:    (v) => set({ directional: v }),
  setJamBearing:     (v) => set({ jamBearing: Number(v) }),
  setNoiseLevel:     (v) => set({ noiseLevel: Number(v) }),
  setActiveUav:      (id) => set({ activeUavId: id }),
  setCountermeasure: (k, v) => set(s => ({ countermeasures: { ...s.countermeasures, [k]: v } })),
  setRealism:        (v) => set({ realism: v }),
  setAutoCountermeasure: (v) => set({ autoCountermeasure: v }),
  setUavRadius:      (id, v) => set(s => ({
    uavs: s.uavs.map(u => u.id === id ? { ...u, radius: Number(v) } : u)
  })),
  setUavSpeed: (id, v) => set(s => ({
    uavs: s.uavs.map(u => u.id === id ? { ...u, speed: Number(v) } : u)
  })),

  toggleMission: () => set(s => ({
    missionMode: !s.missionMode,
    missionPhase: 0, missionScore: 100, history: [], events: [],
    countermeasures: { freqHopping: false, encryption: false, powerBoost: false },
  })),

  // ══════════════════════════════════════════════════════════════════════
  //  Main Simulation Tick
  // ══════════════════════════════════════════════════════════════════════
  tick_sim: (dt) => {
    const s = get()
    if (!s.running) return

    const newTime = s.time + dt
    const newTick = s.tick + 1

    // ── Mission escalation ───────────────────────────────────────────
    let { jammerPower, missionPhase, missionScore } = s
    if (s.missionMode) {
      missionPhase = Math.min(5, Math.floor(newTime / 10))
      jammerPower  = 8 + missionPhase * 16
    }

    // ── Auto ECM ─────────────────────────────────────────────────────
    let cm = { ...s.countermeasures }
    let autoECMCooldown = Math.max(0, s.autoECMCooldown - dt)
    const newCMEvents = []
    if (s.autoCountermeasure && autoECMCooldown <= 0) {
      const lq = s.linkQuality
      if (lq < 0.45 && !cm.freqHopping) {
        cm.freqHopping = true; autoECMCooldown = 2
        newCMEvents.push({ id: newTick + 10, type: 'ECM', msg: '⚡ Auto-ECM: Frequency hopping ON', t: Math.round(newTime) })
      }
      if (lq < 0.30 && !cm.powerBoost) {
        cm.powerBoost = true; autoECMCooldown = 2
        newCMEvents.push({ id: newTick + 11, type: 'ECM', msg: '⚡ Auto-ECM: Power boost ON', t: Math.round(newTime) })
      }
      if (lq > 0.82 && (cm.freqHopping || cm.powerBoost)) {
        cm.freqHopping = false; cm.powerBoost = false
        newCMEvents.push({ id: newTick + 12, type: 'OK', msg: '✅ Auto-ECM: Countermeasures stood down', t: Math.round(newTime) })
      }
    }

    const Pt = s.gcsPower * (cm.powerBoost ? 2.5 : 1)

    // ── Update each UAV ──────────────────────────────────────────────
    const updatedUAVs = s.uavs.map(uav => {
      // UAV orbit in XZ plane with slight vertical oscillation
      const angle = uav.startAngle + newTime * uav.speed
      const x = Math.cos(angle) * uav.radius
      const z = Math.sin(angle) * uav.radius
      const y = 3 + Math.sin(newTime * 0.7 + uav.id) * 0.8
      const pos = [x, y, z]

      const trail = [...uav.trail, [...pos]].slice(-MAX_TRAIL)

      // Distance from GCS and jammer
      const dGCS = Math.sqrt(
        Math.pow(pos[0] - GCS_POS[0], 2) +
        Math.pow(pos[2] - GCS_POS[2], 2)
      )
      const dJam = Math.sqrt(
        Math.pow(pos[0] - JAM_POS[0], 2) +
        Math.pow(pos[2] - JAM_POS[2], 2)
      )

      // Directional jammer: compute angle from jammer bearing to this UAV
      const angleToUAV = getAngleToUAV(pos, JAM_POS, s.jamBearing)

      // ── Core RF calculations ─────────────────────────────────────
      const S  = computeSignal(Pt, dGCS, s.realism, newTime)
      const J  = computeJamming(
        jammerPower, dJam,
        s.freqMatch, s.jammingType, s.directional, angleToUAV,
        cm, s.realism, newTime
      ) * s.noiseLevel

      const lq     = computeLinkQuality(S, J)
      const snr    = computeSNR(S, J)
      const status = getLinkStatus(lq, snr)
      const ber    = getBitErrorRate(snr)
      const threat = Math.min(1, J / Math.max(S + J + NOISE_FLOOR, 0.0001))

      return {
        ...uav,
        pos, trail,
        signalStrength:  S,
        jammingStrength: J,
        linkQuality:     lq,
        snr,
        linkStatus:      status,
        bitErrorRate:    ber,
        threatLevel:     threat,
      }
    })

    // ── Active UAV metrics (for data panels) ─────────────────────────
    const active = updatedUAVs.find(u => u.id === s.activeUavId) || updatedUAVs[0]
    const { signalStrength: S, jammingStrength: J, linkQuality: lq,
            snr, linkStatus: status, bitErrorRate: ber, threatLevel } = active
    const je = 1 - lq

    // ── Spectrum (active UAV perspective) ────────────────────────────
    const spectrum = buildSpectrum(S, J, s.freqMatch, cm.freqHopping, newTime, s.jammingType)

    // ── History ──────────────────────────────────────────────────────
    const entry = {
      t:       +(newTime).toFixed(1),
      signal:  +(S  * 1000).toFixed(3),
      jamming: +(J  * 1000).toFixed(3),
      lq:      +(lq * 100).toFixed(1),
      snr:     +snr.toFixed(1),
      ber:     +(ber * 100).toFixed(4),
    }
    const history = [...s.history.slice(-(HISTORY_LEN - 1)), entry]

    // ── Heatmap: sample jamming power on a grid (updated every 5 ticks) ──
    let heatmapData = s.heatmapData
    if (newTick % 5 === 0) {
      const GRID = 20
      const RANGE = 25
      heatmapData = []
      for (let gx = 0; gx < GRID; gx++) {
        for (let gz = 0; gz < GRID; gz++) {
          const wx = -RANGE + (gx / (GRID - 1)) * RANGE * 2
          const wz = -RANGE + (gz / (GRID - 1)) * RANGE * 2
          const dj = Math.sqrt(Math.pow(wx - JAM_POS[0], 2) + Math.pow(wz - JAM_POS[2], 2))
          const ang = getAngleToUAV([wx, 0, wz], JAM_POS, s.jamBearing)
          const j = computeJamming(jammerPower, dj, s.freqMatch, s.jammingType,
            s.directional, ang, cm, false, newTime)
          heatmapData.push({ gx, gz, wx, wz, intensity: Math.min(j * 20, 1) })
        }
      }
    }

    // ── Mission score ─────────────────────────────────────────────────
    if (s.missionMode) missionScore = Math.max(0, missionScore - dt * je * 3)

    // ── Status-change events ─────────────────────────────────────────
    const statusEvents = []
    if (status !== s.linkStatus) {
      const msgs = {
        LOST:     '🔴 LINK LOST — UAV-0 uncontrolled!',
        CRITICAL: '🟠 Link CRITICAL — imminent loss',
        DEGRADED: '🟡 Link degraded — jamming detected',
        SECURE:   '🟢 Link restored — signal secure',
      }
      statusEvents.push({ id: newTick, type: status, msg: msgs[status] ?? status, t: Math.round(newTime) })
    }

    const allNew = [...statusEvents, ...newCMEvents]
    const events = allNew.length ? [...allNew, ...s.events].slice(0, 40) : s.events

    set({
      time: newTime, tick: newTick,
      jammerPower, missionPhase, missionScore,
      countermeasures: cm, autoECMCooldown,
      uavs: updatedUAVs,
      signalStrength: S, jammingStrength: J,
      linkQuality: lq, snr, linkStatus: status,
      jammingEffectiveness: je, bitErrorRate: ber,
      threatLevel, history, spectrum, events, heatmapData,
    })
  },
}))
