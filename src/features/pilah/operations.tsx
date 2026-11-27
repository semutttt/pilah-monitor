import { useState, type ReactNode } from 'react'
import { Activity, AudioLines, Cable, CircleGauge, Cpu, Droplets, Gauge, Lightbulb, Pause, Play, Plus, Radar, RotateCcw, Trash2, Wifi, type LucideIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Capacity, Empty, Metric, PageHeading, Panel, Select, Status, WasteBadge } from './shared'
import { clamp, classify, connections, deviceService, formatDate, formatTime, number, usePilah, type Telemetry } from './service'

export function RangeField({ label, value, min = 0, max = 100, unit = '%', disabled, onChange }: { label: string; value: number; min?: number; max?: number; unit?: string; disabled?: boolean; onChange: (value: number) => void }) {
  return <label className='block min-w-0 rounded-xl border border-border px-3.5 pt-3 pb-1'>
    <span className='flex items-center justify-between gap-2 text-sm font-semibold'><span>{label}</span><span aria-hidden='true' className='shrink-0 text-primary tabular-nums'>{number(value)}{unit}</span></span>
    <input type='range' className='block h-11 w-full min-w-0 cursor-pointer accent-[#37835b] outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50' min={min} max={max} value={value} disabled={disabled} onChange={(event) => onChange(Number(event.target.value))}/>
  </label>
}

function ToggleField({ label, value, onChange, disabled }: { label: string; value: boolean; onChange: (value: boolean) => void; disabled?: boolean }) {
  return <label className='flex min-h-12 min-w-0 cursor-pointer items-center justify-between gap-3 rounded-lg border border-border px-3 text-sm font-medium'>
    <span>{label}</span><Switch aria-label={label} checked={value} onCheckedChange={onChange} disabled={disabled} className='relative shrink-0 cursor-pointer after:absolute after:-inset-y-3 after:inset-x-0 after:content-[""]'/>
  </label>
}

export function ConfirmAction({ children, title, description, onConfirm }: { children: ReactNode; title: string; description: string; onConfirm: () => void }) {
  return <AlertDialog>
    <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader><AlertDialogTitle>{title}</AlertDialogTitle><AlertDialogDescription>{description}</AlertDialogDescription></AlertDialogHeader>
      <AlertDialogFooter><AlertDialogCancel className='min-h-11'>Batal</AlertDialogCancel><AlertDialogAction className='min-h-11' onClick={onConfirm}>Konfirmasi</AlertDialogAction></AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
}

export function Monitoring() {
  const { settings, telemetry: simulation } = usePilah()
  const telemetry = settings.mode === 'simulation' ? simulation : deviceService('real').read()
  return <>
    <PageHeading title='Monitoring Real-Time' description='Pantau pembacaan sensor, aktuator, dan koneksi PILAH-001.'/>
    {!telemetry ? <Panel title='Telemetri perangkat'><Empty text='Menunggu koneksi dari perangkat fisik.'/></Panel> : <>
      <section className='grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4' aria-label='Pembacaan langsung'>
        <Metric title='Kelembapan' value={telemetry.sensor && telemetry.arduino ? number(telemetry.moisture) + '%' : '—'} note='Pembacaan mentah sensor kapasitif' icon={Droplets} tone='blue'/>
        <Metric title='Deteksi Sampah' value={telemetry.detected ? 'Terdeteksi' : 'Kosong'} note={telemetry.detected ? 'Objek berada pada area sensor' : 'Menunggu sampah masuk'} icon={Radar} tone='lime'/>
        <Metric title='Posisi Servo' value={telemetry.servo ? number(telemetry.angle) + '°' : '—'} note='Sudut aktuator MG996R' icon={CircleGauge}/>
        <Metric title='Pembaruan' value={formatTime(telemetry.timestamp)} note={formatDate(telemetry.timestamp) + ' · WIB'} icon={Activity} tone='amber'/>
      </section>
      <section className='grid min-w-0 gap-4 md:grid-cols-2'>
        <Panel title='Sensor Ultrasonik' subtitle='Jarak dari sensor ke permukaan isi wadah.'>
          <Capacity label='Wadah organik' percent={telemetry.organic} warningLevel={settings.warningLevel} distance={settings.depthOrganic * (1 - telemetry.organic / 100)} tone='green'/>
          <Capacity label='Wadah anorganik' percent={telemetry.inorganic} warningLevel={settings.warningLevel} distance={settings.depthInorganic * (1 - telemetry.inorganic / 100)} tone='lime'/>
        </Panel>
        <Panel title='Aktuator dan Koneksi'>
          <div className='divide-y divide-border'>
            {[...connections, ['servo', 'Servo'], ['led', 'LED'], ['buzzer', 'Buzzer']].map(([key, title]) => <div className='flex min-h-10 items-center justify-between gap-2 py-1.5 text-sm' key={key}>
              <span>{title}</span><Status good={Boolean(telemetry[key as keyof Telemetry])} positive={key === 'led' || key === 'buzzer' ? 'Menyala' : 'Aktif'} negative={key === 'led' || key === 'buzzer' ? 'Mati' : 'Terputus'}/>
            </div>)}
          </div>
        </Panel>
      </section>
    </>}
  </>
}

export function Simulation() {
  const { settings, telemetry, running, speed, command, setRunning, setSpeed, reset } = usePilah()
  const moistureTarget = (target: 'organic' | 'inorganic') => {
    const calibrated = target === 'organic' ? (100 + settings.threshold) / 2 : settings.threshold / 2
    return settings.dry + (settings.wet - settings.dry) * calibrated / 100
  }
  const update = (values: Partial<Telemetry>) => command({ type: 'update', values })
  const add = (target?: 'organic' | 'inorganic') => {
    command(target ? { type: 'sort', moisture: moistureTarget(target) } : { type: 'sort' })
    const row = usePilah.getState().history[0]
    if (row.success) toast.success('Sampah berhasil dipilah')
    else toast.warning('Percobaan tersimpan dengan status gagal')
  }
  return <>
    <PageHeading title='Laboratorium Simulasi' description='Uji sensor dan proses pemilahan melalui perangkat virtual.'/>
    {settings.mode === 'real' ? <Panel title='Simulasi dijeda'><Empty text='Pilih Mode Simulasi di Pengaturan untuk menguji perangkat virtual.'/></Panel> : <>
      <Panel title='Sesi Simulasi' subtitle='Pemilahan otomatis menambahkan aktivitas sesuai kecepatan yang dipilih.' action={<Status good={running} positive='Berjalan' negative='Dijeda'/>}>
        <div className='flex min-w-0 flex-wrap items-center gap-2'>
          <Button onClick={() => setRunning(true)} disabled={running} className='min-h-11'><Play size={16}/>Mulai Simulasi</Button>
          <Button variant='outline' onClick={() => setRunning(false)} disabled={!running} className='min-h-11'><Pause size={16}/>Jeda Simulasi</Button>
          <ConfirmAction title='Reset data simulasi?' description='Riwayat dan notifikasi simulasi akan dihapus. Kapasitas kedua wadah kembali ke 0%.' onConfirm={() => { reset(); toast.success('Data simulasi direset') }}>
            <Button variant='outline' className='min-h-11'><RotateCcw size={16}/>Reset Simulasi</Button>
          </ConfirmAction>
          <Select label='Kecepatan simulasi' value={String(speed)} onChange={(value) => setSpeed(Number(value))}><option value='5000'>Lambat · 5 detik</option><option value='2500'>Normal · 2,5 detik</option><option value='1000'>Cepat · 1 detik</option></Select>
        </div>
      </Panel>
      <section className='grid min-w-0 gap-4 lg:grid-cols-2'>
        <Panel title='Sensor dan Pemilahan' action={<WasteBadge waste={classify(telemetry, settings)}/>}>
          <RangeField label='Kelembapan mentah' value={telemetry.moisture} onChange={(moisture) => update({ moisture })}/>
          <ToggleField label='Sampah terdeteksi' value={telemetry.detected} onChange={(detected) => update({ detected })}/>
          <ToggleField label='Data sensor tersedia' value={telemetry.sensor} onChange={(sensor) => update({ sensor })}/>
          <div className='flex flex-wrap gap-2'>
            <Button className='min-h-11' onClick={() => add()}><Plus size={17}/>Tambah Sampah</Button>
            <Button className='min-h-11' variant='outline' onClick={() => add('organic')}>Simulasi Organik</Button>
            <Button className='min-h-11' variant='outline' onClick={() => add('inorganic')}>Simulasi Anorganik</Button>
          </div>
          <p className='text-sm leading-relaxed text-muted-foreground'>Dalam prototipe, sampah basah dipetakan ke organik dan sampah kering ke anorganik. Kelembapan saja tidak menentukan jenis material.</p>
        </Panel>
        <Panel title='Kapasitas Wadah' subtitle='Ubah kapasitas atau jarak ultrasonik. Keduanya saling memperbarui.' action={<Button variant='outline' className='min-h-11' onClick={() => { command({ type: 'empty' }); toast.success('Kedua wadah dikosongkan') }}><Trash2 size={16}/>Kosongkan Wadah</Button>}>
          {(['organic', 'inorganic'] as const).map((key) => {
            const organic = key === 'organic'
            const depth = organic ? settings.depthOrganic : settings.depthInorganic
            const label = organic ? 'organik' : 'anorganik'
            return <div className='grid min-w-0 gap-2 sm:grid-cols-2' key={key}>
              <RangeField label={'Kapasitas ' + label} value={telemetry[key]} onChange={(level) => update({ [key]: level })}/>
              <RangeField label={'Ultrasonik ' + label} value={Math.round(depth * (1 - telemetry[key] / 100))} max={depth} unit=' cm' onChange={(distance) => update({ [key]: clamp(Math.round((1 - distance / depth) * 100)) })}/>
            </div>
          })}
        </Panel>
        <Panel title='Koneksi Virtual' subtitle='Matikan koneksi untuk menguji peringatan.'>
          <div className='grid min-w-0 gap-2 sm:grid-cols-2'>
            {connections.map(([key, title]) => <ToggleField key={key} label={title} value={telemetry[key]} onChange={(value) => update({ [key]: value })}/>)}
          </div>
        </Panel>
        <Panel title='Aktuator Virtual'>
          <RangeField label='Sudut servo' value={telemetry.angle} max={180} unit='°' onChange={(angle) => update({ angle })}/>
          <div className='grid min-w-0 gap-2 sm:grid-cols-2'>
            {([['servo', 'Servo operasional'], ['led', 'LED'], ['buzzer', 'Buzzer']] as const).map(([key, label]) => <ToggleField key={key} label={label} value={telemetry[key]} onChange={(value) => update({ [key]: value })}/>)}
          </div>
        </Panel>
      </section>
    </>}
  </>
}

const devices: { name: string; description: string; icon: LucideIcon; key: keyof Telemetry; optional?: boolean }[] = [
  { name: 'Arduino Uno', icon: Cpu, key: 'arduino', description: 'Memproses input sensor dan mengendalikan aktuator.' },
  { name: 'ESP32', icon: Wifi, key: 'esp32', description: 'Mengirim telemetri melalui jaringan WiFi.' },
  { name: 'Sensor kapasitif', icon: Droplets, key: 'sensor', description: 'Membaca kelembapan untuk klasifikasi awal.' },
  { name: 'Ultrasonik organik', icon: Radar, key: 'arduino', description: 'Mengukur permukaan isi wadah organik.' },
  { name: 'Ultrasonik anorganik', icon: Radar, key: 'arduino', description: 'Mengukur permukaan isi wadah anorganik.' },
  { name: 'Sensor IR', icon: Cable, key: 'detected', description: 'Opsi untuk mendeteksi sampah masuk.', optional: true },
  { name: 'Servo MG996R', icon: Gauge, key: 'servo', description: 'Menggerakkan pengarah sampah ke wadah.' },
  { name: 'LCD 16×2 I2C', icon: Activity, key: 'arduino', description: 'Menampilkan pembacaan dan status perangkat.' },
  { name: 'Buzzer', icon: AudioLines, key: 'buzzer', description: 'Memberi peringatan suara saat diperlukan.' },
  { name: 'LED', icon: Lightbulb, key: 'led', description: 'Memberi indikator visual aktivitas sistem.' },
]

export function Devices() {
  const { settings, telemetry } = usePilah()
  const simulated = settings.mode === 'simulation'
  return <>
    <PageHeading title='Manajemen Perangkat' description='Inventaris dan kondisi komponen PILAH-001.'/>
    <section className='grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3'>
      {devices.map(({ name, description, icon: Icon, key, optional }) => {
        const attached = simulated && !optional && Boolean(key === 'led' || key === 'buzzer' ? telemetry.arduino : telemetry[key])
        const operational = attached && Boolean(telemetry[key])
        return <Panel key={name} title={name} subtitle={description} action={<span className='tone-green grid size-10 shrink-0 place-items-center rounded-lg'><Icon size={18}/></span>}>
          <dl className='space-y-2 text-sm'>
            <div className='flex flex-wrap items-center justify-between gap-1.5'><dt className='text-muted-foreground'>Koneksi</dt><dd><Status good={attached} positive='Simulasi aktif' negative={optional ? 'Opsional' : 'Terputus'}/></dd></div>
            <div className='flex flex-wrap items-center justify-between gap-1.5'><dt className='text-muted-foreground'>Operasional</dt><dd className='font-semibold'>{operational ? 'Aktif' : attached ? 'Siaga' : '—'}</dd></div>
            <div className='flex flex-wrap items-center justify-between gap-1.5'><dt className='text-muted-foreground'>Data terakhir</dt><dd className='font-semibold'>{attached ? formatTime(telemetry.timestamp) + ' WIB' : '—'}</dd></div>
          </dl>
        </Panel>
      })}
    </section>
  </>
}

export function Control() {
  const { settings, telemetry, command } = usePilah()
  const [testing, setTesting] = useState(false)
  const available = settings.mode === 'simulation' || deviceService('real').read() !== null
  const manual = available && !telemetry.automatic && telemetry.arduino
  const servoControl = manual && telemetry.servo
  const update = (values: Partial<Telemetry>) => command({ type: 'update', values })
  const testBuzzer = () => {
    const previous = telemetry.buzzer
    if (!update({ buzzer: true })) return
    setTesting(true)
    window.setTimeout(() => {
      deviceService(settings.mode).send({ type: 'update', values: { buzzer: previous } })
      setTesting(false)
    }, 1200)
  }
  return <>
    <PageHeading title='Kontrol Perangkat' description='Atur mode operasi, servo, dan indikator PILAH-001.'/>
    <section className='grid min-w-0 gap-4 md:grid-cols-2'>
      <Panel title='Mode Operasi' subtitle='Pilih manual untuk mengubah posisi servo secara langsung.' action={<Status good={available} positive='Simulasi aktif' negative='Koneksi diperlukan'/>}>
        <div className='flex flex-wrap gap-2' role='group' aria-label='Mode operasi'>
          <Button aria-pressed={available && telemetry.automatic} disabled={!available} variant={telemetry.automatic ? 'default' : 'outline'} onClick={() => update({ automatic: true })} className='min-h-11'>Otomatis</Button>
          <Button aria-pressed={available && !telemetry.automatic} disabled={!available} variant={!telemetry.automatic ? 'default' : 'outline'} onClick={() => update({ automatic: false })} className='min-h-11'>Manual</Button>
        </div>
      </Panel>
      <Panel title='Servo MG996R'>
        <RangeField label='Sudut servo' value={available ? telemetry.angle : 0} max={180} unit='°' disabled={!servoControl} onChange={(angle) => update({ angle })}/>
        <div className='flex flex-wrap gap-2'><Button variant='outline' className='min-h-11' disabled={!servoControl} onClick={() => update({ angle: 145 })}>Buka Servo</Button><Button variant='outline' className='min-h-11' disabled={!servoControl} onClick={() => update({ angle: 90 })}>Tutup Servo</Button></div>
      </Panel>
      <Panel title='Indikator'>
        <ToggleField label='LED' value={available && telemetry.led} disabled={!available || !telemetry.arduino} onChange={(led) => update({ led })}/>
        <Button variant='outline' className='min-h-11 self-start' disabled={!available || !telemetry.arduino || testing} onClick={testBuzzer}><AudioLines size={16}/>{testing ? 'Pengujian berjalan' : 'Uji Buzzer'}</Button>
      </Panel>
      <Panel title='Reset Sistem' subtitle='Mulai ulang koneksi dan aktuator dengan mempertahankan riwayat pemilahan.'>
        <ConfirmAction title='Mulai ulang perangkat?' description='Aktuator dan status koneksi akan kembali ke pengaturan awal.' onConfirm={() => { if (command({ type: 'restart' })) toast.success('Perangkat virtual dimulai ulang') }}>
          <Button variant='outline' className='min-h-11 self-start' disabled={!available}><RotateCcw size={16}/>Reset Sistem</Button>
        </ConfirmAction>
      </Panel>
    </section>
  </>
}

