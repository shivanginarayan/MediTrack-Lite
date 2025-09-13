import React from 'react'
import { useTranslation } from 'react-i18next'
import { LoginForm } from '@/components/auth/LoginForm'
import { Layout } from '@/components/layout/Layout'
import { InventoryCard } from '@/components/inventory/InventoryCard'
import { Dashboard } from '@/components/dashboard/Dashboard'
import { MedicationDetail } from '@/components/inventory/MedicationDetail'
import { SearchBar } from '@/components/inventory/SearchBar'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { Plus, Package, AlertTriangle, MessageSquare, Settings } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useInventoryStore, type MedicationItem } from '@/stores/inventoryStore'
import { useUIStore } from '@/stores/uiStore'

// Mock data removed - using store data instead

export const AppRouter: React.FC = () => {
  const { t } = useTranslation()
  const { isAuthenticated, login, logout } = useAuthStore()
  const { 
    getFilteredItems, 
    filters, 
    setFilters, 
    selectedItem, 
    setSelectedItem,
    updateItem,
    deleteItem,
    fetchItems 
  } = useInventoryStore()
  const { currentRoute, navigate } = useUIStore()

  // Initialize inventory data when authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      fetchItems()
    }
  }, [isAuthenticated, fetchItems])

  const handleLogin = async (credentials: { email: string; password: string }) => {
    await login(credentials.email, credentials.password)
  }

  const handleLogout = () => {
    logout()
    navigate('/dashboard')
    setSelectedItem(null)
  }

  const handleNavigate = (route: string) => {
    navigate(route as any)
    if (route !== '/item') {
      setSelectedItem(null)
    }
  }

  const handleItemClick = (item: MedicationItem) => {
    setSelectedItem(item)
    navigate('/item')
  }

  const handleItemUpdate = (updatedItem: MedicationItem) => {
    updateItem(updatedItem.id, updatedItem)
  }

  const handleItemDelete = (itemId: string) => {
    deleteItem(itemId)
    setSelectedItem(null)
    navigate('/inventory')
  }

  const filteredInventory = getFilteredItems()

  const getPageTitle = () => {
    switch (currentRoute) {
      case '/dashboard': return t('navigation.dashboard')
      case '/inventory': return t('navigation.inventory')
      case '/alerts': return t('navigation.alerts')
      case '/messages': return t('navigation.messages')
      case '/settings': return t('navigation.settings')
      case '/item': return selectedItem ? `${selectedItem.name} - ${t('common.details')}` : t('inventory.medicationDetails')
      default: return 'MediTrack Lite'
    }
  }

  const renderContent = () => {
    switch (currentRoute) {
      case '/dashboard':
        return <Dashboard onNavigate={handleNavigate} />
      
      case '/inventory':
        return (
          <div className="space-y-8 animate-fade-in">
            {/* Enhanced Header with Gradient Background */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-100 shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"></div>
              <div className="relative p-8">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg">
                        <Package className="h-6 w-6 text-white" />
                      </div>
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                        {t('inventory.title')}
                      </h2>
                    </div>
                    <p className="text-gray-600 text-lg leading-relaxed max-w-2xl">
                      {t('inventory.description')}
                    </p>
                    <div className="flex items-center gap-6 mt-4">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span>{filteredInventory.length} items in stock</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span>Real-time tracking</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <LanguageSwitcher />
                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 group">
                      <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform duration-200" />
                      {t('inventory.addMedication')}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Search and Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <SearchBar 
                filters={filters}
                onFiltersChange={(newFilters) => setFilters(newFilters)}
              />
            </div>

            {/* Enhanced Inventory Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredInventory.map((item, index) => (
                <div 
                  key={item.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <InventoryCard
                    item={item}
                    onClick={handleItemClick}
                  />
                </div>
              ))}
            </div>

            {/* Enhanced Empty State */}
            {filteredInventory.length === 0 && (
              <div className="text-center py-16 animate-fade-in">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center">
                    <Package className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('inventory.noMedicationsFound')}</h3>
                  <p className="text-gray-500 mb-6">{t('inventory.adjustFilters')}</p>
                  <Button 
                    variant="outline" 
                    className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
                    onClick={() => setFilters({ query: '', category: 'all', status: 'all' })}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}
          </div>
        )
      
      case '/alerts':
        return (
          <div className="space-y-8 animate-fade-in">
            {/* Enhanced Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 border border-orange-100 shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-600/5 to-red-600/5"></div>
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-orange-400/20 to-red-400/20 rounded-full blur-xl"></div>
              <div className="relative p-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 shadow-lg">
                    <AlertTriangle className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      {t('navigation.alerts')}
                    </h2>
                    <p className="text-orange-600 text-lg font-medium mt-1">Stay informed about critical updates</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Coming Soon Card */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-orange-50/30 to-red-50/20 border border-orange-100 shadow-lg backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-600/5 to-red-600/5"></div>
              <div className="relative p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-orange-100 to-red-100 flex items-center justify-center shadow-lg">
                  <AlertTriangle className="h-10 w-10 text-orange-500" />
                </div>
                <div className="text-2xl font-semibold text-gray-800 mb-3">{t('common.comingSoon')}</div>
                <div className="text-gray-600 text-lg max-w-md mx-auto leading-relaxed">{t('alerts.description')}</div>
                <div className="mt-8 flex items-center justify-center gap-2 text-sm text-orange-600">
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                  <span>Feature in development</span>
                </div>
              </div>
            </div>
          </div>
        )
      
      case '/messages':
        return (
          <div className="space-y-8 animate-fade-in">
            {/* Enhanced Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-50 via-teal-50 to-cyan-50 border border-green-100 shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-r from-green-600/5 to-teal-600/5"></div>
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-green-400/20 to-teal-400/20 rounded-full blur-xl"></div>
              <div className="relative p-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-green-500 to-teal-600 shadow-lg">
                    <MessageSquare className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      {t('navigation.messages')}
                    </h2>
                    <p className="text-green-600 text-lg font-medium mt-1">Connect and communicate seamlessly</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Coming Soon Card */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-green-50/30 to-teal-50/20 border border-green-100 shadow-lg backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-r from-green-600/5 to-teal-600/5"></div>
              <div className="relative p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-green-100 to-teal-100 flex items-center justify-center shadow-lg">
                  <MessageSquare className="h-10 w-10 text-green-500" />
                </div>
                <div className="text-2xl font-semibold text-gray-800 mb-3">{t('common.comingSoon')}</div>
                <div className="text-gray-600 text-lg max-w-md mx-auto leading-relaxed">{t('messages.description')}</div>
                <div className="mt-8 flex items-center justify-center gap-2 text-sm text-green-600">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Feature in development</span>
                </div>
              </div>
            </div>
          </div>
        )
      
      case '/settings':
        return (
          <div className="space-y-8 animate-fade-in">
            {/* Enhanced Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 border border-purple-100 shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-indigo-600/5"></div>
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-indigo-400/20 rounded-full blur-xl"></div>
              <div className="relative p-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 shadow-lg">
                    <Settings className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      {t('navigation.settings')}
                    </h2>
                    <p className="text-purple-600 text-lg font-medium mt-1">Customize your experience</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Coming Soon Card */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-purple-50/30 to-indigo-50/20 border border-purple-100 shadow-lg backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-indigo-600/5"></div>
              <div className="relative p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-purple-100 to-indigo-100 flex items-center justify-center shadow-lg">
                  <Settings className="h-10 w-10 text-purple-500" />
                </div>
                <div className="text-2xl font-semibold text-gray-800 mb-3">{t('common.comingSoon')}</div>
                <div className="text-gray-600 text-lg max-w-md mx-auto leading-relaxed">{t('settings.description')}</div>
                <div className="mt-8 flex items-center justify-center gap-2 text-sm text-purple-600">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  <span>Feature in development</span>
                </div>
              </div>
            </div>
          </div>
        )
      
      case '/item':
        if (selectedItem) {
          return (
            <MedicationDetail
              item={selectedItem}
              onBack={() => handleNavigate('/inventory')}
              onUpdate={handleItemUpdate}
              onDelete={handleItemDelete}
            />
          )
        }
        return (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">{t('common.itemNotFound')}</div>
          </div>
        )
      
      default:
        return (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">{t('common.pageNotFound')}</div>
          </div>
        )
    }
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <LoginForm
        onLogin={handleLogin}
      />
    )
  }

  // Show main application
  return (
    <Layout
      title={getPageTitle()}
      currentPath={currentRoute}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
    >
      {renderContent()}
    </Layout>
  )
}