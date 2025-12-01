import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

/**
 * Service to handle generating various report types in different formats
 */
class ReportService {
  /**
   * Generate a report based on given parameters
   * @param {string} type - Type of report: 'sales', 'inventory', 'customers', 'performance'
   * @param {string} period - Time period: 'week', 'month', 'quarter', 'year', 'all'
   * @param {string} format - Output format: 'pdf', 'csv', 'xlsx'
   * @param {Object} storeData - Data from various stores needed for the report
   * @returns {Blob} - Blob of the generated report
   */
  async generateReport(type, period, format, storeData) {
    try {
      console.log(`Generating ${type} report for ${period} period in ${format} format`);
      
      // Get the appropriate data based on report type
      const reportData = this._getReportData(type, period, storeData);
      
      // Generate the report in the requested format
      switch (format) {
        case 'pdf':
          return this._generatePDF(type, period, reportData);
        case 'csv':
          return this._generateCSV(reportData);
        case 'xlsx':
          return this._generateExcel(reportData, `${type}-${period}`);
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      throw new Error('Failed to generate report');
    }
  }

  /**
   * Prepare report data based on report type and period
   */
  _getReportData(type, period, storeData) {
    const { orders, products, customers } = storeData;
    const filteredOrders = this._filterDataByPeriod(orders, period);
    
    switch (type) {
      case 'sales':
        return this._prepareSalesReportData(filteredOrders);
      case 'inventory':
        return this._prepareInventoryReportData(products);
      case 'customers':
        return this._prepareCustomerReportData(customers, filteredOrders);
      case 'performance':
        return this._preparePerformanceReportData(filteredOrders, products);
      default:
        throw new Error(`Unsupported report type: ${type}`);
    }
  }

  /**
   * Filter data based on time period
   */
  _filterDataByPeriod(data, period) {
    if (!data || period === 'all') return data;
    
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case 'year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        return data;
    }
    
    return data.filter(item => {
      const itemDate = new Date(item.date || item.createdAt || item.updatedAt);
      return itemDate >= startDate && itemDate <= now;
    });
  }

  /**
   * Prepare data for sales report
   */
  _prepareSalesReportData(orders) {
    // Group orders by date
    const salesByDate = orders.reduce((acc, order) => {
      const date = format(new Date(order.date || order.createdAt), 'yyyy-MM-dd');
      
      if (!acc[date]) {
        acc[date] = {
          date,
          totalSales: 0,
          totalOrders: 0,
          products: {}
        };
      }
      
      acc[date].totalSales += order.total || 0;
      acc[date].totalOrders += 1;
      
      // Track product sales
      if (order.items) {
        order.items.forEach(item => {
          const productId = item.id || item._id;
          if (!acc[date].products[productId]) {
            acc[date].products[productId] = {
              name: item.name,
              quantity: 0,
              revenue: 0
            };
          }
          acc[date].products[productId].quantity += item.quantity || 1;
          acc[date].products[productId].revenue += (item.price * (item.quantity || 1));
        });
      }
      
      return acc;
    }, {});
    
    // Convert to array and sort by date
    const salesData = Object.values(salesByDate).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Calculate totals and averages
    const totalSales = salesData.reduce((sum, day) => sum + day.totalSales, 0);
    const totalOrders = salesData.reduce((sum, day) => sum + day.totalOrders, 0);
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    
    // Best selling products
    const productSales = {};
    salesData.forEach(day => {
      Object.entries(day.products).forEach(([id, product]) => {
        if (!productSales[id]) {
          productSales[id] = { ...product, quantity: 0, revenue: 0 };
        }
        productSales[id].quantity += product.quantity;
        productSales[id].revenue += product.revenue;
      });
    });
    
    const bestSellingProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
    
    return {
      dailySales: salesData,
      summary: {
        totalSales,
        totalOrders,
        avgOrderValue,
        currency: 'GH₵'
      },
      bestSellingProducts
    };
  }

  /**
   * Prepare data for inventory report
   */
  _prepareInventoryReportData(products) {
    if (!products || !products.length) {
      return {
        products: [],
        summary: {
          totalProducts: 0,
          totalValue: 0,
          lowStockItems: 0
        }
      };
    }
    
    const lowStockThreshold = 10; // Define what "low stock" means
    
    // Calculate inventory metrics
    const inventoryProducts = products.map(product => ({
      id: product.id || product._id,
      name: product.name,
      sku: product.sku || '-',
      price: product.price || 0,
      stockLevel: product.stockLevel || product.quantity || 0,
      value: (product.price || 0) * (product.stockLevel || product.quantity || 0),
      status: (product.stockLevel || product.quantity || 0) <= lowStockThreshold ? 'Low Stock' : 'In Stock'
    }));
    
    // Sort by stock level (ascending)
    inventoryProducts.sort((a, b) => a.stockLevel - b.stockLevel);
    
    // Calculate summary
    const totalProducts = inventoryProducts.length;
    const totalValue = inventoryProducts.reduce((sum, product) => sum + product.value, 0);
    const lowStockItems = inventoryProducts.filter(p => p.status === 'Low Stock').length;
    
    return {
      products: inventoryProducts,
      summary: {
        totalProducts,
        totalValue,
        lowStockItems,
        currency: 'GH₵'
      }
    };
  }

  /**
   * Prepare data for customer report
   */
  _prepareCustomerReportData(customers, orders) {
    if (!customers || !customers.length) {
      return {
        customers: [],
        summary: {
          totalCustomers: 0,
          newCustomers: 0,
          activeCustomers: 0
        }
      };
    }
    
    // Get customer purchase history from orders
    const customerPurchases = {};
    orders.forEach(order => {
      const customerId = order.customerId || order.customer?.id || order.customer;
      if (!customerId) return;
      
      if (!customerPurchases[customerId]) {
        customerPurchases[customerId] = {
          totalSpent: 0,
          orderCount: 0,
          lastOrderDate: null
        };
      }
      
      customerPurchases[customerId].totalSpent += order.total || 0;
      customerPurchases[customerId].orderCount += 1;
      
      const orderDate = new Date(order.date || order.createdAt);
      if (!customerPurchases[customerId].lastOrderDate || 
          orderDate > new Date(customerPurchases[customerId].lastOrderDate)) {
        customerPurchases[customerId].lastOrderDate = orderDate;
      }
    });
    
    // Prepare customer data with purchase metrics
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    
    const customerData = customers.map(customer => {
      const purchases = customerPurchases[customer.id || customer._id] || {
        totalSpent: 0,
        orderCount: 0,
        lastOrderDate: null
      };
      
      const createdAt = new Date(customer.createdAt || customer.registeredDate);
      const isNewCustomer = createdAt >= oneMonthAgo;
      const isActive = purchases.lastOrderDate && new Date(purchases.lastOrderDate) >= oneMonthAgo;
      
      return {
        id: customer.id || customer._id,
        name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.name || 'Unknown',
        email: customer.email || '-',
        phone: customer.phone || '-',
        totalSpent: purchases.totalSpent,
        orderCount: purchases.orderCount,
        lastOrderDate: purchases.lastOrderDate ? format(new Date(purchases.lastOrderDate), 'yyyy-MM-dd') : '-',
        status: isActive ? 'Active' : 'Inactive',
        customerSince: format(createdAt, 'yyyy-MM-dd'),
        isNew: isNewCustomer
      };
    });
    
    // Calculate summary
    const totalCustomers = customerData.length;
    const newCustomers = customerData.filter(c => c.isNew).length;
    const activeCustomers = customerData.filter(c => c.status === 'Active').length;
    
    // Sort by total spent (descending)
    customerData.sort((a, b) => b.totalSpent - a.totalSpent);
    
    return {
      customers: customerData,
      summary: {
        totalCustomers,
        newCustomers,
        activeCustomers,
        currency: 'GH₵'
      }
    };
  }

  /**
   * Prepare data for store performance report
   */
  _preparePerformanceReportData(orders, products) {
    // Calculate revenue metrics
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    const orderCount = orders.length;
    const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;
    
    // Calculate revenue by day
    const revenueByDay = orders.reduce((acc, order) => {
      const date = format(new Date(order.date || order.createdAt), 'yyyy-MM-dd');
      
      if (!acc[date]) {
        acc[date] = {
          date,
          revenue: 0,
          orders: 0
        };
      }
      
      acc[date].revenue += order.total || 0;
      acc[date].orders += 1;
      
      return acc;
    }, {});
    
    // Convert to array and sort by date
    const dailyRevenue = Object.values(revenueByDay).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Get top 5 products by revenue
    const productRevenue = {};
    orders.forEach(order => {
      if (!order.items) return;
      
      order.items.forEach(item => {
        const productId = item.id || item._id;
        if (!productRevenue[productId]) {
          productRevenue[productId] = {
            name: item.name,
            quantity: 0,
            revenue: 0
          };
        }
        productRevenue[productId].quantity += item.quantity || 1;
        productRevenue[productId].revenue += (item.price * (item.quantity || 1));
      });
    });
    
    const topProducts = Object.values(productRevenue)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
    
    return {
      summary: {
        totalRevenue,
        orderCount,
        avgOrderValue,
        currency: 'GH₵'
      },
      dailyRevenue,
      topProducts
    };
  }

  /**
   * Generate PDF report
   */
  _generatePDF(type, period, data) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Add report title
    const title = `${this._capitalizeFirstLetter(type)} Report - ${this._getPeriodLabel(period)}`;
    doc.setFontSize(18);
    doc.text(title, pageWidth / 2, 20, { align: 'center' });
    
    // Add date
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), 'PPpp')}`, pageWidth / 2, 27, { align: 'center' });
    
    doc.setFontSize(12);
    
    // Generate report based on type
    switch (type) {
      case 'sales':
        this._generateSalesPDF(doc, data);
        break;
      case 'inventory':
        this._generateInventoryPDF(doc, data);
        break;
      case 'customers':
        this._generateCustomersPDF(doc, data);
        break;
      case 'performance':
        this._generatePerformancePDF(doc, data);
        break;
    }
    
    return doc.output('blob');
  }
  
  /**
   * Generate sales report PDF
   */
  _generateSalesPDF(doc, data) {
    const { summary, dailySales, bestSellingProducts } = data;
    
    // Add summary section
    doc.setFontSize(14);
    doc.text('Summary', 14, 40);
    
    const summaryData = [
      ['Total Sales', `${summary.currency}${summary.totalSales.toFixed(2)}`],
      ['Total Orders', summary.totalOrders.toString()],
      ['Average Order Value', `${summary.currency}${summary.avgOrderValue.toFixed(2)}`]
    ];
    
    doc.autoTable({
      startY: 45,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [75, 0, 130] }
    });
    
    // Add daily sales table
    doc.setFontSize(14);
    doc.text('Daily Sales', 14, doc.lastAutoTable.finalY + 15);
    
    const dailySalesData = dailySales.map(day => [
      day.date,
      `${summary.currency}${day.totalSales.toFixed(2)}`,
      day.totalOrders.toString()
    ]);
    
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Date', 'Revenue', 'Orders']],
      body: dailySalesData,
      theme: 'grid',
      headStyles: { fillColor: [75, 0, 130] }
    });
    
    // Add best selling products table
    doc.setFontSize(14);
    doc.text('Best Selling Products', 14, doc.lastAutoTable.finalY + 15);
    
    const productData = bestSellingProducts.map(product => [
      product.name,
      product.quantity.toString(),
      `${summary.currency}${product.revenue.toFixed(2)}`
    ]);
    
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Product', 'Units Sold', 'Revenue']],
      body: productData,
      theme: 'grid',
      headStyles: { fillColor: [75, 0, 130] }
    });
    
    return doc;
  }
  
  /**
   * Generate inventory report PDF
   */
  _generateInventoryPDF(doc, data) {
    const { summary, products } = data;
    
    // Add summary section
    doc.setFontSize(14);
    doc.text('Inventory Summary', 14, 40);
    
    const summaryData = [
      ['Total Products', summary.totalProducts.toString()],
      ['Total Inventory Value', `${summary.currency}${summary.totalValue.toFixed(2)}`],
      ['Low Stock Items', summary.lowStockItems.toString()]
    ];
    
    doc.autoTable({
      startY: 45,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [75, 0, 130] }
    });
    
    // Add inventory table
    doc.setFontSize(14);
    doc.text('Inventory Details', 14, doc.lastAutoTable.finalY + 15);
    
    const inventoryData = products.map(product => [
      product.name,
      product.sku,
      `${summary.currency}${product.price.toFixed(2)}`,
      product.stockLevel.toString(),
      `${summary.currency}${product.value.toFixed(2)}`,
      product.status
    ]);
    
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Product', 'SKU', 'Price', 'Stock', 'Value', 'Status']],
      body: inventoryData,
      theme: 'grid',
      headStyles: { fillColor: [75, 0, 130] }
    });
    
    return doc;
  }
  
  /**
   * Generate customers report PDF
   */
  _generateCustomersPDF(doc, data) {
    const { summary, customers } = data;
    
    // Add summary section
    doc.setFontSize(14);
    doc.text('Customer Summary', 14, 40);
    
    const summaryData = [
      ['Total Customers', summary.totalCustomers.toString()],
      ['New Customers (Last 30 days)', summary.newCustomers.toString()],
      ['Active Customers', summary.activeCustomers.toString()]
    ];
    
    doc.autoTable({
      startY: 45,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [75, 0, 130] }
    });
    
    // Add customers table
    doc.setFontSize(14);
    doc.text('Top Customers by Spending', 14, doc.lastAutoTable.finalY + 15);
    
    const customerData = customers.slice(0, 20).map(customer => [
      customer.name,
      customer.email,
      `${summary.currency}${customer.totalSpent.toFixed(2)}`,
      customer.orderCount.toString(),
      customer.lastOrderDate,
      customer.status
    ]);
    
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Name', 'Email', 'Total Spent', 'Orders', 'Last Order', 'Status']],
      body: customerData,
      theme: 'grid',
      headStyles: { fillColor: [75, 0, 130] }
    });
    
    return doc;
  }
  
  /**
   * Generate performance report PDF
   */
  _generatePerformancePDF(doc, data) {
    const { summary, dailyRevenue, topProducts } = data;
    
    // Add summary section
    doc.setFontSize(14);
    doc.text('Performance Summary', 14, 40);
    
    const summaryData = [
      ['Total Revenue', `${summary.currency}${summary.totalRevenue.toFixed(2)}`],
      ['Total Orders', summary.orderCount.toString()],
      ['Average Order Value', `${summary.currency}${summary.avgOrderValue.toFixed(2)}`]
    ];
    
    doc.autoTable({
      startY: 45,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [75, 0, 130] }
    });
    
    // Add daily revenue table
    doc.setFontSize(14);
    doc.text('Daily Revenue', 14, doc.lastAutoTable.finalY + 15);
    
    const revenueData = dailyRevenue.map(day => [
      day.date,
      `${summary.currency}${day.revenue.toFixed(2)}`,
      day.orders.toString()
    ]);
    
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Date', 'Revenue', 'Orders']],
      body: revenueData,
      theme: 'grid',
      headStyles: { fillColor: [75, 0, 130] }
    });
    
    // Add top products table
    doc.setFontSize(14);
    doc.text('Top Products by Revenue', 14, doc.lastAutoTable.finalY + 15);
    
    const productData = topProducts.map(product => [
      product.name,
      product.quantity.toString(),
      `${summary.currency}${product.revenue.toFixed(2)}`
    ]);
    
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Product', 'Units Sold', 'Revenue']],
      body: productData,
      theme: 'grid',
      headStyles: { fillColor: [75, 0, 130] }
    });
    
    return doc;
  }

  /**
   * Generate CSV report
   */
  _generateCSV(data) {
    // Flatten the data structure based on the report type
    let csvData = [];
    let headers = [];
    
    if (data.dailySales) {
      // Sales report
      headers = ['Date', 'Revenue', 'Orders'];
      csvData = data.dailySales.map(day => [
        day.date,
        day.totalSales.toFixed(2),
        day.totalOrders
      ]);
    } else if (data.products) {
      // Inventory report
      headers = ['Product', 'SKU', 'Price', 'Stock Level', 'Value', 'Status'];
      csvData = data.products.map(product => [
        product.name,
        product.sku,
        product.price.toFixed(2),
        product.stockLevel,
        product.value.toFixed(2),
        product.status
      ]);
    } else if (data.customers) {
      // Customer report
      headers = ['Name', 'Email', 'Phone', 'Total Spent', 'Order Count', 'Last Order', 'Status', 'Customer Since'];
      csvData = data.customers.map(customer => [
        customer.name,
        customer.email,
        customer.phoneNumber || customer.phone || '-',
        customer.totalSpent.toFixed(2),
        customer.orderCount,
        customer.lastOrderDate,
        customer.status,
        customer.customerSince
      ]);
    } else if (data.dailyRevenue) {
      // Performance report
      headers = ['Date', 'Revenue', 'Orders'];
      csvData = data.dailyRevenue.map(day => [
        day.date,
        day.revenue.toFixed(2),
        day.orders
      ]);
    }
    
    // Convert to CSV string
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  }

  /**
   * Generate Excel report
   */
  _generateExcel(data, sheetName) {
    const wb = XLSX.utils.book_new();
    
    // Process different report types
    if (data.dailySales) {
      // Sales report
      const summaryWS = XLSX.utils.aoa_to_sheet([
        ['Sales Summary'],
        [''],
        ['Metric', 'Value'],
        ['Total Sales', `${data.summary.currency}${data.summary.totalSales.toFixed(2)}`],
        ['Total Orders', data.summary.totalOrders],
        ['Average Order Value', `${data.summary.currency}${data.summary.avgOrderValue.toFixed(2)}`]
      ]);
      
      const dailySalesWS = XLSX.utils.aoa_to_sheet([
        ['Daily Sales'],
        [''],
        ['Date', 'Revenue', 'Orders'],
        ...data.dailySales.map(day => [
          day.date,
          `${data.summary.currency}${day.totalSales.toFixed(2)}`,
          day.totalOrders
        ])
      ]);
      
      const productsWS = XLSX.utils.aoa_to_sheet([
        ['Best Selling Products'],
        [''],
        ['Product', 'Units Sold', 'Revenue'],
        ...data.bestSellingProducts.map(product => [
          product.name,
          product.quantity,
          `${data.summary.currency}${product.revenue.toFixed(2)}`
        ])
      ]);
      
      XLSX.utils.book_append_sheet(wb, summaryWS, 'Summary');
      XLSX.utils.book_append_sheet(wb, dailySalesWS, 'Daily Sales');
      XLSX.utils.book_append_sheet(wb, productsWS, 'Best Selling Products');
    } else if (data.products) {
      // Inventory report
      const summaryWS = XLSX.utils.aoa_to_sheet([
        ['Inventory Summary'],
        [''],
        ['Metric', 'Value'],
        ['Total Products', data.summary.totalProducts],
        ['Total Inventory Value', `${data.summary.currency}${data.summary.totalValue.toFixed(2)}`],
        ['Low Stock Items', data.summary.lowStockItems]
      ]);
      
      const inventoryWS = XLSX.utils.aoa_to_sheet([
        ['Inventory Details'],
        [''],
        ['Product', 'SKU', 'Price', 'Stock Level', 'Value', 'Status'],
        ...data.products.map(product => [
          product.name,
          product.sku,
          `${data.summary.currency}${product.price.toFixed(2)}`,
          product.stockLevel,
          `${data.summary.currency}${product.value.toFixed(2)}`,
          product.status
        ])
      ]);
      
      XLSX.utils.book_append_sheet(wb, summaryWS, 'Summary');
      XLSX.utils.book_append_sheet(wb, inventoryWS, 'Inventory');
    } else if (data.customers) {
      // Customer report
      const summaryWS = XLSX.utils.aoa_to_sheet([
        ['Customer Summary'],
        [''],
        ['Metric', 'Value'],
        ['Total Customers', data.summary.totalCustomers],
        ['New Customers (Last 30 days)', data.summary.newCustomers],
        ['Active Customers', data.summary.activeCustomers]
      ]);
      
      const customersWS = XLSX.utils.aoa_to_sheet([
        ['Customer Details'],
        [''],
        ['Name', 'Email', 'Phone', 'Total Spent', 'Orders', 'Last Order', 'Status', 'Customer Since'],
        ...data.customers.map(customer => [
          customer.name,
          customer.email,
          customer.phoneNumber || customer.phone || '-',
          `${data.summary.currency}${customer.totalSpent.toFixed(2)}`,
          customer.orderCount,
          customer.lastOrderDate,
          customer.status,
          customer.customerSince
        ])
      ]);
      
      XLSX.utils.book_append_sheet(wb, summaryWS, 'Summary');
      XLSX.utils.book_append_sheet(wb, customersWS, 'Customers');
    } else if (data.dailyRevenue) {
      // Performance report
      const summaryWS = XLSX.utils.aoa_to_sheet([
        ['Performance Summary'],
        [''],
        ['Metric', 'Value'],
        ['Total Revenue', `${data.summary.currency}${data.summary.totalRevenue.toFixed(2)}`],
        ['Total Orders', data.summary.orderCount],
        ['Average Order Value', `${data.summary.currency}${data.summary.avgOrderValue.toFixed(2)}`]
      ]);
      
      const revenueWS = XLSX.utils.aoa_to_sheet([
        ['Daily Revenue'],
        [''],
        ['Date', 'Revenue', 'Orders'],
        ...data.dailyRevenue.map(day => [
          day.date,
          `${data.summary.currency}${day.revenue.toFixed(2)}`,
          day.orders
        ])
      ]);
      
      const productsWS = XLSX.utils.aoa_to_sheet([
        ['Top Products'],
        [''],
        ['Product', 'Units Sold', 'Revenue'],
        ...data.topProducts.map(product => [
          product.name,
          product.quantity,
          `${data.summary.currency}${product.revenue.toFixed(2)}`
        ])
      ]);
      
      XLSX.utils.book_append_sheet(wb, summaryWS, 'Summary');
      XLSX.utils.book_append_sheet(wb, revenueWS, 'Daily Revenue');
      XLSX.utils.book_append_sheet(wb, productsWS, 'Top Products');
    }
    
    // Write to buffer
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  /**
   * Helper function to capitalize first letter
   */
  _capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  /**
   * Get human-readable period label
   */
  _getPeriodLabel(period) {
    switch (period) {
      case 'week': return 'Last Week';
      case 'month': return 'Last Month';
      case 'quarter': return 'Last Quarter';
      case 'year': return 'Last Year';
      case 'all': return 'All Time';
      default: return period;
    }
  }
}

export default new ReportService(); 