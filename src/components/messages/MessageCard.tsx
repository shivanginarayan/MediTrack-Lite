import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MessageCircle, User, Clock, Reply, Archive, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Message {
  id: string
  sender: string
  senderRole: 'doctor' | 'nurse' | 'pharmacist' | 'admin' | 'patient'
  subject: string
  content: string
  timestamp: Date
  isRead: boolean
  priority: 'low' | 'normal' | 'high' | 'urgent'
  category: 'general' | 'prescription' | 'inventory' | 'alert' | 'system'
  attachments?: number
  isStarred?: boolean
}

interface MessageCardProps {
  message: Message
  onRead?: (messageId: string) => void
  onReply?: (messageId: string) => void
  onArchive?: (messageId: string) => void
  onStar?: (messageId: string) => void
  className?: string
}



const roleColors = {
  doctor: 'bg-blue-100 text-blue-800',
  nurse: 'bg-green-100 text-green-800',
  pharmacist: 'bg-purple-100 text-purple-800',
  admin: 'bg-gray-100 text-gray-800',
  patient: 'bg-teal-100 text-teal-800'
}

const categoryLabels = {
  general: 'General',
  prescription: 'Prescription',
  inventory: 'Inventory',
  alert: 'Alert',
  system: 'System'
}

export function MessageCard({ message, onRead, onReply, onArchive, onStar, className }: MessageCardProps) {
  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    return date.toLocaleDateString()
  }

  const truncateContent = (content: string, maxLength: number = 120) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  return (
    <Card className={cn(
      'transition-all duration-200 hover:shadow-md cursor-pointer',
      !message.isRead && 'bg-blue-50/50 border-blue-200',
      message.priority === 'urgent' && 'border-l-4 border-l-red-500',
      message.priority === 'high' && 'border-l-4 border-l-orange-500',
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 rounded-full bg-gradient-to-r from-blue-500 to-teal-500">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={cn(
                  'font-semibold text-sm truncate',
                  !message.isRead ? 'text-gray-900' : 'text-gray-700'
                )}>
                  {message.sender}
                </h3>
                <Badge 
                  variant="outline" 
                  className={cn('text-xs', roleColors[message.senderRole])}
                >
                  {message.senderRole}
                </Badge>
                {!message.isRead && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                <span>{formatTimestamp(message.timestamp)}</span>
                <Badge variant="secondary" className="text-xs">
                  {categoryLabels[message.category]}
                </Badge>
                {message.priority !== 'normal' && (
                  <Badge 
                    variant={message.priority === 'urgent' || message.priority === 'high' ? 'destructive' : 'outline'}
                    className="text-xs"
                  >
                    {message.priority.toUpperCase()}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {message.isStarred && (
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
            )}
            {message.attachments && message.attachments > 0 && (
              <Badge variant="outline" className="text-xs">
                {message.attachments} files
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="mb-3">
          <h4 className={cn(
            'font-medium text-sm mb-2',
            !message.isRead ? 'text-gray-900' : 'text-gray-700'
          )}>
            {message.subject}
          </h4>
          <p className="text-sm text-gray-600 leading-relaxed">
            {truncateContent(message.content)}
          </p>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
          {onRead && !message.isRead && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                onRead(message.id)
              }}
              className="text-xs h-7 hover:bg-blue-50"
            >
              <MessageCircle className="h-3 w-3 mr-1" />
              Mark Read
            </Button>
          )}
          
          {onReply && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                onReply(message.id)
              }}
              className="text-xs h-7 hover:bg-green-50"
            >
              <Reply className="h-3 w-3 mr-1" />
              Reply
            </Button>
          )}
          
          {onStar && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                onStar(message.id)
              }}
              className="text-xs h-7 hover:bg-yellow-50"
            >
              <Star className={cn(
                'h-3 w-3 mr-1',
                message.isStarred ? 'text-yellow-500 fill-current' : ''
              )} />
              {message.isStarred ? 'Unstar' : 'Star'}
            </Button>
          )}
          
          {onArchive && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                onArchive(message.id)
              }}
              className="text-xs h-7 hover:bg-gray-50"
            >
              <Archive className="h-3 w-3 mr-1" />
              Archive
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Sample message data for testing
export const sampleMessages: Message[] = [
  {
    id: '1',
    sender: 'Dr. Sarah Johnson',
    senderRole: 'doctor',
    subject: 'Prescription Update Required',
    content: 'Please update the dosage for patient John Doe\'s medication. The current prescription needs to be adjusted based on recent lab results.',
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    isRead: false,
    priority: 'high',
    category: 'prescription',
    attachments: 2,
    isStarred: true
  },
  {
    id: '2',
    sender: 'Nurse Emily Chen',
    senderRole: 'nurse',
    subject: 'Inventory Check Complete',
    content: 'The weekly inventory check has been completed. All medications are properly stocked except for a few items that need reordering.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    isRead: true,
    priority: 'normal',
    category: 'inventory',
    attachments: 1
  },
  {
    id: '3',
    sender: 'System Administrator',
    senderRole: 'admin',
    subject: 'System Maintenance Scheduled',
    content: 'Scheduled maintenance will occur tonight from 2:00 AM to 4:00 AM. The system will be temporarily unavailable during this time.',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    isRead: false,
    priority: 'urgent',
    category: 'system'
  }
]