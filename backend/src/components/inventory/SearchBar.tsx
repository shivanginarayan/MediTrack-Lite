import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, X, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type SearchFilters } from '@/stores/inventoryStore'

interface SearchBarProps {
  filters: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void
  className?: string
}

const categoryOptions = [
  { value: 'all', label: 'All Categories' },
  { value: 'prescription', label: 'Prescription' },
  { value: 'otc', label: 'Over-the-Counter' },
  { value: 'controlled', label: 'Controlled' },
  { value: 'supplement', label: 'Supplement' },
]

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'in-stock', label: 'In Stock' },
  { value: 'low-stock', label: 'Low Stock' },
  { value: 'expired', label: 'Expired' },
  { value: 'out-of-stock', label: 'Out of Stock' },
]

const locationOptions = [
  { value: 'all', label: 'All Locations' },
  { value: 'pharmacy', label: 'Main Pharmacy' },
  { value: 'storage-a', label: 'Storage Room A' },
  { value: 'storage-b', label: 'Storage Room B' },
  { value: 'refrigerated', label: 'Refrigerated' },
  { value: 'controlled-room', label: 'Controlled Substances' },
]

const sortOptions = [
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'name-desc', label: 'Name (Z-A)' },
  { value: 'expiry', label: 'Expiry Date' },
  { value: 'quantity', label: 'Quantity' },
  { value: 'status', label: 'Status' },
]

export function SearchBar({ filters, onFiltersChange, className }: SearchBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  const updateFilter = (key: keyof SearchFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value })
  }
  
  const clearFilters = () => {
    onFiltersChange({
      query: '',
      category: 'all',
      status: 'all',
      location: 'all',
      sortBy: 'name',
      sortOrder: 'asc'
    })
    setShowAdvanced(false)
  }
  
  const hasActiveFilters = filters.category !== 'all' || 
                          filters.status !== 'all' || 
                          filters.location !== 'all' ||
                          filters.sortBy !== 'name' ||
                          filters.sortOrder !== 'asc'
  
  const getActiveFilterCount = () => {
    let count = 0
    if (filters.category !== 'all') count++
    if (filters.status !== 'all') count++
    if (filters.location !== 'all') count++
    if (filters.sortBy !== 'name') count++
    return count
  }

  return (
    <div className={cn('space-y-6 animate-fade-in', className)}>
      {/* Enhanced Main Search Bar */}
      <div className="flex gap-3 animate-slide-up">
        <div className="relative flex-1 group">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
            <div className="relative">
              <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-all duration-300 group-focus-within:scale-110" />
              <div className="absolute inset-0 bg-blue-400 rounded-full opacity-0 group-focus-within:opacity-20 group-focus-within:animate-ping"></div>
            </div>
          </div>
          <Input
            placeholder="Search medications by name, generic name, or batch number..."
            value={filters.query}
            onChange={(e) => updateFilter('query', e.target.value)}
            className="pl-12 pr-4 py-3 text-base border-2 border-gray-200/60 focus:border-blue-400 focus:ring-4 focus:ring-blue-100/50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-white/90 to-blue-50/30 backdrop-blur-sm hover:from-white hover:to-blue-50/50 group-focus-within:shadow-glow"
          />
          {filters.query && (
            <button
              onClick={() => updateFilter('query', '')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-full hover:bg-red-50 hover:shadow-md transition-all duration-300 group/clear z-10"
            >
              <X className="h-4 w-4 text-gray-400 hover:text-red-500 group-hover/clear:rotate-90 transition-all duration-300" />
              <div className="absolute inset-0 bg-red-400 rounded-full opacity-0 group-hover/clear:opacity-10 transition-opacity duration-300"></div>
            </button>
          )}
        </div>
        
        <Button
          variant="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={cn(
            'relative px-4 py-3 rounded-xl border-2 border-gray-200/60 hover:border-blue-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 shadow-lg hover:shadow-xl group overflow-hidden',
            showAdvanced && 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-400 shadow-xl shadow-blue-100/50'
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-indigo-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <SlidersHorizontal className={cn(
            'h-4 w-4 mr-2 transition-all duration-300 relative z-10',
            showAdvanced && 'rotate-180 text-blue-600'
          )} />
          <span className="font-medium relative z-10">Filters</span>
          {hasActiveFilters && (
            <Badge 
              variant="secondary" 
              className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg animate-pulse relative z-10"
            >
              {getActiveFilterCount()}
            </Badge>
          )}
        </Button>
        
        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            onClick={clearFilters}
            className="px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 hover:text-red-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-red-100/50 group overflow-hidden border-2 border-transparent hover:border-red-200"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-400/10 to-pink-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <X className="h-4 w-4 mr-2 group-hover:rotate-90 transition-all duration-300 relative z-10" />
            <span className="font-medium relative z-10">Clear</span>
          </Button>
        )}
      </div>
      
      {/* Enhanced Advanced Filters */}
      {showAdvanced && (
        <div className="bg-gradient-to-br from-white/80 via-blue-50/40 to-indigo-50/60 rounded-2xl p-6 space-y-6 border-2 border-blue-100/50 shadow-xl shadow-blue-100/20 animate-slide-down backdrop-blur-md overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 via-transparent to-indigo-400/5"></div>
          <div className="flex items-center justify-between relative z-10">
            <h3 className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent flex items-center gap-3">
              <div className="relative">
                <SlidersHorizontal className="h-5 w-5 text-blue-500" />
                <div className="absolute inset-0 bg-blue-400 rounded-full opacity-20 animate-pulse"></div>
              </div>
              Advanced Filters
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(false)}
              className="text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-300 group/close"
            >
              <X className="h-4 w-4 group-hover/close:rotate-90 transition-transform duration-300" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            {/* Category Filter */}
            <div className="space-y-3 animate-slide-up" style={{animationDelay: '0.1s'}}>
              <label className="text-sm font-semibold bg-gradient-to-r from-gray-700 to-blue-600 bg-clip-text text-transparent flex items-center gap-2">
                <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full animate-pulse shadow-sm"></div>
                Category
              </label>
              <Select
                value={filters.category}
                onValueChange={(value) => updateFilter('category', value)}
              >
                <SelectTrigger className="border-2 border-gray-200/60 focus:border-blue-400 focus:ring-4 focus:ring-blue-100/50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-white to-blue-50/30 hover:from-white hover:to-blue-50/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-xl border-2 border-blue-100/50 backdrop-blur-md">
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 focus:bg-gradient-to-r focus:from-blue-50 focus:to-indigo-50 rounded-lg transition-all duration-200">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Status Filter */}
            <div className="space-y-3 animate-slide-up" style={{animationDelay: '0.2s'}}>
              <label className="text-sm font-semibold bg-gradient-to-r from-gray-700 to-green-600 bg-clip-text text-transparent flex items-center gap-2">
                <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse shadow-sm"></div>
                Status
              </label>
              <Select
                value={filters.status}
                onValueChange={(value) => updateFilter('status', value)}
              >
                <SelectTrigger className="border-2 border-gray-200/60 focus:border-green-400 focus:ring-4 focus:ring-green-100/50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-white to-green-50/30 hover:from-white hover:to-green-50/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-xl border-2 border-green-100/50 backdrop-blur-md">
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 focus:bg-gradient-to-r focus:from-green-50 focus:to-emerald-50 rounded-lg transition-all duration-200">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Location Filter */}
            <div className="space-y-3 animate-slide-up" style={{animationDelay: '0.3s'}}>
              <label className="text-sm font-semibold bg-gradient-to-r from-gray-700 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
                <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-violet-500 rounded-full animate-pulse shadow-sm"></div>
                Location
              </label>
              <Select
                value={filters.location}
                onValueChange={(value) => updateFilter('location', value)}
              >
                <SelectTrigger className="border-2 border-gray-200/60 focus:border-purple-400 focus:ring-4 focus:ring-purple-100/50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-white to-purple-50/30 hover:from-white hover:to-purple-50/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-xl border-2 border-purple-100/50 backdrop-blur-md">
                  {locationOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="hover:bg-gradient-to-r hover:from-purple-50 hover:to-violet-50 focus:bg-gradient-to-r focus:from-purple-50 focus:to-violet-50 rounded-lg transition-all duration-200">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Sort By */}
            <div className="space-y-3 animate-slide-up" style={{animationDelay: '0.4s'}}>
              <label className="text-sm font-semibold bg-gradient-to-r from-gray-700 to-orange-600 bg-clip-text text-transparent flex items-center gap-2">
                <div className="w-3 h-3 bg-gradient-to-r from-orange-400 to-amber-500 rounded-full animate-pulse shadow-sm"></div>
                Sort By
              </label>
              <Select
                value={filters.sortBy}
                onValueChange={(value) => updateFilter('sortBy', value)}
              >
                <SelectTrigger className="border-2 border-gray-200/60 focus:border-orange-400 focus:ring-4 focus:ring-orange-100/50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-white to-orange-50/30 hover:from-white hover:to-orange-50/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-xl border-2 border-orange-100/50 backdrop-blur-md">
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="hover:bg-gradient-to-r hover:from-orange-50 hover:to-amber-50 focus:bg-gradient-to-r focus:from-orange-50 focus:to-amber-50 rounded-lg transition-all duration-200">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Enhanced Active Filters Display */}
          {hasActiveFilters && (
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  Active filters:
                </span>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(filters).map(([key, value]) => {
                    if (!value || value === 'all' || key === 'query' || key === 'sortOrder') return null;
                    
                    const getFilterLabel = () => {
                      switch (key) {
                        case 'category':
                          return categoryOptions.find(opt => opt.value === value)?.label || value;
                        case 'status':
                          return statusOptions.find(opt => opt.value === value)?.label || value;
                        case 'location':
                          return locationOptions.find(opt => opt.value === value)?.label || value;
                        case 'sortBy':
                          return sortOptions.find(opt => opt.value === value)?.label || value;
                        default:
                          return value;
                      }
                    };
                    
                    const getFilterColor = () => {
                      switch (key) {
                        case 'category':
                          return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
                        case 'status':
                          return 'bg-green-100 text-green-800 hover:bg-green-200';
                        case 'location':
                          return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
                        case 'sortBy':
                          return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
                        default:
                          return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
                      }
                    };
                    
                    return (
                      <Badge
                        key={key}
                        className={`flex items-center gap-2 cursor-pointer transition-all duration-200 hover:scale-105 rounded-lg px-3 py-1 font-medium ${getFilterColor()}`}
                        onClick={() => updateFilter(key as keyof SearchFilters, 'all')}
                      >
                        {getFilterLabel()}
                        <X className="h-3 w-3 hover:rotate-90 transition-transform duration-200" />
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}