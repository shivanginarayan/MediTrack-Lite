import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Clock, Package, Calendar, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AlertItem {
  id: string
  type: 'low_stock' | 'expiring' | 'expired' | 'system'
  title: string
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: Date
  medicationId?: string
  quantity?: number
  expiryDate?: Date
}

interface AlertCardProps {
  alert: AlertItem
  onDismiss?: (alertId: string) => void
  onAction?: (alertId: string, action: string) => void
  className?: string
}

const severityConfig = {
  low: {
    bgColor: 'bg-blue-50 border-blue-200',
    textColor: 'text-blue-800',
    badgeVariant: 'secondary' as const,
    icon: Package
  },
  medium: {
    bgColor: 'bg-yellow-50 border-yellow-200',
    textColor: 'text-yellow-800',
    badgeVariant: 'outline' as const,
    icon: Clock
  },
  high: {
    bgColor: 'bg-orange-50 border-orange-200',
    textColor: 'text-orange-800',
    badgeVariant: 'destructive' as const,
    icon: AlertTriangle
  },
  critical: {
    bgColor: 'bg-red-50 border-red-200',
    textColor: 'text-red-800',
    badgeVariant: 'destructive' as const,
    icon: AlertTriangle
  }
}

const typeLabels = {
  low_stock: 'Low Stock',
  expiring: 'Expiring Soon',
  expired: 'Expired',
  system: 'System Alert'
}

export function AlertCard({ alert, onDismiss, onAction, className }: AlertCardProps) {
  const config = severityConfig[alert.severity]
  const IconComponent = config.icon

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  return (
    <Card className={cn(
      'transition-all duration-200 hover:shadow-md',
      config.bgColor,
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-2 rounded-lg',
              alert.severity === 'critical' ? 'bg-red-100' : 
              alert.severity === 'high' ? 'bg-orange-100' :
              alert.severity === 'medium' ? 'bg-yellow-100' : 'bg-blue-100'
            )}>
              <IconComponent className={cn(
                'h-4 w-4',
                alert.severity === 'critical' ? 'text-red-600 animate-pulse' :
                alert.severity === 'high' ? 'text-orange-600' :
                alert.severity === 'medium' ? 'text-yellow-600' : 'text-blue-600'
              )} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className={cn('text-sm font-semibold', config.textColor)}>
                  {alert.title}
                </CardTitle>
                <Badge variant={config.badgeVariant} className="text-xs">
                  {typeLabels[alert.type]}
                </Badge>
              </div>
              <p className="text-xs text-gray-600">
                {formatTimestamp(alert.timestamp)}
              </p>
            </div>
          </div>
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDismiss(alert.id)}
              className="h-6 w-6 p-0 hover:bg-gray-200 transition-colors"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-sm text-gray-700 mb-3">
          {alert.message}
        </p>
        
        {/* Additional info based on alert type */}
        {alert.type === 'low_stock' && alert.quantity !== undefined && (
          <div className="flex items-center gap-2 text-xs text-gray-600 mb-3">
            <Package className="h-3 w-3" />
            <span>Current stock: {alert.quantity} units</span>
          </div>
        )}
        
        {(alert.type === 'expiring' || alert.type === 'expired') && alert.expiryDate && (
          <div className="flex items-center gap-2 text-xs text-gray-600 mb-3">
            <Calendar className="h-3 w-3" />
            <span>Expires: {alert.expiryDate.toLocaleDateString()}</span>
          </div>
        )}
        
        {/* Action buttons */}
        {onAction && (
          <div className="flex gap-2">
            {alert.type === 'low_stock' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAction(alert.id, 'reorder')}
                className="text-xs h-7"
              >
                Reorder
              </Button>
            )}
            {(alert.type === 'expiring' || alert.type === 'expired') && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAction(alert.id, 'view_details')}
                className="text-xs h-7"
              >
                View Details
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onAction(alert.id, 'mark_read')}
              className="text-xs h-7"
            >
              Mark as Read
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Sample alert data for testing
export const sampleAlerts: AlertItem[] = [
  {
    id: '1',
    type: 'low_stock',
    title: 'Low Stock Alert',
    message: 'Aspirin 500mg is running low and needs to be restocked.',
    severity: 'high',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    medicationId: 'med-001',
    quantity: 5
  },
  {
    id: '2',
    type: 'expiring',
    title: 'Medication Expiring',
    message: 'Ibuprofen 200mg will expire in 3 days.',
    severity: 'medium',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    medicationId: 'med-002',
    expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
  },
  {
    id: '3',
    type: 'expired',
    title: 'Expired Medication',
    message: 'Acetaminophen 325mg has expired and should be removed.',
    severity: 'critical',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    medicationId: 'med-003',
    expiryDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
  }
]