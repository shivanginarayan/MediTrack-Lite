import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Calendar, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MedicationItem } from '@/stores/inventoryStore'

interface InventoryCardProps {
  item: MedicationItem
  onClick?: (item: MedicationItem) => void
}

const statusConfig = {
  'in-stock': {
    label: 'In Stock',
    variant: 'default' as const,
    className: 'bg-green-100 text-green-800 border-green-200'
  },
  'low-stock': {
    label: 'Low Stock',
    variant: 'secondary' as const,
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  },
  'expired': {
    label: 'Expired',
    variant: 'destructive' as const,
    className: 'bg-red-100 text-red-800 border-red-200'
  },
  'out-of-stock': {
    label: 'Out of Stock',
    variant: 'destructive' as const,
    className: 'bg-red-100 text-red-800 border-red-200'
  }
}

const categoryConfig = {
  prescription: {
    label: 'Rx',
    className: 'bg-blue-100 text-blue-800'
  },
  otc: {
    label: 'OTC',
    className: 'bg-gray-100 text-gray-800'
  },
  controlled: {
    label: 'Controlled',
    className: 'bg-purple-100 text-purple-800'
  },
  supplement: {
    label: 'SUP',
    className: 'bg-orange-100 text-orange-800'
  }
}

function formatExpiryDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) {
    return `Expired ${Math.abs(diffDays)} days ago`
  } else if (diffDays === 0) {
    return 'Expires today'
  } else if (diffDays <= 30) {
    return `Expires in ${diffDays} days`
  } else {
    return date.toLocaleDateString()
  }
}

export function InventoryCard({ item, onClick }: InventoryCardProps) {
  const status = statusConfig[item.status]
  const category = categoryConfig[item.category as keyof typeof categoryConfig]
  const isExpiringSoon = new Date(item.expiryDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  const isLowStock = item.status === 'low-stock' || item.quantity <= 10

  return (
    <Card 
      className={cn(
        'cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02]',
        item.status === 'expired' && 'border-red-200 bg-red-50/50',
        item.status === 'out-of-stock' && 'opacity-75'
      )}
      onClick={() => onClick?.(item)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
            {item.genericName && (
              <p className="text-sm text-gray-600 truncate">{item.genericName}</p>
            )}
            <p className="text-sm font-medium text-brand-700">{item.dosage}</p>
          </div>
          
          <div className="flex flex-col gap-1 ml-2">
            <Badge className={category.className}>
              {category.label}
            </Badge>
            <Badge className={status.className}>
              {status.label}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2">
          {/* Quantity */}
          <div className="flex items-center gap-2 text-sm">
            <Package className="h-4 w-4 text-gray-500" />
            <span className={cn(
              'font-medium',
              isLowStock ? 'text-yellow-700' : 'text-gray-700'
            )}>
              {item.quantity} {item.unit}
            </span>
            {isLowStock && (
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            )}
          </div>
          
          {/* Expiry Date */}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className={cn(
              isExpiringSoon ? 'text-red-600 font-medium' : 'text-gray-600'
            )}>
              {formatExpiryDate(item.expiryDate)}
            </span>
            {isExpiringSoon && (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            )}
          </div>
          
          {/* Location */}
          <div className="text-xs text-gray-500">
            Location: {item.location} • Batch: {item.batchNumber}
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex gap-2 mt-4">
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation()
              // Handle quick edit
            }}
          >
            Edit
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation()
              // Handle reorder
            }}
          >
            Reorder
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}