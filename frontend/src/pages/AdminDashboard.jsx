import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import Sidebar from '../components/admin/Sidebar';
import { FaUsers, FaShoppingCart, FaComments, FaMoneyBill, FaExclamationTriangle, FaEdit, FaTimes } from 'react-icons/fa';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { useCustomersStore } from '../store/customersStore';
import { useOrderStore } from '../store/orderStore';
import { useProductStore } from '../store/productStore';
import { useSidebar } from '../context/SidebarContext';
import apiConfig from '../config/apiConfig';

// Mock data for the line chart
const userAnalyticsData = [
  { month: 'January', Organic: 42, Paid: 24 },
  { month: 'February', Organic: 45, Paid: 48 },
  { month: 'March', Organic: 40, Paid: 62 },
  { month: 'April', Organic: 55, Paid: 74 },
  { month: 'May', Organic: 67, Paid: 52 },
  { month: 'June', Organic: 72, Paid: 50 },
  { month: 'July', Organic: 70, Paid: 65 }
];

// Color palette for the pie chart
const COLORS = ['#3B82F6', '#06B6D4', '#8B5CF6', '#EC4899', '#F97316', '#10B981', '#EF4444'];

// Stock threshold constants
const LOW_STOCK_THRESHOLD = 10;
const CRITICAL_STOCK_THRESHOLD = 5;

const StatCard = ({ icon, title, value, bgColor }) => (
  <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm flex items-center justify-between">
    <div>
      <p className="text-gray-600 text-xs md:text-sm">{title}</p>
      <h3 className="text-lg md:text-2xl font-semibold mt-1">{value}</h3>
    </div>
    <div className={`${bgColor} w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center bg-opacity-20`}>
      {icon}
    </div>
  </div>
);

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const { collapsed } = useSidebar();
  
  // New states for product editing
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Get customer count from store instead of API
  const { totalCustomers, customers, fetchCustomers } = useCustomersStore();
  const customerCount = totalCustomers || customers.length || 0;
  
  // Get orders data from order store
  const { orders, fetchOrders } = useOrderStore();
  const orderCount = orders.length || 0;
  
  // Get products data
  const productStore = useProductStore();
  const products = productStore.getProducts();
  
  // Calculate total income from orders
  const totalIncome = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0).toFixed(2);
  
  // Calculate products with low stock
  const stockAlerts = useMemo(() => {
    if (!products || products.length === 0) return [];
    
    return products
      .filter(product => product.stock <= LOW_STOCK_THRESHOLD)
      .sort((a, b) => a.stock - b.stock) // Sort by stock level (ascending)
      .slice(0, 5); // Only show top 5 critical items
  }, [products]);
  
  // Count of products with stock alerts
  const lowStockCount = products.filter(p => p.stock <= LOW_STOCK_THRESHOLD).length;
  
  // Revenue by category
  const revenueData = useMemo(() => {
    // Create an object to store revenue by category
    const categoryRevenue = {};
    
    // Process each order
    orders.forEach(order => {
      // Process each item in the order
      (order.items || []).forEach(item => {
        // Try to find the product to get its category
        const product = products.find(p => p._id === item.productId);
        
        // Use the category name if found, or "Other" as fallback
        const category = product?.category || "Other";
        
        // Calculate item revenue (price * quantity)
        const itemRevenue = item.price * item.quantity;
        
        // Add to category total
        if (categoryRevenue[category]) {
          categoryRevenue[category] += itemRevenue;
        } else {
          categoryRevenue[category] = itemRevenue;
        }
      });
    });
    
    // Convert to array format for the pie chart
    const result = Object.entries(categoryRevenue).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2))
    }));
    
    // If no data, provide sample data
    if (result.length === 0) {
      return [
        { name: 'DRESSES', value: 35 },
        { name: 'TOPS', value: 40 },
        { name: 'BOTTOMS', value: 25 }
      ];
    }
    
    // Sort by value descending
    return result.sort((a, b) => b.value - a.value);
  }, [orders, products]);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    
    // First, set loading state if no cached data is available
    if (customers.length === 0 || orders.length === 0) {
      setLoading(true);
    } else {
      // If we have cached data, we can stay in non-loading state
      setLoading(false);
    }
    
    // Handler to load/refresh all data
    const loadDashboardData = async () => {
      try {
        // Track if we need to update loading state at the end
        let shouldSetLoading = customers.length === 0 || orders.length === 0;
        
        // Load customers from store if not available
        if (customers.length === 0) {
          console.log('Dashboard - Loading customers data...');
          await fetchCustomers(1, 100, '', true);
          console.log('Dashboard - Customers data loaded successfully');
        } else {
          // If we have cached customers data, refresh in background
          console.log('Dashboard - Using cached customers data, refreshing in background');
          fetchCustomers(1, 100, '', true).catch(err => 
            console.error('Dashboard - Background customers refresh failed:', err)
          );
        }
        
        // Load orders if not available
        if (orders.length === 0) {
          console.log('Dashboard - Loading orders data...');
        const result = await fetchOrders();
        if (!result.success || orders.length === 0) {
          useOrderStore.getState().initializeWithSampleOrder();
          }
          console.log('Dashboard - Orders data loaded successfully');
        } else {
          // If we have cached orders data, refresh in background
          console.log('Dashboard - Using cached orders data, refreshing in background');
          fetchOrders(true).catch(err => 
            console.error('Dashboard - Background orders refresh failed:', err)
          );
        }
        
        // Fetch dashboard stats
        await fetchStats();
        
        // Only update loading state if we didn't have cached data
        if (shouldSetLoading) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Dashboard - Error loading data:', error);
        setLoading(false);
      }
    };
    
    // Load or refresh all data
    loadDashboardData();
  }, [user, navigate, fetchCustomers, orders.length, products.length, customers.length]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiConfig.baseURL}/admin/basic-stats`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        }
      });
      
      if (response.data.success) {
        setStats({
          // Don't need userCount from API anymore
          // Using store data instead
          ...response.data.data
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to get stock level CSS class based on quantity
  const getStockLevelClass = (stock) => {
    if (stock === 0) return 'bg-red-100 text-red-800 border-red-300';
    if (stock <= CRITICAL_STOCK_THRESHOLD) return 'bg-orange-100 text-orange-800 border-orange-300';
    return 'bg-yellow-100 text-yellow-800 border-yellow-300';
  };

  // Handle opening the edit modal
  const handleEditProductOpen = (product) => {
    // Format the product data to match the form state
    const productForEdit = {
      _id: product._id,
      name: product.name,
      basePrice: product.basePrice,
      salePrice: product.salePrice || '',
      description: product.description,
      category: product.category,
      details: product.details?.length > 0 ? product.details : [''],
      variants: product.variants?.length > 0 ? product.variants.map(variant => ({
        ...variant,
        price: variant.price || ''
      })) : [{ 
        color: '#000000', 
        colorName: 'Black',
        price: '',
        additionalImages: ['']
      }],
      sizes: product.sizes || ['XS', 'S', 'M', 'L', 'XL'],
      stock: product.stock || 0,
      slug: product.slug,
      sku: product.sku,
      collectionId: product.collectionId || '',
      platformId: product.platformId || '',
      isFeatured: !!product.isFeatured
    };
    
    // Set the editing product
    setEditingProduct(productForEdit);
    
    // Open the modal
    setShowEditModal(true);
  };
  
  // Close edit modal
  const handleEditProductClose = () => {
    setShowEditModal(false);
    setEditingProduct(null);
  };
  
  // Update existing product
  const handleUpdateProduct = async () => {
    try {
      // Start loading state
      setLoading(true);
      
      // Validate required fields
      if (!editingProduct.name || !editingProduct.basePrice || !editingProduct.description || !editingProduct.category) {
        alert('Please fill in all required fields');
        setLoading(false);
        return;
      }
      
      // Format data for API
      const productData = {
        ...editingProduct,
        basePrice: parseFloat(editingProduct.basePrice),
        salePrice: editingProduct.salePrice ? parseFloat(editingProduct.salePrice) : 0,
        stock: parseInt(editingProduct.stock),
        slug: editingProduct.slug, // Preserve original slug
        sku: editingProduct.sku, // Preserve original SKU
        isFeatured: !!editingProduct.isFeatured
      };
      
      // Send data to API
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('You must be logged in to update products');
        setLoading(false);
        return;
      }
      
      const response = await axios.put(
        `${apiConfig.baseURL}/products/${editingProduct._id}`,
        productData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        // Update the product in the store
        productStore.addProduct(response.data.data);
        
        // Update stockAlerts list
        const updatedStockAlerts = stockAlerts.map(p => 
          p._id === response.data.data._id ? response.data.data : p
        );
        
        // Show success message
        alert('Product stock updated successfully!');
        
        // Close modal
        handleEditProductClose();
      } else {
        throw new Error(response.data.error || 'Failed to update product');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      alert(error.response?.data?.error || 'Failed to update product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className={`flex-1 p-4 md:p-8 ${collapsed ? 'md:ml-20' : 'md:ml-64'} transition-all duration-300`}>
        <h1 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6">Dashboard</h1>

        {/* Stats Cards - Responsive grid (1 column on mobile, 2 on small screens, 3 on medium, 5 on large) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6 mb-6 md:mb-8">
          <StatCard
            title="Total customers"
            value={customerCount}
            icon={<FaUsers className="text-orange-500 w-5 h-5 md:w-6 md:h-6" />}
            bgColor="bg-orange-500"
          />
          <StatCard
            title="Total income"
            value={`GH₵ ${totalIncome}`}
            icon={<FaMoneyBill className="text-green-500 w-5 h-5 md:w-6 md:h-6" />}
            bgColor="bg-green-500"
          />
          <StatCard
            title="New Orders"
            value={orderCount}
            icon={<FaShoppingCart className="text-blue-500 w-5 h-5 md:w-6 md:h-6" />}
            bgColor="bg-blue-500"
          />
          <StatCard
            title="Unread Chats"
            value="15"
            icon={<FaComments className="text-purple-500 w-5 h-5 md:w-6 md:h-6" />}
            bgColor="bg-purple-500"
          />
          <StatCard
            title="Low Stock Items"
            value={lowStockCount || '0'}
            icon={<FaExclamationTriangle className="text-red-500 w-5 h-5 md:w-6 md:h-6" />}
            bgColor="bg-red-500"
          />
        </div>


        {/* Charts - Stack on mobile, 2 columns on larger screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
          {/* User Analytics Chart */}
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm">
            <h2 className="text-base md:text-lg font-semibold mb-3 md:mb-4">User Analytics</h2>
            <div className="h-60 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userAnalyticsData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#666" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#666" tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="Organic" 
                    stroke="#06B6D4" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Paid" 
                    stroke="#8B5CF6" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center mt-3 md:mt-4 space-x-4 md:space-x-8 text-xs md:text-sm">
              <div className="flex items-center">
                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-[#06B6D4] mr-1 md:mr-2"></div>
                <span className="text-gray-600">Organic</span>
              </div>
              <div className="flex items-center">
                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-[#8B5CF6] mr-1 md:mr-2"></div>
                <span className="text-gray-600">Paid</span>
              </div>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm">
            <h2 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Revenue by Category</h2>
            <div className="h-60 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {revenueData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `GH₵ ${value}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center mt-3 md:mt-4 flex-wrap gap-2 md:gap-4 text-xs md:text-sm">
              {revenueData.map((item, index) => (
                <div key={item.name} className="flex items-center">
                  <div 
                    className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full mr-1 md:mr-2"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span className="text-gray-600">{item.name}: GH₵ {item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        
        {/* Stock Alerts Section */}
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-3 md:mb-4">
            <h2 className="text-base md:text-lg font-semibold flex items-center">
              <FaExclamationTriangle className="text-red-500 mr-1 md:mr-2 w-4 h-4 md:w-5 md:h-5" />
              Stock Alerts
            </h2>
            <Link 
              to="/admin/products" 
              className="text-xs md:text-sm text-blue-600 hover:text-blue-800"
            >
              View all products
            </Link>
          </div>
          
          {stockAlerts.length > 0 ? (
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Category</th>
                    <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-3 md:px-6 py-2 md:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stockAlerts.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50">
                      <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 md:h-10 md:w-10 flex-shrink-0">
                            <img 
                              className="h-8 w-8 md:h-10 md:w-10 rounded-md object-cover" 
                              src={product.variants?.[0]?.additionalImages?.[0] || '/placeholder.png'} 
                              alt={product.name}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://via.placeholder.com/40?text=No+Image';
                              }}
                            />
                          </div>
                          <div className="ml-2 md:ml-4">
                            <div className="text-xs md:text-sm font-medium text-gray-900 line-clamp-1">{product.name}</div>
                            <div className="text-xs text-gray-500 hidden sm:block">{product.sku || 'No SKU'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap hidden md:table-cell">
                        <div className="text-sm text-gray-900">{product.category}</div>
                      </td>
                      <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap">
                        <div className="text-xs md:text-sm font-medium text-center">
                          {product.stock}
                        </div>
                      </td>
                      <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap">
                        <span className={`px-1.5 md:px-2 py-0.5 md:py-1 text-xs rounded-full border ${getStockLevelClass(product.stock)}`}>
                          {product.stock === 0 ? 'Out of stock' : 
                           product.stock <= CRITICAL_STOCK_THRESHOLD ? 'Critical' : 'Low'}
                        </span>
                      </td>
                      <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-right text-xs md:text-sm font-medium">
                        <button 
                          onClick={() => handleEditProductOpen(product)}
                          className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                        >
                          <FaEdit className="mr-1" /> 
                          <span className="hidden sm:inline">Update Stock</span>
                          <span className="sm:hidden">Update</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-6 md:py-8 bg-gray-50 rounded-lg">
              <FaExclamationTriangle className="mx-auto h-8 w-8 md:h-12 md:w-12 text-gray-400" />
              <h3 className="mt-2 text-xs md:text-sm font-medium text-gray-900">No stock alerts</h3>
              <p className="mt-1 text-xs md:text-sm text-gray-500">All products have sufficient inventory levels.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Edit Product Modal - Simplified for stock update only */}
      {showEditModal && editingProduct && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => handleEditProductClose()}
        >
          <div 
            className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Update Stock</h2>
              <button 
                onClick={() => handleEditProductClose()}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 flex-shrink-0 mr-4">
                    <img 
                      className="h-12 w-12 rounded-md object-cover" 
                      src={editingProduct.variants?.[0]?.additionalImages?.[0] || '/placeholder.png'} 
                      alt={editingProduct.name}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/50?text=No+Image';
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{editingProduct.name}</h3>
                    <p className="text-sm text-gray-500">{editingProduct.category}</p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="stock"
                    value={editingProduct.stock}
                    onChange={(e) => setEditingProduct({...editingProduct, stock: e.target.value})}
                    className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    required
                  />
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg mb-6">
                  <div className="flex items-start">
                    <FaExclamationTriangle className="text-yellow-600 mt-0.5 mr-3" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800">Current Stock Status</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        {editingProduct.stock === 0 ? 'This product is out of stock.' : 
                         editingProduct.stock <= CRITICAL_STOCK_THRESHOLD ? 'Stock level is critical.' : 
                         'Stock level is low.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={handleEditProductClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateProduct}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Update Stock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard; 