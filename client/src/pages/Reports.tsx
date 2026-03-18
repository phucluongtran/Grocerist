import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, CartesianGrid,
} from 'recharts';
import api from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';

interface Sale { quantity: number; sale_price: string; created_at: string }
interface Product { id: number; name: string }
interface ForecastPoint { date: string; qty?: number; predicted_qty?: number }
interface TopProduct { name: string; units_sold: string }

type Range = 7 | 30 | 90;

export default function Reports() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [forecastProduct, setForecastProduct] = useState<string>('');
  const [forecastData, setForecastData] = useState<ForecastPoint[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [range, setRange] = useState<Range>(30);

  useEffect(() => {
    api.get('/sales').then((r) => setSales(r.data));
    api.get('/products').then((r) => {
      setProducts(r.data);
      if (r.data.length) setForecastProduct(String(r.data[0].id));
    });
    api.get('/sales/summary').then((r) => setTopProducts(r.data.top_products ?? []));
  }, []);

  useEffect(() => {
    if (forecastProduct) fetchForecast(forecastProduct);
  }, [forecastProduct]);

  async function fetchForecast(productId: string) {
    const r = await api.get(`/forecast/${productId}`);
    const actual = r.data.actual.map((d: { date: string; qty: number }) => ({ date: formatDate(d.date), qty: d.qty }));
    const forecast = r.data.forecast.map((d: { date: string; predicted_qty: number }) => ({ date: formatDate(d.date), predicted_qty: d.predicted_qty }));
    setForecastData([...actual, ...forecast]);
  }

  const barData = Object.values(
    sales
      .filter((s) => {
        const d = new Date(s.created_at);
        const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - range);
        return d >= cutoff;
      })
      .reduce<Record<string, { date: string; revenue: number }>>((acc, s) => {
        const date = formatDate(s.created_at);
        if (!acc[date]) acc[date] = { date, revenue: 0 };
        acc[date].revenue += s.quantity * parseFloat(s.sale_price);
        return acc;
      }, {})
  ).sort((a, b) => a.date.localeCompare(b.date));

  const ranges: Range[] = [7, 30, 90];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
        <div className="flex gap-1">
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                range === r ? 'bg-green-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Daily Revenue (Last {range} Days)</h3>
        {barData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              <Bar dataKey="revenue" fill="#16a34a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <p className="text-sm text-gray-400 text-center py-10">No sales data for this period</p>}
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

      {/* Top Products */}
      {topProducts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Top Products</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Product</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Units Sold</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topProducts.map((p) => (
                <tr key={p.name} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900">{p.name}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">{p.units_sold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
