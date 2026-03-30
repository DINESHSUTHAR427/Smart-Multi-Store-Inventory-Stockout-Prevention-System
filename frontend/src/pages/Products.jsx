import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { useStore } from '../contexts/StoreContext';
import { productsAPI, formatINR } from '../services/api';
import { 
  Package, 
  Plus, 
  Upload, 
  Search, 
  Edit2, 
  Trash2,
  AlertTriangle,
  Download,
  Filter,
  X
} from 'lucide-react';

const ProductCard = ({ product, onEdit, onDelete, formatINR }) => {
  const statusColors = {
    low: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    high: 'bg-green-100 text-green-700 border-green-200',
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Package className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">{product.name}</h3>
            {product.category && (
              <p className="text-sm text-gray-500">{product.category}</p>
            )}
          </div>
        </div>
        <span className={`badge border ${statusColors[product.stock_status]}`}>
          {product.stock_status === 'low' && <AlertTriangle className="w-3 h-3 mr-1" />}
          {product.stock_status}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center p-3 bg-gray-50 rounded-xl">
          <p className="text-xs text-gray-500 mb-1">Stock</p>
          <p className="font-bold text-gray-800">{product.stock}</p>
          <p className="text-xs text-gray-400">{product.unit}</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-xl">
          <p className="text-xs text-gray-500 mb-1">Price</p>
          <p className="font-bold text-blue-600">{formatINR(product.price)}</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-xl">
          <p className="text-xs text-gray-500 mb-1">SKU</p>
          <p className="font-bold text-gray-800">{product.sku || '-'}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
        <button
          onClick={() => onEdit(product)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors font-medium text-sm"
        >
          <Edit2 className="w-4 h-4" />
          Edit
        </button>
        <button
          onClick={() => onDelete(product.id)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors font-medium text-sm"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      </div>
    </div>
  );
};

const Products = () => {
  const { selectedStore } = useStore();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [filterStatus, setFilterStatus] = useState('all');
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    stock: 0,
    price: 0,
    reorder_level: 10,
    category: '',
    unit: 'units',
  });

  useEffect(() => {
    if (selectedStore) {
      fetchProducts();
    }
  }, [selectedStore]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchProducts = useCallback(async () => {
    if (!selectedStore) return;
    
    setLoading(true);
    try {
      const response = await productsAPI.getAll({ store_id: selectedStore.id });
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedStore]);

  const filteredProducts = useMemo(() => {
    let filtered = products;
    
    if (debouncedSearch) {
      const search = debouncedSearch.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(search) ||
        (p.sku && p.sku.toLowerCase().includes(search)) ||
        (p.category && p.category.toLowerCase().includes(search))
      );
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(p => p.stock_status === filterStatus);
    }
    
    return filtered;
  }, [products, debouncedSearch, filterStatus]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    try {
      if (editingProduct) {
        await productsAPI.update(editingProduct.id, formData);
      } else {
        await productsAPI.create({ ...formData, store_id: selectedStore.id });
      }
      
      setShowModal(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to save product');
    }
  }, [editingProduct, formData, selectedStore, fetchProducts]);

  const handleDelete = useCallback(async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await productsAPI.delete(id);
      fetchProducts();
    } catch (error) {
      alert('Failed to delete product');
    }
  }, [fetchProducts]);

  const handleEdit = useCallback((product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku || '',
      stock: product.stock,
      price: product.price,
      reorder_level: product.reorder_level,
      category: product.category || '',
      unit: product.unit || 'units',
    });
    setShowModal(true);
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadLoading(true);
    setUploadResult(null);
    
    try {
      const response = await productsAPI.bulkUpload(selectedStore.id, file);
      setUploadResult({
        success: true,
        message: response.data.message,
        created: response.data.created_count,
      });
      fetchProducts();
    } catch (error) {
      setUploadResult({
        success: false,
        message: error.response?.data?.detail || 'Upload failed',
      });
    } finally {
      setUploadLoading(false);
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: '',
      stock: 0,
      price: 0,
      reorder_level: 10,
      category: '',
      unit: 'units',
    });
  };

  const downloadCSVTemplate = () => {
    const csv = 'name,stock,price,reorder_level,sku,category,unit\nProduct Name,100,9.99,20,SKU001,Electronics,units';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products_template.csv';
    a.click();
  };

  if (!selectedStore) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Package className="w-16 h-16 text-gray-300 mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">No Store Selected</h2>
          <p className="text-gray-500">Select a store to manage products.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Products</h1>
          <p className="text-gray-500 mt-1">{selectedStore.name} - {products.length} items</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn btn-outline"
          >
            <Upload className="w-4 h-4" />
            Import CSV
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-12"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'low', 'medium', 'high'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-gray-500">Loading products...</p>
          </div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="card text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">No Products Found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || filterStatus !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Start by adding your first product'}
          </p>
          {!searchTerm && filterStatus === 'all' && (
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={handleEdit}
              onDelete={handleDelete}
              formatINR={formatINR}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Product Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                placeholder="Enter product name"
                required
              />
            </div>
            <div>
              <label className="label">SKU</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="input"
                placeholder="e.g., SKU001"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="label">Stock *</label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                className="input"
                min="0"
                required
              />
            </div>
            <div>
              <label className="label">Price *</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className="input"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="label">Reorder Level</label>
              <input
                type="number"
                value={formData.reorder_level}
                onChange={(e) => setFormData({ ...formData, reorder_level: parseInt(e.target.value) || 0 })}
                className="input"
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input"
                placeholder="e.g., Electronics"
              />
            </div>
            <div>
              <label className="label">Unit</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="input"
              >
                <option value="units">Units</option>
                <option value="kg">Kilograms</option>
                <option value="g">Grams</option>
                <option value="liters">Liters</option>
                <option value="ml">Milliliters</option>
                <option value="boxes">Boxes</option>
                <option value="packets">Packets</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-gray-100">
            <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline flex-1">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary flex-1">
              {editingProduct ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* CSV Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          setUploadResult(null);
        }}
        title="Import Products from CSV"
      >
        <div className="space-y-6">
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
            <h4 className="font-semibold text-blue-800 mb-2">CSV Format</h4>
            <p className="text-sm text-blue-700">
              Required: name, stock, price, reorder_level<br />
              Optional: sku, category, unit
            </p>
          </div>

          <button onClick={downloadCSVTemplate} className="btn btn-outline w-full">
            <Download className="w-4 h-4" />
            Download Template
          </button>

          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Select a CSV file to import</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadLoading}
              className="btn btn-primary"
            >
              {uploadLoading ? 'Uploading...' : 'Select CSV File'}
            </button>
          </div>

          {uploadResult && (
            <div className={`p-4 rounded-xl ${uploadResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {uploadResult.message}
              {uploadResult.created && ` (${uploadResult.created} products created)`}
            </div>
          )}
        </div>
      </Modal>
    </Layout>
  );
};

export default Products;
