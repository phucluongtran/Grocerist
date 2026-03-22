import { useEffect, useState } from 'react';
import { AlertTriangle, TrendingUp, ShoppingCart, Package } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';

interface Alert { name: string; stock: number; low_stock_threshold: number }
interface Summary { total_revenue: string; total_units: string; top_products: { name: string; units_sold: string }[] }
interface Sale { quantity: number; sale_price: string; created_at: string }

export default function Dashboard() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);

  useEffect(() => {
    api.get('/alerts').then((r) => setAlerts(r.data.low_stock));
    api.get('/sales/summary').then((r) => setSummary(r.data));
    api.get('/sales').then((r) => setSales(r.data));
  }, []);

  const barData = Object.values(
    sales
      .filter((s) => {
        const d = new Date(s.created_at);
        const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
        return d >= cutoff;
      })
      .reduce<Record<string, { date: string; revenue: number }>>((acc, s) => {
        const date = formatDate(s.created_at);
        if (!acc[date]) acc[date] = { date, revenue: 0 };
        acc[date].revenue += s.quantity * (parseFloat(s.sale_price) || 0);
        return acc;
      }, {})
  ).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-amber-700 font-semibold mb-2">
            <AlertTriangle size={18} /> Low Stock Alerts ({alerts.length})
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {alerts.map((a) => (
              <div key={a.name} className="flex justify-between text-sm text-amber-800 bg-amber-100 rounded-lg px-3 py-2">
                <span>{a.name}</span>
                <span className="font-medium">{a.stock} left (min {a.low_stock_threshold})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sales Snapshot */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="bg-green-100 rounded-full p-3"><TrendingUp className="text-green-600" size={22} /></div>
          <div>
            <p className="text-sm text-gray-500">Today's Revenue</p>
            <p className="text-2xl font-bold text-gray-900">{summary ? formatCurrency(summary.total_revenue) : '—'}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="bg-blue-100 rounded-full p-3"><ShoppingCart className="text-blue-600" size={22} /></div>
          <div>
            <p className="text-sm text-gray-500">Units Sold Today</p>
            <p className="text-2xl font-bold text-gray-900">{summary?.total_units ?? '—'}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2"><Package size={16} /> Top Products</div>
          {summary?.top_products.length ? (
            <ul className="space-y-1">
              {summary.top_products.map((p) => (
                <li key={p.name} className="flex justify-between text-sm">
                  <span className="text-gray-700">{p.name}</span>
                  <span className="font-medium text-gray-900">{p.units_sold} units</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-gray-400">No sales yet today</p>}
        </div>
      </div>

      {/* 7-Day Revenue Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Revenue — Last 7 Days</h3>
        {barData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              <Bar dataKey="revenue" fill="#16a34a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <p className="text-sm text-gray-400 text-center py-10">No sales data in the last 7 days</p>}
      </div>
    </div>
  );
}
