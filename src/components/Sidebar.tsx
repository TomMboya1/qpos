import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ShoppingCart, Users, Package, BarChart2, Settings, DollarSign } from 'lucide-react';

const Sidebar: React.FC = () => {
  return (
    <aside className="bg-gray-800 text-white w-64 min-h-screen p-4">
      <nav>
        <ul>
          <li className="mb-4">
            <Link to="/" className="flex items-center space-x-2 hover:text-gray-300">
              <Home size={20} />
              <span>Dashboard</span>
            </Link>
          </li>
          <li className="mb-4">
            <Link to="/products" className="flex items-center space-x-2 hover:text-gray-300">
              <Package size={20} />
              <span>Products</span>
            </Link>
          </li>
          <li className="mb-4">
            <Link to="/orders" className="flex items-center space-x-2 hover:text-gray-300">
              <ShoppingCart size={20} />
              <span>Orders</span>
            </Link>
          </li>
          <li className="mb-4">
            <Link to="/customers" className="flex items-center space-x-2 hover:text-gray-300">
              <Users size={20} />
              <span>Customers</span>
            </Link>
          </li>
          <li className="mb-4">
            <Link to="/inventory" className="flex items-center space-x-2 hover:text-gray-300">
              <Package size={20} />
              <span>Inventory</span>
            </Link>
          </li>
          <li className="mb-4">
            <Link to="/reports" className="flex items-center space-x-2 hover:text-gray-300">
              <BarChart2 size={20} />
              <span>Reports</span>
            </Link>
          </li>
          <li className="mb-4">
            <Link to="/pos" className="flex items-center space-x-2 hover:text-gray-300">
              <DollarSign size={20} />
              <span>POS Terminal</span>
            </Link>
          </li>
          <li className="mb-4">
            <Link to="/settings" className="flex items-center space-x-2 hover:text-gray-300">
              <Settings size={20} />
              <span>Settings</span>
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;