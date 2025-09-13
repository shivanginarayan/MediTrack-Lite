import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import { Textarea } from '@/components/ui/textarea'
import { 
  ArrowLeft, 
  Edit3, 
  Save, 
  X, 
  Package, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Pill
} from 'lucide-react'
import type { MedicationItem } from '@/stores/inventoryStore'

interface MedicationDetailProps {
  item: MedicationItem
  onBack: () => void
  onUpdate: (updatedItem: MedicationItem) => void
  onDelete: (itemId: string) => void
}

export function MedicationDetail({ item, onBack, onUpdate, onDelete }: MedicationDetailProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedItem, setEditedItem] = useState<MedicationItem>(item)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-stock': return 'bg-green-100 text-green-800 border-green-200'
      case 'low-stock': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'out-of-stock': return 'bg-red-100 text-red-800 border-red-200'
      case 'expired': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'prescription': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'otc': return 'bg-green-100 text-green-800 border-green-200'
      case 'controlled': return 'bg-red-100 text-red-800 border-red-200'
      case 'supplement': return 'bg-purple-100 text-purple-800 border-purple-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const isExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate)
    const today = new Date()
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    return expiry <= thirtyDaysFromNow && expiry > today
  }

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) <= new Date()
  }

  const handleSave = () => {
    onUpdate(editedItem)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedItem(item)
    setIsEditing(false)
  }

  const handleDelete = () => {
    onDelete(item.id)
    onBack()
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50/30 via-white to-purple-50/30 -z-10 animate-gradient-shift" />
      {/* Enhanced Header */}
      <div className="relative bg-gradient-to-r from-blue-50 via-white to-purple-50 rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 animate-slide-up overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 hover:opacity-100 transition-opacity duration-500" />
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="flex items-center space-x-2 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 rounded-xl group hover:shadow-lg hover:scale-105 relative z-10"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Inventory</span>
            </Button>
            <div className="space-y-1 relative z-10">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent animate-slide-up" style={{animationDelay: '0.1s'}}>
                {item.name}
              </h1>
              <p className="text-gray-600 font-medium animate-slide-up" style={{animationDelay: '0.2s'}}>{item.genericName}</p>
              <div className="flex items-center gap-2 mt-2 animate-slide-up" style={{animationDelay: '0.3s'}}>
                <Badge className={getCategoryColor(item.category) + " font-medium hover:scale-110 transition-transform duration-300 cursor-pointer"}>
                  {item.category.toUpperCase()}
                </Badge>
                <Badge className={getStatusColor(item.status) + " font-medium hover:scale-110 transition-transform duration-300 cursor-pointer animate-pulse"}>
                  {item.status === 'in-stock' && <CheckCircle className="h-3 w-3 mr-1" />}
                  {item.status === 'low-stock' && <AlertTriangle className="h-3 w-3 mr-1" />}
                  {item.status === 'out-of-stock' && <X className="h-3 w-3 mr-1" />}
                  {item.status === 'expired' && <Clock className="h-3 w-3 mr-1" />}
                  {item.status.replace('-', ' ').toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {!isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 rounded-xl group"
                >
                  <Edit3 className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                  <span>Edit</span>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="hover:scale-105 transition-transform duration-200 rounded-xl"
                >
                  Delete
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  className="flex items-center space-x-2 hover:bg-red-50 hover:border-red-300 transition-all duration-200 rounded-xl group"
                >
                  <X className="h-4 w-4 group-hover:rotate-90 transition-transform" />
                  <span>Cancel</span>
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 rounded-xl hover:scale-105 group"
                >
                  <Save className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  <span>Save</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Status Alerts */}
      {(isExpiringSoon(item.expiryDate) || isExpired(item.expiryDate) || item.status === 'low-stock' || item.status === 'out-of-stock') && (
        <div className="space-y-4">
          {isExpired(item.expiryDate) && (
            <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-2xl p-5 flex items-center space-x-4 shadow-sm hover:shadow-md transition-all duration-200 animate-pulse">
              <div className="bg-red-100 p-2 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-red-800 text-lg">Expired Medication</p>
                <p className="text-sm text-red-600 font-medium">This medication expired on {formatDate(item.expiryDate)}</p>
              </div>
            </div>
          )}
          
          {!isExpired(item.expiryDate) && isExpiringSoon(item.expiryDate) && (
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-2xl p-5 flex items-center space-x-4 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="bg-yellow-100 p-2 rounded-xl animate-pulse">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-yellow-800 text-lg">Expiring Soon</p>
                <p className="text-sm text-yellow-600 font-medium">This medication expires on {formatDate(item.expiryDate)}</p>
              </div>
            </div>
          )}
          
          {item.status === 'low-stock' && (
            <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-5 flex items-center space-x-4 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="bg-orange-100 p-2 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-orange-600 animate-bounce" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-orange-800 text-lg">Low Stock Alert</p>
                <p className="text-sm text-orange-600 font-medium">Only {item.quantity} {item.unit} remaining</p>
              </div>
            </div>
          )}
          
          {item.status === 'out-of-stock' && (
            <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl p-5 flex items-center space-x-4 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="bg-red-100 p-2 rounded-xl">
                <X className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-red-800 text-lg">Out of Stock</p>
                <p className="text-sm text-red-600 font-medium">This medication is currently out of stock</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-slide-up" style={{animationDelay: '0.4s'}}>
        {/* Enhanced Main Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/30 rounded-2xl overflow-hidden relative group hover:shadow-xl transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white pb-6 relative z-10">
              <CardTitle className="flex items-center space-x-3 text-xl animate-slide-up" style={{animationDelay: '0.5s'}}>
                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                  <Pill className="h-6 w-6" />
                </div>
                <span className="font-bold">Medication Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up" style={{animationDelay: '0.6s'}}>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Medication Name
                  </Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={editedItem.name}
                      onChange={(e) => setEditedItem({ ...editedItem, name: e.target.value })}
                      className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    />
                  ) : (
                    <p className="text-gray-900 font-medium bg-gray-50 p-3 rounded-xl border">{item.name}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="genericName" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    Generic Name
                  </Label>
                  {isEditing ? (
                    <Input
                      id="genericName"
                      value={editedItem.genericName || ''}
                      onChange={(e) => setEditedItem({ ...editedItem, genericName: e.target.value })}
                      className="border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 rounded-xl transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    />
                  ) : (
                    <p className="text-gray-900 font-medium bg-gray-50 p-3 rounded-xl border">{item.genericName}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dosage" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Dosage
                  </Label>
                  {isEditing ? (
                    <Input
                      id="dosage"
                      value={editedItem.dosage}
                      onChange={(e) => setEditedItem({ ...editedItem, dosage: e.target.value })}
                      className="border-gray-200 focus:border-green-500 focus:ring-green-500/20 rounded-xl transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    />
                  ) : (
                    <p className="text-gray-900 font-medium bg-gray-50 p-3 rounded-xl border">{item.dosage}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="batchNumber" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    Batch Number
                  </Label>
                  {isEditing ? (
                    <Input
                      id="batchNumber"
                      value={editedItem.batchNumber}
                      onChange={(e) => setEditedItem({ ...editedItem, batchNumber: e.target.value })}
                      className="border-gray-200 focus:border-orange-500 focus:ring-orange-500/20 rounded-xl transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    />
                  ) : (
                    <p className="text-gray-900 font-medium bg-gray-50 p-3 rounded-xl border">{item.batchNumber}</p>
                  )}
                </div>
              </div>
              
              {item.description && (
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                    Description
                  </Label>
                  {isEditing ? (
                    <Textarea
                      id="description"
                      value={editedItem.description || ''}
                      onChange={(e) => setEditedItem({ ...editedItem, description: e.target.value })}
                      className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl transition-all duration-200 bg-white/50 backdrop-blur-sm resize-none"
                      rows={3}
                    />
                  ) : (
                    <p className="text-gray-900 font-medium bg-gray-50 p-3 rounded-xl border min-h-[80px]">{item.description}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Inventory Details */}
        <div className="space-y-6 animate-slide-up" style={{animationDelay: '0.8s'}}>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-purple-50/30 rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white pb-6">
              <CardTitle className="flex items-center space-x-3 text-xl">
                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                  <Package className="h-6 w-6" />
                </div>
                <span className="font-bold">Inventory Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-2xl border border-blue-100">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Current Stock
                </Label>
                <div className="flex items-center space-x-3">
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editedItem.quantity}
                      onChange={(e) => setEditedItem({ ...editedItem, quantity: parseInt(e.target.value) || 0 })}
                      className="w-24 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    />
                  ) : (
                    <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">{item.quantity}</span>
                  )}
                  <span className="text-gray-600 font-medium text-lg">{item.unit}</span>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-2xl border border-green-100">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Status
                </Label>
                <Badge className={getStatusColor(item.status) + " text-sm px-3 py-2 font-semibold"}>
                  {item.status === 'in-stock' && <CheckCircle className="h-4 w-4 mr-2" />}
                  {item.status === 'low-stock' && <AlertTriangle className="h-4 w-4 mr-2" />}
                  {item.status === 'out-of-stock' && <X className="h-4 w-4 mr-2" />}
                  {item.status === 'expired' && <Clock className="h-4 w-4 mr-2" />}
                  {item.status.replace('-', ' ').toUpperCase()}
                </Badge>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-2xl border border-purple-100">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  Category
                </Label>
                <Badge className={getCategoryColor(item.category) + " text-sm px-3 py-2 font-semibold"}>
                  {item.category.toUpperCase()}
                </Badge>
              </div>
              
              <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-2xl border border-orange-100">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  Expiry Date
                </Label>
                <div>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editedItem.expiryDate}
                      onChange={(e) => setEditedItem({ ...editedItem, expiryDate: e.target.value })}
                      className="border-gray-200 focus:border-orange-500 focus:ring-orange-500/20 rounded-xl transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    />
                  ) : (
                    <div className="flex items-center space-x-3">
                      <span className={`font-bold text-lg ${
                        isExpired(item.expiryDate) ? 'text-red-600' :
                        isExpiringSoon(item.expiryDate) ? 'text-yellow-600' :
                        'text-gray-900'
                      }`}>
                        {formatDate(item.expiryDate)}
                      </span>
                      {isExpired(item.expiryDate) && (
                        <Badge variant="destructive" className="text-xs px-2 py-1 animate-pulse">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Expired
                        </Badge>
                      )}
                      {isExpiringSoon(item.expiryDate) && !isExpired(item.expiryDate) && (
                        <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-700 px-2 py-1">
                          <Clock className="h-3 w-3 mr-1" />
                          Expiring Soon
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-2xl border border-indigo-100">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                  Location
                </Label>
                <div>
                  {isEditing ? (
                    <Input
                      value={editedItem.location}
                      onChange={(e) => setEditedItem({ ...editedItem, location: e.target.value })}
                      placeholder="Storage location"
                      className="border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    />
                  ) : (
                    <span className="text-gray-900 font-bold text-lg bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">{item.location?.replace('-', ' ') || 'Not specified'}</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Enhanced Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4 border-0 shadow-2xl bg-gradient-to-br from-white to-red-50/30 rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-red-500 to-pink-600 text-white pb-6">
              <CardTitle className="flex items-center space-x-3 text-xl font-bold">
                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <span>Delete Medication</span>
              </CardTitle>
              <CardDescription className="text-red-100 mt-3 text-base">
                Are you sure you want to delete <span className="font-semibold text-white">"{item.name}"</span>? This action cannot be undone and will permanently remove all associated data.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-6 py-3 rounded-xl border-gray-200 hover:bg-gray-50 transition-all duration-200 font-medium"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center space-x-2"
                >
                  <AlertTriangle className="h-4 w-4" />
                  <span>Delete Forever</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}