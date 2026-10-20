"use client";

import { useState } from "react";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface ProductFormProps {
  children: React.ReactNode;
  product?: {
    id: string;
    name: string;
    sku: string;
    barcode?: string;
    description?: string;
    unit: string;
    brand?: string;
    purchaseCost: number;
    sellingPrice: number;
    taxRate: number;
    reorderLevel: number;
    reorderQty: number;
    categoryId?: string;
    hasExpiry: boolean;
    hasBatch: boolean;
    hasSerial: boolean;
  };
}

export function ProductForm({ children, product }: ProductFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      sku: formData.get("sku") as string,
      barcode: formData.get("barcode") as string,
      description: formData.get("description") as string,
      unit: formData.get("unit") as string,
      brand: formData.get("brand") as string,
      purchaseCost: parseFloat(formData.get("purchaseCost") as string) || 0,
      sellingPrice: parseFloat(formData.get("sellingPrice") as string) || 0,
      taxRate: parseFloat(formData.get("taxRate") as string) || 0,
      reorderLevel: parseInt(formData.get("reorderLevel") as string) || 0,
      reorderQty: parseInt(formData.get("reorderQty") as string) || 0,
      categoryId: formData.get("categoryId") as string || undefined,
      hasExpiry: formData.get("hasExpiry") === "on",
      hasBatch: formData.get("hasBatch") === "on",
      hasSerial: formData.get("hasSerial") === "on",
    };

    try {
      const res = await fetch("/api/products", {
        method: product ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product ? { ...data, id: product.id } : data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save product");
      }

      setOpen(false);
      window.location.reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div onClick={() => setOpen(true)}>{children}</div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader>
          <DialogTitle>{product ? "Edit Product" : "Add Product"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input id="name" name="name" defaultValue={product?.name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input id="sku" name="sku" defaultValue={product?.sku} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode</Label>
                <Input id="barcode" name="barcode" defaultValue={product?.barcode} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input id="brand" name="brand" defaultValue={product?.brand} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" defaultValue={product?.description} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Input id="unit" name="unit" defaultValue={product?.unit ?? "pcs"} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchaseCost">Purchase Cost</Label>
                <Input id="purchaseCost" name="purchaseCost" type="number" step="0.01" defaultValue={product?.purchaseCost} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sellingPrice">Selling Price</Label>
                <Input id="sellingPrice" name="sellingPrice" type="number" step="0.01" defaultValue={product?.sellingPrice} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                <Input id="taxRate" name="taxRate" type="number" step="0.01" defaultValue={product?.taxRate} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reorderLevel">Reorder Level</Label>
                <Input id="reorderLevel" name="reorderLevel" type="number" defaultValue={product?.reorderLevel} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reorderQty">Reorder Qty</Label>
                <Input id="reorderQty" name="reorderQty" type="number" defaultValue={product?.reorderQty} />
              </div>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="hasExpiry" defaultChecked={product?.hasExpiry} />
                <span className="text-sm">Has Expiry</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="hasBatch" defaultChecked={product?.hasBatch} />
                <span className="text-sm">Has Batch</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="hasSerial" defaultChecked={product?.hasSerial} />
                <span className="text-sm">Has Serial</span>
              </label>
            </div>
          </DialogContent>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : product ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </>
  );
}
