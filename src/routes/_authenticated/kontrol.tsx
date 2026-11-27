import { createFileRoute } from '@tanstack/react-router'
import { Control } from '@/features/pilah/operations'

export const Route = createFileRoute('/_authenticated/kontrol')({ component: Control })
