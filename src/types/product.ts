/**
 * Product Catalog Types
 * For managing products/services that can be added to quotes and invoices
 */

export interface Product {
  id: string;
  companyId: string;
  
  // Basic info
  name: string;
  description?: string;
  sku?: string;                    // Stock Keeping Unit
  
  // Pricing
  unitPrice: number;
  currency: string;                // INR, USD, etc.
  
  // Tax (GST for India)
  hsnCode?: string;                // HSN/SAC code for GST
  taxRate?: number;                // Default tax rate %
  taxInclusive?: boolean;          // Price includes tax
  
  // Categorization
  category?: string;
  tags?: string[];
  
  // Media
  imageUrl?: string;
  
  // Inventory (optional)
  trackInventory?: boolean;
  stockQuantity?: number;
  lowStockThreshold?: number;
  
  // Status
  isActive: boolean;
  
  // Metadata
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCategory {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  color?: string;
  productCount?: number;
  createdAt: string;
}

export interface CreateProductInput {
  name: string;
  description?: string;
  sku?: string;
  unitPrice: number;
  currency?: string;
  hsnCode?: string;
  taxRate?: number;
  taxInclusive?: boolean;
  category?: string;
  tags?: string[];
  imageUrl?: string;
  trackInventory?: boolean;
  stockQuantity?: number;
  lowStockThreshold?: number;
  isActive?: boolean;
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  id: string;
}

export interface ProductFilter {
  category?: string;
  isActive?: boolean;
  searchQuery?: string;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
}

export interface ProductStats {
  total: number;
  active: number;
  inactive: number;
  lowStock: number;
  categories: number;
}
