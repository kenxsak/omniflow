"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Icon } from '@iconify/react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useCurrency } from '@/contexts/currency-context';
import {
  getProductsAction,
  createProductAction,
  updateProductAction,
  deleteProductAction,
  getProductStatsAction,
} from '@/app/actions/product-actions';
import type { Product, CreateProductInput } from '@/types/product';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, lowStock: 0 });
  
  const { toast } = useToast();
  const { appUser } = useAuth();
  const { formatCurrency, currency } = useCurrency();

  // Load products
  useEffect(() => {
    loadProducts();
  }, [appUser?.idToken]);

  async function loadProducts() {
    if (!appUser?.idToken) return;
    
    setIsLoading(true);
    try {
      const [productsResult, statsResult] = await Promise.all([
        getProductsAction({ idToken: appUser.idToken }),
        getProductStatsAction({ idToken: appUser.idToken }),
      ]);

      if (productsResult.success && productsResult.products) {
        setProducts(productsResult.products);
      }
      if (statsResult.success && statsResult.stats) {
        setStats(statsResult.stats);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      toast({ title: 'Failed to load products', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterActive === 'all' || 
      (filterActive === 'active' && product.isActive) ||
      (filterActive === 'inactive' && !product.isActive);

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold">Product Catalog</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage your products and services for quotes & invoices
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="h-9 sm:h-10 w-full sm:w-auto">
          <Icon icon="solar:add-circle-bold" className="w-4 h-4 mr-1.5" />
          Add Product
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Icon icon="solar:box-bold" className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-semibold">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Icon icon="solar:check-circle-bold" className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active</p>
              <p className="text-lg font-semibold">{stats.active}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
              <Icon icon="solar:pause-circle-bold" className="w-4 h-4 text-stone-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Inactive</p>
              <p className="text-lg font-semibold">{stats.inactive}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Icon icon="solar:danger-triangle-bold" className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Low Stock</p>
              <p className="text-lg font-semibold">{stats.lowStock}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Icon icon="solar:magnifer-linear" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 sm:h-10 text-sm"
          />
        </div>
        <Select value={filterActive} onValueChange={(v) => setFilterActive(v as typeof filterActive)}>
          <SelectTrigger className="w-full sm:w-[140px] h-9 sm:h-10 text-sm">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            <SelectItem value="active">Active Only</SelectItem>
            <SelectItem value="inactive">Inactive Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2 mb-4" />
              <div className="h-6 bg-muted rounded w-1/3" />
            </Card>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card className="p-8 text-center">
          <Icon icon="solar:box-linear" className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <h3 className="font-medium mb-1">No products found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchQuery ? 'Try a different search term' : 'Add your first product to get started'}
          </p>
          {!searchQuery && (
            <Button onClick={() => setShowAddDialog(true)} variant="outline">
              <Icon icon="solar:add-circle-linear" className="w-4 h-4 mr-1.5" />
              Add Product
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              formatCurrency={formatCurrency}
              onEdit={() => setEditingProduct(product)}
              onDelete={async () => {
                if (!appUser?.idToken) return;
                const result = await deleteProductAction({
                  idToken: appUser.idToken,
                  productId: product.id,
                });
                if (result.success) {
                  toast({ title: 'Product deleted' });
                  loadProducts();
                } else {
                  toast({ title: 'Failed to delete', variant: 'destructive' });
                }
              }}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <ProductDialog
        open={showAddDialog || !!editingProduct}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddDialog(false);
            setEditingProduct(null);
          }
        }}
        product={editingProduct}
        currency={currency}
        onSave={async (data) => {
          if (!appUser?.idToken) return;
          
          if (editingProduct) {
            const result = await updateProductAction({
              idToken: appUser.idToken,
              product: { id: editingProduct.id, ...data },
            });
            if (result.success) {
              toast({ title: 'Product updated' });
              loadProducts();
              setEditingProduct(null);
            } else {
              toast({ title: result.error || 'Failed to update', variant: 'destructive' });
            }
          } else {
            const result = await createProductAction({
              idToken: appUser.idToken,
              product: data,
            });
            if (result.success) {
              toast({ title: 'Product created' });
              loadProducts();
              setShowAddDialog(false);
            } else {
              toast({ title: result.error || 'Failed to create', variant: 'destructive' });
            }
          }
        }}
      />
    </div>
  );
}


// Product Card Component
function ProductCard({
  product,
  formatCurrency,
  onEdit,
  onDelete,
}: {
  product: Product;
  formatCurrency: (amount: number) => string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="p-3 sm:p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center flex-shrink-0">
              <Icon icon="solar:box-bold" className="w-5 h-5 text-stone-400" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-sm truncate">{product.name}</h3>
            {product.sku && (
              <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
            )}
            {product.description && (
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                {product.description}
              </p>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
              <Icon icon="solar:menu-dots-bold" className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Icon icon="solar:pen-linear" className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Icon icon="solar:trash-bin-2-linear" className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-3 pt-3 border-t flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold text-emerald-600">
            {formatCurrency(product.unitPrice)}
          </p>
          {product.taxRate && (
            <p className="text-[10px] text-muted-foreground">
              +{product.taxRate}% tax {product.hsnCode && `(HSN: ${product.hsnCode})`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {product.trackInventory && product.stockQuantity !== undefined && (
            <Badge 
              variant={product.stockQuantity <= (product.lowStockThreshold || 0) ? 'destructive' : 'secondary'}
              className="text-[10px]"
            >
              Stock: {product.stockQuantity}
            </Badge>
          )}
          <Badge variant={product.isActive ? 'default' : 'secondary'} className="text-[10px]">
            {product.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </div>
    </Card>
  );
}

// Product Dialog Component
function ProductDialog({
  open,
  onOpenChange,
  product,
  currency,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  currency: string;
  onSave: (data: CreateProductInput) => Promise<void>;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<CreateProductInput>({
    name: '',
    description: '',
    sku: '',
    unitPrice: 0,
    currency: currency,
    hsnCode: '',
    taxRate: undefined,
    taxInclusive: false,
    category: '',
    trackInventory: false,
    stockQuantity: undefined,
    lowStockThreshold: undefined,
    isActive: true,
  });

  // Reset form when dialog opens/closes or product changes
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || '',
        sku: product.sku || '',
        unitPrice: product.unitPrice,
        currency: product.currency,
        hsnCode: product.hsnCode || '',
        taxRate: product.taxRate,
        taxInclusive: product.taxInclusive || false,
        category: product.category || '',
        trackInventory: product.trackInventory || false,
        stockQuantity: product.stockQuantity,
        lowStockThreshold: product.lowStockThreshold,
        isActive: product.isActive,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        sku: '',
        unitPrice: 0,
        currency: currency,
        hsnCode: '',
        taxRate: undefined,
        taxInclusive: false,
        category: '',
        trackInventory: false,
        stockQuantity: undefined,
        lowStockThreshold: undefined,
        isActive: true,
      });
    }
  }, [product, open, currency]);

  const handleSubmit = async () => {
    if (!formData.name || formData.unitPrice === undefined) {
      return;
    }
    setIsSaving(true);
    try {
      await onSave(formData);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-[420px] sm:max-w-[480px] p-0 rounded-xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="p-4 sm:p-5 pb-0 space-y-1">
          <DialogTitle className="text-base sm:text-lg">
            {product ? 'Edit Product' : 'Add Product'}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {product ? 'Update product details' : 'Add a new product to your catalog'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Basic Info */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Product Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Website Design Package"
                className="h-9 sm:h-10 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the product/service"
                className="min-h-[60px] text-sm resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">SKU</Label>
                <Input
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="SKU-001"
                  className="h-9 sm:h-10 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Category</Label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Services"
                  className="h-9 sm:h-10 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-3 pt-2 border-t">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pricing</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Unit Price *</Label>
                <Input
                  type="number"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="h-9 sm:h-10 text-sm"
                  min={0}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Tax Rate (%)</Label>
                <Select
                  value={formData.taxRate?.toString() || ''}
                  onValueChange={(v) => setFormData({ ...formData, taxRate: v ? parseFloat(v) : undefined })}
                >
                  <SelectTrigger className="h-9 sm:h-10 text-sm">
                    <SelectValue placeholder="No tax" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No tax</SelectItem>
                    <SelectItem value="5">5% GST</SelectItem>
                    <SelectItem value="12">12% GST</SelectItem>
                    <SelectItem value="18">18% GST</SelectItem>
                    <SelectItem value="28">28% GST</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">HSN/SAC Code</Label>
              <Input
                value={formData.hsnCode}
                onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                placeholder="e.g., 998314 for IT services"
                className="h-9 sm:h-10 text-sm"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-medium">Price includes tax</Label>
                <p className="text-[10px] text-muted-foreground">Tax is included in the unit price</p>
              </div>
              <Switch
                checked={formData.taxInclusive}
                onCheckedChange={(checked) => setFormData({ ...formData, taxInclusive: checked })}
              />
            </div>
          </div>

          {/* Inventory */}
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-medium">Track Inventory</h4>
                <p className="text-[10px] text-muted-foreground">Monitor stock levels</p>
              </div>
              <Switch
                checked={formData.trackInventory}
                onCheckedChange={(checked) => setFormData({ ...formData, trackInventory: checked })}
              />
            </div>

            {formData.trackInventory && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Stock Quantity</Label>
                  <Input
                    type="number"
                    value={formData.stockQuantity || ''}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    className="h-9 sm:h-10 text-sm"
                    min={0}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Low Stock Alert</Label>
                  <Input
                    type="number"
                    value={formData.lowStockThreshold || ''}
                    onChange={(e) => setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value) || 0 })}
                    placeholder="5"
                    className="h-9 sm:h-10 text-sm"
                    min={0}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div>
              <Label className="text-xs font-medium">Active</Label>
              <p className="text-[10px] text-muted-foreground">Show in product selection</p>
            </div>
            <Switch
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 pt-3 border-t bg-muted/30">
          <div className="flex flex-col-reverse sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSaving || !formData.name || formData.unitPrice === undefined}
              className="w-full sm:flex-1 h-9 sm:h-10 text-xs sm:text-sm"
            >
              {isSaving ? (
                <>
                  <Icon icon="solar:spinner-bold" className="w-4 h-4 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Icon icon="solar:check-circle-bold" className="w-4 h-4 mr-1.5" />
                  {product ? 'Update Product' : 'Add Product'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
