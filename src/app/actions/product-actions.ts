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

    let query = adminDb.collection('products')
      .where('companyId', '==', companyId)
      .orderBy('createdAt', 'desc');

    const snapshot = await query.get();
    let products = snapshot.docs.map(doc => doc.data() as Product);

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

    const productData: Product = {
      id: productId,
      companyId,
      name: params.product.name,
      description: params.product.description,
      sku: params.product.sku,
      unitPrice: params.product.unitPrice,
      currency: params.product.currency || 'INR',
      hsnCode: params.product.hsnCode,
      taxRate: params.product.taxRate,
      taxInclusive: params.product.taxInclusive || false,
      category: params.product.category,
      tags: params.product.tags || [],
      imageUrl: params.product.imageUrl,
      trackInventory: params.product.trackInventory || false,
      stockQuantity: params.product.stockQuantity,
      lowStockThreshold: params.product.lowStockThreshold,
      isActive: params.product.isActive !== false,
      createdBy: verification.uid,
      createdAt: now,
      updatedAt: now,
    };

    await adminDb.collection('products').doc(productId).set(productData);

    return { success: true, productId };
  } catch (error) {
    console.error('Error creating product:', error);
    return { success: false, error: 'Failed to create product' };
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

    const snapshot = await adminDb.collection('productCategories')
      .where('companyId', '==', companyId)
      .orderBy('name', 'asc')
      .get();

    const categories = snapshot.docs.map(doc => doc.data() as ProductCategory);

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
      const productData: Product = {
        id: productId,
        companyId,
        name: product.name,
        description: product.description,
        sku: product.sku,
        unitPrice: product.unitPrice,
        currency: product.currency || 'INR',
        hsnCode: product.hsnCode,
        taxRate: product.taxRate,
        taxInclusive: product.taxInclusive || false,
        category: product.category,
        tags: product.tags || [],
        imageUrl: product.imageUrl,
        trackInventory: product.trackInventory || false,
        stockQuantity: product.stockQuantity,
        lowStockThreshold: product.lowStockThreshold,
        isActive: product.isActive !== false,
        createdBy: verification.uid,
        createdAt: now,
        updatedAt: now,
      };

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
