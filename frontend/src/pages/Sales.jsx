import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { useStore } from '../contexts/StoreContext';
import { salesAPI, productsAPI, formatINR } from '../services/api';
import { 
  ShoppingCart, 
  Plus, 
  TrendingUp,
  DollarSign,
  Package,
  IndianRupee
} from 'lucide-react';

const Sales = () => {
  const { selectedStore } = useStore();
  const [sales, setSales] = useState([]);
  const [summary, setSummary] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    product_id: '',
    quantity: 1,
  });

  useEffect(() => {
    if (selectedStore) {
      fetchData();
    }
  }, [selectedStore]);

  const fetchData = async () => {
    if (!selectedStore) return;
    
    setLoading(true);
    try {
      const [salesRes, summaryRes, productsRes] = await Promise.all([
        salesAPI.getAll({ store_id: selectedStore.id, limit: 50 }),
        salesAPI.getSummary({ store_id: selectedStore.id, days: 7 }),
        productsAPI.getAll({ store_id: selectedStore.id }),
      ]);
      
      setSales(salesRes.data);
      setSummary(summaryRes.data);
      setProducts(productsRes.data.filter(p => p.stock > 0));
    } catch (error) {
      console.error('Failed to fetch sales data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await salesAPI.create(formData);
      setShowModal(false);
      setFormData({ product_id: '', quantity: 1 });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to record sale');
    }
  };

  const getProductStock = (productId) => {
    const product = products.find(p => p.id === parseInt(productId));
    return product?.stock || 0;
  };

  if (!selectedStore) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">Please select a store to record sales.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Sales</h1>
          <p className="text-gray-500">Record and track sales at {selectedStore.name}</p>
        </div>
        
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Record Sale
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="stat-card">
            <div className="stat-card-icon bg-green-100">
              <ShoppingCart className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-sm text-gray-500">Total Sales (7 days)</p>
            <p className="text-3xl font-bold text-gray-800">{summary.total_sales}</p>
          </div>

          <div className="stat-card">
            <div className="stat-card-icon bg-blue-100">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-sm text-gray-500">Total Revenue (7 days)</p>
            <p className="text-3xl font-bold text-gray-800">{formatINR(summary.total_revenue)}</p>
          </div>

          <div className="stat-card">
            <div className="stat-card-icon bg-purple-100">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-sm text-gray-500">Avg Sale Value</p>
            <p className="text-3xl font-bold text-gray-800">
              {formatINR(summary.total_sales > 0 ? (summary.total_revenue / summary.total_sales) : 0)}
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Sales</h2>
          
          {sales.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No sales recorded yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale.id}>
                      <td className="text-gray-500">
                        {new Date(sale.created_at).toLocaleString()}
                      </td>
                      <td className="font-medium text-gray-800">
                        {sale.product_name}
                      </td>
                      <td>{sale.quantity}</td>
                      <td>${sale.unit_price.toFixed(2)}</td>
                      <td className="font-semibold text-green-600">
                        ${sale.total_amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setFormData({ product_id: '', quantity: 1 });
        }}
        title="Record New Sale"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
            <label className="label">Product *</label>
            <select
              value={formData.product_id}
              onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
              className="input"
              required
            >
              <option value="">Select a product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} - {formatINR(product.price)} (Stock: {product.stock})
                </option>
              ))}
            </select>
            {formData.product_id && (
              <p className="text-sm text-gray-500 mt-1">
                <Package className="w-4 h-4 inline mr-1" />
                Available: {getProductStock(formData.product_id)} units
              </p>
            )}
          </div>

          <div>
            <label className="label">Quantity *</label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
              className="input"
              min="1"
              max={getProductStock(formData.product_id) || 1}
              required
            />
          </div>

          {formData.product_id && (
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatINR(
                  (products.find(p => p.id === parseInt(formData.product_id))?.price || 0) *
                  formData.quantity
                )}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="btn btn-outline flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={!formData.product_id}
            >
              Record Sale
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default Sales;
