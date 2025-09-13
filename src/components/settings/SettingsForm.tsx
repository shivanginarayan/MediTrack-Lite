import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Settings, 
  User, 
  Bell, 
  Globe, 
  Shield, 
  Save, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Key 
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SettingsData {
  // Profile Settings
  firstName: string
  lastName: string
  email: string
  role: string
  department: string
  
  // Notification Settings
  emailNotifications: boolean
  pushNotifications: boolean
  lowStockAlerts: boolean
  expirationAlerts: boolean
  systemAlerts: boolean
  
  // System Settings
  language: string
  timezone: string
  dateFormat: string
  theme: 'light' | 'dark' | 'auto'
  
  // Security Settings
  twoFactorAuth: boolean
  sessionTimeout: number
  passwordExpiry: number
}

interface SettingsFormProps {
  initialData?: Partial<SettingsData>
  onSave?: (data: SettingsData) => void
  className?: string
}

const defaultSettings: SettingsData = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@meditrack.com',
  role: 'Pharmacist',
  department: 'Pharmacy',
  emailNotifications: true,
  pushNotifications: true,
  lowStockAlerts: true,
  expirationAlerts: true,
  systemAlerts: false,
  language: 'en',
  timezone: 'UTC-5',
  dateFormat: 'MM/DD/YYYY',
  theme: 'light',
  twoFactorAuth: false,
  sessionTimeout: 30,
  passwordExpiry: 90
}

export function SettingsForm({ initialData, onSave, className }: SettingsFormProps) {
  const [settings, setSettings] = useState<SettingsData>({
    ...defaultSettings,
    ...initialData
  })
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'system' | 'security'>('profile')
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleInputChange = (field: keyof SettingsData, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }))
    setSaveStatus('idle')
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveStatus('idle')
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (onSave) {
        onSave(settings)
      }
      
      setSaveStatus('success')
    } catch (error) {
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'system', label: 'System', icon: Settings },
    { id: 'security', label: 'Security', icon: Shield }
  ] as const

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between animate-slide-in-left">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-medical-blue-500 via-medical-teal-500 to-medical-green-500 shadow-medical animate-glow hover:animate-bounce-gentle cursor-pointer transition-all duration-300">
            <Settings className="h-7 w-7 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-medical-blue-700 via-medical-teal-600 to-medical-green-600 bg-clip-text text-transparent animate-slide-in-right">
              Settings
            </h1>
            <p className="text-gray-600 text-lg animate-fade-in">Manage your account and application preferences</p>
          </div>
        </div>
        
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="group relative px-6 py-3 bg-gradient-to-r from-medical-blue-600 via-medical-teal-600 to-medical-green-600 hover:from-medical-blue-700 hover:via-medical-teal-700 hover:to-medical-green-700 text-white font-semibold rounded-xl shadow-medical hover:shadow-glow transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 active:scale-95 animate-shimmer bg-size-200 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
          <div className="flex items-center relative z-10">
            {isSaving ? (
              <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <Save className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform duration-200" />
            )}
            <span className="group-hover:tracking-wide transition-all duration-200">{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </div>
        </Button>
      </div>

      {/* Save Status Alert */}
      {saveStatus !== 'idle' && (
        <Alert className={cn(
          'animate-slide-down shadow-lg backdrop-blur-sm border-0 rounded-xl',
          saveStatus === 'success' 
            ? 'bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 border-green-200' 
            : 'bg-gradient-to-r from-red-50 via-rose-50 to-red-50 border-red-200'
        )}>
          <div className={cn(
            'p-2 rounded-lg mr-3',
            saveStatus === 'success' 
              ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
              : 'bg-gradient-to-r from-red-500 to-rose-500'
          )}>
            {saveStatus === 'success' ? (
              <CheckCircle className="h-4 w-4 text-white" />
            ) : (
              <AlertCircle className="h-4 w-4 text-white" />
            )}
          </div>
          <AlertDescription className={cn(
            'font-medium',
            saveStatus === 'success' ? 'text-green-800' : 'text-red-800'
          )}>
            {saveStatus === 'success' 
              ? 'Settings saved successfully!' 
              : 'Failed to save settings. Please try again.'
            }
          </AlertDescription>
        </Alert>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-2 bg-gradient-to-r from-medical-blue-50 via-white to-medical-teal-50 p-2 rounded-2xl shadow-medical backdrop-blur-sm border border-medical-blue-100 animate-slide-in-right">
        {tabs.map((tab, index) => {
          const IconComponent = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'group flex items-center gap-3 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-105 active:scale-95',
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-medical-blue-500 via-medical-teal-500 to-medical-green-500 text-white shadow-medical animate-glow'
                  : 'text-gray-600 hover:text-medical-blue-700 hover:bg-white/80 hover:shadow-lg backdrop-blur-sm'
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={cn(
                'p-1 rounded-lg transition-all duration-200',
                activeTab === tab.id
                  ? 'bg-white/20'
                  : 'group-hover:bg-medical-blue-100'
              )}>
                <IconComponent className={cn(
                  'h-4 w-4 transition-all duration-200',
                  activeTab === tab.id
                    ? 'text-white'
                    : 'text-gray-500 group-hover:text-medical-blue-600 group-hover:rotate-12'
                )} />
              </div>
              <span className="group-hover:tracking-wide transition-all duration-200">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="grid gap-6">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <Card className="animate-slide-up hover:shadow-glow transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm shadow-medical">
            <CardHeader className="bg-gradient-to-r from-medical-blue-50 via-white to-medical-teal-50 rounded-t-lg border-b border-medical-blue-100">
              <CardTitle className="flex items-center gap-3 text-gray-800">
                <div className="p-2 rounded-lg bg-gradient-to-r from-medical-blue-500 to-medical-teal-500">
                  <User className="h-5 w-5 text-white" />
                </div>
                Profile Information
              </CardTitle>
              <CardDescription className="text-gray-600">
                Update your personal information and account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3 group">
                  <Label htmlFor="firstName" className="text-medical-blue-700 font-medium transition-colors group-focus-within:text-medical-blue-600">First Name</Label>
                  <Input
                    id="firstName"
                    value={settings.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="border-2 border-gray-200 rounded-xl focus:border-medical-blue-500 focus:ring-0 hover:border-gray-300 hover:shadow-lg focus:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-sm transform hover:-translate-y-0.5 focus:-translate-y-1"
                  />
                </div>
                <div className="space-y-3 group">
                  <Label htmlFor="lastName" className="text-medical-blue-700 font-medium transition-colors group-focus-within:text-medical-blue-600">Last Name</Label>
                  <Input
                    id="lastName"
                    value={settings.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="border-2 border-gray-200 rounded-xl focus:border-medical-blue-500 focus:ring-0 hover:border-gray-300 hover:shadow-lg focus:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-sm transform hover:-translate-y-0.5 focus:-translate-y-1"
                  />
                </div>
              </div>
              
              <div className="space-y-3 group">
                <Label htmlFor="email" className="text-medical-blue-700 font-medium transition-colors group-focus-within:text-medical-blue-600">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="border-2 border-gray-200 rounded-xl focus:border-medical-blue-500 focus:ring-0 hover:border-gray-300 hover:shadow-lg focus:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-sm transform hover:-translate-y-0.5 focus:-translate-y-1"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3 group">
                  <Label htmlFor="role" className="text-medical-blue-700 font-medium transition-colors group-focus-within:text-medical-blue-600">Role</Label>
                  <Input
                    id="role"
                    value={settings.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    className="border-2 border-gray-200 rounded-xl focus:border-medical-blue-500 focus:ring-0 hover:border-gray-300 hover:shadow-lg focus:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-sm transform hover:-translate-y-0.5 focus:-translate-y-1"
                  />
                </div>
                <div className="space-y-3 group">
                  <Label htmlFor="department" className="text-medical-blue-700 font-medium transition-colors group-focus-within:text-medical-blue-600">Department</Label>
                  <Input
                    id="department"
                    value={settings.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    className="border-2 border-gray-200 rounded-xl focus:border-medical-blue-500 focus:ring-0 hover:border-gray-300 hover:shadow-lg focus:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-sm transform hover:-translate-y-0.5 focus:-translate-y-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <Card className="animate-slide-up hover:shadow-glow transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm shadow-medical">
            <CardHeader className="bg-gradient-to-r from-medical-teal-50 via-white to-medical-green-50 rounded-t-lg border-b border-medical-teal-100">
              <CardTitle className="flex items-center gap-3 text-gray-800">
                <div className="p-2 rounded-lg bg-gradient-to-r from-medical-teal-500 to-medical-green-500">
                  <Bell className="h-5 w-5 text-white" />
                </div>
                Notification Preferences
              </CardTitle>
              <CardDescription className="text-gray-600">
                Choose how you want to be notified about important events
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive notifications via email' },
                { key: 'pushNotifications', label: 'Push Notifications', description: 'Receive browser push notifications' },
                { key: 'lowStockAlerts', label: 'Low Stock Alerts', description: 'Get notified when inventory is low' },
                { key: 'expirationAlerts', label: 'Expiration Alerts', description: 'Get notified about expiring medications' },
                { key: 'systemAlerts', label: 'System Alerts', description: 'Receive system maintenance notifications' }
              ].map((item) => (
                <div key={item.key} className="group flex items-center justify-between p-5 border-2 border-gray-100 rounded-xl hover:bg-gradient-to-r hover:from-medical-teal-50/50 hover:to-medical-green-50/50 hover:border-medical-teal-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5">
                  <div className="space-y-2">
                    <div className="font-semibold text-gray-800 group-hover:text-medical-teal-700 transition-colors">{item.label}</div>
                    <div className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors">{item.description}</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings[item.key as keyof SettingsData] as boolean}
                      onChange={(e) => handleInputChange(item.key as keyof SettingsData, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-12 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-medical-teal-300/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all after:shadow-md peer-checked:bg-gradient-to-r peer-checked:from-medical-teal-500 peer-checked:to-medical-green-500 hover:shadow-lg transition-all duration-300"></div>
                  </label>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* System Tab */}
        {activeTab === 'system' && (
          <Card className="animate-slide-up hover:shadow-glow transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm shadow-medical">
            <CardHeader className="bg-gradient-to-r from-medical-green-50 via-white to-medical-blue-50 rounded-t-lg border-b border-medical-green-100">
              <CardTitle className="flex items-center gap-3 text-gray-800">
                <div className="p-2 rounded-lg bg-gradient-to-r from-medical-green-500 to-medical-blue-500">
                  <Globe className="h-5 w-5 text-white" />
                </div>
                System Preferences
              </CardTitle>
              <CardDescription className="text-gray-600">
                Configure language, timezone, and display settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <select
                    id="language"
                    value={settings.language}
                    onChange={(e) => handleInputChange('language', e.target.value)}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-medical-green-500 focus:ring-0 hover:border-gray-300 hover:shadow-lg focus:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-sm"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <select
                    id="timezone"
                    value={settings.timezone}
                    onChange={(e) => handleInputChange('timezone', e.target.value)}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-medical-green-500 focus:ring-0 hover:border-gray-300 hover:shadow-lg focus:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-sm"
                  >
                    <option value="UTC-8">Pacific Time (UTC-8)</option>
                    <option value="UTC-7">Mountain Time (UTC-7)</option>
                    <option value="UTC-6">Central Time (UTC-6)</option>
                    <option value="UTC-5">Eastern Time (UTC-5)</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <select
                    id="dateFormat"
                    value={settings.dateFormat}
                    onChange={(e) => handleInputChange('dateFormat', e.target.value)}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-medical-green-500 focus:ring-0 hover:border-gray-300 hover:shadow-lg focus:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-sm"
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <select
                    id="theme"
                    value={settings.theme}
                    onChange={(e) => handleInputChange('theme', e.target.value as 'light' | 'dark' | 'auto')}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-medical-green-500 focus:ring-0 hover:border-gray-300 hover:shadow-lg focus:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-sm"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Manage your account security and authentication preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 p-6">
              <div className="group flex items-center justify-between p-6 border-2 border-gray-100 rounded-xl hover:bg-gradient-to-r hover:from-medical-blue-50/50 hover:to-medical-green-50/50 hover:border-medical-blue-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5">
                <div className="space-y-2">
                  <div className="font-semibold text-gray-800 group-hover:text-medical-blue-700 transition-colors flex items-center gap-2">
                    <div className="p-1 rounded-lg bg-gradient-to-r from-medical-blue-500 to-medical-green-500">
                      <Shield className="h-4 w-4 text-white" />
                    </div>
                    Two-Factor Authentication
                  </div>
                  <div className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors">Add an extra layer of security to your account</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.twoFactorAuth}
                    onChange={(e) => handleInputChange('twoFactorAuth', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-medical-blue-300/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all after:shadow-md peer-checked:bg-gradient-to-r peer-checked:from-medical-blue-500 peer-checked:to-medical-green-500 hover:shadow-lg transition-all duration-300"></div>
                </label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3 group">
                  <Label htmlFor="sessionTimeout" className="text-medical-blue-700 font-medium transition-colors group-focus-within:text-medical-blue-600 flex items-center gap-2">
                    <div className="p-1 rounded-lg bg-gradient-to-r from-medical-blue-500 to-medical-teal-500">
                      <Clock className="h-3 w-3 text-white" />
                    </div>
                    Session Timeout (minutes)
                  </Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    min="5"
                    max="480"
                    value={settings.sessionTimeout}
                    onChange={(e) => handleInputChange('sessionTimeout', parseInt(e.target.value))}
                    className="border-2 border-gray-200 rounded-xl focus:border-medical-blue-500 focus:ring-0 hover:border-gray-300 hover:shadow-lg focus:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-sm transform hover:-translate-y-0.5 focus:-translate-y-1"
                  />
                </div>
                <div className="space-y-3 group">
                  <Label htmlFor="passwordExpiry" className="text-medical-blue-700 font-medium transition-colors group-focus-within:text-medical-blue-600 flex items-center gap-2">
                    <div className="p-1 rounded-lg bg-gradient-to-r from-medical-green-500 to-medical-blue-500">
                      <Key className="h-3 w-3 text-white" />
                    </div>
                    Password Expiry (days)
                  </Label>
                  <Input
                    id="passwordExpiry"
                    type="number"
                    min="30"
                    max="365"
                    value={settings.passwordExpiry}
                    onChange={(e) => handleInputChange('passwordExpiry', parseInt(e.target.value))}
                    className="border-2 border-gray-200 rounded-xl focus:border-medical-blue-500 focus:ring-0 hover:border-gray-300 hover:shadow-lg focus:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-sm transform hover:-translate-y-0.5 focus:-translate-y-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}