import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, Menu, User } from 'lucide-react'

interface HeaderProps {
  title: string
  onMenuClick?: () => void
  alertCount?: number
}

export function Header({ title, onMenuClick, alertCount = 0 }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuClick}
          className="md:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {alertCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {alertCount > 99 ? '99+' : alertCount}
            </Badge>
          )}
        </Button>
        
        <Button variant="ghost" size="sm">
          <User className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}