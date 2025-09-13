import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { 
  ArrowLeft, 
  Edit3, 
  Save, 
  X, 
  Calendar, 
  Package, 
  MapPin, 
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Inventory</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{item.name}</h1>
            <p className="text-gray-600">{item.genericName}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {!isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2"
              >
                <Edit3 className="h-4 w-4" />
                <span>Edit</span>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
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
                className="flex items-center space-x-2"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                className="flex items-center space-x-2 bg-brand-700 hover:bg-brand-800"
              >
                <Save className="h-4 w-4" />
                <span>Save</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Status Alerts */}
      {isExpired(item.expiryDate) && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This medication expired on {formatDate(item.expiryDate)}. Remove from active inventory.
          </AlertDescription>
        </Alert>
      )}
      
      {isExpiringSoon(item.expiryDate) && !isExpired(item.expiryDate) && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <Clock className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            This medication expires soon on {formatDate(item.expiryDate)}. Consider reordering.
          </AlertDescription>
        </Alert>
      )}
      
      {item.status === 'low-stock' && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            Low stock alert: Only {item.quantity} {item.unit} remaining.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Pill className="h-5 w-5" />
                <span>Medication Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Medication Name</Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={editedItem.name}
                      onChange={(e) => setEditedItem({ ...editedItem, name: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm font-medium mt-1">{item.name}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="genericName">Generic Name</Label>
                  {isEditing ? (
                    <Input
                      id="genericName"
                      value={editedItem.genericName || ''}
                      onChange={(e) => setEditedItem({ ...editedItem, genericName: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm font-medium mt-1">{item.genericName}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="dosage">Dosage</Label>
                  {isEditing ? (
                    <Input
                      id="dosage"
                      value={editedItem.dosage}
                      onChange={(e) => setEditedItem({ ...editedItem, dosage: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm font-medium mt-1">{item.dosage}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="batchNumber">Batch Number</Label>
                  {isEditing ? (
                    <Input
                      id="batchNumber"
                      value={editedItem.batchNumber}
                      onChange={(e) => setEditedItem({ ...editedItem, batchNumber: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm font-medium mt-1">{item.batchNumber}</p>
                  )}
                </div>
              </div>
              
              {item.description && (
                <div>
                  <Label htmlFor="description">Description</Label>
                  {isEditing ? (
                    <Textarea
                      id="description"
                      value={editedItem.description || ''}
                      onChange={(e) => setEditedItem({ ...editedItem, description: e.target.value })}
                      rows={3}
                    />
                  ) : (
                    <p className="text-sm mt-1">{item.description}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Inventory Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Inventory Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Current Stock</Label>
                <div className="flex items-center space-x-2 mt-1">
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editedItem.quantity}
                      onChange={(e) => setEditedItem({ ...editedItem, quantity: parseInt(e.target.value) || 0 })}
                      className="w-20"
                    />
                  ) : (
                    <span className="text-2xl font-bold">{item.quantity}</span>
                  )}
                  <span className="text-gray-600">{item.unit}</span>
                </div>
              </div>
              
              <div>
                <Label>Status</Label>
                <div className="mt-1">
                  <Badge className={getStatusColor(item.status)}>
                    {item.status === 'in-stock' && <CheckCircle className="h-3 w-3 mr-1" />}
                    {item.status === 'low-stock' && <AlertTriangle className="h-3 w-3 mr-1" />}
                    {item.status === 'out-of-stock' && <X className="h-3 w-3 mr-1" />}
                    {item.status === 'expired' && <Clock className="h-3 w-3 mr-1" />}
                    {item.status.replace('-', ' ').toUpperCase()}
                  </Badge>
                </div>
              </div>
              
              <div>
                <Label>Category</Label>
                <div className="mt-1">
                  <Badge className={getCategoryColor(item.category)}>
                    {item.category.toUpperCase()}
                  </Badge>
                </div>
              </div>
              
              <div>
                <Label className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Expiry Date</span>
                </Label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={editedItem.expiryDate}
                    onChange={(e) => setEditedItem({ ...editedItem, expiryDate: e.target.value })}
                    className="mt-1"
                  />
                ) : (
                  <p className={`text-sm font-medium mt-1 ${
                    isExpired(item.expiryDate) ? 'text-red-600' : 
                    isExpiringSoon(item.expiryDate) ? 'text-yellow-600' : 'text-gray-900'
                  }`}>
                    {formatDate(item.expiryDate)}
                  </p>
                )}
              </div>
              
              <div>
                <Label className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>Location</span>
                </Label>
                {isEditing ? (
                  <Input
                    value={editedItem.location}
                    onChange={(e) => setEditedItem({ ...editedItem, location: e.target.value })}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-sm font-medium mt-1 capitalize">
                    {item.location?.replace('-', ' ') || 'Not specified'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-red-600">Delete Medication</CardTitle>
              <CardDescription>
                Are you sure you want to delete "{item.name}"? This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}