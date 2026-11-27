import { createFileRoute } from '@tanstack/react-router'
import { Dashboard } from '@/features/pilah/dashboard'

export const Route = createFileRoute('/_authenticated/')({ component: Dashboard })
