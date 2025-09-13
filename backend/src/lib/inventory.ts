// Inventory API for MediTrack Lite Backend

import { apiRequest } from './api';

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  expiryDate: string;
  batchNumber?: string;
  supplier?: string;
  cost?: number;
  location?: string;
  minStockLevel?: number;
  maxStockLevel?: number;
  description?: string;
  barcode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInventoryItem {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  expiryDate: string;
  batchNumber?: string;
  supplier?: string;
  cost?: number;
  location?: string;
  minStockLevel?: number;
  maxStockLevel?: number;
  description?: string;
  barcode?: string;
}

export interface UpdateInventoryItem extends Partial<CreateInventoryItem> {
  id: string;
}

export interface InventoryFilters {
  category?: string;
  search?: string;
  lowStock?: boolean;
  expiringSoon?: boolean;
  expired?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface InventoryResponse {
  items: InventoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const inventoryAPI = {
  // Get all inventory items with optional filters
  getItems: async (token: string, filters?: InventoryFilters): Promise<InventoryResponse> => {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/inventory${params.toString() ? `?${params.toString()}` : ''}`;
    return await apiRequest(endpoint, { method: 'GET' }, token);
  },

  // Get single inventory item by ID
  getItem: async (token: string, id: string): Promise<InventoryItem> => {
    return await apiRequest(`/inventory/${id}`, { method: 'GET' }, token);
  },

  // Create new inventory item
  createItem: async (token: string, itemData: CreateInventoryItem): Promise<InventoryItem> => {
    return await apiRequest('/inventory', {
      method: 'POST',
      body: JSON.stringify(itemData),
    }, token);
  },

  // Update existing inventory item
  updateItem: async (token: string, id: string, updates: Partial<CreateInventoryItem>): Promise<InventoryItem> => {
    return await apiRequest(`/inventory/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }, token);
  },

  // Delete inventory item
  deleteItem: async (token: string, id: string): Promise<void> => {
    return await apiRequest(`/inventory/${id}`, { method: 'DELETE' }, token);
  },

  // Bulk operations
  bulkUpdate: async (token: string, updates: UpdateInventoryItem[]): Promise<InventoryItem[]> => {
    return await apiRequest('/inventory/bulk', {
      method: 'PATCH',
      body: JSON.stringify({ updates }),
    }, token);
  },

  bulkDelete: async (token: string, ids: string[]): Promise<void> => {
    return await apiRequest('/inventory/bulk', {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    }, token);
  },

  // Get inventory statistics
  getStats: async (token: string): Promise<{
    totalItems: number;
    lowStockItems: number;
    expiredItems: number;
    expiringSoonItems: number;
    totalValue: number;
    categoriesCount: number;
  }> => {
    return await apiRequest('/inventory/stats', { method: 'GET' }, token);
  },

  // Get categories
  getCategories: async (token: string): Promise<string[]> => {
    return await apiRequest('/inventory/categories', { method: 'GET' }, token);
  },

  // Search items
  searchItems: async (token: string, query: string): Promise<InventoryItem[]> => {
    const params = new URLSearchParams({ search: query });
    return await apiRequest(`/inventory/search?${params.toString()}`, { method: 'GET' }, token);
  },

  // Export inventory data
  exportData: async (token: string, format: 'csv' | 'xlsx' = 'csv'): Promise<Blob> => {
    const response = await fetch(`${apiRequest}/inventory/export?format=${format}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Export failed');
    }
    
    return await response.blob();
  },
};

// Inventory categories
export const INVENTORY_CATEGORIES = [
  'Medications',
  'Medical Supplies',
  'Equipment',
  'Consumables',
  'Laboratory',
  'Emergency',
  'Other'
] as const;

// Units of measurement
export const INVENTORY_UNITS = [
  'pieces',
  'boxes',
  'bottles',
  'vials',
  'tablets',
  'capsules',
  'ml',
  'liters',
  'grams',
  'kg',
  'meters',
  'sets'
] as const;