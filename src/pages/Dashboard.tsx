import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProducts } from '../api/products';
import { getOrders } from '../api/orders';
import { getCustomers } from '../api/customers';
import { DollarSign, ShoppingBag, Package, TrendingUp, Users, AlertTriangle } from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { subDays, format, parseISO } from 'date-fns';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const DashboardCard: React.FC<{ title: string; value: string; icon: React.ReactNode; trend?: number }> = ({ title, value, icon, trend }) => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
        {trend !== undefined && (
          <p className={`text-sm font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(2)}%
          </p>
        )}
      </div>
      <div className="bg-blue-100 rounded-full p-3">
        {icon}
      </div>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const { data: products } = useQuery(['products'], getProducts);
  const { data: orders } = useQuery(['orders'], getOrders);
  const { data: customers } = useQuery(['customers'], () => getCustomers(1, ''));
  const [realtimeSales, setRealtimeSales] = useState<number[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRealtimeSales(prev => [...prev.slice(-11), Math.floor(Math.random() * 1000)]);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const totalSales = orders?.reduce((sum, order) => sum + order.total, 0) || 0;
  const totalOrders = orders?.length || 0;
  const totalProducts = products?.length || 0;
  const totalCustomers = customers?.length || 0;

  // Calculate revenue growth (comparing last 7 days to previous 7 days)
  const last7Days = orders?.filter(order => new Date(order.createdAt) >= subDays(new Date(), 7)) || [];
  const previous7Days = orders?.filter(order => {
    const orderDate = new Date(order.createdAt);
    return orderDate >= subDays(new Date(), 14) && orderDate < subDays(new Date(), 7);
  }) || [];
  
  const last7DaysRevenue = last7Days.reduce((sum, order) => sum + order.total, 0);
  const previous7DaysRevenue = previous7Days.reduce((sum, order) => sum + order.total, 0);
  const revenueGrowth = previous7DaysRevenue !== 0
    ? ((last7DaysRevenue - previous7DaysRevenue) / previous7DaysRevenue) * 100
    : 100;

  const last30Days = Array.from({length: 30}, (_, i) => format(subDays(new Date(), i), 'yyyy-MM-dd')).reverse();

  const salesChartData = {
    labels: last30Days,
    datasets: [
      {
        label: 'Sales',
        data: last30Days.map(date => {
          const dayOrders = orders?.filter(order => format(parseISO(order.createdAt), 'yyyy-MM-dd') === date) || [];
          return dayOrders.reduce((sum, order) => sum + order.total, 0);
        }),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }
    ]
  };

  const realtimeChartData = {
    labels: Array.from({length: 12}, (_, i) => i === 11 ? 'Now' : `-${11-i}s`),
    datasets: [
      {
        label: 'Real-time Sales',
        data: realtimeSales,
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1
      }
    ]
  };

  const topProducts = products
    ?.map(product => ({
      name: product.name,
      sales: orders?.filter(order => order.items.some(item => item.productId === product.id))
                    .reduce((sum, order) => sum + order.items.find(item => item.productId === product.id)!.quantity, 0) || 0
    }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);

  const topProductsChartData = {
    labels: topProducts?.map(p => p.name) || [],
    datasets: [
      {
        label: 'Units Sold',
        data: topProducts?.map(p => p.sales) || [],
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
      }
    ]
  };

  const lowStockProducts = products?.filter(product => product.stock <= 10) || [];

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <DashboardCard 
          title="Total Sales" 
          value={`$${totalSales.toFixed(2)}`} 
          icon={<DollarSign size={24} className="text-blue-500" />}
          trend={revenueGrowth}
        />
        <DashboardCard 
          title="Total Orders" 
          value={totalOrders.toString()} 
          icon={<ShoppingBag size={24} className="text-green-500" />} 
        />
        <DashboardCard 
          title="Total Products" 
          value={totalProducts.toString()} 
          icon={<Package size={24} className="text-purple-500" />} 
        />
        <DashboardCard 
          title="Total Customers" 
          value={totalCustomers.toString()} 
          icon={<Users size={24} className="text-yellow-500" />} 
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Sales Last 30 Days</h3>
          <Line data={salesChartData} />
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Real-time Sales</h3>
          <Line data={realtimeChartData} options={{ animation: { duration: 0 } }} />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Top Selling Products</h3>
          <Bar data={topProductsChartData} />
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Low Stock Alert</h3>
          {lowStockProducts.length > 0 ? (
            <ul className="space-y-2">
              {lowStockProducts.map(product => (
                <li key={product.id} className="flex items-center">
                  <AlertTriangle size={20} className="text-yellow-500 mr-2" />
                  <span>{product.name} - {product.stock} left in stock</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>No products are low in stock.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;