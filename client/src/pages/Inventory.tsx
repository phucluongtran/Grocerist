import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import api from '../lib/api';
import { formatDate } from '../lib/utils';

interface InventoryItem {
  product_id: number;
  name: string;
  category: string;
  stock: number;
  low_stock_threshold: number;
  low_stock: boolean;
  updated_at?: string;
}

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [editQty, setEditQty] = useState<{ id: number; val: string } | null>(null);

  useEffect(() => { fetchInventory(); }, []);

  async function fetchInventory() {
    const r = await api.get('/inventory');
    setItems(r.data);
  }

  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.category?.toLowerCase().includes(search.toLowerCase())
  );

  async function saveQty(item: InventoryItem) {
    if (!editQty) return;
    await api.put(`/inventory/${item.product_id}`, { stock: parseInt(editQty.val) });
    setEditQty(null);
    fetchInventory();
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Inventory</h2>

      <input
        type="text"
        placeholder="Search products…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 max-w-sm"
      />

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Product</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Stock</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Last Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((item) => (
              <tr key={item.product_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                <td className="px-4 py-3 text-gray-500">{item.category || '—'}</td>
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
                <td className="px-4 py-3">
                  {item.low_stock ? (
                    <span className="flex items-center gap-1 text-red-600 text-xs font-medium">
                      <AlertCircle size={13} /> Low Stock
                    </span>
                  ) : (
                    <span className="text-xs text-green-600 font-medium">OK</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-gray-500">
                  {item.updated_at ? formatDate(item.updated_at) : '—'}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">No products found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
