import { createFileRoute } from '@tanstack/react-router'
import { About } from '@/features/pilah/settings'

export const Route = createFileRoute('/_authenticated/tentang')({ component: About })
