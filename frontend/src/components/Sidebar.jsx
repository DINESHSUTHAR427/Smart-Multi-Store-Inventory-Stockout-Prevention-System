import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  AlertTriangle, 
  TrendingUp,
  Store,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../contexts/StoreContext';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { selectedStore } = useStore();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/products', label: 'Products', icon: Package },
    { path: '/sales', label: 'Sales', icon: ShoppingCart },
    { path: '/forecasts', label: 'Forecasts', icon: TrendingUp },
    { path: '/alerts', label: 'Low Stock', icon: AlertTriangle },
    { path: '/stores', label: 'Stores', icon: Store },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const NavContent = () => (
    <>
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-blue-600">Smart Inventory</h1>
        <p className="text-xs text-gray-500 mt-1">Stock Prevention System</p>
      </div>

      {selectedStore && (
        <div className="p-4 bg-blue-50 border-b border-blue-100">
          <p className="text-xs text-blue-600 font-medium">Active Store</p>
          <p className="text-sm font-semibold text-gray-800">{selectedStore.name}</p>
        </div>
      )}

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-5 h-5 mr-3" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md lg:hidden"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white transform transition-transform lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <NavContent />
      </aside>
    </>
  );
};

export default Sidebar;
