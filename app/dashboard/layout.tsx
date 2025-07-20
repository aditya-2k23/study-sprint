import ProtectedRoute from '../components/ProtectedRoute';
import DashboardNav from '../components/DashboardNav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <DashboardNav />
        <main>{children}</main>
      </div>
    </ProtectedRoute>
  );
}
