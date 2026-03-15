import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Send } from 'lucide-react';
import api from '../lib/api';
import { useAuthContext } from '../context/AuthContext';

interface Customer { id: number; name: string; email: string; phone: string; notes: string; joined_at: string }
interface Promotion { id: number; title: string; description: string; discount_pct: string; target_segment: string; created_at: string }

const defaultCustomer = { name: '', email: '', phone: '', notes: '' };
const defaultPromo = { title: '', description: '', discount_pct: '', target_segment: 'all' };

export default function Customers() {
  const { user } = useAuthContext();
  const isOwner = user?.role === 'owner';
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [customerForm, setCustomerForm] = useState(defaultCustomer);
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [promoForm, setPromoForm] = useState(defaultPromo);

  useEffect(() => {
    fetchCustomers();
    fetchPromotions();
  }, []);

  async function fetchCustomers() {
    const r = await api.get('/customers');
    setCustomers(r.data);
  }

  async function fetchPromotions() {
    const r = await api.get('/promotions');
    setPromotions(r.data);
  }

  async function handleCustomerSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editCustomer) {
      await api.put(`/customers/${editCustomer.id}`, customerForm);
    } else {
      await api.post('/customers', customerForm);
    }
    setShowCustomerForm(false);
    setEditCustomer(null);
    setCustomerForm(defaultCustomer);
    fetchCustomers();
  }

  function openEditCustomer(c: Customer) {
    setCustomerForm({ name: c.name, email: c.email, phone: c.phone, notes: c.notes });
    setEditCustomer(c);
    setShowCustomerForm(true);
  }

  async function deleteCustomer(id: number) {
    if (!confirm('Delete this customer?')) return;
    await api.delete(`/customers/${id}`);
    fetchCustomers();
  }

  async function handlePromoSubmit(e: React.FormEvent) {
    e.preventDefault();
    await api.post('/promotions', promoForm);
    setShowPromoForm(false);
    setPromoForm(defaultPromo);
    fetchPromotions();
  }

  async function deletePromo(id: number) {
    if (!confirm('Delete this promotion?')) return;
    await api.delete(`/promotions/${id}`);
    fetchPromotions();
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Customers & Promotions</h2>

      {/* Customers */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Customers ({customers.length})</h3>
          <button
            onClick={() => { setShowCustomerForm(true); setEditCustomer(null); setCustomerForm(defaultCustomer); }}
            className="flex items-center gap-2 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700 transition-colors"
          >
            <Plus size={15} /> Add Customer
          </button>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Phone</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Notes</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                <td className="px-4 py-3 text-gray-600">{c.email || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{c.phone || '—'}</td>
                <td className="px-4 py-3 text-gray-500">{c.notes || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openEditCustomer(c)} className="text-gray-400 hover:text-blue-500 transition-colors">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => deleteCustomer(c.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">No customers yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Customer Form Modal */}
      {showCustomerForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h3 className="font-semibold text-lg mb-4">{editCustomer ? 'Edit Customer' : 'New Customer'}</h3>
            <form onSubmit={handleCustomerSubmit} className="space-y-3">
              {[
                { field: 'name', label: 'Name', required: true },
                { field: 'email', label: 'Email' },
                { field: 'phone', label: 'Phone' },
                { field: 'notes', label: 'Notes' },
              ].map(({ field, label, required }) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    value={customerForm[field as keyof typeof customerForm]}
                    onChange={(e) => setCustomerForm({ ...customerForm, [field]: e.target.value })}
                    required={required}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm hover:bg-green-700 transition-colors">Save</button>
                <button type="button" onClick={() => setShowCustomerForm(false)} className="flex-1 border border-gray-300 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Promotions */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Promotions</h3>
          {isOwner && (
            <button
              onClick={() => setShowPromoForm(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 transition-colors"
            >
              <Send size={15} /> Create Promotion
            </button>
          )}
        </div>

        {/* Promo Form */}
        {showPromoForm && isOwner && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
              <h3 className="font-semibold text-lg mb-4">New Promotion</h3>
              <form onSubmit={handlePromoSubmit} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input required value={promoForm.title} onChange={(e) => setPromoForm({ ...promoForm, title: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea rows={3} value={promoForm.description} onChange={(e) => setPromoForm({ ...promoForm, description: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
                  <input type="number" min="0" max="100" step="0.01" value={promoForm.discount_pct} onChange={(e) => setPromoForm({ ...promoForm, discount_pct: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Segment</label>
                  <select value={promoForm.target_segment} onChange={(e) => setPromoForm({ ...promoForm, target_segment: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="all">All Customers</option>
                    <option value="loyal">Loyal Customers</option>
                    <option value="new">New Customers</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">Create</button>
                  <button type="button" onClick={() => setShowPromoForm(false)} className="flex-1 border border-gray-300 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="p-4 space-y-3">
          {promotions.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No promotions yet</p>}
          {promotions.map((p) => (
            <div key={p.id} className="flex items-start justify-between border border-gray-200 rounded-xl p-4 hover:bg-gray-50">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900">{p.title}</p>
                  {p.discount_pct && (
                    <span className="text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5">{p.discount_pct}% off</span>
                  )}
                  <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 capitalize">{p.target_segment}</span>
                </div>
                {p.description && <p className="text-sm text-gray-500 mt-1">{p.description}</p>}
              </div>
              {isOwner && (
                <button onClick={() => deletePromo(p.id)} className="text-gray-400 hover:text-red-500 transition-colors ml-4 shrink-0">
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
