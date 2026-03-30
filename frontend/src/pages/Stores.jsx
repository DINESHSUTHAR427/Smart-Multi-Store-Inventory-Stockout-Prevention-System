import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { useStore } from '../contexts/StoreContext';
import { Store, Plus, Edit2, Trash2, Package } from 'lucide-react';

const Stores = () => {
  const { 
    stores, 
    selectedStore, 
    setSelectedStore,
    fetchStores, 
    createStore, 
    updateStore, 
    deleteStore 
  } = useStore();
  
  const [showModal, setShowModal] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
  });

  useEffect(() => {
    fetchStores();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingStore) {
        await updateStore(editingStore.id, formData);
      } else {
        const newStore = await createStore(formData);
        setSelectedStore(newStore);
      }
      
      setShowModal(false);
      resetForm();
      fetchStores();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to save store');
    }
  };

  const handleEdit = (store) => {
    setEditingStore(store);
    setFormData({
      name: store.name,
      location: store.location || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this store? All products and sales data will be lost.')) {
      return;
    }
    
    try {
      await deleteStore(id);
    } catch (error) {
      alert('Failed to delete store');
    }
  };

  const resetForm = () => {
    setEditingStore(null);
    setFormData({ name: '', location: '' });
  };

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Stores</h1>
          <p className="text-gray-500">Manage your store locations</p>
        </div>
        
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="btn btn-primary flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Store
        </button>
      </div>

      {stores.length === 0 ? (
        <div className="card text-center py-12">
          <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-xl font-semibold text-gray-800 mb-2">No stores yet</p>
          <p className="text-gray-500 mb-6">
            Create your first store to start managing inventory.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary"
          >
            Create Store
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map((store) => (
            <div 
              key={store.id} 
              className={`card cursor-pointer transition-all ${
                selectedStore?.id === store.id 
                  ? 'ring-2 ring-blue-500' 
                  : 'hover:shadow-lg'
              }`}
              onClick={() => setSelectedStore(store)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <Store className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{store.name}</h3>
                    {store.location && (
                      <p className="text-sm text-gray-500">{store.location}</p>
                    )}
                  </div>
                </div>
                
                {selectedStore?.id === store.id && (
                  <span className="badge bg-blue-100 text-blue-800">Active</span>
                )}
              </div>

              <div className="flex items-center text-gray-500 mb-4">
                <Package className="w-4 h-4 mr-2" />
                <span>{store.product_count || 0} products</span>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-xs text-gray-400">
                  Created: {new Date(store.created_at).toLocaleDateString()}
                </span>
                
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleEdit(store)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(store.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingStore ? 'Edit Store' : 'Add New Store'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Store Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="e.g., Main Store, Branch 1"
              required
            />
          </div>

          <div>
            <label className="label">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="input"
              placeholder="e.g., 123 Main Street, City"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="btn btn-outline flex-1"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary flex-1">
              {editingStore ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default Stores;
