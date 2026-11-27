import { createFileRoute } from '@tanstack/react-router'
import { Analytics } from '@/features/pilah/records'

export const Route = createFileRoute('/_authenticated/analitik')({ component: Analytics })
