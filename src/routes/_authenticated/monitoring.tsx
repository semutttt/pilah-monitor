import { createFileRoute } from '@tanstack/react-router'
import { Monitoring } from '@/features/pilah/operations'

export const Route = createFileRoute('/_authenticated/monitoring')({ component: Monitoring })
