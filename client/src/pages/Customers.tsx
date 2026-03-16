import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import api from '../lib/api';

interface Customer { id: number; name: string; email: string; phone: string; loyalty_points: number; created_at: string }

const defaultCustomer = { name: '', email: '', phone: '', loyalty_points: 0 };

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [customerForm, setCustomerForm] = useState(defaultCustomer);

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    const r = await api.get('/customers');
    setCustomers(r.data);
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
    setCustomerForm({ name: c.name, email: c.email, phone: c.phone, loyalty_points: c.loyalty_points });
    setEditCustomer(c);
    setShowCustomerForm(true);
  }

  async function deleteCustomer(id: number) {
    if (!confirm('Delete this customer?')) return;
    await api.delete(`/customers/${id}`);
    fetchCustomers();
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Customers</h2>

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
              <th className="text-right px-4 py-3 font-medium text-gray-600">Loyalty Points</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                <td className="px-4 py-3 text-gray-600">{c.email || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{c.phone || '—'}</td>
                <td className="px-4 py-3 text-right text-gray-600">{c.loyalty_points}</td>
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
              ].map(({ field, label, required }) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    value={customerForm[field as keyof typeof customerForm] as string}
                    onChange={(e) => setCustomerForm({ ...customerForm, [field]: e.target.value })}
                    required={required}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loyalty Points</label>
                <input
                  type="number" min="0"
                  value={customerForm.loyalty_points}
                  onChange={(e) => setCustomerForm({ ...customerForm, loyalty_points: parseInt(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm hover:bg-green-700 transition-colors">Save</button>
                <button type="button" onClick={() => setShowCustomerForm(false)} className="flex-1 border border-gray-300 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
