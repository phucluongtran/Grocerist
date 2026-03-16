import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, AlertCircle } from 'lucide-react';
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
  stock: number;
  low_stock_threshold: number;
  low_stock: boolean;
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

export default function Inventory() {
  const { user } = useAuthContext();
  const isOwner = user?.role === 'owner';
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductFormData>(defaultForm);
  const [editQty, setEditQty] = useState<{ id: number; val: string } | null>(null);

  useEffect(() => { fetchInventory(); }, []);

  async function fetchInventory() {
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
    fetchInventory();
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
    fetchInventory();
  }

  async function saveQty(item: InventoryItem) {
    if (!editQty) return;
    await api.put(`/inventory/${item.product_id}`, { stock: parseInt(editQty.val) });
    setEditQty(null);
    fetchInventory();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Inventory</h2>
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
              <th className="text-left px-4 py-3 font-medium text-gray-600">Product</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">SKU</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Price</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Suggested</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Stock</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((item) => (
              <tr key={item.product_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">
                  <div className="flex items-center gap-2">
                    {item.name}
                    {item.low_stock && <AlertCircle size={14} className="text-amber-500" />}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500">{item.category || '—'}</td>
                <td className="px-4 py-3 text-gray-500">{item.sku || '—'}</td>
                <td className="px-4 py-3 text-right text-gray-900">{formatCurrency(item.price)}</td>
                <td className="px-4 py-3 text-right text-blue-600 font-medium">{formatCurrency(Number(item.price) * 1.15)}</td>
                <td className="px-4 py-3 text-right">
                  {editQty?.id === item.product_id ? (
                    <span className="flex items-center justify-end gap-1">
                      <input
                        type="number" min="0"
                        value={editQty.val}
                        onChange={(e) => setEditQty({ id: item.product_id, val: e.target.value })}
                        className="w-16 border border-gray-300 rounded px-2 py-1 text-sm text-right"
                        autoFocus
                      />
                      <button onClick={() => saveQty(item)} className="text-green-600 hover:text-green-700 text-xs font-medium">Save</button>
                      <button onClick={() => setEditQty(null)} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
                    </span>
                  ) : (
                    <button
                      onClick={() => setEditQty({ id: item.product_id, val: String(item.stock) })}
                      className={`font-medium ${item.low_stock ? 'text-red-600' : 'text-gray-900'} hover:underline`}
                    >
                      {item.stock}
                    </button>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {isOwner && (
                      <>
                        <button onClick={() => openEdit(item)} className="text-gray-400 hover:text-blue-500 transition-colors">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => deleteProduct(item.product_id)} className="text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">No products found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
