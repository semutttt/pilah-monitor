import { createFileRoute } from '@tanstack/react-router'
import { SettingsPage } from '@/features/pilah/settings'

export const Route = createFileRoute('/_authenticated/pengaturan')({ component: SettingsPage })
