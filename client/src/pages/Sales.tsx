import { useEffect, useState } from 'react';
import { Plus, Minus, Trash2, ShoppingCart } from 'lucide-react';
import api from '../lib/api';
import { formatCurrency } from '../lib/utils';

interface Product { id: number; name: string; price: string; category: string }
interface CartItem { product: Product; qty: number }

export default function Sales() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    api.get('/products').then((r) => setProducts(r.data));
  }, []);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id);
      if (existing) return prev.map((c) => c.product.id === product.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { product, qty: 1 }];
    });
  }

  function updateQty(productId: number, delta: number) {
    setCart((prev) =>
      prev
        .map((c) => c.product.id === productId ? { ...c, qty: c.qty + delta } : c)
        .filter((c) => c.qty > 0)
    );
  }

  function removeFromCart(productId: number) {
    setCart((prev) => prev.filter((c) => c.product.id !== productId));
  }

  const total = cart.reduce((sum, c) => sum + c.qty * parseFloat(c.product.price), 0);

  async function checkout() {
    if (cart.length === 0) return;
    setChecking(true);
    try {
      await Promise.all(
        cart.map((c) =>
          api.post('/sales', {
            product_id: c.product.id,
            quantity: c.qty,
            sale_price: parseFloat(c.product.price),
          })
        )
      );
      setCart([]);
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">Point of Sale</h2>

      <input
        type="text"
        placeholder="Search products…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
      />

      <div className="flex gap-4 items-start">
        {/* Product Grid */}
        <div className="flex-[3] grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => addToCart(p)}
              className="bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-green-400 hover:shadow-sm transition-all"
            >
              <p className="font-medium text-gray-900 text-sm leading-tight">{p.name}</p>
              {p.category && <p className="text-xs text-gray-400 mt-0.5">{p.category}</p>}
              <p className="text-green-600 font-semibold text-sm mt-2">{formatCurrency(p.price)}</p>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full text-center py-8 text-gray-400 text-sm">No products found</p>
          )}
        </div>

        {/* Cart */}
        <div className="flex-[2] bg-white border border-gray-200 rounded-xl p-4 sticky top-4">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart size={18} className="text-gray-600" />
            <h3 className="font-semibold text-gray-900">Cart</h3>
            {cart.length > 0 && (
              <span className="ml-auto text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5 font-medium">
                {cart.reduce((s, c) => s + c.qty, 0)} items
              </span>
            )}
          </div>

          {cart.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Add products to start a sale</p>
          ) : (
            <div className="space-y-3">
              {cart.map((c) => (
                <div key={c.product.id} className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{c.product.name}</p>
                    <p className="text-xs text-gray-500">{formatCurrency(c.product.price)} each</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty(c.product.id, -1)} className="p-1 rounded hover:bg-gray-100 text-gray-500">
                      <Minus size={13} />
                    </button>
                    <span className="text-sm font-medium w-6 text-center">{c.qty}</span>
                    <button onClick={() => updateQty(c.product.id, 1)} className="p-1 rounded hover:bg-gray-100 text-gray-500">
                      <Plus size={13} />
                    </button>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-16 text-right">
                    {formatCurrency(c.qty * parseFloat(c.product.price))}
                  </span>
                  <button onClick={() => removeFromCart(c.product.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-green-600">{formatCurrency(total)}</span>
                </div>
                <button
                  onClick={checkout}
                  disabled={checking}
                  className="w-full bg-green-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {checking ? 'Processing…' : 'Checkout'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
