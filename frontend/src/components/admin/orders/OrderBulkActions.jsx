import { useState } from 'react';
import { FaCheckSquare, FaDownload, FaPrint, FaTags, FaEnvelope, FaExclamationTriangle, FaBoxOpen, FaShippingFast, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const OrderBulkActions = ({ selectedCount, onAction }) => {
  const [showStatusOptions, setShowStatusOptions] = useState(false);
  
  const handleBulkAction = (action) => {
    onAction(action);
    setShowStatusOptions(false);
  };
  
  const handleBulkStatusChange = (status) => {
    onAction('mark-' + status.toLowerCase());
    setShowStatusOptions(false);
  };
  
  return (
    <div className="bg-gray-100 py-3 px-3 sm:px-6 rounded-lg border border-gray-200 flex flex-col sm:flex-row sm:items-center gap-2 mt-4 mb-4">
      <div className="flex items-center justify-between w-full sm:w-auto">
        <span className="text-xs sm:text-sm text-gray-600 font-medium whitespace-nowrap">
          <FaCheckSquare className="inline-block mr-1 text-purple-600" />
          {selectedCount} orders selected
        </span>
        
        {/* Mobile-only clear button */}
        <button 
          onClick={() => onAction('clear-selection')}
          className="sm:hidden text-xs text-red-600 hover:text-red-800"
        >
          Clear
        </button>
      </div>
      
      <div className="flex flex-wrap gap-2 w-full sm:flex-1 sm:justify-end">
        <div className="grid grid-cols-3 sm:flex gap-1 sm:gap-2 w-full sm:w-auto">
          <button 
            onClick={() => handleBulkAction('print')}
            className="btn-bulk-action bg-gray-200 hover:bg-gray-300"
            title="Print selected orders"
          >
            <FaPrint className="text-gray-700" />
            <span className="hidden sm:inline">Print</span>
          </button>
          
          <button 
            onClick={() => handleBulkAction('export')}
            className="btn-bulk-action bg-gray-200 hover:bg-gray-300"
            title="Export selected orders"
          >
            <FaDownload className="text-gray-700" />
            <span className="hidden sm:inline">Export</span>
          </button>
          
          <button 
            onClick={() => handleBulkAction('email')}
            className="btn-bulk-action bg-gray-200 hover:bg-gray-300"
            title="Email customers"
          >
            <FaEnvelope className="text-gray-700" />
            <span className="hidden sm:inline">Email</span>
          </button>
          
          <div className="relative col-span-2 sm:col-span-1">
            <button 
              onClick={() => setShowStatusOptions(!showStatusOptions)}
              className="btn-bulk-action bg-gray-200 hover:bg-gray-300 w-full"
              title="Update status"
            >
              <FaTags className="text-gray-700" />
              <span className="hidden sm:inline">Update Status</span>
            </button>
            
            {showStatusOptions && (
              <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-48 bg-white rounded-md shadow-lg z-10 py-1 border border-gray-200">
                <button 
                  onClick={() => handleBulkStatusChange('Processing')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <FaBoxOpen className="mr-2 text-blue-500" />
                  Mark as Processing
                </button>
                <button 
                  onClick={() => handleBulkStatusChange('Shipped')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <FaShippingFast className="mr-2 text-indigo-500" />
                  Mark as Shipped
                </button>
                <button 
                  onClick={() => handleBulkStatusChange('Delivered')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <FaCheckCircle className="mr-2 text-green-500" />
                  Mark as Delivered
                </button>
                <button 
                  onClick={() => handleBulkStatusChange('Cancelled')}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                >
                  <FaTimesCircle className="mr-2 text-red-500" />
                  Cancel Orders
                </button>
              </div>
            )}
          </div>
          
          <button 
            onClick={() => handleBulkAction('delete')}
            className="btn-bulk-action bg-red-100 hover:bg-red-200 text-red-700"
            title="Delete selected orders"
          >
            <FaExclamationTriangle className="text-red-600" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      </div>
      
      <style jsx="true">{`
        .btn-bulk-action {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.5rem;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s;
          width: 100%;
        }
        
        @media (min-width: 640px) {
          .btn-bulk-action {
            padding: 0.5rem 0.75rem;
            width: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default OrderBulkActions; 