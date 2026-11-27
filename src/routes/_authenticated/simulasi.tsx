import { createFileRoute } from '@tanstack/react-router'
import { Simulation } from '@/features/pilah/operations'

export const Route = createFileRoute('/_authenticated/simulasi')({ component: Simulation })
