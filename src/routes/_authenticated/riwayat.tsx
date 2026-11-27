import { createFileRoute } from '@tanstack/react-router'
import { HistoryPage } from '@/features/pilah/records'

export const Route = createFileRoute('/_authenticated/riwayat')({ component: HistoryPage })
