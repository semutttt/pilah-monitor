import { createFileRoute } from '@tanstack/react-router'
import { Notifications } from '@/features/pilah/records'

export const Route = createFileRoute('/_authenticated/notifikasi')({ component: Notifications })
