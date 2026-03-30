import { createContext, useContext, useState, useEffect } from 'react';
import { storesAPI } from '../services/api';
import { useAuth } from './AuthContext';

const StoreContext = createContext(null);

export const StoreProvider = ({ children }) => {
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchStores = async () => {
    setLoading(true);
    try {
      const response = await storesAPI.getAll();
      setStores(response.data);
      
      if (response.data.length > 0 && !selectedStore) {
        setSelectedStore(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch stores:', error);
    } finally {
      setLoading(false);
    }
  };

  const createStore = async (data) => {
    const response = await storesAPI.create(data);
    setStores([...stores, response.data]);
    return response.data;
  };

  const updateStore = async (id, data) => {
    const response = await storesAPI.update(id, data);
    setStores(stores.map(s => s.id === id ? response.data : s));
    return response.data;
  };

  const deleteStore = async (id) => {
    await storesAPI.delete(id);
    setStores(stores.filter(s => s.id !== id));
    if (selectedStore?.id === id) {
      setSelectedStore(stores[0] || null);
    }
  };

  const value = {
    stores,
    selectedStore,
    setSelectedStore,
    loading,
    fetchStores,
    createStore,
    updateStore,
    deleteStore,
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
