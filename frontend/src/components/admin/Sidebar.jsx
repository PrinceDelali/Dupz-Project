import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  FaHome, 
  FaShoppingCart, 
  FaBoxes, 
  FaUsers, 
  FaComments,
  FaUser,
  FaCog,
  FaSignOutAlt,
  FaTimes,
  FaDownload,
  FaFileAlt,
  FaCalendarAlt,
  FaChartBar,
  FaChevronRight,
  FaChevronLeft,
  FaTicketAlt,
  FaBullhorn,
  FaShoppingBag,
  FaStore,
  FaUserPlus,
  FaBars,
  FaQuoteRight
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import axios from 'axios';
import apiConfig from '../../config/apiConfig';

// Custom CSS for scrollbar
const scrollbarStyles = `
  /* Hide scrollbar for Chrome, Safari and Opera */
  .sidebar-nav::-webkit-scrollbar {
    width: 6px;
  }

  /* Handle */
  .sidebar-nav::-webkit-scrollbar-thumb {
    background: #CBD5E0;
    border-radius: 3px;
  }

  /* Handle on hover */
  .sidebar-nav::-webkit-scrollbar-thumb:hover {
    background: #A0AEC0;
  }
`;

// Custom tooltip component
const Tooltip = ({ children, label, visible }) => {
  if (!visible) return children;
  
  return (
    <div className="group relative">
      {children}
      <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 w-auto min-w-max opacity-0 
                    group-hover:opacity-100 transition-opacity duration-200 px-2 py-1 
                    text-sm font-medium text-white bg-gray-900 rounded-md shadow-sm pointer-events-none
                    whitespace-nowrap z-50">
        {label}
      </div>
    </div>
  );
};

const Sidebar = () => {
  console.log("Sidebar component rendering");

  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { collapsed, setCollapsed } = useSidebar();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportType, setReportType] = useState('sales');
  const [reportPeriod, setReportPeriod] = useState('month');
  const [reportFormat, setReportFormat] = useState('pdf');
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Define all menu items with IDs
  const allMenuItems = [
    { id: 'dashboard', path: '/admin/dashboard', icon: FaHome, label: 'Dashboard' },
    { id: 'orders', path: '/admin/all-orders', icon: FaShoppingCart, label: 'All Orders' },
    { id: 'products', path: '/admin/products', icon: FaBoxes, label: 'Products' },
    { id: 'collections', path: '/admin/collections', icon: FaShoppingBag, label: 'Collections' },
    { id: 'platforms', path: '/admin/platforms', icon: FaStore, label: 'Platforms' },
    { id: 'quotes', path: '/admin/quotes', icon: FaQuoteRight, label: 'Quote Requests' },
    { id: 'customers', path: '/admin/customers', icon: FaUsers, label: 'Customers' },
    { id: 'chats', path: '/admin/chats', icon: FaComments, label: 'Chats' },
    { id: 'campaigns', path: '/admin/campaigns', icon: FaBullhorn, label: 'Campaigns' },
    { id: 'coupons', path: '/admin/coupons', icon: FaTicketAlt, label: 'Coupons' },
    { id: 'users', path: '/admin/users', icon: FaUserPlus, label: 'Manage Users' }, // New menu item for user management
  ];

  const bottomMenuItems = [
    { id: 'profile', path: '/admin/profile', icon: FaUser, label: 'Profile' },
    { id: 'settings', path: '/admin/settings', icon: FaCog, label: 'Settings' }
  ];

  // Filter menu items based on user permissions
  const getAuthorizedMenuItems = () => {
    // Admin sees everything
    if (user?.role === 'admin') {
      return allMenuItems;
    }

    // Staff only sees items they have permission for
    if (user?.role === 'staff' && Array.isArray(user?.permissions)) {
      return allMenuItems.filter(item => user.permissions.includes(item.id));
    }

    // Default - only show dashboard
    return allMenuItems.filter(item => item.id === 'dashboard');
  };

  // Get authorized bottom menu items
  const getAuthorizedBottomMenuItems = () => {
    // Everyone can see profile
    const items = [bottomMenuItems[0]]; // Profile
    
    // Only admin can see settings by default
    if (user?.role === 'admin' || (user?.role === 'staff' && user?.permissions?.includes('settings'))) {
      items.push(bottomMenuItems[1]); // Settings
    }
    
    return items;
  };

  // Get visible menu items based on permissions
  const menuItems = getAuthorizedMenuItems();
  const authorizedBottomMenuItems = getAuthorizedBottomMenuItems();

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    logout();
    navigate('/admin/login');
    setShowLogoutModal(false);
  };

  const handleGenerateReport = () => {
    setShowReportModal(true);
  };

  const downloadReport = async () => {
    try {
      setGeneratingReport(true);
      console.log(`Generating ${reportType} report for ${reportPeriod} period in ${reportFormat} format`);
      
      // Create the API endpoint URL
      const apiEndpoint = `${apiConfig.baseURL}/admin/reports/generate`;
      console.log(`Calling API endpoint: ${apiEndpoint}`);
      
      const response = await axios.get(apiEndpoint, {
        params: {
          type: reportType,
          period: reportPeriod,
          format: reportFormat
        },
        headers: {
          ...apiConfig.headers,
          ...apiConfig.getAuthHeader()
        },
        responseType: 'blob', // Important for file downloads
        timeout: 30000 // Increase timeout for large reports
      });
      
      console.log('Response received, content type:', response.headers['content-type']);
      
      // Check if the response is an error message
      if (response.data.size < 100 && response.headers['content-type'].includes('application/json')) {
        const reader = new FileReader();
        reader.onload = function() {
          const errorJson = JSON.parse(reader.result);
          console.error('API returned error:', errorJson);
          alert(`Failed to generate report: ${errorJson.error || 'Unknown error'}`);
        };
        reader.readAsText(response.data);
        return;
      }
      
      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Set filename based on report type and date
      const date = new Date().toISOString().split('T')[0];
      const filename = `${reportType}-report-${date}.${reportFormat}`;
      link.setAttribute('download', filename);
      
      console.log(`Downloading file as: ${filename}`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      console.log('Download initiated successfully');
      setShowReportModal(false);
    } catch (error) {
      console.error('Error generating report:', error);
      
      let errorMessage = 'Failed to generate report. Please try again later.';
      
      if (error.response) {
        // The request was made and the server responded with an error status
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        
        if (typeof error.response.data === 'object') {
          errorMessage = error.response.data.error || errorMessage;
        } else if (error.response.status === 401) {
          errorMessage = 'Authentication error. Please log in again.';
        } else if (error.response.status === 403) {
          errorMessage = 'You do not have permission to generate reports.';
        } else if (error.response.status === 500) {
          errorMessage = 'Server error generating report. Please try again later.';
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        errorMessage = 'No response from server. Please check your connection.';
      }
      
      alert(errorMessage);
    } finally {
      setGeneratingReport(false);
    }
  };

  // Toggle mobile sidebar
  const toggleMobileMenu = () => {
    setMobileOpen(!mobileOpen);
  };

  // Close mobile menu when clicking a link
  const handleLinkClick = () => {
    if (window.innerWidth < 768) {
      setMobileOpen(false);
    }
  };

  // Add event listener for window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setCollapsed(true);
      }
      
      // Auto-close mobile menu on larger screens
      if (window.innerWidth >= 768) {
        setMobileOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    // Initial check
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, [setCollapsed]);
  
  // Check if navigation is scrollable and show scroll indicator when needed
  useEffect(() => {
    const checkScrollable = () => {
      // Find the navigation element
      const nav = document.querySelector('.sidebar-nav');
      const scrollIndicator = document.querySelector('.nav-has-overflow');
      
      if (nav && scrollIndicator) {
        // Check if content is scrollable
        const isScrollable = nav.scrollHeight > nav.clientHeight;
        
        // Show or hide scroll indicator
        if (isScrollable) {
          scrollIndicator.classList.remove('hidden');
        } else {
          scrollIndicator.classList.add('hidden');
        }
      }
    };
    
    // Check when component mounts
    checkScrollable();
    
    // Also check when window is resized
    window.addEventListener('resize', checkScrollable);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkScrollable);
  }, [menuItems, collapsed, mobileOpen]);

  // Check if user can generate reports
  const canGenerateReports = () => {
    return user?.role === 'admin' || (user?.role === 'staff' && user?.permissions?.includes('reports'));
  };

  console.log("Sidebar about to return JSX");

  return (
    <>
      {/* Add custom scrollbar styles */}
      <style>{scrollbarStyles}</style>
      
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button 
          onClick={toggleMobileMenu}
          className="bg-white p-2 rounded-md shadow-md"
          aria-label="Toggle menu"
        >
          <FaBars className="h-5 w-5 text-gray-700" />
        </button>
      </div>
      
      {/* Backdrop for mobile menu */}
      {mobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setMobileOpen(false)}
        ></div>
      )}
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 bg-white border-r border-gray-200 transition-all duration-300 z-40
                      ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} 
                      md:translate-x-0 
                      ${collapsed ? 'md:w-20' : 'md:w-64'}
                      w-3/4 sm:w-64 flex flex-col`}>
        {/* Mobile close button */}
        <button 
          className="md:hidden absolute top-4 right-4 p-1 text-gray-500"
          onClick={() => setMobileOpen(false)}
        >
          <FaTimes className="h-5 w-5" />
        </button>
        
        {/* Logo/Title - Fixed at top */}
        <div className="p-4 md:p-6 border-b flex items-center flex-shrink-0">
          <FaStore className="text-purple-600 text-xl mr-3" />
          <h1 className={`text-xl font-semibold text-gray-800 ${collapsed && !mobileOpen ? 'md:hidden' : 'block'}`}>Sinosply</h1>
        </div>

        {/* Main Navigation - Scrollable */}
        <nav className="sidebar-nav flex-1 px-4 mt-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          <div className="space-y-2 py-2">
          {menuItems.map((item) => (
            <Tooltip key={item.path} label={item.label} visible={collapsed && !mobileOpen}>
              <Link
                to={item.path}
                onClick={handleLinkClick}
                className={`flex items-center ${collapsed && !mobileOpen ? 'md:justify-center' : ''} px-4 py-3 rounded-lg transition-colors ${
                  location.pathname === item.path
                    ? 'bg-purple-100 text-purple-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${
                  location.pathname === item.path
                    ? 'text-purple-600'
                    : 'text-gray-500'
                }`} />
                <span className={`ml-3 font-medium ${collapsed && !mobileOpen ? 'md:hidden' : 'block'}`}>{item.label}</span>
              </Link>
            </Tooltip>
          ))}
          </div>
        </nav>

        {/* Scroll indicator - only visible when content is scrollable */}
        <div className="px-4 py-2 text-center text-xs text-gray-500 hidden nav-has-overflow">
          <span>Scroll for more</span>
          <div className="mt-1 flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>

        {/* Bottom Navigation - Fixed at bottom */}
        <div className="px-4 py-4 border-t flex-shrink-0">
          <div className="space-y-2">
            {authorizedBottomMenuItems.map((item) => (
              <Tooltip key={item.path} label={item.label} visible={collapsed && !mobileOpen}>
                <Link
                  to={item.path}
                  onClick={handleLinkClick}
                  className={`flex items-center ${collapsed && !mobileOpen ? 'md:justify-center' : ''} px-4 py-3 rounded-lg transition-colors ${
                    location.pathname === item.path
                      ? 'bg-purple-100 text-purple-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className={`w-5 h-5 flex-shrink-0 ${
                    location.pathname === item.path
                      ? 'text-purple-600'
                      : 'text-gray-500'
                  }`} />
                  <span className={`ml-3 font-medium ${collapsed && !mobileOpen ? 'md:hidden' : 'block'}`}>{item.label}</span>
                </Link>
              </Tooltip>
            ))}
            
            {/* Logout Button */}
            <Tooltip label="Logout" visible={collapsed && !mobileOpen}>
              <button
                onClick={handleLogout}
                className={`w-full flex items-center ${collapsed && !mobileOpen ? 'md:justify-center' : ''} px-4 py-3 rounded-lg transition-colors text-gray-600 hover:bg-gray-100`}
              >
                <FaSignOutAlt className="w-5 h-5 flex-shrink-0 text-gray-500" />
                <span className={`ml-3 font-medium ${collapsed && !mobileOpen ? 'md:hidden' : 'block'}`}>Logout</span>
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Generate Report Button - Only show for users with permission */}
        {canGenerateReports() && (
          <div className="px-4 mb-4 flex-shrink-0">
            <Tooltip label="Generate Report" visible={collapsed && !mobileOpen}>
              <button 
                className={`w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center ${collapsed && !mobileOpen ? 'md:justify-center' : ''}`}
                onClick={handleGenerateReport}
              >
                <FaFileAlt className={collapsed && !mobileOpen ? '' : 'mr-2'} />
                <span className={`${collapsed && !mobileOpen ? 'md:hidden' : 'block'}`}>Generate Report</span>
              </button>
            </Tooltip>
          </div>
        )}

        {/* Desktop Collapse Button */}
        <button
          className="hidden md:block absolute -right-3 top-20 bg-white border border-gray-200 rounded-full p-1 shadow-md"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-4 md:p-6 w-full max-w-xs md:max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base md:text-lg font-medium text-gray-900">Confirm Logout</h3>
              <button 
                onClick={() => setShowLogoutModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <FaTimes />
              </button>
            </div>
            <div className="mb-6">
              <p className="text-sm md:text-base text-gray-600">Are you sure you want to log out of your admin account?</p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-3 py-1.5 md:px-4 md:py-2 border border-gray-300 rounded-lg text-sm md:text-base text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="px-3 py-1.5 md:px-4 md:py-2 bg-purple-600 text-white rounded-lg text-sm md:text-base hover:bg-purple-700"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Report Generation Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-4 md:p-6 w-full max-w-xs md:max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base md:text-lg font-medium text-gray-900">Generate Report</h3>
              <button 
                onClick={() => setShowReportModal(false)}
                className="text-gray-400 hover:text-gray-500"
                disabled={generatingReport}
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="space-y-3 md:space-y-4 mb-4 md:mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Report Type
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  disabled={generatingReport}
                >
                  <option value="sales">Sales Report</option>
                  <option value="inventory">Inventory Report</option>
                  <option value="customers">Customer Analytics</option>
                  <option value="performance">Store Performance</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time Period
                </label>
                <select
                  value={reportPeriod}
                  onChange={(e) => setReportPeriod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  disabled={generatingReport}
                >
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                  <option value="quarter">Last Quarter</option>
                  <option value="year">Last Year</option>
                  <option value="all">All Time</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Format
                </label>
                <select
                  value={reportFormat}
                  onChange={(e) => setReportFormat(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  disabled={generatingReport}
                >
                  <option value="pdf">PDF Document</option>
                  <option value="csv">CSV Spreadsheet</option>
                  <option value="xlsx">Excel Spreadsheet</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-3 py-1.5 md:px-4 md:py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                disabled={generatingReport}
              >
                Cancel
              </button>
              <button
                onClick={downloadReport}
                className="px-3 py-1.5 md:px-4 md:py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center text-sm"
                disabled={generatingReport}
              >
                {generatingReport ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <FaDownload className="mr-2" />
                    Download Report
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {console.log("Sidebar rendering children")}
    </>
  );
};

export default Sidebar; 