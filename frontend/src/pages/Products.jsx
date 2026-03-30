import { useState, useEffect, useRef } from 'react';
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
  Download
} from 'lucide-react';

const Products = () => {
  const { selectedStore } = useStore();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
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

  const fetchProducts = async () => {
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
  };

  const handleSubmit = async (e) => {
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
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await productsAPI.delete(id);
      fetchProducts();
    } catch (error) {
      alert('Failed to delete product');
    }
  };

  const handleEdit = (product) => {
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
  };

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

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
        <div className="text-center py-12">
          <p className="text-gray-500">Please select a store to manage products.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Products</h1>
          <p className="text-gray-500">{selectedStore.name} - {products.length} items</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn btn-outline flex items-center"
          >
            <Upload className="w-4 h-4 mr-2" />
            CSV Upload
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="btn btn-primary flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </button>
        </div>
      </div>

      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search products by name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Stock</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-gray-500">
                      No products found
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <div className="flex items-center">
                          <Package className="w-5 h-5 text-gray-400 mr-3" />
                          <div>
                            <p className="font-medium text-gray-800">{product.name}</p>
                            {product.category && (
                              <p className="text-xs text-gray-500">{product.category}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="text-gray-500">{product.sku || '-'}</td>
                      <td>
                        <span className="font-semibold">{product.stock}</span>
                        <span className="text-gray-400 text-sm ml-1">{product.unit}</span>
                      </td>
                      <td>{formatINR(product.price)}</td>
                      <td>
                        <span className={`badge badge-${product.stock_status}`}>
                          {product.stock_status === 'low' && (
                            <AlertTriangle className="w-3 h-3 mr-1" />
                          )}
                          {product.stock_status}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Product Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">SKU</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
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

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline flex-1">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary flex-1">
              {editingProduct ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          setUploadResult(null);
        }}
        title="Bulk Upload Products"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Upload a CSV file to bulk import products. The file should have the following columns:
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 text-sm">
            <p className="font-medium mb-2">Required columns:</p>
            <code className="text-blue-600">name, stock, price, reorder_level</code>
            
            <p className="font-medium mt-3 mb-2">Optional columns:</p>
            <code className="text-blue-600">sku, category, unit</code>
          </div>

          <button
            onClick={downloadCSVTemplate}
            className="btn btn-outline w-full flex items-center justify-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </button>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            
            <p className="text-gray-600 mb-4">
              {uploadLoading ? 'Uploading...' : 'Click to select CSV file'}
            </p>
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadLoading}
              className="btn btn-primary"
            >
              Select File
            </button>
          </div>

          {uploadResult && (
            <div className={`p-4 rounded-lg ${uploadResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
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
