import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Settings, Palette, Zap } from 'lucide-react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@/components/ui/sidebar'
import { useUIStore } from '@/store/ui-store'
import { GeneralPane } from './panes/GeneralPane'
import { AppearancePane } from './panes/AppearancePane'
import { AdvancedPane } from './panes/AdvancedPane'

type PreferencePane = 'general' | 'appearance' | 'advanced'

const navigationItems = [
  {
    id: 'general' as const,
    labelKey: 'preferences.general',
    icon: Settings,
  },
  {
    id: 'appearance' as const,
    labelKey: 'preferences.appearance',
    icon: Palette,
  },
  {
    id: 'advanced' as const,
    labelKey: 'preferences.advanced',
    icon: Zap,
  },
] as const

export function PreferencesDialog() {
  const { t } = useTranslation()
  const [activePane, setActivePane] = useState<PreferencePane>('general')
  const preferencesOpen = useUIStore(state => state.preferencesOpen)
  const setPreferencesOpen = useUIStore(state => state.setPreferencesOpen)

  const getPaneTitle = (pane: PreferencePane): string => {
    return t(`preferences.${pane}`)
  }

  return (
    <Dialog open={preferencesOpen} onOpenChange={setPreferencesOpen}>
      <DialogContent className="overflow-hidden p-0 md:max-h-[600px] md:max-w-[900px] lg:max-w-[1000px] font-sans rounded-xl">
        <DialogTitle className="sr-only">{t('preferences.title')}</DialogTitle>
        <DialogDescription className="sr-only">
          {t('preferences.description')}
        </DialogDescription>

        <SidebarProvider className="items-start">
          <Sidebar collapsible="none" className="hidden md:flex">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {navigationItems.map(item => (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          asChild
                          isActive={activePane === item.id}
                        >
                          <button
                            onClick={() => setActivePane(item.id)}
                            className="w-full"
                          >
                            <item.icon />
                            <span>{t(item.labelKey)}</span>
                          </button>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>

          <main className="flex flex-1 flex-col overflow-hidden">
            <header className="flex h-16 shrink-0 items-center gap-2">
              <div className="flex items-center gap-2 px-4">
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink asChild>
                        <span>{t('preferences.title')}</span>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>
                        {getPaneTitle(activePane)}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>

            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 pt-0 max-h-[calc(600px-4rem)]">
              {activePane === 'general' && <GeneralPane />}
              {activePane === 'appearance' && <AppearancePane />}
              {activePane === 'advanced' && <AdvancedPane />}
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  )
}
