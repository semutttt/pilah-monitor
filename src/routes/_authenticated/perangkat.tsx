import { createFileRoute } from '@tanstack/react-router'
import { Devices } from '@/features/pilah/operations'

export const Route = createFileRoute('/_authenticated/perangkat')({ component: Devices })
