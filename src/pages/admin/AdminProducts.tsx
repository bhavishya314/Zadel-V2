import React from 'react';
import { Package, ShieldCheck } from 'lucide-react';
import { products } from '../../lib/products';

export default function AdminProducts() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-zadel-gold">
            <Package className="h-3.5 w-3.5" />
            <span>Admin Management</span>
          </div>
          <h1 className="font-display text-3xl text-foreground">
            Product Catalog
          </h1>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-emerald-950/50 border border-emerald-800/40 px-3 py-1.5 text-xs text-emerald-400">
          <ShieldCheck className="h-4 w-4" />
          <span>Protected Route: /admin/products</span>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-800 bg-zadel-elevated overflow-hidden">
        <div className="p-4 border-b border-neutral-800 flex justify-between items-center text-xs text-neutral-400">
          <span>Catalog Items ({products.length})</span>
          <span className="font-mono text-neutral-500">Read-Only Admin View</span>
        </div>

        <div className="divide-y divide-neutral-800">
          {products.map((product) => (
            <div key={product.id} className="p-4 flex items-center gap-4 hover:bg-neutral-900/50 transition-colors">
              <img
                src={product.images[0]}
                alt={product.title}
                className="h-12 w-12 rounded-lg object-cover bg-neutral-900 border border-neutral-800"
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-foreground truncate">{product.title}</h3>
                <p className="text-xs text-neutral-400 capitalize">{product.category} • {product.subtitle}</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-mono font-medium text-zadel-gold">${product.price.toLocaleString()}</span>
                <span className="block text-[10px] text-neutral-500 uppercase">{product.inStock ? 'In Stock' : 'Out of Stock'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
