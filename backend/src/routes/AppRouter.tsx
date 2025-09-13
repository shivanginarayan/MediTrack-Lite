import React from 'react'
import { useTranslation } from 'react-i18next'
import { LoginForm } from '@/components/auth/LoginForm'
import { Layout } from '@/components/layout/Layout'
import { InventoryCard } from '@/components/inventory/InventoryCard'
import { MedicationDetail } from '@/components/inventory/MedicationDetail'
import { SearchBar } from '@/components/inventory/SearchBar'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { Plus } from 'lucide-react'
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
    navigate('/inventory')
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
      case '/inventory':
        return (
          <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{t('inventory.title')}</h2>
                <p className="text-gray-600 mt-1">
                  {t('inventory.description')}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <LanguageSwitcher />
                <Button className="bg-brand-700 hover:bg-brand-800">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('inventory.addMedication')}
                </Button>
              </div>
            </div>

            {/* Search and Filters */}
            <SearchBar 
              filters={filters}
              onFiltersChange={(newFilters) => setFilters(newFilters)}
            />

            {/* Inventory Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredInventory.map((item) => (
                <InventoryCard
                  key={item.id}
                  item={item}
                  onClick={handleItemClick}
                />
              ))}
            </div>

            {filteredInventory.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg mb-2">{t('inventory.noMedicationsFound')}</div>
                <div className="text-gray-500">{t('inventory.adjustFilters')}</div>
              </div>
            )}
          </div>
        )
      
      case '/alerts':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">{t('navigation.alerts')}</h2>
            <div className="bg-white rounded-lg p-8 text-center">
              <div className="text-gray-400 text-lg mb-2">{t('common.comingSoon')}</div>
              <div className="text-gray-500">{t('alerts.description')}</div>
            </div>
          </div>
        )
      
      case '/messages':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">{t('navigation.messages')}</h2>
            <div className="bg-white rounded-lg p-8 text-center">
              <div className="text-gray-400 text-lg mb-2">{t('common.comingSoon')}</div>
              <div className="text-gray-500">{t('messages.description')}</div>
            </div>
          </div>
        )
      
      case '/settings':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">{t('navigation.settings')}</h2>
            <div className="bg-white rounded-lg p-8 text-center">
              <div className="text-gray-400 text-lg mb-2">{t('common.comingSoon')}</div>
              <div className="text-gray-500">{t('settings.description')}</div>
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