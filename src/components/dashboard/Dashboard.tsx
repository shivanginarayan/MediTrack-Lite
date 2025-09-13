import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Package, 
  AlertTriangle, 
  Calendar,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  BarChart3,
  ShoppingCart,
  Users
} from 'lucide-react'
import { useInventoryStore } from '@/stores/inventoryStore'


interface DashboardProps {
  onNavigate: (path: string) => void
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { t } = useTranslation()
  const { items } = useInventoryStore()

  // Calculate statistics
  const totalMedications = items.length
  const lowStockItems = items.filter(item => item.quantity <= (item.minStockLevel || 10)).length
  const expiringSoon = items.filter(item => {
    const expiryDate = new Date(item.expiryDate)
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    return expiryDate <= thirtyDaysFromNow
  }).length


  const recentActivity = [
    {
      id: '1',
      type: 'added',
      item: 'Aspirin 500mg',
      time: '2 hours ago',
      icon: Plus,
      color: 'text-green-600'
    },
    {
      id: '2',
      type: 'low_stock',
      item: 'Ibuprofen 200mg',
      time: '4 hours ago',
      icon: AlertTriangle,
      color: 'text-yellow-600'
    },
    {
      id: '3',
      type: 'expired',
      item: 'Paracetamol 250mg',
      time: '1 day ago',
      icon: XCircle,
      color: 'text-red-600'
    },
    {
      id: '4',
      type: 'restocked',
      item: 'Vitamin D3',
      time: '2 days ago',
      icon: CheckCircle,
      color: 'text-green-600'
    }
  ]



  return (
    <div className="space-y-8 p-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white p-8 rounded-3xl mb-8 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
        <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
        <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full blur-lg"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">Dashboard</h1>
          <p className="text-blue-100 text-lg font-medium">Welcome back! Here's your medication inventory overview.</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
        <Card className="group hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 backdrop-blur-lg border-0 shadow-lg rounded-2xl animate-fade-in overflow-hidden relative p-6" style={{animationDelay: '0.1s'}}>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="flex items-center justify-between relative z-10">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-600 mb-2 group-hover:text-gray-700 transition-colors">{t('dashboard.totalMedications')}</p>
              <p className="text-3xl font-bold text-gray-900 mb-1 group-hover:text-blue-900 transition-colors">{totalMedications}</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <p className="text-xs font-medium text-emerald-600">+12% from last month</p>
              </div>
            </div>
            <div className="relative">
              <div className="p-4 rounded-2xl shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 bg-gradient-primary">
                <Package className="h-7 w-7 text-white transition-all duration-300" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
            </div>
          </div>
        </Card>
        <Card className="group hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 backdrop-blur-lg border-0 shadow-lg rounded-2xl animate-fade-in overflow-hidden relative p-6" style={{animationDelay: '0.2s'}}>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="flex items-center justify-between relative z-10">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-600 mb-2 group-hover:text-gray-700 transition-colors">{t('dashboard.lowStockItems')}</p>
              <p className="text-3xl font-bold text-gray-900 mb-1 group-hover:text-blue-900 transition-colors">{lowStockItems}</p>
              {lowStockItems > 0 ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                  <p className="text-xs font-medium text-red-600">Needs attention</p>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <p className="text-xs font-medium text-emerald-600">All good</p>
                </div>
              )}
            </div>
            <div className="relative">
              <div className="p-4 rounded-2xl shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 bg-gradient-to-r from-red-500 to-red-600">
                <ShoppingCart className="h-7 w-7 text-white transition-all duration-300" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
            </div>
          </div>
        </Card>
        <Card className="group hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 backdrop-blur-lg border-0 shadow-lg rounded-2xl animate-fade-in overflow-hidden relative p-6" style={{animationDelay: '0.3s'}}>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="flex items-center justify-between relative z-10">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-600 mb-2 group-hover:text-gray-700 transition-colors">{t('dashboard.expiringSoon')}</p>
              <p className="text-3xl font-bold text-gray-900 mb-1 group-hover:text-blue-900 transition-colors">{expiringSoon}</p>
              {expiringSoon > 0 ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                  <p className="text-xs font-medium text-red-600">Within 30 days</p>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <p className="text-xs font-medium text-emerald-600">All fresh</p>
                </div>
              )}
            </div>
            <div className="relative">
              <div className="p-4 rounded-2xl shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 bg-gradient-to-r from-yellow-500 to-orange-500">
                <Calendar className="h-7 w-7 text-white transition-all duration-300" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
            </div>
          </div>
        </Card>
        <Card className="group hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 backdrop-blur-lg border-0 shadow-lg rounded-2xl animate-fade-in overflow-hidden relative p-6" style={{animationDelay: '0.4s'}}>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="flex items-center justify-between relative z-10">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-600 mb-2 group-hover:text-gray-700 transition-colors">Active Users</p>
              <p className="text-3xl font-bold text-gray-900 mb-1 group-hover:text-blue-900 transition-colors">24</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <p className="text-xs font-medium text-emerald-600">Online now</p>
              </div>
            </div>
            <div className="relative">
              <div className="p-4 rounded-2xl shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 bg-gradient-secondary">
                <Users className="h-7 w-7 text-white transition-all duration-300" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Recent Activity */}
        <Card className="bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/10 backdrop-blur-lg border-0 shadow-xl rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5"></div>
          <CardHeader className="pb-6 relative z-10">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl shadow-lg">
                <Activity className="h-6 w-6 text-white" />
              </div>
              {t('dashboard.recentActivity')}
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-4">
              {recentActivity.map((activity, index) => {
                const Icon = activity.icon
                return (
                  <div 
                    key={activity.id}
                    className="group flex items-center gap-4 p-4 rounded-2xl bg-white/60 hover:bg-white/90 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] animate-fade-in border border-white/20"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className={`p-3 rounded-2xl shadow-md transition-all duration-300 group-hover:scale-110 ${activity.color.includes('green') ? 'bg-green-100 text-green-600' : activity.color.includes('yellow') ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-900 transition-colors">{activity.item}</p>
                      <p className="text-xs text-gray-500 font-medium">{activity.time}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs">
                        {activity.type.replace('_', ' ')}
                      </Badge>
                      <div className="w-2 h-2 rounded-full bg-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 mt-1 ml-auto"></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Alerts & Quick Actions */}
        <Card className="bg-gradient-to-br from-white via-purple-50/20 to-pink-50/10 backdrop-blur-lg border-0 shadow-xl rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5"></div>
          <CardHeader className="pb-6 relative z-10">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              Alerts & Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-8">
              {/* Alerts */}
              <div className="space-y-4">
                {lowStockItems > 0 && (
                  <div 
                    onClick={() => onNavigate('/inventory?filter=low-stock')}
                    className="group p-4 rounded-2xl bg-gradient-to-r from-red-50 to-red-100/50 border border-red-200/50 shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in cursor-pointer hover:scale-105 transform"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-500 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
                        <AlertTriangle className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-sm font-semibold text-red-800">
                        {lowStockItems} items low in stock
                      </span>
                    </div>
                  </div>
                )}
                {expiringSoon > 0 && (
                  <div 
                    onClick={() => onNavigate('/inventory?filter=expiring-soon')}
                    className="group p-4 rounded-2xl bg-gradient-to-r from-yellow-50 to-orange-100/50 border border-yellow-200/50 shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in cursor-pointer hover:scale-105 transform"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-500 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
                        <Clock className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-sm font-semibold text-yellow-800">
                        {expiringSoon} items expiring soon
                      </span>
                    </div>
                  </div>
                )}
                {lowStockItems === 0 && expiringSoon === 0 && (
                  <div className="group p-4 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-100/50 border border-green-200/50 shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
                        <CheckCircle className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-sm font-semibold text-green-800">
                        All medications are well-stocked
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="space-y-4">
                <h4 className="text-lg font-bold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">Quick Actions</h4>
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    onClick={() => onNavigate('/inventory')}
                    variant="outline" 
                    size="sm" 
                    className="group justify-start gap-3 p-4 h-auto rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200/50 hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                  >
                    <div className="p-2 bg-blue-500 rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                      <Package className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-semibold text-blue-700">View Inventory</span>
                  </Button>
                  <Button 
                    onClick={() => onNavigate('/alerts')}
                    variant="outline" 
                    size="sm" 
                    className="group justify-start gap-3 p-4 h-auto rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200/50 hover:from-purple-100 hover:to-pink-100 hover:border-purple-300 hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                  >
                    <div className="p-2 bg-purple-500 rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                      <AlertTriangle className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-semibold text-purple-700">View Alerts</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="group justify-start gap-3 p-4 h-auto rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border-green-200/50 hover:from-green-100 hover:to-emerald-100 hover:border-green-300 hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                  >
                    <div className="p-2 bg-green-500 rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                      <BarChart3 className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-semibold text-green-700">Generate Report</span>
                  </Button>
                  <Button 
                    onClick={() => onNavigate('/inventory')}
                    variant="outline" 
                    size="sm" 
                    className="group justify-start gap-3 p-4 h-auto rounded-2xl bg-gradient-to-r from-orange-50 to-red-50 border-orange-200/50 hover:from-orange-100 hover:to-red-100 hover:border-orange-300 hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                  >
                    <div className="p-2 bg-orange-500 rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                      <Plus className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-semibold text-orange-700">Add Medication</span>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}