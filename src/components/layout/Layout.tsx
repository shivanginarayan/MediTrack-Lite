import { useState } from 'react'
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

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <Navigation 
          currentPath={currentPath}
          onNavigate={(path) => {
            onNavigate(path)
            setSidebarOpen(false)
          }}
          onLogout={onLogout}
        />
      </aside>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          title={title}
          onMenuClick={() => setSidebarOpen(true)}
          alertCount={5}
        />
        
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}