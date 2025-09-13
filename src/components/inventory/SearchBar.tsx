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
    <div className={cn('space-y-4', className)}>
      {/* Main Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search medications by name, generic name, or batch number..."
            value={filters.query}
            onChange={(e) => updateFilter('query', e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Button
          variant="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={cn(
            'relative',
            showAdvanced && 'bg-brand-50 border-brand-200'
          )}
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Filters
          {hasActiveFilters && (
            <Badge 
              variant="secondary" 
              className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-brand-700 text-white"
            >
              {getActiveFilterCount()}
            </Badge>
          )}
        </Button>
        
        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>
      
      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Category Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Category
              </label>
              <Select
                value={filters.category}
                onValueChange={(value) => updateFilter('category', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Status
              </label>
              <Select
                value={filters.status}
                onValueChange={(value) => updateFilter('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Location Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Location
              </label>
              <Select
                value={filters.location}
                onValueChange={(value) => updateFilter('location', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {locationOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Sort By */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Sort By
              </label>
              <Select
                value={filters.sortBy}
                onValueChange={(value) => updateFilter('sortBy', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
              <span className="text-sm text-gray-600">Active filters:</span>
              {filters.category !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Category: {categoryOptions.find(o => o.value === filters.category)?.label}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => updateFilter('category', 'all')}
                  />
                </Badge>
              )}
              {filters.status !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Status: {statusOptions.find(o => o.value === filters.status)?.label}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => updateFilter('status', 'all')}
                  />
                </Badge>
              )}
              {filters.location !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Location: {locationOptions.find(o => o.value === filters.location)?.label}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => updateFilter('location', 'all')}
                  />
                </Badge>
              )}
              {filters.sortBy !== 'name' && (
                <Badge variant="secondary" className="gap-1">
                  Sort: {sortOptions.find(o => o.value === filters.sortBy)?.label}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => updateFilter('sortBy', 'name')}
                  />
                </Badge>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}