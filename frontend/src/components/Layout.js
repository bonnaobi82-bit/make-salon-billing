import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Scissors,
  Calendar,
  UsersRound,
  Package,
  Receipt,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  Sparkles,
  Megaphone
} from 'lucide-react';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/customers', label: 'Customers', icon: Users },
    { path: '/services', label: 'Services', icon: Scissors },
    { path: '/appointments', label: 'Appointments', icon: Calendar },
    { path: '/staff', label: 'Staff', icon: UsersRound },
    { path: '/inventory', label: 'Inventory', icon: Package },
    { path: '/invoices', label: 'Invoices', icon: Receipt },
    { path: '/promotions', label: 'Promotions', icon: Megaphone },
    { path: '/settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar" data-testid="sidebar">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <Sparkles className="w-7 h-7 text-[#D4AF37]" strokeWidth={1.5} />
            <h1 className="text-2xl font-serif font-bold text-[#1B3B36]">Ma-Ke Salon</h1>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-[#1B3B36] text-white'
                      : 'text-[#6B726C] hover:bg-[#F3F4F1] hover:text-[#1B3B36]'
                  }`}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  <Icon size={20} strokeWidth={1.5} />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-[#E8EAE6]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-[#1B3B36] flex items-center justify-center text-white font-medium">
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-[#1B3B36]">{user?.full_name}</p>
              <p className="text-xs text-[#6B726C] capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-[#8C2A2A] hover:text-[#6B1F1F] w-full"
            data-testid="logout-button"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        <header className="top-header">
          <div className="px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-serif text-[#1B3B36]">
                {menuItems.find((item) => item.path === location.pathname)?.label || 'Dashboard'}
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-[#F3F4F1] rounded-lg transition-colors" data-testid="notifications-button">
                <Bell size={20} className="text-[#6B726C]" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </header>

        <main className="p-8" data-testid="main-content">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
