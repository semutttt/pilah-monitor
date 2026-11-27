import { useState, type FormEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { Activity, Cpu, Droplets, Radio, Recycle, Save, Settings2, type LucideIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTheme } from '@/context/theme-provider'
import { PageHeading, Panel, Select } from './shared'
import { usePilah, type Mode, type Settings } from './service'

function Numeric({ label, value, min, max, onChange }: { label: string; value: string; min: number; max: number; onChange: (value: string) => void }) {
  return <label className='min-w-0 space-y-1.5 text-sm font-semibold'><span className='block'>{label}</span>
    <Input required type='number' step='1' inputMode='numeric' min={min} max={max} value={value} className='min-h-11 w-full' onChange={(event) => onChange(event.target.value)}/>
  </label>
}
const numericKeys = ['threshold', 'dry', 'wet', 'depthOrganic', 'depthInorganic', 'warningLevel'] as const
type NumericKey = (typeof numericKeys)[number]

export function SettingsPage() {
  const { settings, saveSettings } = usePilah()
  const { theme, setTheme } = useTheme()
  const [profile, setProfile] = useState({ appName: settings.appName, operator: settings.operator, mode: settings.mode })
  const [draft, setDraft] = useState(() => Object.fromEntries(numericKeys.map((key) => [key, String(settings[key])])) as Record<NumericKey, string>)
  const [error, setError] = useState('')
  const field = (key: NumericKey) => ({ value: draft[key], onChange: (value: string) => setDraft((previous) => ({ ...previous, [key]: value })) })
  const submit = (event: FormEvent) => {
    event.preventDefault()
    const values = Object.fromEntries(numericKeys.map((key) => [key, Number(draft[key])])) as Pick<Settings, NumericKey>
    if (values.wet <= values.dry) {
      setError('Nilai acuan basah harus lebih besar dari nilai acuan kering.')
      return
    }
    const appName = profile.appName.trim()
    const operator = profile.operator.trim()
    if (!appName || !operator) {
      setError('Isi nama aplikasi dan nama operator.')
      return
    }
    saveSettings({ ...values, ...profile, appName, operator })
    setError('')
    toast.success('Pengaturan disimpan')
  }
  return <>
    <PageHeading title='Pengaturan' description='Sesuaikan kalibrasi sensor, kapasitas wadah, mode sistem, dan profil.'/>
    <form onSubmit={submit} className='space-y-5'>
      <div className='grid min-w-0 gap-4 md:grid-cols-2'>
        <Panel title='Kalibrasi dan Klasifikasi' subtitle='Nilai awal untuk simulasi. Sesuaikan berdasarkan pengujian sensor.'>
          <Numeric label='Ambang kelembapan terkalibrasi (%)' min={1} max={99} {...field('threshold')}/>
          <div className='grid min-w-0 gap-3 sm:grid-cols-2'>
            <Numeric label='Acuan kering (%)' min={0} max={99} {...field('dry')}/>
            <Numeric label='Acuan basah (%)' min={1} max={100} {...field('wet')}/>
          </div>
          <p className='text-sm leading-relaxed text-muted-foreground'>Bacaan pada atau di atas ambang dikelompokkan sebagai basah. Bacaan di luar rentang kalibrasi ditandai tidak diketahui.</p>
        </Panel>
        <Panel title='Wadah dan Peringatan' subtitle='Kedalaman wadah digunakan untuk menghitung jarak ultrasonik.'>
          <div className='grid min-w-0 gap-3 sm:grid-cols-2'>
            <Numeric label='Kedalaman organik (cm)' min={5} max={300} {...field('depthOrganic')}/>
            <Numeric label='Kedalaman anorganik (cm)' min={5} max={300} {...field('depthInorganic')}/>
          </div>
          <Numeric label='Batas peringatan kapasitas (%)' min={1} max={99} {...field('warningLevel')}/>
        </Panel>
        <Panel title='Mode Sistem dan Tampilan'>
          <label className='min-w-0 space-y-1.5 text-sm font-semibold'><span className='block'>Mode perangkat</span>
            <Select label='Mode perangkat' value={profile.mode} onChange={(mode) => setProfile((previous) => ({ ...previous, mode: mode as Mode }))}><option value='simulation'>Simulasi</option><option value='real'>Perangkat fisik</option></Select>
          </label>
          <label className='min-w-0 space-y-1.5 text-sm font-semibold'><span className='block'>Tema antarmuka</span>
            <Select label='Tema antarmuka' value={theme} onChange={(value) => setTheme(value as typeof theme)}><option value='system'>Ikuti sistem</option><option value='light'>Terang</option><option value='dark'>Gelap</option></Select>
          </label>
        </Panel>
        <Panel title='Profil Aplikasi'>
          <label className='min-w-0 space-y-1.5 text-sm font-semibold'><span className='block'>Nama aplikasi</span><Input required maxLength={38} value={profile.appName} onChange={(event) => setProfile((previous) => ({ ...previous, appName: event.target.value }))} className='min-h-11 w-full'/></label>
          <label className='min-w-0 space-y-1.5 text-sm font-semibold'><span className='block'>Nama operator</span><Input required maxLength={38} value={profile.operator} onChange={(event) => setProfile((previous) => ({ ...previous, operator: event.target.value }))} className='min-h-11 w-full'/></label>
        </Panel>
      </div>
      {error && <p role='alert' className='tone-red rounded-lg px-4 py-3 text-sm'>{error}</p>}
      <Button type='submit' className='min-h-11'><Save size={17}/>Simpan Pengaturan</Button>
    </form>
  </>
}

const architecture: { title: string; text: string; icon: LucideIcon }[] = [
  { title: 'Mikrokontroler', text: 'Arduino Uno memproses pembacaan dan mengendalikan aktuator. ESP32 mengirimkan telemetri.', icon: Cpu },
  { title: 'Komunikasi', text: 'UART menghubungkan kedua mikrokontroler. WiFi menjadi jalur telemetri ESP32.', icon: Radio },
  { title: 'Sensor', text: 'Sensor kapasitif membaca kelembapan dan sensor ultrasonik mengukur kapasitas wadah.', icon: Droplets },
  { title: 'Aktuator', text: 'Servo MG996R mengarahkan sampah. LCD, LED, dan buzzer menampilkan status alat.', icon: Settings2 },
]
export function About() {
  return <>
    <PageHeading title='Tentang Sistem' description='Cara Pilah Monitor memantau alat pemilah sampah otomatis.'/>
    <Panel title='Pilah Monitor' subtitle='Smart Waste Sorting & IoT Monitoring System' action={<span className='tone-green grid size-11 place-items-center rounded-xl'><Recycle size={24}/></span>}>
      <p className='max-w-3xl text-sm leading-relaxed text-muted-foreground'>Pilah Monitor menggabungkan pemantauan perangkat, pemilahan berbasis kelembapan, dan pengelolaan data sampah dalam satu dashboard.</p>
      <div className='flex flex-wrap gap-2'><Button asChild className='min-h-11'><Link to='/monitoring'><Activity size={17}/>Monitoring Real-Time</Link></Button><Button asChild variant='outline' className='min-h-11'><Link to='/simulasi'>Buka Laboratorium</Link></Button></div>
    </Panel>
    <section className='grid min-w-0 gap-3 sm:grid-cols-2'>
      {architecture.map(({ title, text, icon: Icon }) => <Panel key={title} title={title} action={<span className='tone-green grid size-10 place-items-center rounded-lg'><Icon size={18}/></span>}><p className='text-sm leading-relaxed text-muted-foreground'>{text}</p></Panel>)}
    </section>
    <Panel title='Klasifikasi Prototipe' subtitle='Pembacaan kelembapan dikelompokkan menjadi basah atau kering.'>
      <p className='text-sm leading-relaxed text-muted-foreground'>Simulasi memetakan basah ke organik dan kering ke anorganik sebagai asumsi demonstrasi. Sensor kelembapan saja tidak dapat memastikan material organik atau anorganik. Pengukuran di luar kondisi kalibrasi menghasilkan status tidak diketahui.</p>
    </Panel>
  </>
}

