import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Calendar, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import { InventoryCardSkeleton } from '@/components/ui/skeleton'
import type { MedicationItem } from '@/stores/inventoryStore'

interface InventoryCardProps {
  item?: MedicationItem
  onClick?: (item: MedicationItem) => void
  loading?: boolean
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

export function InventoryCard({ item, onClick, loading = false }: InventoryCardProps) {
  if (loading || !item) {
    return <InventoryCardSkeleton />
  }

  const status = statusConfig[item.status] || statusConfig['in-stock']
  const category = categoryConfig[item.category as keyof typeof categoryConfig] || categoryConfig['otc']
  const isExpiringSoon = new Date(item.expiryDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  const isLowStock = item.status === 'low-stock' || item.quantity <= 10

  return (
    <Card 
      className={cn(
        'group hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.03] bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 backdrop-blur-lg border-0 shadow-lg rounded-2xl animate-fade-in hover:shadow-blue-200/50 cursor-pointer overflow-hidden relative',
        'before:absolute before:inset-0 before:bg-gradient-to-br before:from-blue-500/5 before:to-purple-500/5 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500',
        item.status === 'expired' && 'bg-gradient-to-br from-red-50 via-red-50/50 to-red-100/30 border-red-100 shadow-red-100/50',
        item.status === 'out-of-stock' && 'opacity-80 grayscale-[0.3]',
        item.status === 'low-stock' && 'bg-gradient-to-br from-yellow-50 via-orange-50/30 to-yellow-100/20 shadow-yellow-100/50'
      )}
      onClick={() => onClick?.(item)}
    >
      <CardHeader className="pb-4 relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-gray-900 truncate group-hover:text-blue-900 transition-colors duration-300">{item.name}</h3>
            {item.genericName && (
              <p className="text-sm text-gray-600 truncate mt-1 group-hover:text-gray-700 transition-colors">{item.genericName}</p>
            )}
            <p className="text-sm font-semibold text-blue-700 mt-2 bg-blue-50 px-3 py-1 rounded-full inline-block group-hover:bg-blue-100 transition-colors">{item.dosage}</p>
          </div>
          
          <div className="flex flex-col gap-2 ml-3">
            <Badge className={cn(
              category.className,
              "px-3 py-1 text-xs font-bold rounded-full shadow-sm transition-all duration-300 transform group-hover:scale-110"
            )}>
              {category.label}
            </Badge>
            <Badge 
              variant={status.variant}
              className={cn(
                "text-xs font-bold transition-all duration-300 transform group-hover:scale-110 px-3 py-1 rounded-full shadow-md",
                item.status === 'in-stock' && "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-green-200",
                item.status === 'low-stock' && "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-orange-200 animate-pulse",
                item.status === 'out-of-stock' && "bg-gradient-to-r from-red-500 to-red-700 text-white shadow-red-200",
                item.status === 'expired' && "bg-gradient-to-r from-red-600 to-red-800 text-white shadow-red-300 animate-pulse"
              )}
            >
              {status.label}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 relative z-10">
        <div className="space-y-3">
          {/* Quantity */}
          <div className="flex items-center gap-3 text-sm bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-xl border border-blue-100">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-sm">
              <Package className="h-4 w-4 text-white" />
            </div>
            <span className={cn(
              'font-semibold text-blue-700 group-hover:text-blue-800 transition-colors flex-1',
              isLowStock ? 'text-orange-700' : ''
            )}>
              {item.quantity} {item.unit}
            </span>
            {isLowStock && (
              <div className="p-1 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-bounce">
                <AlertTriangle className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
          
          {/* Expiry Date */}
          <div className={cn(
            "flex items-center gap-3 text-sm p-3 rounded-xl border transition-all duration-300",
            isExpiringSoon 
              ? "bg-gradient-to-r from-red-50 to-pink-50 border-red-200" 
              : "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
          )}>
            <div className={cn(
              "p-2 rounded-lg shadow-sm",
              isExpiringSoon 
                ? "bg-gradient-to-br from-red-500 to-pink-600" 
                : "bg-gradient-to-br from-green-500 to-emerald-600"
            )}>
              <Calendar className="h-4 w-4 text-white" />
            </div>
            <span className={cn(
              'font-semibold group-hover:font-bold transition-all flex-1',
              isExpiringSoon ? 'text-red-700' : 'text-green-700'
            )}>
              {formatExpiryDate(item.expiryDate)}
            </span>
            {isExpiringSoon && (
              <div className="p-1 bg-gradient-to-br from-red-400 to-red-600 rounded-full animate-pulse">
                <AlertTriangle className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
          
          {/* Location */}
          <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-3 rounded-xl border border-gray-200">
            <div className="text-xs font-medium text-gray-600 space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full"></div>
                <span>Location: <span className="font-semibold text-gray-800">{item.location}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full"></div>
                <span>Batch: <span className="font-semibold text-gray-800">{item.batchNumber}</span></span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex gap-3 mt-6">
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1 border-0 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5 rounded-xl"
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
            className="flex-1 border-0 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-lg hover:shadow-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5 rounded-xl"
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