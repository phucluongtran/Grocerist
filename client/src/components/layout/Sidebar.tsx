import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, TrendingUp, Users, Upload, LogOut } from 'lucide-react';
import { useAuthContext } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/inventory', label: 'Inventory', icon: Package },
  { to: '/sales', label: 'Sales & Forecast', icon: TrendingUp },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/import', label: 'Import CSV', icon: Upload },
];

export default function Sidebar() {
  const { user, logout } = useAuthContext();
  return (
    <aside className="flex flex-col w-60 min-h-screen bg-gray-900 text-white px-4 py-6 shrink-0">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-green-400">Grocerist</h1>
        <p className="text-xs text-gray-400 mt-1">{user?.email}</p>
        <span className="text-xs bg-gray-700 rounded px-1 py-0.5 mt-1 inline-block capitalize">{user?.role}</span>
      </div>
      <nav className="flex-1 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                isActive ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-800'
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <button
        onClick={logout}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mt-4 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors"
      >
        <LogOut size={16} /> Logout
      </button>
    </aside>
  );
}
