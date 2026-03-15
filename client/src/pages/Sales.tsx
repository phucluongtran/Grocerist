import { useEffect, useState } from 'react';
import { Trash2, Plus } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, CartesianGrid,
} from 'recharts';
import api from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';

interface Sale { id: number; product_name: string; quantity: number; sale_price: string; sold_at: string }
interface Product { id: number; name: string; price: string }
interface ForecastPoint { date: string; qty?: number; predicted_qty?: number }

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState({ product_id: '', quantity: '1', sale_price: '' });
  const [showForm, setShowForm] = useState(false);
  const [forecastProduct, setForecastProduct] = useState<string>('');
  const [forecastData, setForecastData] = useState<ForecastPoint[]>([]);

  useEffect(() => {
    fetchSales();
    api.get('/products').then((r) => {
      setProducts(r.data);
      if (r.data.length) setForecastProduct(String(r.data[0].id));
    });
  }, []);

  useEffect(() => {
    if (forecastProduct) fetchForecast(forecastProduct);
  }, [forecastProduct]);

  async function fetchSales() {
    const r = await api.get('/sales');
    setSales(r.data);
  }

  async function fetchForecast(productId: string) {
    const r = await api.get(`/forecast/${productId}`);
    const actual = r.data.actual.map((d: { date: string; qty: number }) => ({ date: formatDate(d.date), qty: d.qty }));
    const forecast = r.data.forecast.map((d: { date: string; predicted_qty: number }) => ({ date: formatDate(d.date), predicted_qty: d.predicted_qty }));
    setForecastData([...actual, ...forecast]);
  }

  function selectProduct(id: string) {
    const p = products.find((x) => String(x.id) === id);
    setForm((f) => ({ ...f, product_id: id, sale_price: p ? p.price : '' }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await api.post('/sales', {
      product_id: parseInt(form.product_id),
      quantity: parseInt(form.quantity),
      sale_price: parseFloat(form.sale_price),
    });
    setShowForm(false);
    setForm({ product_id: '', quantity: '1', sale_price: '' });
    fetchSales();
  }

  async function deleteSale(id: number) {
    await api.delete(`/sales/${id}`);
    fetchSales();
  }

  // Build bar chart data: daily revenue last 30 days
  const barData = Object.values(
    sales
      .filter((s) => {
        const d = new Date(s.sold_at);
        const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
        return d >= cutoff;
      })
      .reduce<Record<string, { date: string; revenue: number }>>((acc, s) => {
        const date = formatDate(s.sold_at);
        if (!acc[date]) acc[date] = { date, revenue: 0 };
        acc[date].revenue += s.quantity * parseFloat(s.sale_price);
        return acc;
      }, {})
  ).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Sales & Forecasting</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors"
        >
          <Plus size={16} /> Record Sale
        </button>
      </div>

      {/* Sale Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h3 className="font-semibold text-lg mb-4">Record Sale</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                <select
                  value={form.product_id}
                  onChange={(e) => selectProduct(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select product</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sale Price ($)</label>
                <input type="number" step="0.01" min="0" value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: e.target.value })} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm hover:bg-green-700 transition-colors">Save</button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Daily Revenue (Last 30 Days)</h3>
        {barData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              <Bar dataKey="revenue" fill="#16a34a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <p className="text-sm text-gray-400 text-center py-10">No sales data yet</p>}
      </div>

      {/* Forecast Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">7-Day Demand Forecast</h3>
          <select
            value={forecastProduct}
            onChange={(e) => setForecastProduct(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        {forecastData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="qty" stroke="#16a34a" name="Actual" dot={false} strokeWidth={2} connectNulls />
              <Line type="monotone" dataKey="predicted_qty" stroke="#3b82f6" name="Forecast" strokeDasharray="5 5" strokeWidth={2} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        ) : <p className="text-sm text-gray-400 text-center py-10">Select a product to see forecast</p>}
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Recent Sales</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Product</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Qty</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Price</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Total</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Date</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sales.slice(0, 50).map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-900">{s.product_name}</td>
                <td className="px-4 py-3 text-right text-gray-600">{s.quantity}</td>
                <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(s.sale_price)}</td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency(s.quantity * parseFloat(s.sale_price))}</td>
                <td className="px-4 py-3 text-right text-gray-500">{formatDate(s.sold_at)}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => deleteSale(s.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
            {sales.length === 0 && (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">No sales recorded</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
