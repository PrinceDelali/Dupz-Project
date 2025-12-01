 /**
 * Utility functions for formatting various data types
 */

/**
 * Format a number as currency with proper symbols and formatting
 * @param {number} amount - The amount to format
 * @param {string} currencyCode - The currency code (USD, GHS, CNY, GBP)
 * @param {string} locale - The locale to use for formatting
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (amount, currencyCode = 'USD', locale = 'en-US') => {
    if (amount == null) return '-';
    
    const currencyMap = {
      USD: { symbol: '$', locale: 'en-US' },
      GHS: { symbol: '₵', locale: 'en-GH' },
      CNY: { symbol: '¥', locale: 'zh-CN' },
      GBP: { symbol: '£', locale: 'en-GB' }
    };
  
    try {
      // Use Intl.NumberFormat for proper locale-aware formatting
      return new Intl.NumberFormat(currencyMap[currencyCode]?.locale || locale, {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    } catch (error) {
      // Fallback formatting if Intl.NumberFormat fails
      const currency = currencyMap[currencyCode] || currencyMap.USD;
      return `${currency.symbol}${amount.toFixed(2)}`;
    }
  };
  
  /**
   * Format a date with a standard format
   * @param {Date|string} date - The date to format
   * @param {string} format - Optional format instruction
   * @returns {string} - Formatted date string
   */
  export const formatDate = (date, format = 'standard') => {
    if (!date) return '-';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) return 'Invalid date';
    
    switch (format) {
      case 'short':
        return dateObj.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        });
      case 'long':
        return dateObj.toLocaleDateString('en-US', { 
          weekday: 'long',
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        });
      case 'time':
        return dateObj.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit'
        });
      case 'datetime':
        return dateObj.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric',
          hour: '2-digit', 
          minute: '2-digit'
        });
      case 'standard':
      default:
        return dateObj.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
    }
  };
  
  /**
   * Format a number with commas for thousands
   * @param {number} num - The number to format
   * @returns {string} - Formatted number string
   */
  export const formatNumber = (num) => {
    if (num == null) return '-';
    return new Intl.NumberFormat().format(num);
  };
  
  /**
   * Format a percentage value
   * @param {number} value - The decimal value to format as percentage
   * @param {number} decimals - Number of decimal places
   * @returns {string} - Formatted percentage string
   */
  export const formatPercentage = (value, decimals = 1) => {
    if (value == null) return '-';
    return `${(value * 100).toFixed(decimals)}%`;
  };
  
  /**
   * Format a file size in bytes to a human-readable format
   * @param {number} bytes - The size in bytes
   * @returns {string} - Formatted file size
   */
  export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };
  
  /**
   * Format a phone number
   * @param {string} phone - The phone number to format
   * @returns {string} - Formatted phone number
   */
  export const formatPhone = (phone) => {
    if (!phone) return '-';
    
    // Simple formatting for US numbers
    if (phone.length === 10) {
      return `(${phone.substring(0, 3)}) ${phone.substring(3, 6)}-${phone.substring(6)}`;
    }
    
    return phone;
  };