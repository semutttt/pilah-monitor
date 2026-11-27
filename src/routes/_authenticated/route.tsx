import { createFileRoute } from '@tanstack/react-router'
import { PilahLayout } from '@/features/pilah/layout'

export const Route = createFileRoute('/_authenticated')({ component: PilahLayout })

