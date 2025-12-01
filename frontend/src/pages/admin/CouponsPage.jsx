import { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaFilter, FaCopy, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import Sidebar from '../../components/admin/Sidebar';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ToastManager';
import { useCouponStore } from '../../store/couponStore';

const CouponsPage = () => {
  const { user } = useAuth();
  const { success, error: toastError, info } = useToast();
  const { 
    coupons, 
    loading, 
    error: storeError, 
    fetchCoupons, 
    createCoupon, 
    updateCoupon, 
    deleteCoupon,
    toggleCouponStatus
  } = useCouponStore();
  
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState('all'); // 'all', 'active', 'inactive'
  const [filterType, setFilterType] = useState('all'); // 'all', 'percentage', 'fixed'
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Form state for creating/editing coupons
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: 0,
    minPurchaseAmount: 0,
    maxDiscountAmount: null,
    startDate: '',
    endDate: '',
    isActive: true,
    usageLimit: null,
    description: '',
    applicableProducts: [],
    excludedProducts: []
  });

  useEffect(() => {
    // Fetch coupons from API via the store
    fetchCoupons();
  }, [fetchCoupons]);

  const resetForm = () => {
    setFormData({
      code: '',
      discountType: 'percentage',
      discountValue: 0,
      minPurchaseAmount: 0,
      maxDiscountAmount: null,
      startDate: '',
      endDate: '',
      isActive: true,
      usageLimit: null,
      description: '',
      applicableProducts: [],
      excludedProducts: []
    });
  };

  const handleOpenModal = (mode, coupon = null) => {
    setModalMode(mode);
    if (mode === 'edit' && coupon) {
      setFormData({
        _id: coupon._id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minPurchaseAmount: coupon.minPurchaseAmount,
        maxDiscountAmount: coupon.maxDiscountAmount,
        startDate: coupon.startDate ? coupon.startDate.split('T')[0] : '',
        endDate: coupon.endDate ? coupon.endDate.split('T')[0] : '',
        isActive: coupon.isActive,
        usageLimit: coupon.usageLimit,
        description: coupon.description || '',
        applicableProducts: coupon.applicableProducts || [],
        excludedProducts: coupon.excludedProducts || []
      });
    } else {
      resetForm();
      // Set today's date as default start date
      const today = new Date().toISOString().split('T')[0];
      setFormData(prev => ({
        ...prev,
        startDate: today,
        // Default end date 30 days from now
        endDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0]
      }));
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let result;
      
      if (modalMode === 'add') {
        // Create new coupon via store
        result = await createCoupon(formData);
        
        if (result.success) {
          success('Coupon created successfully!');
          setShowModal(false);
          resetForm();
        } else {
          toastError(result.error || 'Failed to create coupon');
        }
      } else {
        // Update existing coupon via store
        result = await updateCoupon(formData._id, formData);
        
        if (result.success) {
          success('Coupon updated successfully!');
          setShowModal(false);
          resetForm();
        } else {
          toastError(result.error || 'Failed to update coupon');
        }
      }
    } catch (err) {
      console.error('Error saving coupon:', err);
      toastError(err.response?.data?.message || 'Error saving coupon. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    
    try {
      const result = await deleteCoupon(id);
      
      if (result.success) {
        success('Coupon deleted successfully!');
      } else {
        toastError(result.error || 'Failed to delete coupon');
      }
    } catch (err) {
      console.error('Error deleting coupon:', err);
      toastError(err.response?.data?.message || 'Error deleting coupon. Please try again.');
    }
  };

  const toggleActivation = async (id, currentStatus) => {
    try {
      const result = await toggleCouponStatus(id);
      
      if (result.success) {
        success(`Coupon ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      } else {
        toastError(result.error || 'Failed to update coupon status');
      }
    } catch (err) {
      console.error('Error updating coupon status:', err);
      toastError(err.response?.data?.message || 'Error updating coupon status. Please try again.');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Function to generate a random coupon code
  const generateRandomCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    setFormData(prev => ({ ...prev, code: result }));
  };

  // Copy coupon code to clipboard
  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    info('Coupon code copied to clipboard!');
  };

  // Filter coupons based on search and filters
  const filteredCoupons = coupons.filter(coupon => {
    const matchesSearch = coupon.code.toLowerCase().includes(search.toLowerCase()) || 
                         (coupon.description && coupon.description.toLowerCase().includes(search.toLowerCase()));
    
    const matchesActiveFilter = filterActive === 'all' || 
                              (filterActive === 'active' && coupon.isActive) || 
                              (filterActive === 'inactive' && !coupon.isActive);
    
    const matchesTypeFilter = filterType === 'all' || 
                             filterType === coupon.discountType;
    
    return matchesSearch && matchesActiveFilter && matchesTypeFilter;
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCoupons = filteredCoupons.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCoupons.length / itemsPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Function to format date in a more readable format
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Function to format money values with Ghana Cedis symbol
  const formatCurrency = (amount) => {
    return `GH₵${parseFloat(amount).toFixed(2)}`;
  };

  // Get additional statistics for coupon performance
  const getCouponStats = () => {
    const totalCoupons = coupons.length;
    const activeCoupons = coupons.filter(c => c.isActive).length;
    const expiredCoupons = coupons.filter(c => new Date(c.endDate) < new Date()).length;
    const totalUsage = coupons.reduce((sum, c) => sum + (c.usageCount || 0), 0);
    
    return {
      totalCoupons,
      activeCoupons,
      expiredCoupons,
      totalUsage
    };
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-[256px] p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Coupon Management</h1>
          <button 
            onClick={() => handleOpenModal('add')}
            className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg flex items-center"
          >
            <FaPlus className="mr-2" /> Add New Coupon
          </button>
        </div>

        {/* Coupon Stats */}
        {!loading && !storeError && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            {(() => {
              const stats = getCouponStats();
              return (
                <>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-sm text-gray-500">Total Coupons</div>
                    <div className="text-2xl font-semibold mt-1">{stats.totalCoupons}</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-sm text-gray-500">Active Coupons</div>
                    <div className="text-2xl font-semibold mt-1 text-green-600">{stats.activeCoupons}</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-sm text-gray-500">Expired Coupons</div>
                    <div className="text-2xl font-semibold mt-1 text-orange-500">{stats.expiredCoupons}</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-sm text-gray-500">Total Usages</div>
                    <div className="text-2xl font-semibold mt-1 text-blue-600">{stats.totalUsage}</div>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* Filter and search */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-grow max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Search coupons by code or description"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center">
                <span className="mr-2 text-sm text-gray-600">Status:</span>
                <select
                  value={filterActive}
                  onChange={(e) => setFilterActive(e.target.value)}
                  className="border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <span className="mr-2 text-sm text-gray-600">Type:</span>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Types</option>
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>
              
              <button
                onClick={() => {
                  setSearch('');
                  setFilterActive('all');
                  setFilterType('all');
                  setCurrentPage(1);
                }}
                className="text-purple-600 hover:text-purple-800 py-2 px-3 text-sm"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Coupons Table */}
        {loading ? (
          <div className="text-center py-10">
            <div className="spinner"></div>
            <p className="mt-2 text-gray-600">Loading coupons...</p>
          </div>
        ) : storeError ? (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-4">
            {storeError}
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                    <tr>
                      <th className="py-3 px-4 text-left">Code</th>
                      <th className="py-3 px-4 text-left">Type</th>
                      <th className="py-3 px-4 text-left">Value</th>
                      <th className="py-3 px-4 text-left">Min. Purchase</th>
                      <th className="py-3 px-4 text-left">Valid Period</th>
                      <th className="py-3 px-4 text-left">Status</th>
                      <th className="py-3 px-4 text-left">Usage</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {currentCoupons.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="py-4 px-4 text-center text-gray-500">
                          No coupons found. Create your first coupon to get started!
                        </td>
                      </tr>
                    ) : (
                      currentCoupons.map((coupon) => (
                        <tr key={coupon._id} className="hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <span className="font-medium">{coupon.code}</span>
                              <button onClick={() => copyToClipboard(coupon.code)} className="ml-2 text-gray-400 hover:text-gray-600">
                                <FaCopy size={14} />
                              </button>
                            </div>
                            {coupon.description && (
                              <div className="text-xs text-gray-500 mt-1">{coupon.description}</div>
                            )}
                          </td>
                          <td className="py-3 px-4 capitalize">
                            {coupon.discountType}
                          </td>
                          <td className="py-3 px-4">
                            {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : formatCurrency(coupon.discountValue)}
                            {coupon.maxDiscountAmount && (
                              <div className="text-xs text-gray-500">
                                Max: {formatCurrency(coupon.maxDiscountAmount)}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {coupon.minPurchaseAmount > 0 ? formatCurrency(coupon.minPurchaseAmount) : 'None'}
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm">
                              {formatDate(coupon.startDate)} - {formatDate(coupon.endDate)}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                coupon.isActive 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {coupon.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm">
                              {coupon.usageCount} {coupon.usageCount === 1 ? 'use' : 'uses'}
                              {coupon.usageLimit && (
                                <span className="text-xs text-gray-500"> / {coupon.usageLimit}</span>
                              )}
                            </div>
                            {coupon.usageLimit && (
                              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                <div 
                                  className={`h-1.5 rounded-full ${
                                    (coupon.usageCount / coupon.usageLimit) > 0.8 
                                      ? 'bg-red-500' 
                                      : (coupon.usageCount / coupon.usageLimit) > 0.5 
                                        ? 'bg-yellow-500' 
                                        : 'bg-green-500'
                                  }`}
                                  style={{ width: `${Math.min((coupon.usageCount / coupon.usageLimit) * 100, 100)}%` }}
                                ></div>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex justify-center space-x-2">
                              <button
                                onClick={() => toggleActivation(coupon._id, coupon.isActive)}
                                className={`p-1.5 rounded-full ${
                                  coupon.isActive 
                                    ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                                title={coupon.isActive ? 'Deactivate' : 'Activate'}
                              >
                                {coupon.isActive ? <FaToggleOn size={16} /> : <FaToggleOff size={16} />}
                              </button>
                              <button
                                onClick={() => handleOpenModal('edit', coupon)}
                                className="p-1.5 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200"
                                title="Edit"
                              >
                                <FaEdit size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(coupon._id)}
                                className="p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                                title="Delete"
                              >
                                <FaTrash size={16} />
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

            {/* Pagination */}
            {filteredCoupons.length > itemsPerPage && (
              <div className="flex justify-between items-center mt-6">
                <div className="text-sm text-gray-500">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredCoupons.length)} of {filteredCoupons.length} coupons
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Prev
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(num => {
                      if (totalPages <= 5) return true;
                      if (num === 1 || num === totalPages) return true;
                      if (Math.abs(num - currentPage) <= 1) return true;
                      return false;
                    })
                    .map((number, idx, array) => {
                      // Add ellipsis
                      if (idx > 0 && array[idx] - array[idx-1] > 1) {
                        return (
                          <span key={`ellipsis-${number}`} className="px-3 py-1">...</span>
                        );
                      }
                      
                      return (
                        <button
                          key={number}
                          onClick={() => paginate(number)}
                          className={`px-3 py-1 rounded ${
                            currentPage === number
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {number}
                        </button>
                      );
                    })}
                  
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Coupon Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">
                {modalMode === 'add' ? 'Create New Coupon' : 'Edit Coupon'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Coupon Code */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Coupon Code <span className="text-red-500">*</span>
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        name="code"
                        value={formData.code}
                        onChange={handleChange}
                        className="flex-1 border border-gray-300 rounded-l-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="e.g., SUMMER25"
                        required
                      />
                      <button
                        type="button"
                        onClick={generateRandomCode}
                        className="bg-gray-200 text-gray-700 px-3 py-2 rounded-r-lg hover:bg-gray-300"
                      >
                        Generate
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Use uppercase letters and numbers for better readability
                    </p>
                  </div>
                  
                  {/* Discount Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discount Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="discountType"
                      value={formData.discountType}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    >
                      <option value="percentage">Percentage Discount</option>
                      <option value="fixed">Fixed Amount Discount</option>
                    </select>
                  </div>
                  
                  {/* Discount Value */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discount Value <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">
                          {formData.discountType === 'percentage' ? '%' : 'GH₵'}
                        </span>
                      </div>
                      <input
                        type="number"
                        name="discountValue"
                        value={formData.discountValue}
                        onChange={handleChange}
                        min={0}
                        max={formData.discountType === 'percentage' ? 100 : undefined}
                        step={0.01}
                        className="w-full pl-8 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                      />
                    </div>
                    {formData.discountType === 'percentage' && (
                      <p className="mt-1 text-xs text-gray-500">
                        Enter a value between 0 and 100
                      </p>
                    )}
                  </div>
                  
                  {/* Minimum Purchase Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Purchase Amount
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">₵</span>
                      </div>
                      <input
                        type="number"
                        name="minPurchaseAmount"
                        value={formData.minPurchaseAmount}
                        onChange={handleChange}
                        min={0}
                        step={0.01}
                        className="w-full pl-8 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Minimum order value required to apply this coupon (0 for no minimum)
                    </p>
                  </div>
                  
                  {/* Maximum Discount Amount (for percentage discounts) */}
                  {formData.discountType === 'percentage' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Maximum Discount Amount
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500">₵</span>
                        </div>
                        <input
                          type="number"
                          name="maxDiscountAmount"
                          value={formData.maxDiscountAmount || ''}
                          onChange={handleChange}
                          min={0}
                          step={0.01}
                          className="w-full pl-8 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="No maximum"
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Maximum discount amount (leave empty for no limit)
                      </p>
                    </div>
                  )}
                  
                  {/* Start Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                  
                  {/* End Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      min={formData.startDate}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                  
                  {/* Usage Limit */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Usage Limit
                    </label>
                    <input
                      type="number"
                      name="usageLimit"
                      value={formData.usageLimit || ''}
                      onChange={handleChange}
                      min={0}
                      step={1}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Unlimited"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Maximum number of times this coupon can be used (leave empty for unlimited)
                    </p>
                  </div>
                  
                  {/* Active Status */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleChange}
                      className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isActive" className="ml-2 block text-sm font-medium text-gray-700">
                      Active
                    </label>
                    <p className="ml-5 text-xs text-gray-500">
                      Uncheck to temporarily disable this coupon
                    </p>
                  </div>
                </div>
                
                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Brief description of this coupon (optional)"
                  ></textarea>
                </div>
              </div>
              
              <div className="px-6 py-4 bg-gray-50 border-t flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  disabled={loading}
                >
                  {loading ? 
                    'Saving...' : 
                    (modalMode === 'add' ? 'Create Coupon' : 'Update Coupon')
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponsPage; 