import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Activity, Box, CircleCheck, CircuitBoard, Cpu, Leaf, Package, Radio, Recycle, Wifi } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ActivityChart, Capacity, Composition, Empty, EmptyNotices, Metric, NoticeItem, PageHeading, Panel, PeriodFilter, Status, WasteBadge } from './shared'
import { connections, defaultRange, filterHistory, formatTime, number, summarize, usePilah, wasteNames, type Range } from './service'

export function BinIllustration() {
  return <div aria-hidden='true' className='hero-art'>
    <div className='hero-orb hero-orb-outer'/><div className='hero-orb hero-orb-inner'/>
    <div className='hero-art-grid'/>
    <span className='hero-signal'><Wifi size={18} strokeWidth={1.8}/></span>
    <div className='hero-device'><span/><span/><span/></div>
    <div className='hero-bin hero-bin-organic'>
      <div className='hero-bin-lid'/><div className='hero-bin-face'><Leaf size={32} strokeWidth={1.55}/></div>
    </div>
    <div className='hero-bin hero-bin-inorganic'>
      <div className='hero-bin-lid'/><div className='hero-bin-face'><Recycle size={32} strokeWidth={1.55}/></div>
    </div>
    <div className='hero-platform'/>
  </div>
}

export function Dashboard() {
  const [range, setRange] = useState<Range>(defaultRange)
  const { telemetry, settings, history, notices, running } = usePilah()
  const simulated = settings.mode === 'simulation'
  const records = simulated ? filterHistory(history, range) : []
  const { success, organic, inorganic } = summarize(records)
  const connected = simulated && telemetry.sensor && telemetry.servo && connections.every(([key]) => telemetry[key])
  const recent = simulated ? history.slice(0, 4) : []
  const displayNotices = simulated ? notices.slice(0, 3) : []
  const labels = [Cpu, CircuitBoard, Radio, Wifi]

  return <>
    <PageHeading title='Dashboard' description='Ringkasan aktivitas pemilahan dan kondisi perangkat.'><PeriodFilter range={range} update={setRange}/></PageHeading>

    <section className='pilah-hero relative isolate flex min-h-[204px] min-w-0 items-center overflow-hidden rounded-[17px] px-5 py-6 sm:px-7 lg:px-8' aria-label='Ringkasan status sistem'>
      <div className='relative z-10 max-w-[530px] space-y-2.5'>
        <div className='inline-flex items-center gap-2 rounded-full border border-[#79b18566] bg-[#e0fac719] px-2.5 py-1 text-xs font-semibold text-[#e2f7d6]'>
          <span className='size-1.5 rounded-full bg-[#b8f395]' aria-hidden='true'/>
          {simulated ? running ? 'Simulasi berjalan' : 'Mode Simulasi' : 'Mode Perangkat Fisik'}
        </div>
        <h2 className='font-manrope text-[25px] leading-tight font-extrabold tracking-[-.042em] text-white sm:text-[32px]'>Sistem Pemilahan Sampah</h2>
        <p className='max-w-[390px] text-sm leading-relaxed text-[#d2e6d7]'>Pantau kapasitas wadah, aktivitas pemilahan, dan koneksi perangkat PILAH-001.</p>
        <Button asChild className='mt-1 min-h-11 rounded-lg bg-[#c1efa9] px-3.5 font-semibold text-[#183e2b] hover:bg-[#e0f7d6]'>
          <Link to='/monitoring'><Activity size={16}/>Monitoring Real-Time</Link>
        </Button>
      </div>
      <BinIllustration/>
    </section>

    <section aria-label='Statistik pemilahan' className='grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-4'>
      <Metric title='Total Dipilah' value={number(success)} note={records.length ? `Dari ${number(records.length)} percobaan` : 'Pemilahan berhasil pada periode ini'} icon={Box}/>
      <Metric title='Sampah Organik' value={number(organic)} note={success ? `${number(organic / success * 100)}% dari pemilahan berhasil` : 'Pemilahan berhasil pada periode ini'} icon={Leaf} tone='lime'/>
      <Metric title='Sampah Anorganik' value={number(inorganic)} note={success ? `${number(inorganic / success * 100)}% dari pemilahan berhasil` : 'Pemilahan berhasil pada periode ini'} icon={Package} tone='amber'/>
      <Metric title='Tingkat Keberhasilan' value={records.length ? number(success / records.length * 100) + '%' : '—'} note='Persentase dari seluruh percobaan' icon={CircleCheck} tone='blue'/>
    </section>

    <section aria-label='Grafik pemilahan' className='pilah-columns'>
      <Panel title='Aktivitas Pemilahan' subtitle='Jumlah item berhasil dipilah per periode.'>
        <ActivityChart history={records} range={range}/>
      </Panel>
      <Panel title='Komposisi Sampah' subtitle='Perbandingan hasil pemilahan.'>
        <Composition history={records}/>
      </Panel>
    </section>

    <section aria-label='Kondisi perangkat' className='grid min-w-0 gap-4 lg:grid-cols-2'>
      <Panel title='Kapasitas Wadah' subtitle='Batas peringatan mengikuti pengaturan perangkat.'>
        {simulated ? <div className='grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2'>
          <Capacity label='Organik' percent={telemetry.organic} warningLevel={settings.warningLevel} tone='green'/>
          <Capacity label='Anorganik' percent={telemetry.inorganic} warningLevel={settings.warningLevel} tone='lime'/>
        </div> : <Empty text='Telemetri wadah belum tersedia.'/>}
      </Panel>
      <Panel title='Status Sistem' subtitle='Kondisi koneksi PILAH-001.' action={<Status good={connected} positive='Operasional' negative={simulated ? 'Perlu diperiksa' : 'Belum terhubung'}/>}>
        <div className='grid min-w-0 grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2'>
          {connections.map(([key, title], i) => {
            const Icon = labels[i]
            return <div key={key} className='flex min-w-0 items-center gap-2 rounded-lg bg-muted/55 px-2.5 py-2 text-sm'>
              <Icon size={16} className='shrink-0 text-muted-foreground'/><span className='min-w-0 flex-1'>{title}</span>
              <Status good={simulated && telemetry[key]} positive='Aktif'/>
            </div>
          })}
        </div>
      </Panel>
    </section>

    <section aria-label='Aktivitas terbaru' className='pilah-columns'>
      <Panel title='Pemilahan Terbaru' action={<Button asChild variant='ghost' className='min-h-11 text-primary'><Link to='/riwayat'>Lihat riwayat</Link></Button>}>
        {recent.length ? <div>
          {recent.map((row) => <div key={row.id} className='flex flex-wrap items-center gap-2 border-b border-border py-3 text-sm last:border-b-0'>
            <span className='font-semibold'>{row.id}</span><WasteBadge waste={row.waste}/>
            <span className='hidden text-muted-foreground sm:inline'>{wasteNames[row.waste] === 'Tidak diketahui' ? 'Sensor tidak valid' : row.success ? 'Berhasil' : 'Gagal'}</span>
            <span className='ml-auto text-xs text-muted-foreground'>{formatTime(row.timestamp)} WIB</span>
          </div>)}
        </div> : <Empty text='Belum ada aktivitas pemilahan.'/>}
      </Panel>
      <Panel title='Notifikasi Terbaru' action={<Button asChild variant='ghost' className='min-h-11 text-primary'><Link to='/notifikasi'>Lihat semua</Link></Button>}>
        {displayNotices.length ? <div>{displayNotices.map((notice) => <NoticeItem key={notice.id} notice={notice}/>)}</div> : <EmptyNotices/>}
      </Panel>
    </section>
  </>
}

