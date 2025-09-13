import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Package, 
  AlertTriangle, 
  MessageSquare, 
  Settings, 
  LogOut,
  BarChart3,
  Menu,
  Activity,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface NavigationItem {
  id: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  path: string
  badge?: number
}

interface NavigationProps {
  currentPath: string
  onNavigate: (path: string) => void
  onLogout?: () => void
  isMobile?: boolean
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: BarChart3,
    path: '/dashboard'
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: Package,
    path: '/inventory'
  },
  {
    id: 'alerts',
    label: 'Alerts',
    icon: AlertTriangle,
    path: '/alerts',
    badge: 3
  },
  {
    id: 'messages',
    label: 'Messages',
    icon: MessageSquare,
    path: '/messages',
    badge: 2
  },
  {
    id: 'ai-assistant',
    label: 'AI Assistant',
    icon: Sparkles,
    path: '/ai-assistant'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    path: '/settings'
  }
]

export function Navigation({ currentPath, onNavigate, onLogout, isMobile = false, isCollapsed = false, onToggleCollapse }: NavigationProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  return (
    <nav className={cn(
      "flex flex-col h-full bg-gradient-to-br from-medical-blue-50 via-white to-medical-teal-50 shadow-2xl border-r border-medical-blue-200/30 transition-all duration-500 animate-slide-up backdrop-blur-xl relative overflow-hidden",
      isCollapsed && !isMobile && "w-16",
      isMobile && "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300"
    )}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-medical-blue-500/10 to-transparent" />
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-medical-teal-400/20 to-medical-blue-400/20 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/2 -left-10 w-32 h-32 bg-gradient-to-br from-medical-green-400/15 to-medical-teal-400/15 rounded-full blur-2xl animate-float" style={{animationDelay: '2s'}} />
      </div>
      {/* Logo */}
      <div className="relative p-6 border-b border-medical-blue-200/30 bg-gradient-to-r from-medical-blue-600 via-medical-teal-600 to-medical-green-600 shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-white/10 animate-shimmer bg-size-200" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-300 group cursor-pointer">
            <Activity className="h-7 w-7 text-white group-hover:rotate-12 transition-transform duration-300" />
            <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          {!isCollapsed && (
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-2xl text-white drop-shadow-lg tracking-tight">MediTrack</span>
                <Sparkles className="h-4 w-4 text-white/80 animate-pulse" />
              </div>
              <p className="text-sm text-white/90 mt-1 font-medium">Healthcare Management</p>
            </div>
          )}
          {onToggleCollapse && !isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="text-white hover:bg-white/20 p-2 h-9 w-9 rounded-xl hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Navigation Items */}
      <div className="flex-1 p-6 space-y-3 overflow-y-auto relative z-10">
        {navigationItems.map((item, index) => {
          const Icon = item.icon
          const isActive = currentPath === item.path
          const isHovered = hoveredItem === item.id
          
          return (
            <div
              key={item.id}
              className="relative animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-medical-blue-500 to-medical-teal-500 rounded-r-full animate-slide-in-left shadow-lg" />
              )}
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-4 h-14 relative overflow-hidden transition-all duration-500 group rounded-2xl border",
                  isActive && "bg-gradient-to-r from-medical-blue-50 via-white to-medical-teal-50 shadow-xl border-medical-blue-200 text-medical-blue-800 scale-105",
                  !isActive && "hover:bg-gradient-to-r hover:from-medical-blue-25 hover:to-medical-teal-25 hover:shadow-lg hover:scale-102 text-gray-700 hover:text-medical-blue-700 border-transparent hover:border-medical-blue-100",
                  isCollapsed && "justify-center px-2"
                )}
                onClick={() => onNavigate(item.path)}
              >
                {/* Shimmer effect */}
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full transition-transform duration-1000",
                  isHovered && "translate-x-full"
                )} />
                
                {/* Glow effect for active item */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-medical-blue-500/10 via-medical-teal-500/10 to-medical-green-500/10 rounded-2xl animate-pulse-gentle" />
                )}
                
                <div className={cn(
                  "relative z-10 flex items-center gap-4 w-full",
                  isCollapsed && "justify-center"
                )}>
                  <div className={cn(
                    "p-2 rounded-xl transition-all duration-300",
                    isActive && "bg-gradient-to-r from-medical-blue-500 to-medical-teal-500 shadow-lg",
                    !isActive && isHovered && "bg-gradient-to-r from-medical-blue-100 to-medical-teal-100",
                    !isActive && !isHovered && "bg-gray-100 group-hover:bg-medical-blue-50"
                  )}>
                    <Icon className={cn(
                      "h-5 w-5 transition-all duration-300",
                      isActive && "text-white",
                      !isActive && isHovered && "text-medical-blue-600 scale-110",
                      !isActive && !isHovered && "text-gray-600 group-hover:text-medical-blue-600"
                    )} />
                  </div>
                  {!isCollapsed && (
                    <>
                      <span className={cn(
                        "flex-1 text-left font-semibold transition-all duration-300",
                        isActive && "text-medical-blue-800",
                        isHovered && "tracking-wide"
                      )}>{item.label}</span>
                      {item.badge && item.badge > 0 && (
                        <Badge 
                          className={cn(
                            "ml-auto transition-all duration-300 shadow-md font-bold",
                            isActive && "bg-gradient-to-r from-medical-blue-600 to-medical-teal-600 text-white animate-pulse-gentle shadow-lg",
                            !isActive && "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 group-hover:from-medical-blue-100 group-hover:to-medical-teal-100 group-hover:text-medical-blue-700 group-hover:shadow-lg"
                          )}
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </div>
              </Button>
              
              {/* Enhanced tooltip for collapsed state */}
              {isCollapsed && isHovered && (
                <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 bg-gradient-to-r from-gray-900 to-gray-800 text-white px-4 py-2 rounded-xl text-sm whitespace-nowrap z-50 animate-fade-in shadow-2xl border border-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <Badge className="bg-medical-blue-600 text-white text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                  {/* Tooltip arrow */}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      {/* Logout */}
      <div className="relative p-6 border-t border-medical-blue-200/30 bg-gradient-to-r from-red-50/50 via-white/50 to-red-50/50 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-orange-500/5" />
        <Button 
          variant="ghost" 
          className={cn(
            "w-full justify-start gap-4 h-14 text-red-600 hover:text-red-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 hover:shadow-lg hover:scale-102 transition-all duration-300 group rounded-2xl border border-transparent hover:border-red-200 relative overflow-hidden",
            isCollapsed && "justify-center px-2"
          )}
          onClick={onLogout}
        >
          {/* Hover shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-200/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          
          <div className="p-2 rounded-xl bg-red-100 group-hover:bg-red-200 transition-all duration-300 relative z-10">
            <LogOut className="h-5 w-5 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-300" />
          </div>
          {!isCollapsed && (
            <span className="font-semibold group-hover:tracking-wide transition-all duration-300 relative z-10">Logout</span>
          )}
        </Button>
      </div>
    </nav>
  )
}