"use client";

import { useState } from "react";
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone, User, Receipt, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  sku: string;
  sellingPrice: number;
  availableStock: number;
  taxRate: number;
}

interface Customer {
  id: string;
  name: string;
  phone?: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
}

interface POSClientProps {
  products: Product[];
  customers: Customer[];
  taxRate: number;
  branchId: string;
  userId: string;
  orgId: string;
}

export function POSClient({ products, customers, taxRate, branchId, userId, orgId }: POSClientProps) {
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showCustomer, setShowCustomer] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "UPI">("CASH");
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState<{ invoiceNumber: string; total: number } | null>(null);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.availableStock) return prev;
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      if (product.availableStock <= 0) return prev;
      return [...prev, { product, quantity: 1, discount: 0 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.availableStock) return item;
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);
  const discountTotal = cart.reduce((sum, item) => sum + item.discount, 0);
  const taxableAmount = subtotal - discountTotal;
  const taxAmount = (taxableAmount * taxRate) / 100;
  const total = taxableAmount + taxAmount;

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId,
          branchId,
          userId,
          customerId: selectedCustomer?.id,
          items: cart.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            unitPrice: item.product.sellingPrice,
            discount: item.discount,
            taxRate: item.product.taxRate,
          })),
          paymentMethod,
          total,
          subtotal,
          discountTotal,
          taxTotal: taxAmount,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Checkout failed");
        return;
      }

      const result = await res.json();
      setReceipt({ invoiceNumber: result.invoiceNumber, total: result.totalAmount });
      setCart([]);
      setShowCheckout(false);
    } catch {
      alert("Checkout failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (receipt) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
          <Receipt className="h-8 w-8 text-emerald-600" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">Sale Complete!</h3>
        <p className="text-sm text-gray-500">Invoice: {receipt.invoiceNumber}</p>
        <p className="text-2xl font-bold mt-2">{formatCurrency(receipt.total)}</p>
        <p className="text-xs text-gray-500 mt-1">Payment simulated (demo mode)</p>
        <Button className="mt-6" onClick={() => setReceipt(null)}>New Sale</Button>
      </div>
    );
  }

  return (
    <>
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search products by name or SKU..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {filteredProducts.map((product) => (
          <button
            key={product.id}
            onClick={() => addToCart(product)}
            disabled={product.availableStock <= 0}
            className="flex flex-col items-center rounded-lg border border-gray-200 p-3 text-center transition-colors hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:hover:border-indigo-600 dark:hover:bg-indigo-900/20"
          >
            <p className="text-xs font-medium text-gray-900 dark:text-gray-100 line-clamp-2">{product.name}</p>
            <p className="text-[10px] text-gray-500">{product.sku}</p>
            <p className="mt-1 text-sm font-bold text-indigo-600">{formatCurrency(product.sellingPrice)}</p>
            <Badge variant={product.availableStock === 0 ? "destructive" : product.availableStock <= 10 ? "warning" : "success"} className="mt-1">
              {product.availableStock === 0 ? "Out" : `${product.availableStock} left`}
            </Badge>
          </button>
        ))}
      </div>

      {/* Cart */}
      {cart.length > 0 && (
        <div className="mt-6 border-t border-gray-200 pt-4 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Cart ({cart.length} items)</h3>
            <Button variant="ghost" size="sm" onClick={() => setCart([])}>
              <Trash2 className="h-4 w-4" /> Clear
            </Button>
          </div>
          <div className="space-y-2">
            {cart.map((item) => (
              <div key={item.product.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-2 dark:bg-gray-700/50">
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.product.name}</p>
                  <p className="text-xs text-gray-500">{formatCurrency(item.product.sellingPrice)} each</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.product.id, -1)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.product.id, 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => removeFromCart(item.product.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-4 space-y-1 border-t border-gray-200 pt-3 dark:border-gray-700">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discountTotal > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>Discount</span>
                <span>-{formatCurrency(discountTotal)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span>Tax ({taxRate}%)</span>
              <span>{formatCurrency(taxAmount)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowCustomer(true)}>
              <User className="h-4 w-4" /> {selectedCustomer?.name ?? "Walk-in"}
            </Button>
            <Button className="flex-1" onClick={() => setShowCheckout(true)}>
              <CreditCard className="h-4 w-4" /> Checkout
            </Button>
          </div>
        </div>
      )}

      {/* Customer Dialog */}
      <Dialog open={showCustomer} onOpenChange={setShowCustomer}>
        <DialogHeader>
          <DialogTitle>Select Customer</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <div className="space-y-2">
            <button
              onClick={() => { setSelectedCustomer(null); setShowCustomer(false); }}
              className="w-full rounded-lg border border-gray-200 p-3 text-left hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
            >
              <p className="text-sm font-medium">Walk-in Customer</p>
            <p className="text-xs text-gray-500">No customer selected</p>
            </button>
            {customers.map((customer) => (
              <button
                key={customer.id}
                onClick={() => { setSelectedCustomer(customer); setShowCustomer(false); }}
                className="w-full rounded-lg border border-gray-200 p-3 text-left hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
              >
                <p className="text-sm font-medium">{customer.name}</p>
                <p className="text-xs text-gray-500">{customer.phone ?? "No phone"}</p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogHeader>
          <DialogTitle>Complete Sale</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Payment simulated (demo mode)</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Payment Method</p>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={paymentMethod === "CASH" ? "default" : "outline"}
                  onClick={() => setPaymentMethod("CASH")}
                  className="flex flex-col items-center gap-1 h-auto py-3"
                >
                  <Banknote className="h-5 w-5" />
                  <span className="text-xs">Cash</span>
                </Button>
                <Button
                  variant={paymentMethod === "CARD" ? "default" : "outline"}
                  onClick={() => setPaymentMethod("CARD")}
                  className="flex flex-col items-center gap-1 h-auto py-3"
                >
                  <CreditCard className="h-5 w-5" />
                  <span className="text-xs">Card</span>
                </Button>
                <Button
                  variant={paymentMethod === "UPI" ? "default" : "outline"}
                  onClick={() => setPaymentMethod("UPI")}
                  className="flex flex-col items-center gap-1 h-auto py-3"
                >
                  <Smartphone className="h-5 w-5" />
                  <span className="text-xs">UPI</span>
                </Button>
              </div>
            </div>
            {selectedCustomer && (
              <div className="text-sm">
                <span className="text-gray-500">Customer: </span>
                <span className="font-medium">{selectedCustomer.name}</span>
              </div>
            )}
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowCheckout(false)}>Cancel</Button>
          <Button onClick={handleCheckout} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Complete Sale
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}
