import { useMemo, useState } from 'react'
import { Activity, Archive, Bell, Check, ChevronLeft, ChevronRight, Download, Printer, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ActivityChart, Composition, Empty, EmptyNotices, Metric, NoticeItem, PageHeading, Panel, PeriodFilter, Select, Status, WasteBadge } from './shared'
import { chartSeries, defaultRange, exportCsv, filterHistory, formatDate, formatTime, number, rangeBounds, summarize, usePilah, wasteNames, type Range, type SortingRecord } from './service'

function recordRows(history: SortingRecord[]) {
  return [
    ['ID transaksi', 'Tanggal', 'Waktu WIB', 'Jenis', 'Kelembapan (%)', 'Klasifikasi', 'Status', 'Servo (derajat)'],
    ...history.map((row) => [row.id, formatDate(row.timestamp), formatTime(row.timestamp), wasteNames[row.waste], row.moisture, row.waste === 'organic' ? 'Basah' : row.waste === 'inorganic' ? 'Kering' : 'Tidak valid', row.success ? 'Berhasil' : 'Gagal', row.servo]),
  ]
}

export function HistoryPage() {
  const { history, settings } = usePilah()
  const [query, setQuery] = useState('')
  const [waste, setWaste] = useState('all')
  const [range, setRange] = useState<Range>({ ...defaultRange, period: 'custom' })
  const [page, setPage] = useState(1)
  const rows = useMemo(() => {
    if (settings.mode === 'real') return []
    const text = query.trim().toLocaleLowerCase('id-ID')
    return filterHistory(history, range).filter((row) => (
      (waste === 'all' || waste === row.waste)
      && (!text || [row.id, wasteNames[row.waste], formatDate(row.timestamp), row.success ? 'berhasil' : 'gagal'].some((value) => value.toLocaleLowerCase('id-ID').includes(text)))
    ))
  }, [history, query, settings.mode, range, waste])
  const pageSize = 10
  const pages = Math.max(1, Math.ceil(rows.length / pageSize))
  const current = Math.min(page, pages)
  const from = (current - 1) * pageSize
  return <>
    <PageHeading title='Riwayat Pemilahan' description='Telusuri transaksi pemilahan berdasarkan tanggal, kategori, atau ID.'>
      <Button variant='outline' className='min-h-11' disabled={!rows.length} onClick={() => exportCsv('pilah-riwayat.csv', recordRows(rows))}><Download size={16}/>Ekspor CSV</Button>
    </PageHeading>
    <Panel title='Transaksi Pemilahan' subtitle={`${number(rows.length)} transaksi sesuai filter.`}>
      <div className='flex min-w-0 flex-wrap items-end gap-2'>
        <div className='relative min-w-0 flex-[1_1_190px]'>
          <Search size={17} className='pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground'/>
          <Input aria-label='Cari transaksi' placeholder='Cari transaksi…' value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} className='min-h-11 w-full ps-9'/>
        </div>
        <Select label='Jenis sampah' value={waste} onChange={(value) => { setWaste(value); setPage(1) }} className='w-full sm:w-auto'>
          <option value='all'>Semua jenis</option><option value='organic'>Organik</option><option value='inorganic'>Anorganik</option><option value='unknown'>Tidak diketahui</option>
        </Select>
      </div>
      <div className='flex min-w-0 flex-wrap gap-2'>
        <label className='min-w-0 flex-[1_1_130px] text-xs font-semibold text-muted-foreground'>Dari tanggal<Input type='date' className='mt-1 min-h-11 w-full min-w-0' value={range.start} max={range.end || undefined} onChange={(event) => { setRange({ ...range, start: event.target.value }); setPage(1) }}/></label>
        <label className='min-w-0 flex-[1_1_130px] text-xs font-semibold text-muted-foreground'>Sampai tanggal<Input type='date' className='mt-1 min-h-11 w-full min-w-0' value={range.end} min={range.start || undefined} onChange={(event) => { setRange({ ...range, end: event.target.value }); setPage(1) }}/></label>
      </div>
      {rows.length ? <>
        <p className='text-xs text-muted-foreground lg:hidden'>Geser tabel untuk melihat seluruh kolom.</p>
        <div role='region' aria-label='Tabel riwayat pemilahan, dapat digulir horizontal' tabIndex={0} className='table-scroll min-w-0 overflow-x-auto rounded-xl border border-border focus-visible:ring-2 focus-visible:ring-ring'>
          <Table className='min-w-[850px]'>
            <TableHeader className='bg-muted/75'><TableRow>{['ID transaksi', 'Tanggal dan waktu', 'Jenis sampah', 'Kelembapan', 'Klasifikasi', 'Status', 'Servo'].map((heading) => <TableHead scope='col' key={heading} className='h-11 px-3 font-semibold'>{heading}</TableHead>)}</TableRow></TableHeader>
            <TableBody>{rows.slice(from, from + pageSize).map((row) => <TableRow key={row.id}>
              <TableCell className='px-3 py-3 font-semibold'>{row.id}</TableCell>
              <TableCell className='px-3'>{formatDate(row.timestamp)} · {formatTime(row.timestamp)} WIB</TableCell>
              <TableCell className='px-3'><WasteBadge waste={row.waste}/></TableCell>
              <TableCell className='px-3 tabular-nums'>{row.moisture === null ? '—' : number(row.moisture) + '%'}</TableCell>
              <TableCell className='px-3'>{row.waste === 'organic' ? 'Basah' : row.waste === 'inorganic' ? 'Kering' : 'Tidak valid'}</TableCell>
              <TableCell className='px-3'><Status good={row.success} positive='Berhasil' negative='Gagal'/></TableCell>
              <TableCell className='px-3 tabular-nums'>{row.servo}°</TableCell>
            </TableRow>)}</TableBody>
          </Table>
        </div>
        <div className='flex min-w-0 flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground'>
          <span>{number(from + 1)}–{number(Math.min(from + pageSize, rows.length))} dari {number(rows.length)}</span>
          <div className='flex items-center gap-1.5' aria-label='Paginasi'>
            <Button size='icon' variant='outline' className='size-11' aria-label='Halaman sebelumnya' disabled={current <= 1} onClick={() => setPage(current - 1)}><ChevronLeft size={17}/></Button>
            <span className='px-1.5 tabular-nums'>Halaman {current} / {pages}</span>
            <Button size='icon' variant='outline' className='size-11' aria-label='Halaman berikutnya' disabled={current >= pages} onClick={() => setPage(current + 1)}><ChevronRight size={17}/></Button>
          </div>
        </div>
      </> : <Empty text='Tidak ada transaksi yang cocok dengan filter.'/>}
    </Panel>
  </>
}

export function Analytics() {
  const { history, settings } = usePilah()
  const [range, setRange] = useState(defaultRange)
  const records = settings.mode === 'simulation' ? filterHistory(history, range) : []
  const totals = summarize(records)
  const bounds = rangeBounds(range)
  const duration = bounds.last - bounds.first
  const previous = (Number.isFinite(duration) && settings.mode === 'simulation') ? history.filter((row) => row.timestamp >= bounds.first - duration && row.timestamp < bounds.first && row.success).length : 0
  const average = (sum: number) => records.length ? number(sum / records.length) + '%' : '—'
  const difference = previous ? (totals.success - previous) / previous * 100 : null
  const exportReport = () => exportCsv('pilah-laporan.csv', [
    ['Periode', 'Rentang mulai', 'Rentang akhir', 'Berhasil', 'Organik', 'Anorganik', 'Rata-rata kapasitas organik', 'Rata-rata kapasitas anorganik', 'Koneksi aktif'],
    [range.period, Number.isFinite(bounds.first) ? formatDate(bounds.first) : '', Number.isFinite(bounds.last) ? formatDate(bounds.last - 1) : '', totals.success, totals.organic, totals.inorganic, average(totals.organicLevel), average(totals.inorganicLevel), average(totals.availability)],
    [],
    ['Interval', 'Organik', 'Anorganik', 'Koneksi aktif (%)'],
    ...chartSeries(records, range).map((row) => [row.label, row.organic, row.inorganic, row.performance]),
    [],
    ...recordRows(records),
  ])
  return <>
    <PageHeading title='Statistik dan Analitik' description='Evaluasi tren pemilahan, komposisi, dan ketersediaan perangkat.'/>
    <div className='print-hide flex min-w-0 flex-wrap items-end justify-between gap-2'>
      <PeriodFilter range={range} update={setRange}/>
      <div className='flex flex-wrap gap-2'><Button variant='outline' className='min-h-11' disabled={!records.length} onClick={exportReport}><Download size={16}/>Unduh CSV</Button><Button variant='outline' className='min-h-11' disabled={!records.length} onClick={() => window.print()}><Printer size={16}/>Cetak / PDF</Button></div>
    </div>
    <section className='grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4' aria-label='Ringkasan analitik'>
      <Metric title='Berhasil Dipilah' value={number(totals.success)} note='Total hasil pada periode aktif' icon={Archive}/>
      <Metric title='Tren Aktivitas' value={difference === null ? '—' : (difference > 0 ? '+' : '') + number(difference) + '%'} note='Dibanding periode sebelumnya' icon={Activity} tone='lime'/>
      <Metric title='Rata-rata Wadah Organik' value={average(totals.organicLevel)} note='Kapasitas saat setiap pemilahan' icon={Archive} tone='amber'/>
      <Metric title='Rata-rata Wadah Anorganik' value={average(totals.inorganicLevel)} note='Kapasitas saat setiap pemilahan' icon={Archive} tone='blue'/>
    </section>
    <section className='pilah-columns'>
      <Panel title='Tren Pemilahan' subtitle='Jumlah pemilahan berhasil menurut periode yang dipilih.'><ActivityChart history={records} range={range}/></Panel>
      <Panel title='Komposisi Sampah' subtitle='Persentase hasil pemilahan per kategori.'><Composition history={records}/></Panel>
    </section>
    <Panel title='Performa Koneksi Perangkat' subtitle='Rata-rata koneksi aktif pada setiap percobaan pemilahan.' action={<span className='tone-green rounded-full px-3 py-1.5 text-xs font-semibold'>{average(totals.availability)} aktif</span>}>
      <ActivityChart history={records} range={range} performance/>
    </Panel>
  </>
}

export function Notifications() {
  const { notices, settings, updateNotices } = usePilah()
  const [filter, setFilter] = useState('all')
  const all = settings.mode === 'simulation' ? notices : []
  const unread = all.filter((notice) => !notice.read).length
  const rows = all.filter((notice) => filter === 'all' || (filter === 'unread' ? !notice.read : notice.severity === filter))
  return <>
    <PageHeading title='Notifikasi' description='Tinjau peringatan kapasitas, koneksi, serta kondisi perangkat.'>
      <Button variant='outline' className='min-h-11' disabled={!unread} onClick={() => updateNotices((previous) => previous.map((notice) => ({ ...notice, read: true })))}><Check size={17}/>Tandai Semua Dibaca</Button>
    </PageHeading>
    <Panel title='Pusat Notifikasi' subtitle={`${unread} notifikasi belum dibaca.`} action={<Select value={filter} label='Filter notifikasi' onChange={setFilter}>
      <option value='all'>Semua notifikasi</option><option value='unread'>Belum dibaca</option><option value='info'>Informasi</option><option value='warning'>Peringatan</option><option value='critical'>Kritis</option>
    </Select>}>
      {rows.length ? <div>{rows.map((notice) => <NoticeItem key={notice.id} notice={notice} action={<div className='flex shrink-0 items-center gap-1'>
        {!notice.read && <Button size='icon' variant='ghost' className='size-11' aria-label={`Tandai dibaca: ${notice.title}`} onClick={() => updateNotices((previous) => previous.map((entry) => entry.id === notice.id ? { ...entry, read: true } : entry))}><Check size={17}/></Button>}
        <Button size='icon' variant='ghost' className='size-11 text-destructive' aria-label={`Hapus: ${notice.title}`} onClick={() => updateNotices((previous) => previous.filter((entry) => entry.id !== notice.id))}><Trash2 size={17}/></Button>
      </div>}/>)}</div> : all.length ? <Empty text='Tidak ada notifikasi yang cocok dengan filter.'/> : <EmptyNotices/>}
    </Panel>
    <div className='flex flex-wrap gap-3 text-sm text-muted-foreground' aria-label='Kategori notifikasi'>
      <span className='tone-green inline-flex items-center gap-2 rounded-full px-3 py-1.5'><Bell size={14}/>Informasi</span>
      <span className='tone-amber rounded-full px-3 py-1.5'>Peringatan</span>
      <span className='tone-red rounded-full px-3 py-1.5'>Kritis</span>
    </div>
  </>
}

