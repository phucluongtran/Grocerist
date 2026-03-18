import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import api from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { useAuthContext } from '../context/AuthContext';

interface InventoryItem {
  product_id: number;
  name: string;
  category: string;
  sku: string;
  price: string;
  cost: string;
  low_stock_threshold: number;
}

interface ProductFormData {
  name: string;
  category: string;
  sku: string;
  price: string;
  cost: string;
  low_stock_threshold: string;
}

const defaultForm: ProductFormData = { name: '', category: '', sku: '', price: '', cost: '', low_stock_threshold: '10' };

export default function Products() {
  const { user } = useAuthContext();
  const isOwner = user?.role === 'owner';
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductFormData>(defaultForm);

  useEffect(() => { fetchProducts(); }, []);

  async function fetchProducts() {
    const r = await api.get('/inventory');
    setItems(r.data);
  }

  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.category?.toLowerCase().includes(search.toLowerCase()) ||
    i.sku?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editId) {
      await api.put(`/products/${editId}`, form);
    } else {
      await api.post('/products', form);
    }
    setShowForm(false);
    setEditId(null);
    setForm(defaultForm);
    fetchProducts();
  }

  function openEdit(item: InventoryItem) {
    setForm({
      name: item.name,
      category: item.category,
      sku: item.sku,
      price: item.price,
      cost: item.cost ?? '',
      low_stock_threshold: String(item.low_stock_threshold),
    });
    setEditId(item.product_id);
    setShowForm(true);
  }

  async function deleteProduct(id: number) {
    if (!confirm('Delete this product?')) return;
    await api.delete(`/products/${id}`);
    fetchProducts();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Products</h2>
        {isOwner && (
          <button
            onClick={() => { setShowForm(true); setEditId(null); setForm(defaultForm); }}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors"
          >
            <Plus size={16} /> Add Product
          </button>
        )}
      </div>

      <input
        type="text"
        placeholder="Search products…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 max-w-sm"
      />

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h3 className="font-semibold text-lg mb-4">{editId ? 'Edit Product' : 'New Product'}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              {(['name', 'category', 'sku'] as const).map((field) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{field}</label>
                  <input
                    value={form[field]}
                    onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                    required={field === 'name'}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                <input
                  type="number" step="0.01" min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost ($)</label>
                <input
                  type="number" step="0.01" min="0"
                  value={form.cost}
                  onChange={(e) => setForm({ ...form, cost: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
                <input
                  type="number" min="0"
                  value={form.low_stock_threshold}
                  onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm hover:bg-green-700 transition-colors">Save</button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Price</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Cost</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">SKU</th>
              {isOwner && <th className="px-4 py-3"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((item) => (
              <tr key={item.product_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                <td className="px-4 py-3 text-right text-gray-900">{formatCurrency(item.price)}</td>
                <td className="px-4 py-3 text-right text-gray-500">{item.cost ? formatCurrency(item.cost) : '—'}</td>
                <td className="px-4 py-3 text-gray-500">{item.category || '—'}</td>
                <td className="px-4 py-3 text-gray-500">{item.sku || '—'}</td>
                {isOwner && (
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(item)} className="text-gray-400 hover:text-blue-500 transition-colors">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => deleteProduct(item.product_id)} className="text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={isOwner ? 6 : 5} className="text-center py-8 text-gray-400">No products found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
