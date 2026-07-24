import { useEffect, useRef, useState } from 'react'

// ─── Types ──────────────────────────────────────────────────────────────────
type Phase = 'black' | 'glow' | 'choi-appear' | 'running' | 'cards-line' | 'curtain-open' | 'done'

interface CardData {
  name: string;
  symbol: string;
  top: string;
  color: string;
  accent: string;
}

// ─── 10 quân bài ─────────────────────────────────────────────────────────────
const CARDS: CardData[] = [
  { name: 'Ông Ầm',      symbol: '龍', top: '老', color: '#7C2421', accent: '#C44837' },
  { name: 'Thái Tử',    symbol: '王', top: '君', color: '#006368', accent: '#D8B069' },
  { name: 'Ba Gà',      symbol: '鳳', top: '三', color: '#7C2421', accent: '#C44837' },
  { name: 'Nhứt Nọc',   symbol: '一', top: '木', color: '#006368', accent: '#D8B069' },
  { name: 'Tứ Cẳng',    symbol: '四', top: '馬', color: '#7C2421', accent: '#C44837' },
  { name: 'Trường Hầm', symbol: '將', top: '隧', color: '#006368', accent: '#D8B069' },
  { name: 'Ngũ Trợt',   symbol: '五', top: '滑', color: '#7C2421', accent: '#C44837' },
  { name: 'Bạch Huê',   symbol: '白', top: '花', color: '#006368', accent: '#D8B069' },
  { name: 'Nhì Nghèo',  symbol: '二', top: '貧', color: '#7C2421', accent: '#C44837' },
  { name: 'Sáu Miếng',  symbol: '六', top: '片', color: '#006368', accent: '#D8B069' },
]

const RX = 385   
const RY = 128   
const SPACING = 0.2
const CARD_WIDTH = 70
const LINE_CARD_WIDTH = CARD_WIDTH
const LINE_GAP = 16
const LINE_STEP = LINE_CARD_WIDTH + LINE_GAP
const LINE_Y = 138
const LINE_ENTRY_BEAT_SEC = 6.35
const LINE_SETTLE_BEAT_SEC = 7.75
const LINE_CARD_STAGGER_MS = 6
const LINE_CARD_TRAVEL_MS = Math.max(
  560,
  Math.round((LINE_SETTLE_BEAT_SEC - LINE_ENTRY_BEAT_SEC) * 1000) - (CARDS.length - 1) * LINE_CARD_STAGGER_MS
)
const LINE_WAVE_CARD_DELAY_SEC = 0.036
const LINE_WAVE_READY_SEC = LINE_ENTRY_BEAT_SEC
const LINE_TOTAL_FORM_MS = LINE_CARD_TRAVEL_MS + (CARDS.length - 1) * LINE_CARD_STAGGER_MS + 420
const ORBIT_PROGRESS_RATE = 0.0009
const BLACK_HOLD_MS = 180
const CAMERA_ZOOM_MS = 2500
const CHOI_RISE_MS = 1750
const CHOI_DELAY_AFTER_ZOOM_MS = 220
const CHOI_REVEAL_LEAD_MS = 360
const CHOI_HANDOFF_LEAD_MS = 560
const ORBIT_DELAY_AFTER_ZOOM_MS = 1640
const MUSIC_CARD_SYNC_LEAD_MS = 400
const ORBIT_TO_LINE_MS = LINE_ENTRY_BEAT_SEC * 1000
const LINE_TO_CURTAIN_MS = 3240
const CURTAIN_TO_DONE_MS = 1850
const CURTAIN_OPEN_MS = 1280

const TIMING = {
  glow: BLACK_HOLD_MS,
  choi: BLACK_HOLD_MS + CAMERA_ZOOM_MS + CHOI_DELAY_AFTER_ZOOM_MS,
  orbit: BLACK_HOLD_MS + CAMERA_ZOOM_MS + ORBIT_DELAY_AFTER_ZOOM_MS,
  music: BLACK_HOLD_MS + CAMERA_ZOOM_MS + ORBIT_DELAY_AFTER_ZOOM_MS - MUSIC_CARD_SYNC_LEAD_MS,
  line: BLACK_HOLD_MS + CAMERA_ZOOM_MS + ORBIT_DELAY_AFTER_ZOOM_MS - MUSIC_CARD_SYNC_LEAD_MS + ORBIT_TO_LINE_MS,
  curtain: BLACK_HOLD_MS + CAMERA_ZOOM_MS + ORBIT_DELAY_AFTER_ZOOM_MS - MUSIC_CARD_SYNC_LEAD_MS + ORBIT_TO_LINE_MS + LINE_TO_CURTAIN_MS,
  done: BLACK_HOLD_MS + CAMERA_ZOOM_MS + ORBIT_DELAY_AFTER_ZOOM_MS - MUSIC_CARD_SYNC_LEAD_MS + ORBIT_TO_LINE_MS + LINE_TO_CURTAIN_MS + CURTAIN_TO_DONE_MS,
}

const DRUM_AUDIO_START = 1
const MUSIC_AUDIO_START = 13.1

const CARD_BEATS = [2.46, 3.24, 4.02, 4.92, 5.72, 6.54, 7.36, 8.18, 9.0, 9.82, 10.64, 11.38]
const BEAT_PULSE_WINDOW = 0.42

const LANTERN_SPOTS = [
  { left: 33, top: 57, size: 54, delay: 0 },
  { left: 67, top: 57, size: 54, delay: 0.16 },
  { left: 25, top: 70, size: 46, delay: 0.26 },
  { left: 75, top: 70, size: 46, delay: 0.36 },
]

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v))
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function easeOutBack(t: number, amount = 1.18) {
  const c3 = amount + 1
  return 1 + c3 * Math.pow(t - 1, 3) + amount * Math.pow(t - 1, 2)
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function beatPulseAt(seconds: number, offset = 0) {
  return CARD_BEATS.reduce((strongest, beat) => {
    const distance = Math.abs(seconds - beat - offset)
    if (distance > BEAT_PULSE_WINDOW) return strongest

    const pulse = Math.pow(1 - distance / BEAT_PULSE_WINDOW, 1.65)
    return Math.max(strongest, pulse)
  }, 0)
}

function musicWaveAt(seconds: number, index: number) {
  const shifted = seconds - index * LINE_WAVE_CARD_DELAY_SEC
  let prevBeat = CARD_BEATS[0]
  let nextBeat = CARD_BEATS[1] ?? CARD_BEATS[0] + 0.78
  let beatIndex = 0

  for (let i = 0; i < CARD_BEATS.length - 1; i += 1) {
    if (shifted >= CARD_BEATS[i] && shifted <= CARD_BEATS[i + 1]) {
      prevBeat = CARD_BEATS[i]
      nextBeat = CARD_BEATS[i + 1]
      beatIndex = i
      break
    }

    if (shifted > CARD_BEATS[i + 1]) {
      prevBeat = CARD_BEATS[i + 1]
      nextBeat = CARD_BEATS[i + 1] + (CARD_BEATS[i + 1] - CARD_BEATS[i])
      beatIndex = i + 1
    }
  }

  const phase = clamp01((shifted - prevBeat) / Math.max(0.001, nextBeat - prevBeat))
  const accent = [1, 0.78, 0.92, 0.82][beatIndex % 4]
  return Math.cos(phase * Math.PI * 2) * accent
}

function cardPose(t: number) {
  if (t <= 0) return null
  const ROT_SPEED = Math.PI * 0.95; 
  const expandFactor = Math.tanh(t * 3.0); 
  const rX = RX * expandFactor;
  const rY = RY * expandFactor;
  const angle = -t * ROT_SPEED;
  const x = Math.cos(angle) * rX;
  const y = Math.sin(angle) * rY; 
  const depth = (Math.sin(angle) + 1) / 2;
  const scale = 0.44 + (depth * 0.62); 
  const opacity = Math.min(1, t * 2.5) * (0.42 + (depth * 0.58)); 
  const behind = y < -5; 
  const rotZ = Math.sin(t * 1.2) * 8;
  return { x, y, scale, opacity, behind, rotZ, depth };
}

function BaiChoiCard({ card, width = 64 }: { card: CardData; width?: number }) {
  const h = Math.round(width * 1.65)
  return (
    <svg width={width} height={h} viewBox="0 0 72 119" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="70" height="117" rx="6" fill="#006368" stroke="#D8B069" strokeWidth="2.5"/>
      <rect x="5" y="5" width="62" height="109" rx="4" fill="none" stroke="#D8B069" strokeWidth="0.8" strokeDasharray="2,2"/>
      <rect x="1" y="1" width="70" height="22" rx="6" fill={card.color}/>
      <text x="36" y="14" textAnchor="middle" dominantBaseline="middle" fontSize="10" fontWeight="900" fill="#D8B069" style={{fontFamily:'serif'}}>{card.top}</text>
      <text x="36" y="63" textAnchor="middle" dominantBaseline="middle" fontSize="36" fontWeight="900" fill="#D8B069" style={{fontFamily:'serif'}}>{card.symbol}</text>
      <text x="36" y="100" textAnchor="middle" dominantBaseline="middle" fontSize="7.5" fontWeight="700" fill="#D8B069" style={{fontFamily:'serif'}}>{card.name}</text>
      <rect x="1" y="97" width="70" height="21" rx="6" fill={card.color}/>
      <text x="36" y="109" textAnchor="middle" dominantBaseline="middle" fontSize="9" fontWeight="700" fill="#D8B069" style={{fontFamily:'serif'}}>✦</text>
    </svg>
  )
}

function FogLayer() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[0, 1].map((i) => (
        <div key={i} className="absolute rounded-full" style={{
          width: '140%', height: '40%', left: '-20%', top: '60%',
          background: 'radial-gradient(ellipse, rgba(216,176,105,0.08) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: `fogDrift${i} ${20 + i * 5}s ease-in-out infinite alternate`,
        }}/>
      ))}
    </div>
  )
}

type AudioWindow = Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }

function playFestivalDrum(ctx: AudioContext, time: number, volume = 0.34) {
  const master = ctx.createGain()
  master.gain.setValueAtTime(0.0001, time)
  master.gain.linearRampToValueAtTime(volume, time + 0.028)
  master.gain.exponentialRampToValueAtTime(0.0001, time + 0.52)
  master.connect(ctx.destination)

  const samples = Math.floor(ctx.sampleRate * 0.24)
  const buffer = ctx.createBuffer(1, samples, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < samples; i += 1) {
    const attack = clamp01(i / (ctx.sampleRate * 0.018))
    const decay = Math.pow(1 - i / samples, 3.4)
    const body = Math.sin(i * 0.052) * 0.52
    data[i] = ((Math.random() * 2 - 1) * 0.28 + body) * attack * decay
  }

  const drum = ctx.createBufferSource()
  const lowpass = ctx.createBiquadFilter()
  const band = ctx.createBiquadFilter()
  const gain = ctx.createGain()
  drum.buffer = buffer
  lowpass.type = 'lowpass'
  lowpass.frequency.setValueAtTime(210, time)
  lowpass.Q.setValueAtTime(0.28, time)
  band.type = 'bandpass'
  band.frequency.setValueAtTime(92, time)
  band.Q.setValueAtTime(0.55, time)
  gain.gain.setValueAtTime(1, time)
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.48)
  drum.connect(lowpass).connect(band).connect(gain).connect(master)
  drum.start(time)
  drum.stop(time + 0.5)
}

const INTRO_AUDIO_SRC = '/assets/bai-choi-intro.mp4'
const INTRO_AUDIO_END = 25
const INTRO_AUDIO_VOLUME = 0.9
const INTRO_AUDIO_FADE_IN = 1.05
const INTRO_AUDIO_FADE_OUT = 2
const AUDIO_AUTOPLAY_DELAY_MS = 0
const AUDIO_HANDOFF_TOLERANCE_SEC = 1.1
type AudioSegment = 'drums' | 'waiting' | 'music'

export default function IntroAnimation({ onDone }: { onDone: () => void }) {
  const [phase, setPhase]  = useState<Phase>('black')
  const [frame, setFrame]  = useState(0)
  const [viewport, setViewport] = useState(() => ({
    w: typeof window === 'undefined' ? 1280 : window.innerWidth,
    h: typeof window === 'undefined' ? 720 : window.innerHeight,
  }))
  const globalTRef  = useRef(0)
  const lineFormTRef = useRef(0)
  const prevMsRef   = useRef(0)
  const rafRef      = useRef(0)
  const phaseRef    = useRef<Phase>('black')
  const timeoutsRef = useRef<number[]>([])
  const startedAtRef = useRef(typeof performance === 'undefined' ? 0 : performance.now())
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioPlayingRef = useRef(false)
  const audioSegmentRef = useRef<AudioSegment>('drums')
  const audioMusicFadeInRef = useRef(false)
  const audioStopTimerRef = useRef<number | null>(null)
  const drumCtxRef = useRef<AudioContext | null>(null)
  const drumTimerRef = useRef<number | null>(null)
  const drumPlayedRef = useRef(false)
  const [audioStarted, setAudioStarted] = useState(false)
  // Most browsers require a visitor gesture before audible playback.
  // Show the sound control immediately while the autoplay attempt runs.
  const [autoplayBlocked, setAutoplayBlocked] = useState(true)

  const getIntroAudioStart = () => {
    const elapsed = performance.now() - startedAtRef.current
    const secondsUntilMusic = Math.max(0, (TIMING.music - elapsed) / 1000)
    return Math.max(DRUM_AUDIO_START, MUSIC_AUDIO_START - secondsUntilMusic)
  }

  const skipIntro = () => {
    timeoutsRef.current.forEach(id => window.clearTimeout(id))
    timeoutsRef.current = []
    if (drumTimerRef.current) {
      window.clearTimeout(drumTimerRef.current)
      drumTimerRef.current = null
    }
    phaseRef.current = 'done'
    setPhase('done')
    onDone()
  }

  const playChoiDrum = async () => {
    if (drumPlayedRef.current) return

    const AudioContextClass = window.AudioContext || (window as AudioWindow).webkitAudioContext
    if (!AudioContextClass) return

    drumCtxRef.current ??= new AudioContextClass()
    const ctx = drumCtxRef.current

    try {
      await ctx.resume()
    } catch {
      return
    }

    if (ctx.state !== 'running') return

    drumPlayedRef.current = true
    playFestivalDrum(ctx, ctx.currentTime + 0.012)
  }

  const stopChoiDrumLayer = () => {
    if (drumTimerRef.current) {
      window.clearTimeout(drumTimerRef.current)
      drumTimerRef.current = null
    }

    if (drumCtxRef.current && drumCtxRef.current.state !== 'closed') {
      void drumCtxRef.current.close()
      drumCtxRef.current = null
    }
  }

  const scheduleChoiDrum = () => {
    if (drumPlayedRef.current) return

    if (drumTimerRef.current) {
      window.clearTimeout(drumTimerRef.current)
      drumTimerRef.current = null
    }

    const elapsed = performance.now() - startedAtRef.current
    const delay = TIMING.choi - elapsed

    if (delay <= 0) {
      if (elapsed < TIMING.choi + 900) void playChoiDrum()
      return
    }

    drumTimerRef.current = window.setTimeout(() => {
      void playChoiDrum()
    }, delay)
  }

  const watchAudioWindow = (audio: HTMLAudioElement) => {
    if (audioStopTimerRef.current) window.clearTimeout(audioStopTimerRef.current)

    const watch = () => {
      let segment = audioSegmentRef.current

      if (segment === 'drums' && audio.currentTime >= MUSIC_AUDIO_START - 0.06) {
        stopChoiDrumLayer()
        audioMusicFadeInRef.current = false
        audio.volume = INTRO_AUDIO_VOLUME
        audioPlayingRef.current = true
        audioSegmentRef.current = 'music'
        segment = 'music'
      }

      if (segment === 'music') {
        if (audio.currentTime >= INTRO_AUDIO_END || audio.ended) {
          audio.pause()
          audio.currentTime = MUSIC_AUDIO_START
          audio.volume = INTRO_AUDIO_VOLUME
          audioPlayingRef.current = false
          audioStopTimerRef.current = null
          return
        }

        const sourceRemaining = INTRO_AUDIO_END - audio.currentTime
        const introRemaining = Math.max(0, (TIMING.done - (performance.now() - startedAtRef.current)) / 1000)
        const remaining = Math.min(sourceRemaining, introRemaining)
        const fadeIn = audioMusicFadeInRef.current
          ? clamp01((audio.currentTime - MUSIC_AUDIO_START) / INTRO_AUDIO_FADE_IN)
          : 1
        if (fadeIn >= 1) audioMusicFadeInRef.current = false
        const fadeOut = remaining <= INTRO_AUDIO_FADE_OUT
          ? Math.pow(clamp01(remaining / INTRO_AUDIO_FADE_OUT), 1.7)
          : 1

        audio.volume = Math.max(0.0001, INTRO_AUDIO_VOLUME * fadeIn * fadeOut)
      }

      audioStopTimerRef.current = window.setTimeout(watch, 50)
    }

    watch()
  }

  const startMainMusic = async () => {
    const audio = audioRef.current
    if (!audio) return

    try {
      stopChoiDrumLayer()

      if (audioStopTimerRef.current) window.clearTimeout(audioStopTimerRef.current)

      audio.muted = false
      audioPlayingRef.current = true

      const isContinuousHandoff = !audio.paused
        && audio.currentTime >= MUSIC_AUDIO_START - AUDIO_HANDOFF_TOLERANCE_SEC
        && audio.currentTime <= MUSIC_AUDIO_START + AUDIO_HANDOFF_TOLERANCE_SEC

      if (isContinuousHandoff) {
        audioMusicFadeInRef.current = false
        audio.volume = INTRO_AUDIO_VOLUME
        if (audio.currentTime >= MUSIC_AUDIO_START - 0.04) {
          audioSegmentRef.current = 'music'
        }
      } else {
        audio.pause()
        audio.currentTime = MUSIC_AUDIO_START
        audioMusicFadeInRef.current = true
        audio.volume = 0.0001
        audioSegmentRef.current = 'music'
      }

      await audio.play()
      setAudioStarted(true)
      setAutoplayBlocked(false)
      watchAudioWindow(audio)
    } catch {
      audioPlayingRef.current = false
      setAutoplayBlocked(true)
    }
  }

  const startAudio = async (showFallback = true) => {
    if (audioSegmentRef.current === 'waiting') {
      await startMainMusic()
      return
    }

    if (audioSegmentRef.current === 'music' && !audioPlayingRef.current) {
      await startMainMusic()
      return
    }

    if (audioPlayingRef.current) {
      const audio = audioRef.current
      if (audio) {
        try {
          audio.muted = false
          audio.volume = INTRO_AUDIO_VOLUME
          await audio.play()
          setAudioStarted(true)
          setAutoplayBlocked(false)
          scheduleChoiDrum()
        } catch {
          setAudioStarted(false)
          if (showFallback) setAutoplayBlocked(true)
        }
      }
      return
    }

    const audio = audioRef.current
    if (!audio) return

    try {
      if (audioStopTimerRef.current) window.clearTimeout(audioStopTimerRef.current)

      audio.pause()
      // Call play() without awaiting metadata first. This preserves the first
      // pointer/key action as a valid audio-unlock gesture on mobile browsers.
      try {
        audio.currentTime = getIntroAudioStart()
      } catch {
        // onLoadedMetadata below applies the synced position once it is known.
      }
      audioMusicFadeInRef.current = false
      audio.volume = INTRO_AUDIO_VOLUME
      audio.muted = false
      audioSegmentRef.current = 'drums'
      audioPlayingRef.current = true
      await audio.play()
      setAudioStarted(true)
      setAutoplayBlocked(false)
      scheduleChoiDrum()

      watchAudioWindow(audio)
    } catch {
      audioPlayingRef.current = false
      setAudioStarted(false)
      if (showFallback) setAutoplayBlocked(true)
    }
  }

  useEffect(() => {
    const updateViewport = () => setViewport({ w: window.innerWidth, h: window.innerHeight })
    updateViewport()
    window.addEventListener('resize', updateViewport)
    return () => window.removeEventListener('resize', updateViewport)
  }, [])

  useEffect(() => {
    const tryAutoplay = () => {
      if (!audioPlayingRef.current) void startAudio(false)
    }

    const unlockAudio = () => {
      void startAudio(true)
    }

    const retryWhenVisible = () => {
      if (document.visibilityState === 'visible' && !audioPlayingRef.current) {
        void startAudio(false)
      }
    }

    const autoPlayTimer = window.setTimeout(() => {
      tryAutoplay()
    }, AUDIO_AUTOPLAY_DELAY_MS)

    tryAutoplay()
    window.addEventListener('focus', tryAutoplay)
    window.addEventListener('pageshow', tryAutoplay)
    window.addEventListener('pointerdown', unlockAudio, { capture: true })
    window.addEventListener('touchstart', unlockAudio, { capture: true, passive: true })
    window.addEventListener('keydown', unlockAudio, { capture: true })
    document.addEventListener('visibilitychange', retryWhenVisible)

    return () => {
      window.clearTimeout(autoPlayTimer)
      window.removeEventListener('focus', tryAutoplay)
      window.removeEventListener('pageshow', tryAutoplay)
      window.removeEventListener('pointerdown', unlockAudio, { capture: true })
      window.removeEventListener('touchstart', unlockAudio, { capture: true })
      window.removeEventListener('keydown', unlockAudio, { capture: true })
      document.removeEventListener('visibilitychange', retryWhenVisible)

      if (audioStopTimerRef.current) {
        window.clearTimeout(audioStopTimerRef.current)
      }

      if (drumTimerRef.current) {
        window.clearTimeout(drumTimerRef.current)
      }

      if (audioRef.current) {
        audioRef.current.pause()
      }

      if (drumCtxRef.current && drumCtxRef.current.state !== 'closed') {
        void drumCtxRef.current.close()
      }
    }
  }, [])

  useEffect(() => {
    const loop = (now: number) => {
      const dt = prevMsRef.current ? now - prevMsRef.current : 16
      prevMsRef.current = now
      const currentPhase = phaseRef.current
      const needsFrame = currentPhase === 'choi-appear'
        || currentPhase === 'running'
        || currentPhase === 'cards-line'
        || currentPhase === 'curtain-open'

      if (currentPhase === 'running') {
        globalTRef.current += dt * ORBIT_PROGRESS_RATE; 
      }
      if (currentPhase === 'cards-line') {
        lineFormTRef.current += dt
      }
      if (needsFrame) setFrame(f => f + 1)
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }
  }, [])

  useEffect(() => {
    const schedule = (fn: () => void, ms: number) => {
      const id = window.setTimeout(fn, ms);
      timeoutsRef.current.push(id);
    }

    schedule(() => { setPhase('glow');       phaseRef.current='glow' },         TIMING.glow)
    schedule(() => { setPhase('choi-appear'); phaseRef.current='choi-appear' },   TIMING.choi)
    schedule(() => { void startMainMusic() },                                    TIMING.music)
    schedule(() => {
      setPhase('running')
      phaseRef.current='running'
    }, TIMING.orbit)
    
    schedule(() => { lineFormTRef.current = 0; setPhase('cards-line'); phaseRef.current='cards-line' }, TIMING.line)
    schedule(() => { setPhase('curtain-open');phaseRef.current='curtain-open' },  TIMING.curtain)
    schedule(skipIntro,                                                           TIMING.done)
    
    return () => {
      timeoutsRef.current.forEach(id => window.clearTimeout(id));
      timeoutsRef.current = [];
    }
  }, [onDone])

  if (phase === 'done') return null
  void frame

  const elapsedMs = typeof performance === 'undefined' ? 0 : performance.now() - startedAtRef.current
  const audio = audioRef.current
  const musicElapsedSec = audio && audioSegmentRef.current === 'music'
    ? Math.max(0, audio.currentTime - MUSIC_AUDIO_START)
    : Math.max(0, (elapsedMs - TIMING.orbit) / 1000)
  const lineSyncedMs = Math.max(0, (musicElapsedSec - LINE_ENTRY_BEAT_SEC) * 1000)
  const running   = ['running','cards-line','curtain-open'].includes(phase)
  const lineOn    = ['cards-line','curtain-open'].includes(phase)
  const curtainOn = phase === 'curtain-open'
  const beatBasePulse = beatPulseAt(musicElapsedSec)
  const cameraVisible = phase === 'glow'
  const choiRiseProgress = easeInOutCubic(clamp01((elapsedMs - (TIMING.choi - CHOI_REVEAL_LEAD_MS)) / CHOI_RISE_MS))
  const choiExitProgress = curtainOn ? easeOutCubic(clamp01((elapsedMs - TIMING.curtain) / CURTAIN_OPEN_MS)) : 0
  const lineRibbonProgress = lineOn
    ? (curtainOn ? 1 : easeOutCubic(clamp01(lineSyncedMs / LINE_TOTAL_FORM_MS)))
    : 0
  const lanternProgress = easeOutCubic(clamp01((elapsedMs - (TIMING.choi + 120)) / 1450))
  const lanternGlow = lanternProgress * (0.74 + Math.sin(elapsedMs / 180) * 0.08 + beatBasePulse * 0.16)

  const allCards = CARDS.map((card, i) => {
    const cardT = globalTRef.current - (i * SPACING);
    const pose = cardPose(cardT) ?? {
      x: -RX,
      y: 0,
      scale: 0.4,
      opacity: 0,
      behind: true,
      rotZ: 0,
      depth: 0,
    };
    
    const zIdx = pose.behind 
      ? Math.floor(pose.depth * 10) 
      : 21 + Math.floor(pose.depth * 70);

    return { card, pose, zIdx, index: i, visible: cardT > 0 };
  })

  const activeCards = lineOn ? allCards : allCards.filter(item => item.visible);
  const displayedCards = lineOn ? activeCards : [...activeCards].sort((a, b) => a.zIdx - b.zIdx);
  const choiVisible = elapsedMs >= TIMING.choi - CHOI_REVEAL_LEAD_MS
  const choiRiseDistance = Math.min(190, viewport.h * 0.3)
  const choiFloatY = curtainOn ? 0 : Math.sin(elapsedMs / 820) * 5
  const choiY = lerp(choiRiseDistance, 0, choiRiseProgress) + choiFloatY
  const choiScale = lerp(0.72, 1, choiRiseProgress) * (1 + choiExitProgress * 1.85)
  const choiOpacity = choiVisible ? Math.max(0, choiRiseProgress - choiExitProgress * 0.95) : 0
  const choiTransform = `translate(-50%, -50%) translateY(${choiY}px) scale(${choiScale})`
  const cardWidth = Math.round(Math.min(CARD_WIDTH, Math.max(42, viewport.w * 0.12)))
  const lineStep = Math.max(cardWidth * 0.76, Math.min(LINE_STEP, (viewport.w * 0.78) / (CARDS.length - 1)))
  const lineStartX = -((CARDS.length - 1) * lineStep) / 2
  const lineY = Math.round(Math.min(LINE_Y, Math.max(72, viewport.h * 0.18)))

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
      style={{background:'#080504'}} role="presentation"
      onPointerDown={() => { void startAudio() }}>
      <audio
        ref={audioRef}
        src={INTRO_AUDIO_SRC}
        preload="auto"
        autoPlay
        onCanPlay={() => {
          if (!audioPlayingRef.current) void startAudio(false)
        }}
        onLoadedMetadata={(event) => {
          event.currentTarget.currentTime = getIntroAudioStart()
        }}
      />

      <style>{`
        @keyframes choiFloat{
          0%,100%{transform: translateY(0) rotateX(4deg)}
          50%{transform: translateY(-10px) rotateX(4deg)}
        }
        @keyframes landingFlash{
          0%{opacity: 0; transform: scale(0.78)}
          42%{opacity: 0.72; transform: scale(1)}
          100%{opacity: 0; transform: scale(1.25)}
        }
        @keyframes titleFade{
          from{opacity: 0; transform: translate(-50%, 40px)}
          to{opacity: 1; transform: translate(-50%, 0)}
        }
        @keyframes brushWipe{
          0%{clip-path: inset(0 100% 0 0); filter: blur(2px); transform: translateY(10px) scale(0.96)}
          58%{clip-path: inset(0 0 0 0); filter: blur(0.4px); transform: translateY(0) scale(1.02)}
          100%{clip-path: inset(0 0 0 0); filter: blur(0); transform: translateY(0) scale(1)}
        }
        @keyframes brushUnderline{
          0%{opacity: 0; transform: scaleX(0) translateY(5px)}
          65%{opacity: 1; transform: scaleX(1.06) translateY(0)}
          100%{opacity: 0.82; transform: scaleX(1) translateY(0)}
        }
        @keyframes inkFleck{
          0%{opacity: 0; transform: translateY(10px) scale(0.4)}
          35%{opacity: 0.85}
          100%{opacity: 0; transform: translateY(-18px) scale(1)}
        }
        @keyframes fogDrift0{from{transform:translateX(-10%)}to{transform:translateX(10%)}}
        @keyframes fogDrift1{from{transform:translateX(10%)}to{transform:translateX(-10%)}}
        @keyframes silkBreath{
          0%,100%{filter: blur(18px); opacity: 0.42}
          50%{filter: blur(24px); opacity: 0.62}
        }
        @keyframes inkReveal{
          from{opacity: 0; transform: translate(-50%, -50%) scale(0.86)}
          to{opacity: 1; transform: translate(-50%, -50%) scale(1)}
        }
        @keyframes cameraFrameZoom{
          0%{opacity:0; transform:translate(-50%, -50%) translate3d(0,52px,0) scale(2.28)}
          16%{opacity:.9}
          86%{opacity:.76; transform:translate(-50%, -50%) translate3d(0,0,0) scale(1)}
          100%{opacity:0; transform:translate(-50%, -50%) translate3d(0,0,0) scale(.96)}
        }
        @keyframes cameraLightZoom{
          0%{opacity:0; transform:translate(-50%, -50%) translate3d(0,48px,0) scale(1.9)}
          18%{opacity:.72}
          86%{opacity:.46; transform:translate(-50%, -50%) translate3d(0,0,0) scale(1)}
          100%{opacity:0; transform:translate(-50%, -50%) translate3d(0,0,0) scale(.98)}
        }
        @keyframes cameraVignetteZoom{
          0%{opacity:.9; transform:scale(1.14)}
          78%{opacity:.3; transform:scale(1)}
          100%{opacity:0; transform:scale(1)}
        }
        @keyframes introBackgroundReveal{
          0%{opacity:0}
          10%{opacity:0}
          54%{opacity:1}
          100%{opacity:1}
        }
        @keyframes stageBeamZoomSync{
          0%{opacity:0; transform:translateX(-50%) translateY(76px) scaleX(.68)}
          12%{opacity:.24}
          78%{opacity:.5; transform:translateX(-50%) translateY(0) scaleX(1.04)}
          100%{opacity:.5; transform:translateX(-50%) translateY(0) scaleX(1.04)}
        }
        @keyframes choiHandoffBeam{
          0%{opacity:0; transform:translateX(-50%) translateY(68px) scaleX(.42) scaleY(.72); filter:blur(7px)}
          28%{opacity:.82; transform:translateX(-50%) translateY(22px) scaleX(.8) scaleY(1); filter:blur(5px)}
          62%{opacity:.58; transform:translateX(-50%) translateY(-8px) scaleX(1.06) scaleY(1.05); filter:blur(4px)}
          100%{opacity:0; transform:translateX(-50%) translateY(-18px) scaleX(1.16) scaleY(.98); filter:blur(5px)}
        }
        @keyframes choiHandoffRing{
          0%{opacity:0; transform:translate(-50%, -50%) scale(.56)}
          26%{opacity:.7; transform:translate(-50%, -50%) scale(.86)}
          100%{opacity:0; transform:translate(-50%, -50%) scale(1.22)}
        }
      `}</style>

      {phase !== 'black' && (
        <div className="absolute inset-0" style={{
          background: `
            radial-gradient(circle at 50% 48%, rgba(0, 99, 104, 1) 0%, rgba(0, 63, 64, 1) 44%, rgba(8,5,4,0.96) 100%),
            linear-gradient(180deg, rgba(0,99,104,0.82), rgba(8,5,4,0.9))
          `,
          opacity: 0,
          animation: `introBackgroundReveal ${CAMERA_ZOOM_MS}ms cubic-bezier(0.22, 1, 0.36, 1) forwards`,
          willChange: 'opacity',
        }}/>
      )}

      {cameraVisible && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 'min(90vw, 900px)',
            height: 'min(64vh, 500px)',
            borderRadius: 20,
            border: '2px solid rgba(216,176,105,0.38)',
            background: 'radial-gradient(circle at 50% 50%, rgba(216,176,105,0.24) 0%, rgba(0,99,104,0.24) 46%, transparent 74%)',
            boxShadow: 'inset 0 0 48px rgba(8,5,4,0.46), 0 0 28px rgba(216,176,105,0.12)',
            transformOrigin: '50% 52%',
            animation: `cameraFrameZoom ${CAMERA_ZOOM_MS}ms cubic-bezier(0.22, 1, 0.36, 1) both`,
            pointerEvents: 'none',
            zIndex: 3,
            willChange: 'transform, opacity',
            backfaceVisibility: 'hidden',
            contain: 'paint',
          }}
        />
      )}

      {cameraVisible && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 'min(98vw, 980px)',
            height: 'min(74vh, 560px)',
            transformOrigin: '50% 50%',
            animation: `cameraLightZoom ${CAMERA_ZOOM_MS}ms cubic-bezier(0.22, 1, 0.36, 1) both`,
            backgroundImage: [
              'radial-gradient(circle at 50% 50%, rgba(216,176,105,0.32) 0%, rgba(242,153,99,0.16) 22%, rgba(0,99,104,0.38) 48%, rgba(8,5,4,0.08) 74%, transparent 100%)',
            ].join(', '),
            mixBlendMode: 'screen',
            pointerEvents: 'none',
            zIndex: 4,
            willChange: 'transform, opacity',
            backfaceVisibility: 'hidden',
            contain: 'paint',
          }}
        />
      )}

      {cameraVisible && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 50% 48%, transparent 0%, transparent 18%, rgba(8,5,4,0.22) 54%, rgba(8,5,4,0.92) 100%)',
            animation: `cameraVignetteZoom ${CAMERA_ZOOM_MS}ms cubic-bezier(0.22, 1, 0.36, 1) both`,
            pointerEvents: 'none',
            zIndex: 5,
            willChange: 'transform, opacity',
          }}
        />
      )}

      {phase !== 'black' && (
        <div style={{
          position: 'absolute',
          left: '50%',
          bottom: '-16%',
          width: 'min(78vw, 880px)',
          height: '72%',
          transformOrigin: '50% 100%',
          clipPath: 'polygon(44% 100%, 56% 100%, 100% 0, 0 0)',
          background: 'linear-gradient(0deg, rgba(0,99,104,0.38) 0%, rgba(216,176,105,0.24) 34%, rgba(242,153,99,0.11) 58%, transparent 100%)',
          animation: `stageBeamZoomSync ${CAMERA_ZOOM_MS}ms cubic-bezier(0.22, 1, 0.36, 1) forwards`,
          filter: 'blur(10px)',
          mixBlendMode: 'screen',
          pointerEvents: 'none',
          zIndex: 3,
          willChange: 'transform, opacity',
        }} />
      )}

      {phase !== 'black' && !curtainOn && (
        <>
          <div style={{
            position: 'absolute',
            left: '50%',
            bottom: '-8%',
            width: 'min(58vw, 620px)',
            height: '62%',
            transformOrigin: '50% 100%',
            clipPath: 'polygon(47% 100%, 53% 100%, 94% 0, 6% 0)',
            background: 'linear-gradient(0deg, rgba(242,153,99,0.52) 0%, rgba(216,176,105,0.34) 38%, rgba(0,99,104,0.24) 68%, transparent 100%)',
            animation: `choiHandoffBeam 1080ms cubic-bezier(0.22, 1, 0.36, 1) ${Math.max(0, TIMING.choi - CHOI_HANDOFF_LEAD_MS - TIMING.glow)}ms both`,
            mixBlendMode: 'screen',
            pointerEvents: 'none',
            zIndex: 14,
            willChange: 'transform, opacity, filter',
          }} />
          <div style={{
            position: 'absolute',
            left: '50%',
            top: '59%',
            width: 'min(46vw, 420px)',
            height: 'min(11vh, 82px)',
            borderRadius: '50%',
            border: '1px solid rgba(216,176,105,0.55)',
            boxShadow: '0 0 32px rgba(216,176,105,0.22), inset 0 0 22px rgba(242,153,99,0.18)',
            animation: `choiHandoffRing 960ms cubic-bezier(0.22, 1, 0.36, 1) ${Math.max(0, TIMING.choi - CHOI_HANDOFF_LEAD_MS - TIMING.glow + 80)}ms both`,
            pointerEvents: 'none',
            zIndex: 15,
            willChange: 'transform, opacity',
          }} />
        </>
      )}

      {phase !== 'black' && !cameraVisible && <FogLayer />}

      {curtainOn && (
        <div style={{
          position: 'absolute',
          inset: '12%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(216,176,105,0.86) 0%, rgba(216,176,105,0.42) 28%, rgba(196,72,55,0.2) 52%, transparent 72%)',
          animation: 'landingFlash 1.45s ease-out forwards',
          zIndex: 132,
          pointerEvents: 'none',
        }} />
      )}

      {running && !lineOn && (
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: Math.min(viewport.w * 0.74, RX * 2.18),
          height: Math.min(viewport.h * 0.28, RY * 2.12),
          transform: 'translate(-50%, -50%) rotate(-3deg)',
          borderRadius: '50%',
          border: '1px solid rgba(216,176,105,0.15)',
          boxShadow: '0 0 42px rgba(216,176,105,0.08), inset 0 0 32px rgba(196,72,55,0.08)',
          opacity: clamp01((elapsedMs - TIMING.orbit) / 800),
          zIndex: 8,
          pointerEvents: 'none',
        }} />
      )}

      {lineOn && !curtainOn && (
        <>
          <div style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: Math.min(viewport.w * 0.94, 980),
            height: 92,
            transform: `translate(-50%, -50%) translateY(${lineY + cardWidth * 0.45}px) scaleX(${lineRibbonProgress})`,
            transformOrigin: 'right center',
            borderRadius: 999,
            background: 'linear-gradient(90deg, transparent 0%, rgba(196,72,55,0.38) 22%, rgba(242,153,99,0.38) 48%, rgba(216,176,105,0.24) 70%, transparent 100%)',
            animation: 'silkBreath 1.2s ease-in-out infinite',
            opacity: lineRibbonProgress * 0.72,
            pointerEvents: 'none',
            zIndex: 122,
          }} />
          <div style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: Math.min(viewport.w * 0.86, 860),
            height: 2,
            transform: `translate(-50%, -50%) translateY(${lineY + cardWidth * 1.08}px) scaleX(${lineRibbonProgress})`,
            transformOrigin: 'right center',
            background: 'linear-gradient(90deg, transparent, rgba(216,176,105,0.18), rgba(242,153,99,0.72), rgba(216,176,105,0.42), transparent)',
            opacity: lineRibbonProgress,
            pointerEvents: 'none',
            zIndex: 123,
          }} />
        </>
      )}

      {running && displayedCards.map((item) => {
        const targetX = lineStartX + item.index * lineStep
        const centerOffset = item.index - (CARDS.length - 1) / 2
        const lineOrder = CARDS.length - 1 - item.index
        const lineDelay = lineOrder * LINE_CARD_STAGGER_MS
        const rawLineProgress = phase === 'cards-line'
          ? clamp01((lineSyncedMs - lineDelay) / LINE_CARD_TRAVEL_MS)
          : lineOn ? 1 : 0
        const lineProgress = easeInOutCubic(rawLineProgress)
        const settleProgress = clamp01((rawLineProgress - 0.74) / 0.26)
        const formBeatProgress = clamp01((musicElapsedSec - LINE_ENTRY_BEAT_SEC) / (LINE_SETTLE_BEAT_SEC - LINE_ENTRY_BEAT_SEC))
        const formBeatArc = Math.sin(formBeatProgress * Math.PI)
        const entryStagger = (CARDS.length - 1 - item.index) * Math.min(24, lineStep * 0.24)
        const entryX = (viewport.w / 2) + cardWidth * 1.4 + entryStagger
        const entryY = lineY - 24 + Math.sin(item.index * 0.7) * 26
        const overshoot = -Math.sin(lineProgress * Math.PI) * Math.min(42, lineStep * 0.52)
        const lift = formBeatArc * (-48 + Math.abs(centerOffset) * 3.2)
        const rhythmWave = Math.sin(formBeatProgress * Math.PI * 2 - lineOrder * 0.22) * 3.2 * formBeatArc
        const settleWave = Math.sin(settleProgress * Math.PI * 2 + item.index * 0.32) * 2.4 * (1 - settleProgress)
        const lineRhythmReady = lineOn ? easeOutCubic(clamp01((musicElapsedSec - LINE_WAVE_READY_SEC) / 0.08)) : 0
        const lineWave = lineOn ? musicWaveAt(musicElapsedSec, lineOrder) * lineRhythmReady : 0
        const lineWaveGlow = lineOn ? Math.pow((lineWave + 1) / 2, 1.5) * lineRhythmReady : 0
        const beatPulse = lineOn ? lineWaveGlow : beatPulseAt(musicElapsedSec, item.index * 0.028)
        const waveY = lineOn ? -lineWave * (7.5 + (1 - Math.abs(centerOffset) / 5) * 2.7) : -beatPulse * 5
        const waveX = lineOn ? Math.sin(lineWave * Math.PI) * 1.4 * lineRhythmReady : 0
        const cardX = lineOn ? lerp(entryX, targetX, lineProgress) + overshoot + waveX : item.pose.x
        const cardY = (lineOn ? lerp(entryY, lineY, lineProgress) + lift + rhythmWave + settleWave : item.pose.y) + waveY
        const settledScale = lerp(0.82, 1, easeOutBack(rawLineProgress, 0.48))
        const cardScale = lineOn
          ? settledScale + Math.sin(settleProgress * Math.PI) * 0.014 + lineWaveGlow * 0.024
          : item.pose.scale + beatPulse * 0.032
        const flutter = Math.sin(rawLineProgress * Math.PI * 2.4 + item.index * 0.55) * 5 * (1 - lineProgress)
        const settleRot = Math.sin(settleProgress * Math.PI * 2 + item.index) * 2.2 * (1 - settleProgress)
        const cardRot = lineOn
          ? lerp(-10, 0, lineProgress) + flutter + settleRot + lineWave * 0.9
          : item.pose.rotZ + beatPulse * (item.index % 2 === 0 ? 1.1 : -1.1)
        const cardOpacity = curtainOn ? 0 : lineOn ? easeOutCubic(clamp01(rawLineProgress * 1.35)) : item.pose.opacity
        const sceneCardX = cardX
        const sceneCardY = cardY
        const sceneCardScale = cardScale
        const exitX = item.index < CARDS.length / 2 ? '-130vw' : '130vw'
        const exitY = item.index < CARDS.length / 2
          ? -Math.abs(4 - item.index) * 8
          : -Math.abs(item.index - 5) * 8
        const transition = curtainOn
          ? `transform ${CURTAIN_OPEN_MS}ms cubic-bezier(0.22, 1, 0.36, 1), opacity 0.95s ease`
          : 'none'

        return (
          <div key={item.index} style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: curtainOn
              ? `translate(-50%, -50%) translate3d(${targetX}px, ${lineY + exitY}px, 0) translateX(${exitX}) scale(1.04) rotateZ(${item.index < 5 ? -8 : 8}deg)`
              : `translate(-50%, -50%) translate3d(${sceneCardX}px, ${sceneCardY}px, 0) scale(${sceneCardScale}) rotateZ(${cardRot}deg)`,
            opacity: cardOpacity,
            zIndex: lineOn ? 150 + item.index : item.zIdx,
            filter: lineOn
              ? `drop-shadow(0 16px 30px rgba(0,0,0,0.62)) drop-shadow(0 0 ${7 + beatPulse * 24}px rgba(216,176,105,${0.14 + beatPulse * 0.36}))`
              : `drop-shadow(0 ${15 * item.pose.scale}px ${25 * item.pose.scale}px rgba(0,0,0,0.7)) drop-shadow(0 0 ${4 + beatPulse * 12}px rgba(216,176,105,${beatPulse * 0.24}))`,
            pointerEvents: 'none',
            transition,
            transitionDelay: curtainOn ? `${Math.abs(item.index - 4.5) * 28}ms` : '0ms',
            willChange: 'transform, opacity',
          }}>
            <div style={{
              position: 'relative',
              transformStyle: 'preserve-3d',
            }}>
              {beatPulse > 0.04 && !curtainOn && (
                <div
                  style={{
                    position: 'absolute',
                    inset: '-7%',
                    borderRadius: 12,
                    border: `1px solid rgba(216,176,105,${0.12 + beatPulse * (lineOn ? 0.56 : 0.42)})`,
                    boxShadow: `0 0 ${8 + beatPulse * (lineOn ? 28 : 18)}px rgba(216,176,105,${0.12 + beatPulse * (lineOn ? 0.34 : 0.24)})`,
                    opacity: beatPulse * (lineOn ? 0.9 : 0.78),
                    pointerEvents: 'none',
                  }}
                />
              )}
              {lineOn && !curtainOn && rawLineProgress > 0 && rawLineProgress < 0.96 && (
                <div style={{
                  position: 'absolute',
                  inset: '9% -68% 9% 18%',
                  transform: `translateX(${28 * (1 - lineProgress)}px)`,
                  borderRadius: 14,
                  background: 'linear-gradient(90deg, rgba(242,153,99,0.34), rgba(216,176,105,0.16), transparent)',
                  filter: 'blur(9px)',
                  opacity: (1 - lineProgress) * 0.82,
                  zIndex: -1,
                }} />
              )}
              <BaiChoiCard card={item.card} width={cardWidth} />
            </div>
          </div>
        )
      })}

      {choiVisible && (
        <div style={{
          position: 'absolute', left: '50%', top: '50%', 
          transform: choiTransform,
          opacity: choiOpacity,
          filter: choiOpacity > 0.2 ? 'blur(0px)' : 'blur(10px)',
          transition: 'opacity 0.55s ease, filter 0.8s ease',
          zIndex: 20,
          willChange: 'transform, opacity',
        }}>
          <div style={{
            width: 'clamp(220px, 32vw, 380px)',
            position: 'relative',
            willChange: 'transform, opacity',
          }}>
            <img 
              src="/assets/choi.png" 
              alt="Chòi" 
              style={{
                width: '100%', 
                filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.95))',
                opacity: 1,
              }} 
            />
            {LANTERN_SPOTS.map((spot, index) => {
              const spotGlow = clamp01(lanternGlow - spot.delay)

              return (
                <div
                  key={index}
                  style={{
                    position: 'absolute',
                    left: `${spot.left}%`,
                    top: `${spot.top}%`,
                    width: spot.size,
                    height: spot.size,
                    transform: 'translate(-50%, -50%)',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(242,153,99,0.9) 0%, rgba(216,176,105,0.58) 28%, rgba(196,72,55,0.2) 52%, transparent 74%)',
                    boxShadow: `0 0 ${18 + spotGlow * 28}px rgba(242,153,99,${0.22 + spotGlow * 0.5})`,
                    filter: 'blur(7px)',
                    mixBlendMode: 'screen',
                    opacity: spotGlow * (1 - choiExitProgress),
                    pointerEvents: 'none',
                  }}
                />
              )
            })}
          </div>
        </div>
      )}

      {running && !lineOn && (
        <div style={{
          position: 'absolute', bottom: '10%', left: '50%',
          animation: 'titleFade 2s ease-out forwards',
          zIndex: 100, textAlign: 'center'
        }}>
          <h1 style={{
            fontFamily: 'Playfair Display, serif', color: '#D8B069',
            fontSize: '3.8rem', letterSpacing: 0, fontWeight: 900,
            textShadow: '0 0 40px rgba(216,176,105,0.3)'
          }}>BÀI CHÒI</h1>
          <p style={{color: 'rgba(216,176,105,0.5)', letterSpacing: 0, textTransform: 'uppercase', fontSize: '0.9rem', marginTop: '0.6rem'}}>
            Di Sản Văn Hóa Phi Vật Thể UNESCO
          </p>
        </div>
      )}

      {curtainOn && choiExitProgress < 0.86 && (
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '48%',
          transform: 'translate(-50%, -50%)',
          animation: 'inkReveal 0.75s cubic-bezier(0.22, 1, 0.36, 1) forwards',
          opacity: Math.max(0, 1 - choiExitProgress * 1.12),
          zIndex: 140,
          textAlign: 'center',
          pointerEvents: 'none',
        }}>
          <div style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 'clamp(44px, 8vw, 82px)',
            lineHeight: 1,
            fontWeight: 900,
            color: '#D8B069',
            letterSpacing: 0,
            animation: 'brushWipe 0.92s cubic-bezier(0.22, 1, 0.36, 1) forwards',
            textShadow: '0 18px 48px rgba(0,0,0,0.58), 0 0 28px rgba(216,176,105,0.32)',
            whiteSpace: 'nowrap',
          }}>
            Bài Chòi
          </div>
          <div
            style={{
              width: 'min(52vw, 360px)',
              height: 8,
              margin: '14px auto 0',
              borderRadius: 999,
              background: 'linear-gradient(90deg, transparent 0%, rgba(196,72,55,0.6) 14%, rgba(242,153,99,0.88) 38%, rgba(216,176,105,0.9) 68%, transparent 100%)',
              clipPath: 'polygon(0 38%, 10% 26%, 28% 45%, 48% 28%, 68% 52%, 86% 34%, 100% 48%, 100% 88%, 0 78%)',
              transformOrigin: 'left center',
              animation: 'brushUnderline 0.82s 0.12s cubic-bezier(0.22, 1, 0.36, 1) both',
              filter: 'drop-shadow(0 0 10px rgba(216,176,105,0.28))',
            }}
          />
          {[0, 1, 2, 3, 4].map((dot) => (
            <div
              key={dot}
              style={{
                position: 'absolute',
                left: `${18 + dot * 15}%`,
                top: `${58 + (dot % 2) * 9}%`,
                width: 4 + (dot % 3),
                height: 4 + (dot % 3),
                borderRadius: '50%',
                background: dot % 2 === 0 ? '#D8B069' : '#F29963',
                boxShadow: '0 0 12px rgba(216,176,105,0.45)',
                animation: `inkFleck 0.9s ${0.16 + dot * 0.08}s ease-out both`,
                pointerEvents: 'none',
              }}
            />
          ))}
        </div>
      )}

      {autoplayBlocked && !audioStarted && (
        <button
          type="button"
          onPointerDown={(event) => {
            event.stopPropagation()
            void startAudio()
          }}
          onClick={(event) => event.stopPropagation()}
          className="absolute bottom-10 left-10 flex items-center gap-3 rounded-full border border-[#D8B069]/30 bg-black/40 px-5 py-3 text-xs font-semibold uppercase text-[#D8B069] shadow-[0_12px_34px_rgba(0,0,0,0.35)] backdrop-blur transition-all hover:bg-[#D8B069]/10 z-[200]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M4 9v6h4l5 5V4L8 9H4Zm12.5 3c0-1.6-.86-3-2.15-3.76v7.52A4.3 4.3 0 0 0 16.5 12Zm-2.15-7.4v2.06A6.4 6.4 0 0 1 18.5 12a6.4 6.4 0 0 1-4.15 6.02v2.06A8.35 8.35 0 0 0 20.5 12a8.35 8.35 0 0 0-6.15-7.4Z"/>
          </svg>
          Chạm để nghe
        </button>
      )}

      <button 
        onClick={skipIntro} 
        onPointerDown={(event) => event.stopPropagation()}
        className="absolute bottom-10 right-10 px-8 py-3 rounded-full border border-[#D8B069]/20 bg-black/30 text-[#D8B069]/60 text-xs tracking-widest hover:bg-[#D8B069]/10 hover:text-[#D8B069] transition-all z-[200] uppercase"
      >
        Bỏ qua →
      </button>
    </div>
  )
}
