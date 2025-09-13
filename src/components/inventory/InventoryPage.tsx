import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Package, AlertTriangle, TrendingUp, TrendingDown, Edit, Trash2, Eye } from 'lucide-react'
import { useInventoryStore, type MedicationItem, type SearchFilters } from '@/stores/inventoryStore'
import { InventoryCard } from './InventoryCard'
import { SearchBar } from './SearchBar'
import { ItemForm } from './ItemForm'
import { MedicationDetail } from './MedicationDetail'

interface InventoryPageProps {
  onNavigate?: (path: string) => void
}

export function InventoryPage({ onNavigate }: InventoryPageProps) {
  const {
    items,
    filters,
    isLoading,
    error,
    fetchItems,
    addItem,
    updateItem,
    deleteItem,
    setFilters,
    getLowStockItems,
    getExpiringItems
  } = useInventoryStore()

  // Use onNavigate to avoid unused parameter warning
  console.log('InventoryPage navigation handler:', onNavigate)

  const [selectedItem, setSelectedItem] = useState<MedicationItem | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)


  // Fetch items on component mount and when filters change
  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  // Statistics
  const totalItems = items.length
  const lowStockItems = getLowStockItems()
  const expiringItems = getExpiringItems(30) // Items expiring in 30 days
  const inStockItems = items.filter(item => item.status === 'in-stock')

  const handleFiltersChange = (newFilters: SearchFilters) => {
    setFilters(newFilters)
    fetchItems(newFilters)
  }

  const handleAddItem = async (itemData: any) => {
    try {
      await addItem({
        name: itemData.name,
        description: itemData.description || '',
        quantity: itemData.quantity,
        unit: itemData.unit || 'units',
        category: itemData.category,
        location: itemData.location,
        expiryDate: itemData.expirationDate,
        minStockLevel: itemData.minStockLevel || 10,
        maxStockLevel: itemData.maxStockLevel || 100,
        cost: itemData.unitPrice || 0,
        supplier: itemData.supplier || ''
      })
      setShowAddModal(false)
      console.log('Medication added successfully!')
      fetchItems() // Refresh the list
    } catch (error) {
      console.error('Failed to add medication')
      console.error('Error adding item:', error)
    }
  }

  const handleEditItem = async (itemData: any) => {
    if (!selectedItem) return
    
    try {
      await updateItem(selectedItem.id, {
        name: itemData.name,
        description: itemData.description || '',
        quantity: itemData.quantity,
        unit: itemData.unit || 'units',
        category: itemData.category,
        location: itemData.location,
        expiryDate: itemData.expirationDate,
        minStockLevel: itemData.minStockLevel || 10,
        maxStockLevel: itemData.maxStockLevel || 100,
        cost: itemData.unitPrice || 0,
        supplier: itemData.supplier || ''
      })
      setShowEditModal(false)
      setSelectedItem(null)
      console.log('Medication updated successfully!')
      fetchItems() // Refresh the list
    } catch (error) {
      console.error('Failed to update medication')
      console.error('Error updating item:', error)
    }
  }



  const handleCardClick = (item: MedicationItem) => {
    setSelectedItem(item)
    setShowDetailModal(true)
  }

  const handleEditClick = (item: MedicationItem) => {
    setSelectedItem(item)
    setShowEditModal(true)
  }

  const handleDeleteClick = (item: MedicationItem) => {
    if (window.confirm(`Are you sure you want to delete "${item.name}"? This action cannot be undone.`)) {
      handleDeleteItem(item)
    }
  }

  const handleDeleteItem = async (item: MedicationItem) => {
    try {
      await deleteItem(item.id)
      console.log('Medication deleted successfully!')
      fetchItems() // Refresh the list
    } catch (error) {
      console.error('Failed to delete medication')
      console.error('Error deleting item:', error)
    }
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h3 className="text-red-800 font-semibold">Error Loading Inventory</h3>
          </div>
          <p className="text-red-700 mt-2">{error}</p>
          <Button 
            onClick={() => fetchItems()} 
            className="mt-3"
            variant="outline"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-blue-50/30 via-white to-indigo-50/20 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg">
            <Package className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Inventory Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your medication inventory with real-time tracking
            </p>
          </div>
        </div>
        
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogTrigger asChild>
            <Button 
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Medication
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Medication</DialogTitle>
            </DialogHeader>
            <ItemForm
              mode="create"
              onSave={handleAddItem}
              onCancel={() => setShowAddModal(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Total Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{totalItems}</div>
            <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
              <TrendingUp className="h-3 w-3" />
              Active inventory
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-emerald-700 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              In Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900">{inStockItems.length}</div>
            <div className="flex items-center gap-1 text-xs text-emerald-600 mt-1">
              Available items
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-amber-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Low Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-900">{lowStockItems.length}</div>
            <div className="flex items-center gap-1 text-xs text-amber-600 mt-1">
              <TrendingDown className="h-3 w-3" />
              Need attention
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Expiring Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">{expiringItems.length}</div>
            <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
              Next 30 days
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <SearchBar
        filters={filters}
        onFiltersChange={handleFiltersChange}
        className="animate-fade-in"
      />

      {/* Inventory Grid */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-200 rounded-2xl h-64"></div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <Card className="p-12 text-center bg-gradient-to-br from-gray-50 to-gray-100">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No medications found</h3>
            <p className="text-gray-500 mb-6">
              {filters.query || filters.category !== 'all' || filters.status !== 'all' 
                ? 'Try adjusting your search filters'
                : 'Start by adding your first medication to the inventory'
              }
            </p>
            {(!filters.query && filters.category === 'all' && filters.status === 'all') && (
              <Button 
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Medication
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item, index) => (
              <div 
                key={item.id} 
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <InventoryCard
                  item={item}
                  onClick={handleCardClick}
                />
                {/* Quick Action Buttons */}
                <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCardClick(item)
                    }}
                    className="flex-1 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEditClick(item)
                    }}
                    className="flex-1 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteClick(item)
                    }}
                    className="flex-1 border-red-200 hover:bg-red-50 hover:border-red-300"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Medication</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <ItemForm
              mode="edit"
              item={{
                id: selectedItem.id,
                name: selectedItem.name,
                category: selectedItem.category,
                manufacturer: selectedItem.manufacturer || '',
                batchNumber: selectedItem.batchNumber || '',
                expirationDate: selectedItem.expiryDate,
                quantity: selectedItem.quantity,
                unitPrice: selectedItem.cost || 0,
                location: selectedItem.location || '',
                minStockLevel: selectedItem.minStockLevel || 10,
                maxStockLevel: selectedItem.maxStockLevel || 100,
                description: selectedItem.description || '',
                supplier: selectedItem.supplier || ''
              }}
              onSave={handleEditItem}
              onCancel={() => {
                setShowEditModal(false)
                setSelectedItem(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Medication Details</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <MedicationDetail
              item={selectedItem}
              onBack={() => {
                setShowDetailModal(false)
                setSelectedItem(null)
              }}
              onUpdate={(updatedItem) => {
                updateItem(updatedItem.id, updatedItem)
                setShowDetailModal(false)
                setSelectedItem(null)
              }}
              onDelete={(itemId) => {
                 if (window.confirm('Are you sure you want to delete this medication?')) {
                   deleteItem(itemId)
                   setShowDetailModal(false)
                   setSelectedItem(null)
                 }
               }}
            />
          )}
        </DialogContent>
      </Dialog>


    </div>
  )
}

export default InventoryPage