import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useStore } from '../contexts/StoreContext';
import { useAuth } from '../contexts/AuthContext';
import { alertsAPI } from '../services/api';
import { 
  AlertTriangle, 
  Mail,
  RefreshCw,
  CheckCircle,
  Loader
} from 'lucide-react';

const Alerts = () => {
  const { selectedStore } = useStore();
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  useEffect(() => {
    if (selectedStore) {
      fetchAlerts();
    }
  }, [selectedStore]);

  const fetchAlerts = async () => {
    if (!selectedStore) return;
    
    setLoading(true);
    try {
      const response = await alertsAPI.getLowStock({ store_id: selectedStore.id });
      setAlerts(response.data);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendAlertEmail = async () => {
    if (!selectedStore) return;
    
    setSending(true);
    setSendResult(null);
    
    try {
      const response = await alertsAPI.sendEmail({ store_id: selectedStore.id });
      setSendResult({
        success: true,
        message: response.data.message,
      });
    } catch (error) {
      setSendResult({
        success: false,
        message: error.response?.data?.detail || 'Failed to send email',
      });
    } finally {
      setSending(false);
    }
  };

  if (!selectedStore) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">Please select a store to view alerts.</p>
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Low Stock Alerts</h1>
          <p className="text-gray-500">
            {alerts.length} product{alerts.length !== 1 ? 's' : ''} need restocking
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={fetchAlerts}
            className="btn btn-outline flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          
          {alerts.length > 0 && (
            <button
              onClick={sendAlertEmail}
              disabled={sending}
              className="btn btn-primary flex items-center"
            >
              {sending ? (
                <Loader className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Mail className="w-4 h-4 mr-2" />
              )}
              Send Email Alert
            </button>
          )}
        </div>
      </div>

      {sendResult && (
        <div className={`mb-6 p-4 rounded-lg flex items-center ${sendResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {sendResult.success ? (
            <CheckCircle className="w-5 h-5 mr-2" />
          ) : (
            <AlertTriangle className="w-5 h-5 mr-2" />
          )}
          {sendResult.message}
        </div>
      )}

      {alerts.length === 0 ? (
        <div className="card text-center py-12">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <p className="text-xl font-semibold text-gray-800 mb-2">All stocked up!</p>
          <p className="text-gray-500">
            No products are currently below their reorder level.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {alerts.map((alert) => (
            <div key={alert.id} className="card border-l-4 border-red-500">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                  <h3 className="font-semibold text-gray-800">{alert.product_name}</h3>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Current Stock:</span>
                  <span className="font-bold text-red-600">{alert.current_stock}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Reorder Level:</span>
                  <span className="font-semibold text-gray-800">{alert.reorder_level}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Shortage:</span>
                  <span className="font-semibold text-red-600">
                    {Math.max(0, alert.reorder_level - alert.current_stock)} units
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Alert created: {new Date(alert.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {alerts.length > 0 && (
        <div className="mt-8 card bg-gray-50">
          <h3 className="font-semibold text-gray-800 mb-2">About Low Stock Alerts</h3>
          <p className="text-gray-600 text-sm">
            Products are marked as low stock when their current quantity falls at or below the reorder level. 
            You can configure the reorder level for each product in the Products section. 
            Use the "Send Email Alert" button to notify yourself about all current low stock items.
          </p>
        </div>
      )}
    </Layout>
  );
};

export default Alerts;
