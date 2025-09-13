import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Package, 
  AlertTriangle, 
  MessageSquare, 
  Settings, 
  LogOut,
  Home
} from 'lucide-react'
import { cn } from '@/lib/utils'

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
}

const navigationItems: NavigationItem[] = [
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
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    path: '/settings'
  }
]

export function Navigation({ currentPath, onNavigate, onLogout }: NavigationProps) {
  return (
      <nav className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-700 rounded-lg flex items-center justify-center">
            <Home className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg text-gray-900">MediTrack</span>
        </div>
      </div>
      
      {/* Navigation Items */}
      <div className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = currentPath === item.path
          
          return (
            <Button
              key={item.id}
              variant={isActive ? 'default' : 'ghost'}
              className={cn(
                'w-full justify-start gap-3 h-11',
                isActive && 'bg-brand-700 hover:bg-brand-800'
              )}
              onClick={() => onNavigate(item.path)}
            >
              <Icon className="h-5 w-5" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <Badge 
                  variant={isActive ? 'secondary' : 'default'}
                  className="ml-auto"
                >
                  {item.badge}
                </Badge>
              )}
            </Button>
          )
        })}
      </div>
      
      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 h-11 text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={onLogout}
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </Button>
      </div>
    </nav>
  )
}