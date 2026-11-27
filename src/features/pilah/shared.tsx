import type { ReactNode } from 'react'
import { CartesianGrid, Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Bell, CircleCheck, CircleAlert, ChevronDown, Clock3, Database, Leaf, Package, TriangleAlert, type LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { chartSeries, formatDate, formatTime, number, summarize, wasteNames, type Notice, type Range, type SortingRecord, type Waste } from './service'

export const selectClass = 'min-h-11 min-w-0 max-w-full appearance-none rounded-lg border border-input bg-card py-2 ps-3 pe-9 text-sm font-medium shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring'
export function PageHeading({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return <div className='flex min-w-0 flex-col items-start justify-between gap-4 lg:flex-row lg:items-center'>
    <div className='min-w-0'>
      <h1 className='font-manrope text-[28px] leading-tight font-extrabold tracking-[-.045em] sm:text-[34px]'>{title}</h1>
      <p className='mt-1.5 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]'>{description}</p>
    </div>
    {children}
  </div>
}

export function Panel({ title, subtitle, action, children, className }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <Card className={cn('min-w-0 gap-4 rounded-[15px] border-border px-4 py-5 shadow-[0_1px_2px_#17382907] sm:px-5', className)}>
    <div className='flex min-w-0 flex-wrap items-start justify-between gap-x-3 gap-y-2'>
      <div className='min-w-0'>
        <h2 className='font-manrope text-[17px] leading-tight font-extrabold tracking-[-.02em]'>{title}</h2>
        {subtitle && <p className='mt-1 text-sm leading-relaxed text-muted-foreground'>{subtitle}</p>}
      </div>
      {action}
    </div>
    {children}
  </Card>
}

export function Metric({ title, value, note, icon: Icon, tone = 'green' }: { title: string; value: string; note: string; icon: LucideIcon; tone?: 'green' | 'lime' | 'amber' | 'blue' }) {
  return <Card className='metric-card min-w-0 gap-0 rounded-[15px] px-4 py-4 shadow-[0_1px_2px_#17382907] sm:px-5'>
    <div className='flex min-h-11 items-start justify-between gap-2'>
      <p className='pt-1.5 text-sm leading-tight font-semibold text-muted-foreground'>{title}</p>
      <span className={cn('tone-' + tone, 'grid size-10 shrink-0 place-items-center rounded-[10px]')}><Icon size={19} strokeWidth={1.85}/></span>
    </div>
    <p className='font-manrope text-[30px] leading-tight font-extrabold tracking-[-.045em] tabular-nums'>{value}</p>
    <p className='mt-1.5 text-[13px] leading-snug text-muted-foreground'>{note}</p>
  </Card>
}

export function Empty({ text = 'Belum ada data untuk ditampilkan.' }: { text?: string }) {
  return <div className='flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground'><Database size={21} aria-hidden='true'/><p>{text}</p></div>
}

export function Select({ label, value, onChange, children, className }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode; className?: string }) {
  return <div className={cn('relative min-w-0', className)}>
    <select aria-label={label} className={cn(selectClass, 'w-full')} value={value} onChange={(event) => onChange(event.target.value)}>{children}</select>
    <ChevronDown size={15} className='pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground' aria-hidden='true'/>
  </div>
}

export function PeriodFilter({ range, update }: { range: Range; update: (range: Range) => void }) {
  return <div className='flex w-full min-w-0 flex-wrap items-end gap-2 lg:w-auto'>
    <Select label='Periode data' value={range.period} onChange={(period) => update({ ...range, period: period as Range['period'] })} className='w-full sm:w-auto'>
      <option value='day'>Hari ini</option><option value='week'>7 hari terakhir</option><option value='month'>30 hari terakhir</option><option value='custom'>Rentang tanggal</option>
    </Select>
    {range.period === 'custom' && <>
      <label className='min-w-0 flex-[1_1_130px] text-xs font-semibold text-muted-foreground'>Dari<Input type='date' className='mt-1 min-h-11 w-full min-w-0 bg-card' value={range.start} max={range.end || undefined} onChange={(event) => update({ ...range, start: event.target.value })}/></label>
      <label className='min-w-0 flex-[1_1_130px] text-xs font-semibold text-muted-foreground'>Sampai<Input type='date' className='mt-1 min-h-11 w-full min-w-0 bg-card' value={range.end} min={range.start || undefined} onChange={(event) => update({ ...range, end: event.target.value })}/></label>
    </>}
  </div>
}

const chartColors = ['var(--pilah-chart-organic)', 'var(--pilah-chart-inorganic)']
export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return <div className='flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-medium text-muted-foreground'>{items.map(({ label, color }) => <span key={label} className='flex items-center gap-1.5'><span aria-hidden='true' className='size-2.5 rounded-[3px]' style={{ background: color }}/>{label}</span>)}</div>
}

export function ActivityChart({ history, range, performance = false }: { history: SortingRecord[]; range: Range; performance?: boolean }) {
  if (!history.length) return <Empty text='Tidak ada aktivitas pada periode ini.'/>
  const data = chartSeries(history, range)
  return <div className='min-w-0 space-y-4'>
    {!performance && <Legend items={[{ label: 'Organik', color: chartColors[0] }, { label: 'Anorganik', color: chartColors[1] }]}/>}
    <div className='h-[200px] w-full min-w-0 sm:h-[205px]' aria-label={performance ? 'Grafik ketersediaan koneksi' : 'Grafik jumlah pemilahan'}>
      <ResponsiveContainer width='100%' height='100%' minWidth={0}>
        <AreaChart data={data} margin={{ top: 7, right: 9, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={performance ? 'fill-performance' : 'fill-organic'} x1='0' x2='0' y1='0' y2='1'><stop offset='0%' stopColor={chartColors[0]} stopOpacity={0.24}/><stop offset='100%' stopColor={chartColors[0]} stopOpacity={0.025}/></linearGradient>
            <linearGradient id='fill-inorganic' x1='0' x2='0' y1='0' y2='1'><stop offset='0%' stopColor={chartColors[1]} stopOpacity={0.32}/><stop offset='100%' stopColor={chartColors[1]} stopOpacity={0.08}/></linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke='var(--border)' strokeDasharray='4 4'/>
          <XAxis dataKey='label' tickLine={false} axisLine={false} tickMargin={10} minTickGap={17} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}/>
          <YAxis width={34} tickCount={5} allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} domain={performance ? [0, 100] : [0, 'auto']} unit={performance ? '%' : ''}/>
          <Tooltip cursor={{ stroke: 'var(--border)', strokeWidth: 2 }} contentStyle={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)', borderRadius: 10, fontSize: 13 }} itemStyle={{ color: 'var(--foreground)' }}/>
          {performance
            ? <Area dataKey='performance' name='Koneksi aktif' type='monotone' stroke={chartColors[0]} strokeWidth={2.5} fill='url(#fill-performance)' isAnimationActive={false}/>
            : <>
              <Area dataKey='inorganic' name='Anorganik' type='monotone' stroke={chartColors[1]} strokeWidth={2.5} fill='url(#fill-inorganic)' isAnimationActive={false}/>
              <Area dataKey='organic' name='Organik' type='monotone' stroke={chartColors[0]} strokeWidth={2.75} fill='url(#fill-organic)' isAnimationActive={false}/>
            </>}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
}

export function Composition({ history }: { history: SortingRecord[] }) {
  const { organic, inorganic } = summarize(history)
  const total = organic + inorganic
  const rows = [{ name: 'Organik', value: organic }, { name: 'Anorganik', value: inorganic }]
  return <>
    <div className='relative mx-auto h-[166px] w-full max-w-[240px]' aria-label={`Organik ${organic}, anorganik ${inorganic}`}>
      <ResponsiveContainer width='100%' height='100%' minWidth={0}>
        <PieChart>
          <Pie data={total ? rows : [{ name: 'Kosong', value: 1 }]} nameKey='name' dataKey='value' outerRadius={78} innerRadius={60} startAngle={90} endAngle={-270} stroke='none' paddingAngle={organic && inorganic ? 3 : 0} cornerRadius={4} isAnimationActive={false}>
            {(total ? rows : [{ name: 'Kosong' }]).map(({ name }, i) => <Cell key={name} fill={total ? chartColors[i] : 'var(--muted)'}/>)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className='pointer-events-none absolute inset-0 grid place-content-center text-center' aria-hidden='true'>
        <span className='font-manrope text-[28px] leading-tight font-extrabold tracking-[-.05em]'>{number(total)}</span>
        <span className='text-xs text-muted-foreground'>Total item</span>
      </div>
    </div>
    <div className='space-y-2'>
      {rows.map(({ name, value }, i) => <div key={name} className='flex items-center justify-between gap-2 text-sm'>
        <span className='flex items-center gap-2 text-muted-foreground'><span className='size-2.5 rounded-full' style={{ background: chartColors[i] }}/>{name}</span>
        <span className='font-bold tabular-nums'>{total ? number(value / total * 100) : 0}%</span>
      </div>)}
    </div>
  </>
}

export function WasteBadge({ waste }: { waste: Waste }) {
  const Icon = waste === 'organic' ? Leaf : waste === 'inorganic' ? Package : CircleAlert
  return <span className={cn('inline-flex min-h-6 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap', waste === 'organic' ? 'tone-green' : waste === 'inorganic' ? 'tone-amber' : 'bg-muted text-muted-foreground')}><Icon size={13}/>{wasteNames[waste]}</span>
}

export function Status({ good, positive = 'Aktif', negative = 'Terputus' }: { good: boolean; positive?: string; negative?: string }) {
  return <span className={cn('inline-flex min-h-6 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap', good ? 'tone-green' : 'tone-red')}><span className='size-1.5 rounded-full bg-current' aria-hidden='true'/>{good ? positive : negative}</span>
}

export function NoticeItem({ notice, action }: { notice: Notice; action?: ReactNode }) {
  const Icon = notice.severity === 'critical' ? CircleAlert : notice.severity === 'warning' ? TriangleAlert : CircleCheck
  return <div className='flex min-w-0 flex-wrap items-start gap-3 border-b border-border py-3.5 last:border-b-0 last:pb-0 sm:flex-nowrap'>
    <span className={cn('grid size-9 shrink-0 place-items-center rounded-lg', 'tone-' + (notice.severity === 'critical' ? 'red' : notice.severity === 'warning' ? 'amber' : 'green'))}><Icon size={17}/></span>
    <div className='min-w-0 flex-[1_1_180px]'>
      <p className='flex items-start gap-2 text-sm leading-snug font-semibold'>{notice.title}{!notice.read && <span aria-label='Belum dibaca' className='mt-1.5 size-2 shrink-0 rounded-full bg-emerald-600'/>}</p>
      <p className='mt-1 text-sm text-muted-foreground'>{notice.detail}</p>
      <p className='mt-1.5 flex items-center gap-1 text-xs text-muted-foreground'><Clock3 size={12}/>{formatDate(notice.timestamp)} · {formatTime(notice.timestamp)} WIB</p>
    </div>
    {action}
  </div>
}

export function Capacity({ label, percent, warningLevel, distance, tone }: { label: string; percent: number; warningLevel: number; distance?: number; tone: 'green' | 'lime' }) {
  const Icon = tone === 'green' ? Leaf : Package
  const color = percent >= 100 ? 'bg-red-500' : percent >= warningLevel ? 'bg-amber-500' : tone === 'green' ? 'bg-[#30845b]' : 'bg-[#94c276]'
  return <div className='capacity-row space-y-3 rounded-xl border border-border p-3.5'>
    <div className='flex items-center gap-2.5'>
      <span className={cn('grid size-8 shrink-0 place-items-center rounded-lg', 'tone-' + tone)}><Icon size={16}/></span>
      <span className='min-w-0 text-sm font-semibold'>{label}</span>
      <strong className='ml-auto text-sm tabular-nums'>{number(percent)}%</strong>
    </div>
    <div role='progressbar' aria-label={label} aria-valuenow={percent} className='h-2 overflow-hidden rounded-full bg-muted'><div className={cn('h-full rounded-full transition-[width] motion-reduce:transition-none', color)} style={{ width: percent + '%' }}/></div>
    {distance !== undefined && <p className='text-xs text-muted-foreground'>Jarak ultrasonik {number(distance)} cm</p>}
  </div>
}

export const EmptyNotices = () => <div className='flex items-center gap-2 py-3 text-sm text-muted-foreground'><Bell size={17}/>Tidak ada notifikasi.</div>

