import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { format, subDays, eachDayOfInterval } from 'date-fns';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

interface SalesData {
  date: string;
  total: number;
}

interface ProductSalesData {
  productName: string;
  quantity: number;
}

const Reports: React.FC = () => {
  const [dateRange, setDateRange] = useState(30); // Default to last 30 days

  const fetchSalesData = async () => {
    const response = await axios.get(`/api/reports/sales?days=${dateRange}`);
    return response.data;
  };

  const fetchTopProducts = async () => {
    const response = await axios.get(`/api/reports/top-products?days=${dateRange}`);
    return response.data;
  };

  const { data: salesData, isLoading: salesLoading } = useQuery<SalesData[]>(['salesData', dateRange], fetchSalesData);
  const { data: topProducts, isLoading: productsLoading } = useQuery<ProductSalesData[]>(['topProducts', dateRange], fetchTopProducts);

  if (salesLoading || productsLoading) return <div>Loading...</div>;

  const dates = eachDayOfInterval({
    start: subDays(new Date(), dateRange - 1),
    end: new Date()
  }).map(date => format(date, 'yyyy-MM-dd'));

  const salesChartData = {
    labels: dates,
    datasets: [
      {
        label: 'Daily Sales',
        data: dates.map(date => {
          const sale = salesData?.find(s => s.date === date);
          return sale ? sale.total : 0;
        }),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }
    ]
  };

  const topProductsChartData = {
    labels: topProducts?.map(p => p.productName) || [],
    datasets: [
      {
        label: 'Units Sold',
        data: topProducts?.map(p => p.quantity) || [],
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
      }
    ]
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Reports</h2>
      
      {/* Date Range Selector */}
      <div className="mb-6">
        <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700">Date Range</label>
        <select
          id="dateRange"
          value={dateRange}
          onChange={(e) => setDateRange(Number(e.target.value))}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Sales Over Time Chart */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Sales Over Time</h3>
        <Line data={salesChartData} options={{ responsive: true }} />
      </div>

      {/* Top Selling Products Chart */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Top Selling Products</h3>
        <Bar data={topProductsChartData} options={{ responsive: true }} />
      </div>

      {/* Summary Statistics */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Summary Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Sales</p>
            <p className="mt-1 text-3xl font-semibold text-gray-900">
              ${salesData?.reduce((sum, sale) => sum + sale.total, 0).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Average Daily Sales</p>
            <p className="mt-1 text-3xl font-semibold text-gray-900">
              ${(salesData?.reduce((sum, sale) => sum + sale.total, 0) / dateRange).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Units Sold</p>
            <p className="mt-1 text-3xl font-semibold text-gray-900">
              {topProducts?.reduce((sum, product) => sum + product.quantity, 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;