import { useEffect, type CSSProperties } from 'react'
import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import {
  Activity, Bell, ChevronRight, CircleHelp, Cpu, FlaskConical, History, LayoutDashboard, Menu,
  Moon, Recycle, Settings2, SlidersHorizontal, Sun, ChartNoAxesCombined, X,
} from 'lucide-react'
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarInset,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, useSidebar,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/context/theme-provider'
import { usePilah } from './service'

const groups = [
  { label: 'Ringkasan', pages: [
    { to: '/', title: 'Dashboard', icon: LayoutDashboard },
    { to: '/monitoring', title: 'Monitoring Real-Time', icon: Activity },
  ] },
  { label: 'Operasional', pages: [
    { to: '/simulasi', title: 'Laboratorium Simulasi', icon: FlaskConical },
    { to: '/riwayat', title: 'Riwayat Pemilahan', icon: History },
    { to: '/analitik', title: 'Statistik dan Analitik', icon: ChartNoAxesCombined },
    { to: '/notifikasi', title: 'Notifikasi', icon: Bell },
  ] },
  { label: 'Perangkat', pages: [
    { to: '/perangkat', title: 'Manajemen Perangkat', icon: Cpu },
    { to: '/kontrol', title: 'Kontrol Perangkat', icon: SlidersHorizontal },
  ] },
  { label: 'Sistem', pages: [
    { to: '/pengaturan', title: 'Pengaturan', icon: Settings2 },
    { to: '/tentang', title: 'Tentang Sistem', icon: CircleHelp },
  ] },
] as const

function Workspace() {
  const pathname = useRouterState({ select: (state) => state.location.pathname.replace(/\/$/, '') || '/' })
  const current = groups.flatMap(({ pages }) => [...pages]).find(({ to }) => to === pathname)
  const { setOpenMobile, toggleSidebar, isMobile } = useSidebar()
  const { resolvedTheme, setTheme } = useTheme()
  const { settings, running, speed, notices, storageError } = usePilah()
  const unread = settings.mode === 'simulation' ? notices.filter((notice) => !notice.read).length : 0
  const operator = settings.operator.trim().slice(0, 2).toUpperCase() || 'OP'

  useEffect(() => {
    if (!running || settings.mode !== 'simulation') return
    const timer = window.setInterval(() => usePilah.getState().command({ type: 'sort', moisture: 18 + Math.floor(Math.random() * 73) }), speed)
    return () => window.clearInterval(timer)
  }, [running, settings.mode, speed])

  return <>
    <a href='#pilah-main' className='sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-card focus:p-3'>Ke konten utama</a>
    <Sidebar collapsible='icon' className='!border-sidebar-border'>
      <SidebarHeader className='h-[72px] shrink-0 justify-center border-b border-sidebar-border px-5 group-data-[collapsible=icon]:px-2'>
        <div className='flex items-center gap-3'>
          <Link to='/' aria-label='Dashboard Pilah Monitor' onClick={() => setOpenMobile(false)} className='flex min-w-0 flex-1 items-center gap-3 rounded-lg'>
            <span className='flex size-10 shrink-0 items-center justify-center rounded-[11px] bg-[#b1edac] text-[#153c29]'><Recycle size={23} strokeWidth={2.25}/></span>
            <span className='min-w-0 group-data-[collapsible=icon]:hidden'>
              <strong className='block truncate font-manrope text-[17px] font-extrabold tracking-tight text-[#f5fff6]'>{settings.appName}</strong>
              <span className='block truncate text-xs text-[#a9c5b5]'>Sistem Monitoring IoT</span>
            </span>
          </Link>
          {isMobile && <button className='flex size-11 shrink-0 items-center justify-center rounded-lg hover:bg-sidebar-accent' aria-label='Tutup navigasi' onClick={() => setOpenMobile(false)}><X size={19}/></button>}
        </div>
      </SidebarHeader>
      <SidebarContent className='gap-2 px-3.5 pt-4 group-data-[collapsible=icon]:px-2'>
        <nav aria-label='Navigasi utama'>
          {groups.map(({ label, pages }) => <SidebarGroup key={label} className='mb-3 p-0'>
            <SidebarGroupLabel className='h-7 px-2.5 text-[11px] font-bold tracking-[.13em] text-[#adc6b8] uppercase'>{label}</SidebarGroupLabel>
            <SidebarMenu className='gap-0.5'>
              {pages.map(({ to, title, icon: Icon }) => <SidebarMenuItem key={to}>
                <SidebarMenuButton asChild isActive={pathname === to} tooltip={title} className='h-11 gap-2.5 rounded-lg px-2.5 text-[#cee0d4] hover:bg-[#224635] hover:text-white data-[active=true]:bg-[#214d38] data-[active=true]:font-semibold data-[active=true]:text-[#c9f5b8] group-data-[collapsible=icon]:!size-10'>
                  <Link to={to} aria-current={pathname === to ? 'page' : undefined} aria-label={title} onClick={() => setOpenMobile(false)}>
                    <Icon className='!size-[17px]' strokeWidth={1.9}/><span>{title}</span>
                    {to === '/notifikasi' && unread > 0 && <span aria-hidden='true' className='ml-auto rounded-md bg-[#315b44] px-1.5 text-[11px] leading-5 text-[#d9f6cc]'>{unread}</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroup>)}
        </nav>
      </SidebarContent>
      <SidebarFooter className='px-4 py-4 group-data-[collapsible=icon]:hidden'>
        <div className='flex items-center gap-3 rounded-[11px] border border-[#385b49] bg-[#193728] px-3 py-3'>
          <span className='flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#284d37] text-[#b9ecac]'><Cpu size={17}/></span>
          <div className='min-w-0 space-y-0.5'>
            <p className='truncate text-xs font-semibold tracking-wide text-[#edf7ee]'>PILAH-001</p>
            <p className='text-xs text-[#a9c5b5]'>{settings.mode === 'simulation' ? 'Perangkat virtual' : 'Mode perangkat fisik'}</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
    <SidebarInset className='min-w-0 bg-background'>
      <header className='sticky top-0 z-20 flex h-[64px] shrink-0 items-center justify-between gap-2 border-b border-border bg-card px-3 sm:px-6 lg:h-[72px] lg:px-7'>
        <div className='flex min-w-0 items-center gap-1.5 sm:gap-3'>
          <Button variant='ghost' size='icon' className='size-11 shrink-0 text-muted-foreground' aria-label={isMobile ? 'Buka navigasi' : 'Perkecil atau perluas sidebar'} onClick={toggleSidebar}><Menu size={20}/></Button>
          <span aria-hidden='true' className='hidden h-5 w-px bg-border sm:block'/>
          <span className='hidden whitespace-nowrap text-sm text-muted-foreground xl:block'>Pilah Monitor</span>
          <ChevronRight size={14} className='hidden shrink-0 text-muted-foreground xl:block' aria-hidden='true'/>
          <span className='min-w-0 truncate text-sm font-semibold text-foreground'>{current?.title ?? 'Pilah Monitor'}</span>
        </div>
        <div className='flex shrink-0 items-center gap-0.5 sm:gap-2'>
          <Link to='/simulasi' className='mode-pill hidden min-h-8 items-center gap-2 rounded-full px-3 text-xs font-semibold sm:inline-flex'>
            <span className='size-[7px] rounded-full bg-current' aria-hidden='true'/>{settings.mode === 'simulation' ? 'Mode Simulasi' : 'Mode Perangkat Fisik'}
          </Link>
          <Button asChild variant='ghost' size='icon' className='relative size-11 text-muted-foreground'><Link to='/notifikasi' aria-label={`Notifikasi, ${unread} belum dibaca`}>
            <Bell size={19}/>{unread > 0 && <span className='absolute top-2.5 right-2.5 size-2 rounded-full bg-emerald-600 ring-2 ring-card'/>}
          </Link></Button>
          <Button variant='ghost' size='icon' className='size-11 text-muted-foreground' aria-label={resolvedTheme === 'dark' ? 'Aktifkan tema terang' : 'Aktifkan tema gelap'} onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
            {resolvedTheme === 'dark' ? <Sun size={19}/> : <Moon size={19}/>}
          </Button>
          <Link to='/pengaturan' aria-label='Pengaturan profil' className='grid size-10 place-items-center rounded-full bg-[#dcece0] text-xs font-bold text-[#27513a] sm:ml-1'>{operator}</Link>
        </div>
      </header>
      <main id='pilah-main' tabIndex={-1} className='mx-auto w-full max-w-[1640px] min-w-0 space-y-5 px-4 py-5 outline-none sm:space-y-6 sm:px-6 md:py-6 lg:px-7'>
        {storageError && <p role='alert' className='rounded-xl border border-amber-400 bg-card p-3 text-sm'>Penyimpanan lokal tidak tersedia. Perubahan berlaku selama sesi ini.</p>}
        {settings.mode === 'real' && <p role='status' className='rounded-xl border border-amber-400 bg-card p-3 text-sm'>Mode perangkat fisik · Belum ada koneksi API ESP32.</p>}
        <Outlet/>
      </main>
    </SidebarInset>
  </>
}

export function PilahLayout() {
  return <SidebarProvider className='pilah-shell min-w-0' style={{ '--sidebar-width': '245px', '--sidebar-width-icon': '58px' } as CSSProperties}><Workspace/></SidebarProvider>
}

