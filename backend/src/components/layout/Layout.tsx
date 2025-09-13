import React, { useState } from 'react'
import { Header } from './Header'
import { Navigation } from './Navigation'
import { cn } from '@/lib/utils'

interface LayoutProps {
  children: React.ReactNode
  title: string
  currentPath: string
  onNavigate: (path: string) => void
  onLogout?: () => void
}

export function Layout({ children, title, currentPath, onNavigate, onLogout }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Check if mobile on mount and resize
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-teal-50/30 flex">
      {/* Mobile menu overlay */}
      {sidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        'transition-all duration-300 ease-in-out',
        isMobile ? (
          sidebarOpen ? 'fixed inset-y-0 left-0 z-50' : 'hidden'
        ) : (
          sidebarCollapsed ? 'w-16' : 'w-64'
        )
      )}>
        <Navigation 
          currentPath={currentPath}
          onNavigate={(path) => {
            onNavigate(path)
            if (isMobile) setSidebarOpen(false)
          }}
          onLogout={onLogout}
          isMobile={isMobile}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </aside>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 bg-gradient-to-br from-gray-50/50 to-blue-50/30">
        <Header 
          title={title}
          onMenuClick={() => setSidebarOpen(true)}
          alertCount={5}
          className="bg-white/90 backdrop-blur-lg shadow-lg border-b border-blue-100 sticky top-0 z-30"
          showMenuButton={isMobile}
        />
        
        <main className="flex-1 overflow-auto p-4 md:p-6 animate-fade-in">
          <div className={cn(
            "mx-auto transition-all duration-300",
            sidebarCollapsed && !isMobile ? "max-w-full" : "max-w-7xl"
          )}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}