import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { inventoryAPI, type InventoryItem, type CreateInventoryItem, type InventoryFilters } from '../lib/inventory'
import { useAuthStore } from './authStore'

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'

// MedicationItem extends InventoryItem with additional medical-specific properties
export type MedicationItem = InventoryItem & {
  genericName?: string;
  dosage: string;
  manufacturer?: string;
  status: 'in-stock' | 'low-stock' | 'out-of-stock' | 'expired';
  batchNumber?: string;
};

export interface SearchFilters extends Partial<InventoryFilters> {
  query: string
  category: 'all' | string
  status: 'all' | string
  location: 'all' | string
  sortBy: 'name' | 'quantity' | 'expiryDate' | 'updatedAt'
  sortOrder: 'asc' | 'desc'
}

interface InventoryState {
  items: MedicationItem[]
  filters: SearchFilters
  selectedItem: MedicationItem | null
  isLoading: boolean
  error: string | null
  total: number
  page: number
  totalPages: number
  
  // Actions
  fetchItems: (filters?: Partial<InventoryFilters>) => Promise<void>
  fetchItem: (id: string) => Promise<MedicationItem | null>
  addItem: (item: CreateInventoryItem) => Promise<void>
  updateItem: (id: string, updates: Partial<CreateInventoryItem>) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  setSelectedItem: (item: MedicationItem | null) => void
  setFilters: (filters: Partial<SearchFilters>) => void
  resetFilters: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // Computed
  getFilteredItems: () => MedicationItem[]
  getItemById: (id: string) => MedicationItem | undefined
  getLowStockItems: () => MedicationItem[]
  getExpiringItems: (days?: number) => MedicationItem[]
}

const DEFAULT_FILTERS: SearchFilters = {
  query: '',
  category: 'all',
  status: 'all',
  location: 'all',
  sortBy: 'name',
  sortOrder: 'asc',
  page: 1,
  limit: 50
}

// Mock inventory data removed for production build

export const useInventoryStore = create<InventoryState>()(persist(
  (set, get) => ({
    items: [],
    filters: DEFAULT_FILTERS,
    selectedItem: null,
    isLoading: false,
    error: null,
    total: 0,
    page: 1,
    totalPages: 0,

    fetchItems: async (filters) => {
      const token = useAuthStore.getState().token;
      if (!USE_MOCKS && !token) {
        set({ error: 'Authentication required' });
        return;
      }

      set({ isLoading: true, error: null });
      
      try {
        if (USE_MOCKS) {
          // Mock data for demo
          await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
          
          const currentItems = get().items;
          
          // Only initialize with default mock data if no items exist
          if (currentItems.length === 0) {
            const mockItems: MedicationItem[] = [
              {
                id: '1',
                name: 'Aspirin 325mg',
                description: 'Pain reliever and fever reducer',
                quantity: 150,
                unit: 'tablets',
                category: 'prescription',
                location: 'Pharmacy A-1',
                expiryDate: '2025-12-31',
                minStockLevel: 50,
                maxStockLevel: 500,
                cost: 0.15,
                supplier: 'MedSupply Co',
                createdAt: '2024-01-15T10:00:00Z',
                updatedAt: '2024-01-15T10:00:00Z',
                genericName: 'Acetylsalicylic acid',
                dosage: '325mg',
                batchNumber: 'ASP2024001',
                manufacturer: 'PharmaCorp',
                status: 'in-stock'
              },
              {
                id: '2',
                name: 'Ibuprofen 200mg',
                description: 'Anti-inflammatory medication',
                quantity: 25,
                unit: 'tablets',
                category: 'otc',
                location: 'Pharmacy B-2',
                expiryDate: '2025-06-30',
                minStockLevel: 30,
                maxStockLevel: 300,
                cost: 0.12,
                supplier: 'HealthMeds Inc',
                createdAt: '2024-01-10T14:30:00Z',
                updatedAt: '2024-01-10T14:30:00Z',
                genericName: 'Ibuprofen',
                dosage: '200mg',
                batchNumber: 'IBU2024002',
                manufacturer: 'WellnessPharma',
                status: 'low-stock'
              },
              {
                id: '3',
                name: 'Vitamin D3 1000IU',
                description: 'Vitamin D supplement',
                quantity: 0,
                unit: 'capsules',
                category: 'supplement',
                location: 'Pharmacy C-3',
                expiryDate: '2025-03-15',
                minStockLevel: 20,
                maxStockLevel: 200,
                cost: 0.08,
                supplier: 'VitaHealth Ltd',
                createdAt: '2024-01-05T09:15:00Z',
                updatedAt: '2024-01-05T09:15:00Z',
                genericName: 'Cholecalciferol',
                dosage: '1000IU',
                batchNumber: 'VIT2024003',
                manufacturer: 'NutriCorp',
                status: 'out-of-stock'
              }
            ];
            
            set({ 
              items: mockItems,
              total: mockItems.length,
              page: 1,
              totalPages: 1,
              isLoading: false 
            });
          } else {
            // Keep existing items and just update loading state
            set({ 
              total: currentItems.length,
              page: 1,
              totalPages: 1,
              isLoading: false 
            });
          }
        } else {
          // Real API call
          const currentFilters = { ...get().filters, ...filters };
          const apiFilters: InventoryFilters = {
            search: currentFilters.query || undefined,
            category: currentFilters.category !== 'all' ? currentFilters.category : undefined,
            page: currentFilters.page,
            limit: currentFilters.limit,
            sortBy: currentFilters.sortBy,
            sortOrder: currentFilters.sortOrder
          };
          
          const response = await inventoryAPI.getItems(token!, apiFilters);
          // Transform InventoryItem to MedicationItem
          const medicationItems: MedicationItem[] = response.items.map(item => ({
            ...item,
            dosage: item.description || 'N/A',
            status: (item.quantity <= (item.minStockLevel || 0) ? 'low-stock' : 'in-stock') as MedicationItem['status']
          }));
          set({ 
            items: medicationItems,
            total: response.total,
            page: response.page,
            totalPages: response.totalPages,
            isLoading: false 
          });
        }
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to fetch items',
          isLoading: false 
        });
      }
    },

    fetchItem: async (id) => {
      const token = useAuthStore.getState().token;
      if (!USE_MOCKS && !token) {
        set({ error: 'Authentication required' });
        return null;
      }

      try {
        if (USE_MOCKS) {
          // Mock implementation - find item from current state
          const item = get().items.find(item => item.id === id);
          return item || null;
        } else {
          const item = await inventoryAPI.getItem(token!, id);
          // Transform InventoryItem to MedicationItem
          const medicationItem: MedicationItem = {
            ...item,
            dosage: item.description || 'N/A',
            status: (item.quantity <= (item.minStockLevel || 0) ? 'low-stock' : 'in-stock') as MedicationItem['status']
          };
          return medicationItem;
        }
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to fetch item' });
        return null;
      }
    },

    addItem: async (itemData) => {
      const token = useAuthStore.getState().token;
      if (!USE_MOCKS && !token) {
        set({ error: 'Authentication required' });
        return;
      }

      set({ isLoading: true, error: null });
      
      try {
        if (USE_MOCKS) {
          // Mock implementation
          await new Promise(resolve => setTimeout(resolve, 500));
          const newItem: MedicationItem = {
            id: Date.now().toString(),
            ...itemData,
            dosage: itemData.description || 'N/A',
            status: 'in-stock' as const,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          set(state => ({
            items: [...state.items, newItem],
            total: state.total + 1,
            isLoading: false
          }));
        } else {
          await inventoryAPI.createItem(token!, itemData);
          // Refresh items after adding
          await get().fetchItems();
        }
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to add item',
          isLoading: false 
        });
        throw error;
      }
    },

    updateItem: async (id, updates) => {
      const token = useAuthStore.getState().token;
      if (!USE_MOCKS && !token) {
        set({ error: 'Authentication required' });
        return;
      }

      set({ isLoading: true, error: null });
      
      try {
        if (USE_MOCKS) {
          // Mock implementation
          await new Promise(resolve => setTimeout(resolve, 500));
          set(state => ({
            items: state.items.map(item => 
              item.id === id 
                ? { ...item, ...updates, updatedAt: new Date().toISOString() }
                : item
            ),
            isLoading: false
          }));
        } else {
          await inventoryAPI.updateItem(token!, id, updates);
          // Refresh items after updating
          await get().fetchItems();
        }
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to update item',
          isLoading: false 
        });
        throw error;
      }
    },

    deleteItem: async (id) => {
      const token = useAuthStore.getState().token;
      if (!USE_MOCKS && !token) {
        set({ error: 'Authentication required' });
        return;
      }

      set({ isLoading: true, error: null });
      
      try {
        if (USE_MOCKS) {
          // Mock implementation
          await new Promise(resolve => setTimeout(resolve, 500));
          set(state => ({
            items: state.items.filter(item => item.id !== id),
            total: state.total - 1,
            selectedItem: state.selectedItem?.id === id ? null : state.selectedItem,
            isLoading: false
          }));
        } else {
          await inventoryAPI.deleteItem(token!, id);
          // Update local state and refresh
          set(state => ({
            selectedItem: state.selectedItem?.id === id ? null : state.selectedItem
          }));
          await get().fetchItems();
        }
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to delete item',
          isLoading: false 
        });
        throw error;
      }
    },

    setSelectedItem: (item) => set({ selectedItem: item }),

    setFilters: (newFilters) => {
      set(state => ({ filters: { ...state.filters, ...newFilters } }))
    },

    resetFilters: () => set({ filters: DEFAULT_FILTERS }),

    setLoading: (loading) => set({ isLoading: loading }),

    setError: (error) => set({ error }),

    getFilteredItems: () => {
      const { items, filters } = get()
      
      let filtered = items.filter(item => {
        const matchesQuery = filters.query === '' || 
          item.name.toLowerCase().includes(filters.query.toLowerCase()) ||
          item.genericName?.toLowerCase().includes(filters.query.toLowerCase()) ||
          item.batchNumber?.toLowerCase().includes(filters.query.toLowerCase())
        
        const matchesCategory = filters.category === 'all' || item.category === filters.category
        const matchesStatus = filters.status === 'all' || item.status === filters.status
        const matchesLocation = filters.location === 'all' || item.location === filters.location
        
        return matchesQuery && matchesCategory && matchesStatus && matchesLocation
      })

      // Sort items
      filtered.sort((a, b) => {
        let aValue: any, bValue: any
        
        switch (filters.sortBy) {
          case 'name':
            aValue = a.name.toLowerCase()
            bValue = b.name.toLowerCase()
            break
          case 'quantity':
            aValue = a.quantity
            bValue = b.quantity
            break
          case 'expiryDate':
            aValue = new Date(a.expiryDate)
            bValue = new Date(b.expiryDate)
            break
          case 'updatedAt':
            aValue = new Date(a.updatedAt || 0)
            bValue = new Date(b.updatedAt || 0)
            break
          default:
            return 0
        }
        
        if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1
        if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1
        return 0
      })

      return filtered
    },

    getItemById: (id) => {
      return get().items.find(item => item.id === id)
    },

    getItemsByStatus: (status: string) => {
      return get().items.filter(item => item.status === status)
    },

    getLowStockItems: () => {
      return get().items.filter(item => {
        const minStock = item.minStockLevel || 10;
        return item.quantity <= minStock;
      })
    },

    getExpiringItems: (days = 30) => {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() + days)
      
      return get().items.filter(item => {
        const expiryDate = new Date(item.expiryDate)
        return expiryDate <= cutoffDate && item.status !== 'expired'
      })
    }
  }),
  {
    name: 'inventory-storage',
    partialize: (state) => ({ 
      items: state.items,
      filters: state.filters
    })
  }
))