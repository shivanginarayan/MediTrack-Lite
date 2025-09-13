import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, Menu, User, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HeaderProps {
  title: string
  onMenuClick?: () => void
  alertCount?: number
  className?: string
  showMenuButton?: boolean
}

export function Header({ title, onMenuClick, alertCount = 0, className, showMenuButton = false }: HeaderProps) {
  return (
    <header className={cn(
      "bg-white/95 backdrop-blur-lg border-b border-blue-100 px-4 py-3 flex items-center justify-between shadow-sm",
      className
    )}>
      <div className="flex items-center gap-3">
        {showMenuButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="hover:bg-blue-50 transition-colors duration-200"
          >
            <Menu className="h-5 w-5 text-blue-600" />
          </Button>
        )}
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
            {title}
          </h1>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {/* Search Button */}
        <Button 
          variant="ghost" 
          size="sm" 
          className="hover:bg-blue-50 transition-all duration-200 hover:scale-105"
        >
          <Search className="h-5 w-5 text-gray-600" />
        </Button>
        
        {/* Notifications */}
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative hover:bg-blue-50 transition-all duration-200 hover:scale-105"
        >
          <Bell className="h-5 w-5 text-gray-600" />
          {alertCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs animate-pulse bg-gradient-to-r from-red-500 to-pink-500 border-2 border-white shadow-lg"
            >
              {alertCount > 99 ? '99+' : alertCount}
            </Badge>
          )}
        </Button>
        
        {/* User Profile */}
        <Button 
          variant="ghost" 
          size="sm"
          className="hover:bg-blue-50 transition-all duration-200 hover:scale-105"
        >
          <User className="h-5 w-5 text-gray-600" />
        </Button>
      </div>
    </header>
  )
}