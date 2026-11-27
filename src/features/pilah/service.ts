import { create } from 'zustand'

export type Waste = 'organic' | 'inorganic' | 'unknown'
export type Mode = 'simulation' | 'real'
export type Severity = 'info' | 'warning' | 'critical'
export type Settings = {
  appName: string
  operator: string
  threshold: number
  dry: number
  wet: number
  depthOrganic: number
  depthInorganic: number
  warningLevel: number
  mode: Mode
}
export type Telemetry = {
  moisture: number
  organic: number
  inorganic: number
  angle: number
  detected: boolean
  sensor: boolean
  arduino: boolean
  esp32: boolean
  uart: boolean
  wifi: boolean
  servo: boolean
  led: boolean
  buzzer: boolean
  automatic: boolean
  timestamp: number
}
export type SortingRecord = {
  id: string
  timestamp: number
  waste: Waste
  moisture: number | null
  success: boolean
  servo: number
  organic: number
  inorganic: number
  available: number
}
export type Notice = {
  id: string
  title: string
  detail: string
  severity: Severity
  timestamp: number
  read: boolean
}
type DeviceCommand = { type: 'update'; values: Partial<Telemetry> } | { type: 'sort'; moisture?: number } | { type: 'empty' } | { type: 'restart' }
interface DeviceAdapter {
  read(): Telemetry | null
  send(command: DeviceCommand): boolean
}

const initialSettings: Settings = {
  appName: 'Pilah Monitor', operator: 'Operator', threshold: 55, dry: 0, wet: 100,
  depthOrganic: 40, depthInorganic: 40, warningLevel: 80, mode: 'simulation',
}
const openTelemetry = (organic = 68, inorganic = 42): Telemetry => ({
  moisture: 67, organic, inorganic, angle: 90, detected: false, sensor: true,
  arduino: true, esp32: true, uart: true, wifi: true, servo: true,
  led: true, buzzer: false, automatic: true, timestamp: Date.now(),
})

const timeZone = 'Asia/Jakarta'
const dateFormat = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })
const displayTime = new Intl.DateTimeFormat('id-ID', { timeZone, hour: '2-digit', minute: '2-digit' })
const displayDate = new Intl.DateTimeFormat('id-ID', { timeZone, day: '2-digit', month: 'short', year: 'numeric' })
export const dateKey = (date: number) => dateFormat.format(date)
export const formatTime = (date: number) => displayTime.format(date)
export const formatDate = (date: number) => displayDate.format(date)
export const number = (value: number) => value.toLocaleString('id-ID', { maximumFractionDigits: 1 })
export const wasteNames: Record<Waste, string> = { organic: 'Organik', inorganic: 'Anorganik', unknown: 'Tidak diketahui' }
export const connections = [
  ['arduino', 'Arduino Uno'], ['esp32', 'ESP32'], ['uart', 'Komunikasi UART'], ['wifi', 'Koneksi WiFi'],
] as const
export const clamp = (value: number) => Math.max(0, Math.min(100, value))

function load<T>(name: string, fallback: T): T {
  try {
    const saved = localStorage.getItem('pilah-v1-' + name)
    return saved ? JSON.parse(saved) as T : fallback
  } catch {
    return fallback
  }
}
function save(name: string, value: unknown) {
  try {
    localStorage.setItem('pilah-v1-' + name, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

function demoHistory(): SortingRecord[] {
  const counts = [112, 144, 123, 183, 158, 203, 177]
  const now = Date.now()
  const start = Date.parse(dateKey(now) + 'T00:00:00+07:00')
  return Array.from({ length: 62 }, (_, ago) => {
    const count = counts[6 - ago % 7] - (ago >= 7 ? 24 + ago % 17 : 0)
    const startOfDay = start - ago * 864e5
    const availableTime = ago === 0 ? now - start : 14 * 36e5
    return Array.from({ length: count }, (_, i) => {
      const organic = (i * 13 + ago * 3) % 100 < 64
      const successful = (i + ago) % 59 !== 1
      return {
        id: 'PLH-' + (ago * 250 + i + 10000),
        timestamp: startOfDay + (ago === 0 ? 0 : 7 * 36e5) + Math.floor(availableTime * (i + 1) / (count + 1)),
        waste: organic ? 'organic' as const : 'inorganic' as const,
        moisture: organic ? 57 + i % 37 : 12 + i % 37,
        success: successful, servo: successful ? organic ? 145 : 35 : 90,
        organic: (19 + i * 3 + ago * 5) % 83,
        inorganic: (8 + i * 2 + ago * 4) % 74,
        available: successful ? 100 : 75,
      }
    }).reverse()
  }).flat()
}

const noticesSeed: Notice[] = [
  { id: 'demo-1', title: 'Wadah organik mencapai 80%', detail: 'Kapasitas melewati batas peringatan pada sesi sebelumnya.', severity: 'warning', timestamp: Date.now() - 53 * 60000, read: false },
  { id: 'demo-2', title: 'Koneksi ESP32 dipulihkan', detail: 'Data telemetri simulasi kembali tersedia.', severity: 'info', timestamp: Date.now() - 127 * 60000, read: false },
  { id: 'demo-3', title: 'Simulasi siap digunakan', detail: 'Perangkat virtual PILAH-001 siap menerima data.', severity: 'info', timestamp: Date.now() - 186 * 60000, read: true },
]
type Condition = { key: string; title: string; detail: string; severity: Severity }
function activeConditions(telemetry: Telemetry, settings: Settings): Condition[] {
  const bins = (['organic', 'inorganic'] as const).flatMap((key) => {
    const level = telemetry[key]
    if (level < settings.warningLevel) return []
    const full = level >= 100
    return [{
      key: key + (full ? '-full' : '-warning'),
      title: full ? 'Wadah ' + wasteNames[key].toLowerCase() + ' penuh' : 'Wadah ' + wasteNames[key].toLowerCase() + ' mencapai ' + number(level) + '%',
      detail: full ? 'Kosongkan wadah sebelum melanjutkan pemilahan.' : 'Kapasitas melewati batas peringatan.',
      severity: full ? 'critical' as const : 'warning' as const,
    }]
  })
  const faults = [
    ['sensor', 'Sensor tidak memberikan data'], ['arduino', 'Arduino terputus'],
    ['esp32', 'ESP32 terputus'], ['uart', 'Komunikasi UART gagal'],
    ['wifi', 'WiFi terputus'], ['servo', 'Servo mengalami gangguan'],
  ] as const
  return [...bins, ...faults.filter(([key]) => !telemetry[key]).map(([key, title]) => ({
    key, title, detail: 'Periksa status komponen di laboratorium simulasi.', severity: 'critical' as const,
  }))]
}

export function classify(telemetry: Telemetry, settings: Settings): Waste {
  if (!telemetry.sensor || !telemetry.arduino || !Number.isFinite(telemetry.moisture)
    || telemetry.moisture < settings.dry || telemetry.moisture > settings.wet) return 'unknown'
  const calibrated = (telemetry.moisture - settings.dry) / (settings.wet - settings.dry) * 100
  return calibrated >= settings.threshold ? 'organic' : 'inorganic'
}

type State = {
  settings: Settings
  telemetry: Telemetry
  history: SortingRecord[]
  notices: Notice[]
  running: boolean
  speed: number
  storageError: boolean
  command: (command: DeviceCommand) => boolean
  setRunning: (running: boolean) => void
  setSpeed: (speed: number) => void
  saveSettings: (settings: Settings) => void
  updateNotices: (update: (previous: Notice[]) => Notice[]) => void
  reset: () => void
}
type Persistent = Pick<State, 'settings' | 'telemetry' | 'history' | 'notices' | 'speed'>
function persist(update: Partial<Persistent>) {
  return Object.entries(update).map(([key, value]) => save(key, value)).every(Boolean)
}

function announce(previous: State, telemetry: Telemetry, settings: Settings) {
  const existing = new Set(activeConditions(previous.telemetry, previous.settings).map(({ key }) => key))
  const additions = activeConditions(telemetry, settings).filter(({ key }) => !existing.has(key))
  return additions.length ? [
    ...additions.map(({ title, detail, severity }) => ({ id: crypto.randomUUID(), title, detail, severity, read: false, timestamp: Date.now() })),
    ...previous.notices,
  ] : previous.notices
}

function simulationResult(state: State, command: DeviceCommand): Partial<Persistent> {
  const now = Date.now()
  let telemetry = { ...state.telemetry, timestamp: now }
  let history = state.history
  switch (command.type) {
    case 'restart':
      telemetry = openTelemetry(telemetry.organic, telemetry.inorganic)
      break
    case 'empty':
      telemetry = { ...telemetry, organic: 0, inorganic: 0, buzzer: false, detected: false }
      break
    case 'update':
      telemetry = { ...telemetry, ...command.values }
      break
    case 'sort': {
      telemetry.detected = true
      if (command.moisture !== undefined) telemetry.moisture = command.moisture
      const waste = classify(telemetry, state.settings)
      const success = waste !== 'unknown' && telemetry.servo && telemetry[waste] < 100 && telemetry.automatic
      if (success) {
        telemetry[waste] = clamp(telemetry[waste] + 2)
        telemetry.angle = waste === 'organic' ? 145 : 35
      }
      telemetry.buzzer = telemetry.organic >= 100 || telemetry.inorganic >= 100
      history = [{
        id: 'PLH-' + crypto.randomUUID().slice(0, 8).toUpperCase(), timestamp: now, waste,
        moisture: telemetry.sensor && telemetry.arduino ? telemetry.moisture : null, success, servo: telemetry.angle,
        organic: telemetry.organic, inorganic: telemetry.inorganic,
        available: connections.filter(([key]) => telemetry[key]).length * 25,
      }, ...history]
      break
    }
  }
  const notices = announce(state, telemetry, state.settings)
  return {
    telemetry,
    ...(history !== state.history ? { history } : {}),
    ...(notices !== state.notices ? { notices } : {}),
  }
}

const simulationAdapter: DeviceAdapter = {
  read: () => usePilah.getState().telemetry,
  send(command) {
    usePilah.setState((state) => {
      const update = simulationResult(state, command)
      return { ...update, storageError: !persist(update) }
    })
    return true
  },
}

// Replace this adapter when an authenticated telemetry and control transport is available.
const realDeviceAdapter: DeviceAdapter = { read: () => null, send: () => false }
export const deviceService = (mode: Mode): DeviceAdapter => mode === 'simulation' ? simulationAdapter : realDeviceAdapter

export const usePilah = create<State>((set, get) => ({
  settings: load('settings', initialSettings),
  telemetry: load('telemetry', openTelemetry()),
  history: load<SortingRecord[] | null>('history', null) ?? demoHistory(),
  notices: load('notices', noticesSeed),
  speed: load('speed', 2500),
  running: false,
  storageError: false,
  command: (command) => deviceService(get().settings.mode).send(command),
  setRunning: (running) => set({ running: running && get().settings.mode === 'simulation' }),
  setSpeed: (speed) => set({ speed, storageError: !persist({ speed }) }),
  saveSettings: (settings) => set((state) => {
    const notices = settings.mode === 'simulation' ? announce(state, state.telemetry, settings) : state.notices
    return { settings, notices, running: false, storageError: !persist({ settings, notices }) }
  }),
  updateNotices: (update) => set((state) => {
    const notices = update(state.notices)
    return { notices, storageError: !persist({ notices }) }
  }),
  reset: () => {
    if (get().settings.mode !== 'simulation') return
    const update = { telemetry: openTelemetry(0, 0), history: [], notices: [], speed: 2500 }
    set({ ...update, running: false, storageError: !persist(update) })
  },
}))

export type Period = 'day' | 'week' | 'month' | 'custom'
export type Range = { period: Period; start: string; end: string }
export const defaultRange: Range = { period: 'week', start: '', end: '' }
const dayMs = 864e5
export function rangeBounds({ period, start, end }: Range, now = Date.now()) {
  const today = Date.parse(dateKey(now) + 'T00:00:00+07:00')
  const first = period === 'custom' ? start ? Date.parse(start + 'T00:00:00+07:00') : -Infinity
    : today - (period === 'day' ? 0 : period === 'week' ? 6 : 29) * dayMs
  const last = period === 'custom' ? end ? Date.parse(end + 'T00:00:00+07:00') + dayMs : Infinity : today + dayMs
  return { first, last }
}
export function filterHistory(history: SortingRecord[], range: Range) {
  const { first, last } = rangeBounds(range)
  return history.filter(({ timestamp }) => timestamp >= first && timestamp < last)
}
export function summarize(history: SortingRecord[]) {
  return history.reduce((stats, row) => {
    if (row.success) {
      stats.success++
      stats[row.waste]++
    }
    stats.organicLevel += row.organic
    stats.inorganicLevel += row.inorganic
    stats.availability += row.available
    return stats
  }, { success: 0, organic: 0, inorganic: 0, unknown: 0, organicLevel: 0, inorganicLevel: 0, availability: 0 })
}
export function chartSeries(history: SortingRecord[], range: Range) {
  const bounds = rangeBounds(range)
  const today = Date.parse(dateKey(Date.now()) + 'T00:00:00+07:00')
  const oldest = history[history.length - 1]
  const first = Number.isFinite(bounds.first) ? bounds.first : oldest ? Date.parse(dateKey(oldest.timestamp) + 'T00:00:00+07:00') : today
  const end = Number.isFinite(bounds.last) ? bounds.last : history[0] ? Date.parse(dateKey(history[0].timestamp) + 'T00:00:00+07:00') + dayMs : today + dayMs
  const days = Math.max(0, Math.ceil((end - first) / dayMs))
  const step = range.period === 'day' ? 3 * 36e5 : Math.max(1, Math.ceil(days / (range.period === 'month' ? 10 : 14))) * dayMs
  const labels = new Intl.DateTimeFormat('id-ID', days === 7 ? { timeZone, weekday: 'short' } : { timeZone, day: 'numeric', month: 'short' })
  const buckets = Array.from({ length: Math.ceil(Math.max(0, end - first) / step) }, (_, i) => ({
    label: range.period === 'day' ? formatTime(first + i * step) : labels.format(first + i * step),
    organic: 0, inorganic: 0, availability: 0, samples: 0,
  }))
  for (const row of history) {
    const bucket = buckets[Math.floor((row.timestamp - first) / step)]
    if (!bucket) continue
    if (row.success && row.waste !== 'unknown') bucket[row.waste]++
    bucket.availability += row.available
    bucket.samples++
  }
  return buckets.map((bucket) => ({ ...bucket, performance: bucket.samples ? Math.round(bucket.availability / bucket.samples) : null }))
}

export function exportCsv(file: string, rows: (string | number | null)[][]) {
  const csv = rows.map((row) => row.map((value) => '"' + String(value ?? '').replace(/"/g, '""') + '"').join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = file
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

