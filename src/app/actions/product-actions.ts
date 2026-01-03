'use server';

import { adminDb, verifyAuthToken } from '@/lib/firebase-admin';
import type { Product, CreateProductInput, UpdateProductInput, ProductCategory } from '@/types/product';

/**
 * Get all products for a company
 */
export async function getProductsAction(params: {
  idToken: string;
  category?: string;
  isActive?: boolean;
  searchQuery?: string;
}): Promise<{ success: boolean; products?: Product[]; error?: string }> {
  if (!adminDb) {
    return { success: false, error: 'Database not initialized' };
  }

  try {
    const verification = await verifyAuthToken(params.idToken);
    if (!verification.success) {
      return { success: false, error: 'Unauthorized' };
    }

    const userDoc = await adminDb.collection('users').doc(verification.uid).get();
    if (!userDoc.exists) {
      return { success: false, error: 'User not found' };
    }

    const userData = userDoc.data();
    const companyId = userData?.companyId;

    // Simple query without orderBy to avoid index requirement
    const snapshot = await adminDb.collection('products')
      .where('companyId', '==', companyId)
      .get();
    
    let products = snapshot.docs.map(doc => doc.data() as Product);

    // Sort in memory
    products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply filters
    if (params.category) {
      products = products.filter(p => p.category === params.category);
    }
    if (params.isActive !== undefined) {
      products = products.filter(p => p.isActive === params.isActive);
    }
    if (params.searchQuery) {
      const q = params.searchQuery.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q)
      );
    }

    return { success: true, products };
  } catch (error) {
    console.error('Error fetching products:', error);
    return { success: false, error: 'Failed to fetch products' };
  }
}

/**
 * Get a single product by ID
 */
export async function getProductAction(params: {
  idToken: string;
  productId: string;
}): Promise<{ success: boolean; product?: Product; error?: string }> {
  if (!adminDb) {
    return { success: false, error: 'Database not initialized' };
  }

  try {
    const verification = await verifyAuthToken(params.idToken);
    if (!verification.success) {
      return { success: false, error: 'Unauthorized' };
    }

    const userDoc = await adminDb.collection('users').doc(verification.uid).get();
    if (!userDoc.exists) {
      return { success: false, error: 'User not found' };
    }

    const userData = userDoc.data();
    const productDoc = await adminDb.collection('products').doc(params.productId).get();
    
    if (!productDoc.exists) {
      return { success: false, error: 'Product not found' };
    }

    const product = productDoc.data() as Product;
    if (product.companyId !== userData?.companyId) {
      return { success: false, error: 'Unauthorized' };
    }

    return { success: true, product };
  } catch (error) {
    console.error('Error fetching product:', error);
    return { success: false, error: 'Failed to fetch product' };
  }
}

/**
 * Create a new product
 */
export async function createProductAction(params: {
  idToken: string;
  product: CreateProductInput;
}): Promise<{ success: boolean; productId?: string; error?: string }> {
  if (!adminDb) {
    return { success: false, error: 'Database not initialized' };
  }

  try {
    const verification = await verifyAuthToken(params.idToken);
    if (!verification.success) {
      return { success: false, error: 'Unauthorized' };
    }

    const userDoc = await adminDb.collection('users').doc(verification.uid).get();
    if (!userDoc.exists) {
      return { success: false, error: 'User not found' };
    }

    const userData = userDoc.data();
    const companyId = userData?.companyId;

    // Generate product ID
    const productId = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const now = new Date().toISOString();

    const productData: Record<string, any> = {
      id: productId,
      companyId,
      name: params.product.name,
      unitPrice: params.product.unitPrice,
      currency: params.product.currency || 'INR',
      taxInclusive: params.product.taxInclusive || false,
      tags: params.product.tags || [],
      trackInventory: params.product.trackInventory || false,
      isActive: params.product.isActive !== false,
      createdBy: verification.uid,
      createdAt: now,
      updatedAt: now,
    };

    // Only add optional fields if they have values (Firestore doesn't accept undefined)
    if (params.product.description) productData.description = params.product.description;
    if (params.product.sku) productData.sku = params.product.sku;
    if (params.product.hsnCode) productData.hsnCode = params.product.hsnCode;
    if (params.product.taxRate !== undefined) productData.taxRate = params.product.taxRate;
    if (params.product.category) productData.category = params.product.category;
    if (params.product.imageUrl) productData.imageUrl = params.product.imageUrl;
    if (params.product.stockQuantity !== undefined) productData.stockQuantity = params.product.stockQuantity;
    if (params.product.lowStockThreshold !== undefined) productData.lowStockThreshold = params.product.lowStockThreshold;

    await adminDb.collection('products').doc(productId).set(productData);

    return { success: true, productId };
  } catch (error: any) {
    console.error('Error creating product:', error);
    return { success: false, error: error?.message || 'Failed to create product' };
  }
}

/**
 * Update an existing product
 */
export async function updateProductAction(params: {
  idToken: string;
  product: UpdateProductInput;
}): Promise<{ success: boolean; error?: string }> {
  if (!adminDb) {
    return { success: false, error: 'Database not initialized' };
  }

  try {
    const verification = await verifyAuthToken(params.idToken);
    if (!verification.success) {
      return { success: false, error: 'Unauthorized' };
    }

    const userDoc = await adminDb.collection('users').doc(verification.uid).get();
    if (!userDoc.exists) {
      return { success: false, error: 'User not found' };
    }

    const userData = userDoc.data();
    const productDoc = await adminDb.collection('products').doc(params.product.id).get();
    
    if (!productDoc.exists) {
      return { success: false, error: 'Product not found' };
    }

    const existingProduct = productDoc.data() as Product;
    if (existingProduct.companyId !== userData?.companyId) {
      return { success: false, error: 'Unauthorized' };
    }

    const { id, ...updateData } = params.product;
    await adminDb.collection('products').doc(id).update({
      ...updateData,
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating product:', error);
    return { success: false, error: 'Failed to update product' };
  }
}

/**
 * Delete a product
 */
export async function deleteProductAction(params: {
  idToken: string;
  productId: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!adminDb) {
    return { success: false, error: 'Database not initialized' };
  }

  try {
    const verification = await verifyAuthToken(params.idToken);
    if (!verification.success) {
      return { success: false, error: 'Unauthorized' };
    }

    const userDoc = await adminDb.collection('users').doc(verification.uid).get();
    if (!userDoc.exists) {
      return { success: false, error: 'User not found' };
    }

    const userData = userDoc.data();
    const productDoc = await adminDb.collection('products').doc(params.productId).get();
    
    if (!productDoc.exists) {
      return { success: false, error: 'Product not found' };
    }

    const product = productDoc.data() as Product;
    if (product.companyId !== userData?.companyId) {
      return { success: false, error: 'Unauthorized' };
    }

    await adminDb.collection('products').doc(params.productId).delete();

    return { success: true };
  } catch (error) {
    console.error('Error deleting product:', error);
    return { success: false, error: 'Failed to delete product' };
  }
}

/**
 * Get product categories for a company
 */
export async function getProductCategoriesAction(params: {
  idToken: string;
}): Promise<{ success: boolean; categories?: ProductCategory[]; error?: string }> {
  if (!adminDb) {
    return { success: false, error: 'Database not initialized' };
  }

  try {
    const verification = await verifyAuthToken(params.idToken);
    if (!verification.success) {
      return { success: false, error: 'Unauthorized' };
    }

    const userDoc = await adminDb.collection('users').doc(verification.uid).get();
    if (!userDoc.exists) {
      return { success: false, error: 'User not found' };
    }

    const userData = userDoc.data();
    const companyId = userData?.companyId;

    // Simple query without orderBy to avoid index requirement
    const snapshot = await adminDb.collection('productCategories')
      .where('companyId', '==', companyId)
      .get();

    let categories = snapshot.docs.map(doc => doc.data() as ProductCategory);
    
    // Sort in memory
    categories.sort((a, b) => a.name.localeCompare(b.name));

    return { success: true, categories };
  } catch (error) {
    console.error('Error fetching categories:', error);
    return { success: false, error: 'Failed to fetch categories' };
  }
}

/**
 * Create a product category
 */
export async function createProductCategoryAction(params: {
  idToken: string;
  name: string;
  description?: string;
  color?: string;
}): Promise<{ success: boolean; categoryId?: string; error?: string }> {
  if (!adminDb) {
    return { success: false, error: 'Database not initialized' };
  }

  try {
    const verification = await verifyAuthToken(params.idToken);
    if (!verification.success) {
      return { success: false, error: 'Unauthorized' };
    }

    const userDoc = await adminDb.collection('users').doc(verification.uid).get();
    if (!userDoc.exists) {
      return { success: false, error: 'User not found' };
    }

    const userData = userDoc.data();
    const companyId = userData?.companyId;

    const categoryId = `cat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const categoryData: ProductCategory = {
      id: categoryId,
      companyId,
      name: params.name,
      description: params.description,
      color: params.color,
      productCount: 0,
      createdAt: new Date().toISOString(),
    };

    await adminDb.collection('productCategories').doc(categoryId).set(categoryData);

    return { success: true, categoryId };
  } catch (error) {
    console.error('Error creating category:', error);
    return { success: false, error: 'Failed to create category' };
  }
}

/**
 * Bulk import products
 */
export async function bulkImportProductsAction(params: {
  idToken: string;
  products: CreateProductInput[];
}): Promise<{ success: boolean; imported?: number; errors?: string[]; error?: string }> {
  if (!adminDb) {
    return { success: false, error: 'Database not initialized' };
  }

  try {
    const verification = await verifyAuthToken(params.idToken);
    if (!verification.success) {
      return { success: false, error: 'Unauthorized' };
    }

    const userDoc = await adminDb.collection('users').doc(verification.uid).get();
    if (!userDoc.exists) {
      return { success: false, error: 'User not found' };
    }

    const userData = userDoc.data();
    const companyId = userData?.companyId;
    const now = new Date().toISOString();
    
    const batch = adminDb.batch();
    const errors: string[] = [];
    let imported = 0;

    for (const product of params.products) {
      if (!product.name || product.unitPrice === undefined) {
        errors.push(`Skipped: Missing name or price for "${product.name || 'unnamed'}"`);
        continue;
      }

      const productId = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      const productData: Record<string, any> = {
        id: productId,
        companyId,
        name: product.name,
        unitPrice: product.unitPrice,
        currency: product.currency || 'INR',
        taxInclusive: product.taxInclusive || false,
        tags: product.tags || [],
        trackInventory: product.trackInventory || false,
        isActive: product.isActive !== false,
        createdBy: verification.uid,
        createdAt: now,
        updatedAt: now,
      };

      // Only add optional fields if they have values
      if (product.description) productData.description = product.description;
      if (product.sku) productData.sku = product.sku;
      if (product.hsnCode) productData.hsnCode = product.hsnCode;
      if (product.taxRate !== undefined) productData.taxRate = product.taxRate;
      if (product.category) productData.category = product.category;
      if (product.imageUrl) productData.imageUrl = product.imageUrl;
      if (product.stockQuantity !== undefined) productData.stockQuantity = product.stockQuantity;
      if (product.lowStockThreshold !== undefined) productData.lowStockThreshold = product.lowStockThreshold;

      batch.set(adminDb.collection('products').doc(productId), productData);
      imported++;
    }

    await batch.commit();

    return { success: true, imported, errors: errors.length > 0 ? errors : undefined };
  } catch (error) {
    console.error('Error bulk importing products:', error);
    return { success: false, error: 'Failed to import products' };
  }
}

/**
 * Get product stats
 */
export async function getProductStatsAction(params: {
  idToken: string;
}): Promise<{ 
  success: boolean; 
  stats?: { total: number; active: number; inactive: number; lowStock: number }; 
  error?: string 
}> {
  if (!adminDb) {
    return { success: false, error: 'Database not initialized' };
  }

  try {
    const verification = await verifyAuthToken(params.idToken);
    if (!verification.success) {
      return { success: false, error: 'Unauthorized' };
    }

    const userDoc = await adminDb.collection('users').doc(verification.uid).get();
    if (!userDoc.exists) {
      return { success: false, error: 'User not found' };
    }

    const userData = userDoc.data();
    const companyId = userData?.companyId;

    const snapshot = await adminDb.collection('products')
      .where('companyId', '==', companyId)
      .get();

    const products = snapshot.docs.map(doc => doc.data() as Product);
    
    const stats = {
      total: products.length,
      active: products.filter(p => p.isActive).length,
      inactive: products.filter(p => !p.isActive).length,
      lowStock: products.filter(p => 
        p.trackInventory && 
        p.stockQuantity !== undefined && 
        p.lowStockThreshold !== undefined &&
        p.stockQuantity <= p.lowStockThreshold
      ).length,
    };

    return { success: true, stats };
  } catch (error) {
    console.error('Error fetching product stats:', error);
    return { success: false, error: 'Failed to fetch stats' };
  }
}
