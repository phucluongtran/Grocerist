import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import Sidebar from './Sidebar';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthContext();

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen text-gray-500">Loading…</div>
  );
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
