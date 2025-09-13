import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingButton } from '@/components/ui/loading'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

import { 
  Package, 
  DollarSign, 
  MapPin, 
  AlertTriangle,
  Save,
  CheckCircle,
  X,
  Plus,
  Minus,
  ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface InventoryItem {
  id?: string
  name: string
  category: string
  manufacturer: string
  batchNumber: string
  expirationDate: string
  quantity: number
  unitPrice: number
  location: string
  minStockLevel: number
  maxStockLevel: number
  description: string
  barcode?: string
  supplier: string
  lastUpdated?: string
}

interface ItemFormProps {
  item?: InventoryItem
  onSave?: (item: InventoryItem) => void
  onCancel?: () => void
  className?: string
  mode?: 'create' | 'edit'
}

const defaultItem: InventoryItem = {
  name: '',
  category: 'Medication',
  manufacturer: '',
  batchNumber: '',
  expirationDate: '',
  quantity: 0,
  unitPrice: 0,
  location: '',
  minStockLevel: 10,
  maxStockLevel: 100,
  description: '',
  supplier: ''
}

const categories = [
  'Medication',
  'Medical Supplies',
  'Equipment',
  'Consumables',
  'Emergency Supplies'
]

const locations = [
  'Main Pharmacy',
  'Emergency Room',
  'ICU',
  'Surgery',
  'Pediatrics',
  'Storage Room A',
  'Storage Room B',
  'Refrigerated Storage'
]

export function ItemForm({ item, onSave, onCancel, className, mode = 'create' }: ItemFormProps) {
  const [formData, setFormData] = useState<InventoryItem>({
    ...defaultItem,
    ...item
  })
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleInputChange = (field: keyof InventoryItem, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Item name is required'
    }
    if (!formData.manufacturer.trim()) {
      newErrors.manufacturer = 'Manufacturer is required'
    }
    if (!formData.batchNumber.trim()) {
      newErrors.batchNumber = 'Batch number is required'
    }
    if (!formData.expirationDate) {
      newErrors.expirationDate = 'Expiration date is required'
    }
    if (formData.quantity < 0) {
      newErrors.quantity = 'Quantity cannot be negative'
    }
    if (formData.unitPrice < 0) {
      newErrors.unitPrice = 'Unit price cannot be negative'
    }
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required'
    }
    if (formData.minStockLevel < 0) {
      newErrors.minStockLevel = 'Minimum stock level cannot be negative'
    }
    if (formData.maxStockLevel <= formData.minStockLevel) {
      newErrors.maxStockLevel = 'Maximum stock level must be greater than minimum'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) {
      return
    }

    setIsSaving(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const itemToSave = {
        ...formData,
        id: formData.id || `item-${Date.now()}`,
        lastUpdated: new Date().toISOString()
      }
      
      if (onSave) {
        onSave(itemToSave)
      }
    } catch (error) {
      console.error('Error saving item:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const adjustQuantity = (delta: number) => {
    const newQuantity = Math.max(0, formData.quantity + delta)
    handleInputChange('quantity', newQuantity)
  }

  const getStockStatus = () => {
    if (formData.quantity <= formData.minStockLevel) {
      return { status: 'low', color: 'bg-red-100 text-red-800', label: 'Low Stock' }
    } else if (formData.quantity >= formData.maxStockLevel) {
      return { status: 'high', color: 'bg-yellow-100 text-yellow-800', label: 'Overstocked' }
    } else {
      return { status: 'normal', color: 'bg-green-100 text-green-800', label: 'Normal' }
    }
  }

  const stockStatus = getStockStatus()

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500 to-teal-500">
            <Package className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
              {mode === 'create' ? 'Add New Item' : 'Edit Item'}
            </h1>
            <p className="text-gray-600">
              {mode === 'create' ? 'Add a new item to your inventory' : 'Update item information'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}
          <LoadingButton 
            onClick={handleSave} 
            isLoading={isSaving}
            loadingText={mode === 'create' ? 'Adding Item...' : 'Saving Changes...'}
            className="bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 transition-all duration-200 animate-scale-in"
          >
            <Save className="h-4 w-4 mr-2" />
            {mode === 'create' ? 'Add Item' : 'Save Changes'}
          </LoadingButton>
        </div>
      </div>

      {/* Form */}
      <div className="grid gap-6">
        {/* Basic Information */}
        <Card className="animate-fade-in animate-stagger-1 hover:shadow-lg transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-teal-500">
                <Package className="h-4 w-4 text-white" />
              </div>
              Basic Information
            </CardTitle>
            <CardDescription className="text-gray-600">
              Essential details about the inventory item
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Item Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={cn(
                    'transition-all duration-200 bg-white/50 backdrop-blur-sm border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 hover:border-gray-300',
                    errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
                  )}
                  placeholder="Enter item name"
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm hover:border-gray-300"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manufacturer">Manufacturer *</Label>
                <Input
                  id="manufacturer"
                  value={formData.manufacturer}
                  onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                  className={errors.manufacturer ? 'border-red-500' : ''}
                  placeholder="Enter manufacturer name"
                />
                {errors.manufacturer && (
                  <p className="text-sm text-red-600">{errors.manufacturer}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="batchNumber">Batch Number *</Label>
                <Input
                  id="batchNumber"
                  value={formData.batchNumber}
                  onChange={(e) => handleInputChange('batchNumber', e.target.value)}
                  className={errors.batchNumber ? 'border-red-500' : ''}
                  placeholder="Enter batch number"
                />
                {errors.batchNumber && (
                  <p className="text-sm text-red-600">{errors.batchNumber}</p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[80px]"
                placeholder="Enter item description (optional)"
              />
            </div>
          </CardContent>
        </Card>

        {/* Quantity & Pricing */}
        <Card className="animate-fade-in animate-stagger-2 hover:shadow-lg transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500">
                <DollarSign className="h-4 w-4 text-white" />
              </div>
              Quantity & Pricing
            </CardTitle>
            <CardDescription className="text-gray-600">
              Stock levels and pricing information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Current Quantity</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => adjustQuantity(-1)}
                    disabled={formData.quantity <= 0}
                    className="hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all duration-200 animate-scale-in"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                    className={cn('text-center', errors.quantity ? 'border-red-500' : '')}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => adjustQuantity(1)}
                    className="hover:bg-green-50 hover:border-green-200 hover:text-green-600 transition-all duration-200 animate-scale-in"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {errors.quantity && (
                  <p className="text-sm text-red-600">{errors.quantity}</p>
                )}
                <Badge className={stockStatus.color}>
                  {stockStatus.label}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="unitPrice">Unit Price ($)</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.unitPrice}
                  onChange={(e) => handleInputChange('unitPrice', parseFloat(e.target.value) || 0)}
                  className={errors.unitPrice ? 'border-red-500' : ''}
                  placeholder="0.00"
                />
                {errors.unitPrice && (
                  <p className="text-sm text-red-600">{errors.unitPrice}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Total Value</Label>
                <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg text-lg font-bold text-green-700 border border-green-200 animate-pulse-gentle">
                  ${(formData.quantity * formData.unitPrice).toFixed(2)}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minStockLevel">Minimum Stock Level</Label>
                <Input
                  id="minStockLevel"
                  type="number"
                  min="0"
                  value={formData.minStockLevel}
                  onChange={(e) => handleInputChange('minStockLevel', parseInt(e.target.value) || 0)}
                  className={errors.minStockLevel ? 'border-red-500' : ''}
                />
                {errors.minStockLevel && (
                  <p className="text-sm text-red-600">{errors.minStockLevel}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maxStockLevel">Maximum Stock Level</Label>
                <Input
                  id="maxStockLevel"
                  type="number"
                  min="0"
                  value={formData.maxStockLevel}
                  onChange={(e) => handleInputChange('maxStockLevel', parseInt(e.target.value) || 0)}
                  className={errors.maxStockLevel ? 'border-red-500' : ''}
                />
                {errors.maxStockLevel && (
                  <p className="text-sm text-red-600">{errors.maxStockLevel}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location & Expiration */}
        <Card className="animate-fade-in animate-stagger-3 hover:shadow-lg transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500">
                <MapPin className="h-4 w-4 text-white" />
              </div>
              Location & Expiration
            </CardTitle>
            <CardDescription className="text-gray-600">
              Storage location and expiration information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Storage Location *</Label>
                <select
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className={cn(
                    'w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                    errors.location ? 'border-red-500' : ''
                  )}
                >
                  <option value="">Select location</option>
                  {locations.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
                {errors.location && (
                  <p className="text-sm text-red-600">{errors.location}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="expirationDate">Expiration Date *</Label>
                <Input
                  id="expirationDate"
                  type="date"
                  value={formData.expirationDate}
                  onChange={(e) => handleInputChange('expirationDate', e.target.value)}
                  className={errors.expirationDate ? 'border-red-500' : ''}
                />
                {errors.expirationDate && (
                  <p className="text-sm text-red-600">{errors.expirationDate}</p>
                )}
                {formData.expirationDate && (
                  <div className="flex items-center gap-2 text-sm">
                    {new Date(formData.expirationDate) < new Date() ? (
                      <>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <span className="text-red-600">Expired</span>
                      </>
                    ) : new Date(formData.expirationDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? (
                      <>
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <span className="text-yellow-600">Expires soon</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-green-600">Valid</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) => handleInputChange('supplier', e.target.value)}
                placeholder="Enter supplier name"
              />
            </div>
          </CardContent>
        </Card>

        {/* Advanced Options */}
        <Card className="animate-fade-in animate-stagger-4 hover:shadow-lg transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-t-lg">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full text-left group hover:bg-white/50 p-2 rounded-lg transition-all duration-200"
            >
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500">
                  <Package className="h-4 w-4 text-white" />
                </div>
                Advanced Options
              </CardTitle>
              <div className={cn(
                'transform transition-all duration-300 group-hover:scale-110',
                showAdvanced ? 'rotate-180' : ''
              )}>
                <ChevronDown className="h-5 w-5 text-gray-500" />
              </div>
            </button>
            <CardDescription className="text-gray-600 ml-2">
              Additional item information and settings
            </CardDescription>
          </CardHeader>
          {showAdvanced && (
            <CardContent className="space-y-4 animate-slide-down">
              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode</Label>
                <Input
                  id="barcode"
                  value={formData.barcode || ''}
                  onChange={(e) => handleInputChange('barcode', e.target.value)}
                  className="transition-all duration-200 bg-white/50 backdrop-blur-sm border-gray-200 focus:border-orange-500 focus:ring-orange-500/20 hover:border-gray-300"
                  placeholder="Enter barcode (optional)"
                />
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}