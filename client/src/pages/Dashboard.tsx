import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Plus, Trash2, TrendingUp, ShoppingCart, Package } from 'lucide-react';
import api from '../lib/api';
import { formatCurrency } from '../lib/utils';

interface Alert { name: string; quantity: number; low_stock_threshold: number }
interface Summary { total_revenue: string; total_units: string; top_products: { name: string; units_sold: string }[] }
interface Todo { id: number; text: string; completed: boolean; due_date: string | null }

export default function Dashboard() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');

  useEffect(() => {
    api.get('/alerts').then((r) => setAlerts(r.data.low_stock));
    api.get('/sales/summary').then((r) => setSummary(r.data));
    api.get('/todos').then((r) => setTodos(r.data));
  }, []);

  async function addTodo() {
    if (!newTodo.trim()) return;
    const r = await api.post('/todos', { text: newTodo.trim() });
    setTodos((prev) => [...prev, r.data]);
    setNewTodo('');
  }

  async function toggleTodo(todo: Todo) {
    const r = await api.put(`/todos/${todo.id}`, { completed: !todo.completed });
    setTodos((prev) => prev.map((t) => t.id === todo.id ? r.data : t));
  }

  async function deleteTodo(id: number) {
    await api.delete(`/todos/${id}`);
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }

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
                <span className="font-medium">{a.quantity} left (min {a.low_stock_threshold})</span>
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

      {/* Todo List */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Today's To-Do</h3>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTodo()}
            placeholder="Add a task…"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button onClick={addTodo} className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors">
            <Plus size={18} />
          </button>
        </div>
        <ul className="space-y-2">
          {todos.length === 0 && <p className="text-sm text-gray-400">No tasks for today</p>}
          {todos.map((todo) => (
            <li key={todo.id} className="flex items-center gap-3 group">
              <button onClick={() => toggleTodo(todo)}>
                <CheckCircle2 size={20} className={todo.completed ? 'text-green-500' : 'text-gray-300'} />
              </button>
              <span className={`flex-1 text-sm ${todo.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                {todo.text}
              </span>
              <button onClick={() => deleteTodo(todo.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity">
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
