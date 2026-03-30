import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useStore } from '../contexts/StoreContext';
import { alertsAPI, salesAPI, formatINR } from '../services/api';
import { 
  Package, 
  AlertTriangle, 
  ShoppingCart, 
  TrendingUp,
  ArrowRight,
  Loader
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = () => {
  const { selectedStore, stores } = useStore();
  const [stats, setStats] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedStore) {
      fetchData();
    }
  }, [selectedStore]);

  const fetchData = async () => {
    if (!selectedStore) return;
    
    setLoading(true);
    try {
      const [statsRes, salesRes] = await Promise.all([
        alertsAPI.getDashboard({ store_id: selectedStore.id }),
        salesAPI.getByDate({ store_id: selectedStore.id, days: 7 })
      ]);
      
      setStats(statsRes.data);
      setSalesData(salesRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels: salesData.map(d => d.date.split('-').slice(1).join('/')),
    datasets: [
      {
        label: 'Revenue',
        data: salesData.map(d => d.total_revenue),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `$${value}`,
        },
      },
    },
  };

  if (!selectedStore) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">Please create or select a store to get started.</p>
          <Link to="/stores" className="btn btn-primary mt-4 inline-block">
            Go to Stores
          </Link>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500">Welcome back! Here's what's happening at {selectedStore.name}.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="stat-card">
          <div className="stat-card-icon bg-blue-100">
            <Package className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-sm text-gray-500">Total Products</p>
          <p className="text-3xl font-bold text-gray-800">{stats?.total_products || 0}</p>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon bg-red-100">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-sm text-gray-500">Low Stock Items</p>
          <p className="text-3xl font-bold text-red-600">{stats?.low_stock_count || 0}</p>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon bg-green-100">
            <ShoppingCart className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-sm text-gray-500">Today's Sales</p>
          <p className="text-3xl font-bold text-gray-800">{stats?.today_sales || 0}</p>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon bg-purple-100">
            <TrendingUp className="w-6 h-6 text-purple-600" />
          </div>
          <p className="text-sm text-gray-500">Today's Revenue</p>
          <p className="text-3xl font-bold text-gray-800">${stats?.today_revenue?.toFixed(2) || '0.00'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Sales Trend (Last 7 Days)</h2>
            <Link 
              to="/sales" 
              className="text-blue-600 hover:text-blue-700 text-sm flex items-center"
            >
              View Details <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          {salesData.length > 0 ? (
            <div className="h-64">
              <Line data={chartData} options={chartOptions} />
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No sales data available
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Stock Overview</h2>
            <Link 
              to="/products" 
              className="text-blue-600 hover:text-blue-700 text-sm flex items-center"
            >
              Manage <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-red-600">Low Stock</span>
                <span className="font-semibold">{stats?.low_stock_count || 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full"
                  style={{ width: `${stats?.total_products ? (stats.low_stock_count / stats.total_products) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-yellow-600">Medium Stock</span>
                <span className="font-semibold">{stats?.medium_stock_count || 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{ width: `${stats?.total_products ? (stats.medium_stock_count / stats.total_products) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-green-600">High Stock</span>
                <span className="font-semibold">{stats?.high_stock_count || 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${stats?.total_products ? (stats.high_stock_count / stats.total_products) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          {stats?.low_stock_count > 0 && (
            <Link
              to="/alerts"
              className="mt-6 w-full btn btn-danger flex items-center justify-center"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              View Low Stock Alerts
            </Link>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
