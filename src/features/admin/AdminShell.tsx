import { Button } from '@/components/ui/Button';
import { authClient } from '@/lib/auth-client';
import { Link, Outlet, useNavigate } from '@tanstack/react-router';

export function AdminShell() {
  const { data: session, isPending } = authClient.useSession();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await authClient.signOut();
    navigate({ to: '/admin/login' });
  };

  if (isPending) return <div className="p-8 text-center">Memuat sesi...</div>;

  if (!session) {
    return <Outlet />; // Will be handled by Login page or beforeLoad guard
  }

  const user = session.user;
  const role = user.role ?? '';
  const canEditContent = role === 'super_admin' || role === 'content_editor';

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-neutral-200 flex flex-col">
        <div className="p-6 border-b border-neutral-100">
          <Link
            to="/admin"
            className="text-xl font-bold text-primary-600 block"
          >
            Bimo Admin
          </Link>
          <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wider">
            {user.role?.replace('_', ' ')}
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <Link
            to="/admin"
            activeProps={{
              className: 'bg-primary-50 text-primary-700 font-semibold',
            }}
            className="block px-4 py-2 rounded-lg text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            to="/admin/children"
            activeProps={{
              className: 'bg-primary-50 text-primary-700 font-semibold',
            }}
            className="block px-4 py-2 rounded-lg text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            Manajemen Anak
          </Link>
          <Link
            to="/admin/audit"
            activeProps={{
              className: 'bg-primary-50 text-primary-700 font-semibold',
            }}
            className="block px-4 py-2 rounded-lg text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            Audit Log
          </Link>

          {canEditContent && (
            <Link
              to="/admin/content"
              activeProps={{
                className: 'bg-primary-50 text-primary-700 font-semibold',
              }}
              className="block px-4 py-2 rounded-lg text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              Manajemen Konten
            </Link>
          )}

          <Link
            to="/admin/analytics"
            activeProps={{
              className: 'bg-primary-50 text-primary-700 font-semibold',
            }}
            className="block px-4 py-2 rounded-lg text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            Analytics
          </Link>

          {user.role === 'super_admin' && (
            <Link
              to="/admin/settings"
              activeProps={{
                className: 'bg-primary-50 text-primary-700 font-semibold',
              }}
              className="block px-4 py-2 rounded-lg text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              Settings Global
            </Link>
          )}

          {canEditContent && (
            <Link
              to="/admin/import-export"
              activeProps={{
                className: 'bg-primary-50 text-primary-700 font-semibold',
              }}
              className="block px-4 py-2 rounded-lg text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              Import/Export
            </Link>
          )}

          {role === 'super_admin' && (
            <Link
              to="/admin/users"
              activeProps={{
                className: 'bg-primary-50 text-primary-700 font-semibold',
              }}
              className="block px-4 py-2 rounded-lg text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              Pengguna Admin
            </Link>
          )}
        </nav>

        <div className="p-4 border-t border-neutral-100">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-neutral-500 truncate">{user.email}</p>
            </div>
          </div>
          <Button
            variant="secondary"
            className="w-full text-sm py-1.5"
            onClick={handleSignOut}
          >
            Keluar
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-neutral-50">
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-neutral-200 px-8 py-4 flex items-center justify-between md:hidden">
          <Link to="/admin" className="font-bold text-primary-600">
            Bimo Admin
          </Link>
          <button type="button" className="p-2">
            Menu
          </button>
        </header>
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
