import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useStore } from '../contexts/StoreContext';
import { productsAPI, forecastsAPI, formatINR } from '../services/api';
import { 
  TrendingUp, 
  BarChart3,
  AlertCircle,
  RefreshCw,
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
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Forecasts = () => {
  const { selectedStore } = useStore();
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [reorderSuggestion, setReorderSuggestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [forecastLoading, setForecastLoading] = useState(false);

  useEffect(() => {
    if (selectedStore) {
      fetchProducts();
    }
  }, [selectedStore]);

  const fetchProducts = async () => {
    if (!selectedStore) return;
    
    setLoading(true);
    try {
      const response = await productsAPI.getAll({ store_id: selectedStore.id });
      setProducts(response.data);
      
      if (response.data.length > 0) {
        setSelectedProduct(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateForecast = async () => {
    if (!selectedProduct) return;
    
    setForecastLoading(true);
    try {
      const [forecastRes, reorderRes] = await Promise.all([
        forecastsAPI.generate(selectedProduct.id, 30),
        forecastsAPI.getReorderSuggestion(selectedProduct.id),
      ]);
      
      setForecast(forecastRes.data);
      setReorderSuggestion(reorderRes.data);
    } catch (error) {
      console.error('Failed to generate forecast:', error);
      alert('Failed to generate forecast. Make sure you have enough sales history.');
    } finally {
      setForecastLoading(false);
    }
  };

  const chartData = {
    labels: forecast?.forecasts?.slice(0, 14).map(f => f.date.split('-').slice(1).join('/')) || [],
    datasets: [
      {
        label: 'Predicted Demand',
        data: forecast?.forecasts?.slice(0, 14).map(f => f.predicted_demand) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Demand Forecast (Next 14 Days)',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Units',
        },
      },
    },
  };

  if (!selectedStore) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">Please select a store to view forecasts.</p>
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
        <h1 className="text-2xl font-bold text-gray-800">Demand Forecasting</h1>
        <p className="text-gray-500">ML-powered demand prediction using Linear Regression</p>
      </div>

      <div className="card mb-6">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-1">
            <label className="label">Select Product</label>
            <select
              value={selectedProduct?.id || ''}
              onChange={(e) => {
                const product = products.find(p => p.id === parseInt(e.target.value));
                setSelectedProduct(product);
                setForecast(null);
                setReorderSuggestion(null);
              }}
              className="input"
            >
              {products.length === 0 ? (
                <option value="">No products available</option>
              ) : (
                products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} (Stock: {product.stock})
                  </option>
                ))
              )}
            </select>
          </div>
          
          <button
            onClick={generateForecast}
            disabled={!selectedProduct || forecastLoading}
            className="btn btn-primary flex items-center"
          >
            {forecastLoading ? (
              <Loader className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            {forecast ? 'Regenerate' : 'Generate'} Forecast
          </button>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="card text-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            Add products and record sales to enable demand forecasting.
          </p>
        </div>
      ) : forecast ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="stat-card">
              <div className="stat-card-icon bg-blue-100">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-sm text-gray-500">Avg Daily Demand</p>
              <p className="text-3xl font-bold text-gray-800">
                {forecast.average_daily_demand.toFixed(1)} units
              </p>
            </div>

            <div className="stat-card">
              <div className="stat-card-icon bg-purple-100">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-sm text-gray-500">Model Accuracy</p>
              <p className="text-3xl font-bold text-gray-800">
                {forecast.model_accuracy ? `${forecast.model_accuracy.toFixed(1)}%` : 'N/A'}
              </p>
            </div>

            <div className="stat-card">
              <div className="stat-card-icon bg-green-100">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-sm text-gray-500">30-Day Forecast</p>
              <p className="text-3xl font-bold text-gray-800">
                {(forecast.average_daily_demand * 30).toFixed(0)} units
              </p>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Demand Prediction Chart</h2>
            <div className="h-80">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>

          {reorderSuggestion && (
            <div className={`card ${reorderSuggestion.needs_reorder ? 'border-2 border-red-300' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Reorder Suggestion</h2>
                {reorderSuggestion.needs_reorder && (
                  <span className="badge badge-low flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Reorder Needed
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Current Stock</p>
                  <p className="text-xl font-bold text-gray-800">{reorderSuggestion.current_stock}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Predicted Demand</p>
                  <p className="text-xl font-bold text-gray-800">{reorderSuggestion.predicted_demand.toFixed(1)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Safety Stock</p>
                  <p className="text-xl font-bold text-gray-800">{reorderSuggestion.safety_stock}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Required Stock</p>
                  <p className="text-xl font-bold text-gray-800">{reorderSuggestion.required_stock}</p>
                </div>
              </div>

              {reorderSuggestion.suggested_order_quantity > 0 ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <p className="text-lg font-semibold text-green-800 mb-2">
                    Recommended Order Quantity
                  </p>
                  <p className="text-4xl font-bold text-green-600">
                    {reorderSuggestion.suggested_order_quantity} units
                  </p>
                  <p className="text-sm text-green-600 mt-2">
                    Confidence: {reorderSuggestion.confidence}
                  </p>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <p className="text-lg font-semibold text-blue-800">
                    Stock levels are sufficient
                  </p>
                  <p className="text-blue-600">
                    No reorder needed at this time.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="card text-center py-12">
          <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            Select a product and click "Generate Forecast" to see demand predictions.
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Note: At least 7 days of sales history is required for accurate predictions.
          </p>
        </div>
      )}
    </Layout>
  );
};

export default Forecasts;
