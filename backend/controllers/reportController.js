import asyncHandler from '../middleware/async.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import PDFDocument from 'pdfkit';
import { Parser as CsvParser } from 'json2csv';
import Excel from 'exceljs';

// @desc    Generate various reports
// @route   GET /api/v1/admin/reports/generate
//@access  Private/Admin
export const generateReport = asyncHandler(async (req, res) => {
  console.log('📊 Report generation started with params:', req.query);
  
  const { type, period, format } = req.query;
  
  // Define date range based on period
  const endDate = new Date();
  let startDate = new Date();
  
  switch (period) {
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'quarter':
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    case 'all':
      startDate = new Date(0); // Beginning of time
      break;
    default:
      startDate.setMonth(startDate.getMonth() - 1); // Default to 1 month
  }
  
  console.log(`📅 Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
  
  // Fetch data based on report type
  let reportData = [];
  let reportTitle = '';
  
  try {
    switch (type) {
      case 'sales':
        reportTitle = 'Sales Report';
        console.log('🔍 Fetching orders for sales report...');
        
        const salesOrders = await Order.find({
          createdAt: { $gte: startDate, $lte: endDate }
        })
        .populate('user', 'firstName lastName email');
        
        console.log(`✅ Found ${salesOrders.length} orders for sales report`);
        
        // Format order data for report
        reportData = salesOrders.map(order => ({
          orderId: order._id,
          orderNumber: order.orderNumber || order._id.toString(),
          customerName: `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim() || order.customerName || 'Guest',
          customerEmail: order.user?.email || order.customerEmail || 'guest@example.com',
          orderDate: order.createdAt.toISOString().split('T')[0],
          status: order.status,
          totalAmount: order.totalAmount || order.total || 0,
          paymentMethod: order.paymentMethod || 'N/A',
          itemCount: (order.items && Array.isArray(order.items)) ? order.items.length : 0
        }));
        break;
        
      case 'inventory':
        reportTitle = 'Inventory Report';
        console.log('🔍 Fetching products for inventory report...');
        
        const products = await Product.find();
        console.log(`✅ Found ${products.length} products for inventory report`);
        
        // Format product data
        reportData = products.map(product => ({
          productId: product._id,
          name: product.name,
          sku: product.sku || 'N/A',
          category: product.category || 'Uncategorized',
          price: product.price || 0,
          stock: product.stock || product.quantity || 0,
          status: (product.stock > 0 || product.quantity > 0) ? 'In Stock' : 'Out of Stock',
          createdAt: product.createdAt ? product.createdAt.toISOString().split('T')[0] : 'Unknown'
        }));
        break;
        
      case 'customers':
        reportTitle = 'Customer Analytics';
        console.log('🔍 Fetching users for customer report...');
        
        const users = await User.find({
          role: 'user',
          createdAt: { $gte: startDate, $lte: endDate }
        });
        
        console.log(`✅ Found ${users.length} customers for report`);
        
        // Format user data
        reportData = users.map(user => ({
          userId: user._id,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || 'Unknown',
          email: user.email || 'No Email',
          phoneNumber: user.phoneNumber || '',
          joinDate: user.createdAt ? user.createdAt.toISOString().split('T')[0] : 'Unknown',
          lastActive: user.lastActive ? user.lastActive.toISOString().split('T')[0] : 'Never',
          verified: user.isVerified ? 'Yes' : 'No'
        }));
        break;
        
      case 'performance':
        reportTitle = 'Store Performance';
        console.log('🔍 Fetching data for performance report...');
        
        // Get order data
        const performanceOrders = await Order.find({
          createdAt: { $gte: startDate, $lte: endDate }
        });
        
        console.log(`✅ Found ${performanceOrders.length} orders for performance metrics`);
        
        // Get user signups
        const newUsers = await User.countDocuments({
          role: 'user',
          createdAt: { $gte: startDate, $lte: endDate }
        });
        
        console.log(`✅ Found ${newUsers} new users in the selected period`);
        
        // Calculate performance metrics
        const totalSales = performanceOrders.reduce((sum, order) => sum + (order.totalAmount || order.total || 0), 0);
        const totalOrders = performanceOrders.length;
        const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
        
        // Group by status for report
        const byStatus = {};
        performanceOrders.forEach(order => {
          byStatus[order.status] = (byStatus[order.status] || 0) + 1;
        });
        
        reportData = [{
          period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
          totalSales,
          totalOrders,
          avgOrderValue,
          newCustomers: newUsers,
          pendingOrders: byStatus['pending'] || 0,
          processingOrders: byStatus['processing'] || 0,
          shippedOrders: byStatus['shipped'] || 0,
          deliveredOrders: byStatus['delivered'] || 0,
          cancelledOrders: byStatus['cancelled'] || 0
        }];
        break;
        
      default:
        console.error(`❌ Invalid report type: ${type}`);
        return res.status(400).json({
          success: false,
          error: 'Invalid report type'
        });
    }
    
    console.log(`✅ Report data prepared with ${reportData.length} rows`);
    
    // Generate and send report in requested format
    switch (format) {
      case 'pdf':
        console.log('🖨️ Generating PDF report...');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${type}-report.pdf`);
        
        const doc = new PDFDocument();
        doc.pipe(res);
        
        // Add report header
        doc.fontSize(25).text(`${reportTitle}`, { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Period: ${startDate.toDateString()} to ${endDate.toDateString()}`, { align: 'center' });
        doc.moveDown(2);
        
        // Format depends on report type
        if (type === 'performance') {
          const data = reportData[0];
          doc.fontSize(12);
          doc.text(`Total Sales: GH₵${data.totalSales.toFixed(2)}`);
          doc.text(`Total Orders: ${data.totalOrders}`);
          doc.text(`Average Order Value: GH₵${data.avgOrderValue.toFixed(2)}`);
          doc.text(`New Customers: ${data.newCustomers}`);
          doc.moveDown();
          doc.text('Orders by Status:');
          doc.text(`Pending: ${data.pendingOrders}`);
          doc.text(`Processing: ${data.processingOrders}`);
          doc.text(`Shipped: ${data.shippedOrders}`);
          doc.text(`Delivered: ${data.deliveredOrders}`);
          doc.text(`Cancelled: ${data.cancelledOrders}`);
        } else {
          // Create a table structure for other reports
          const tableTop = 150;
          const columnPositions = [50, 200, 300, 400, 500];
          let rowTop = tableTop;
          
          // Get headers based on report type
          const headers = Object.keys(reportData[0] || {}).slice(0, 5); // Limit to 5 columns for readability
          
          // Draw header row
          doc.fontSize(10).font('Helvetica-Bold');
          headers.forEach((header, i) => {
            doc.text(
              header.charAt(0).toUpperCase() + header.slice(1),
              columnPositions[i],
              rowTop
            );
          });
          rowTop += 20;
          
          // Draw data rows
          doc.font('Helvetica');
          reportData.forEach((row, rowIndex) => {
            if (rowIndex < 40) { // Limit rows for PDF
              headers.forEach((header, colIndex) => {
                doc.text(
                  String(row[header] || ''),
                  columnPositions[colIndex],
                  rowTop
                );
              });
              rowTop += 20;
            }
          });
          
          if (reportData.length > 40) {
            doc.moveDown();
            doc.text(`...plus ${reportData.length - 40} more rows not shown`, { align: 'center' });
          }
        }
        
        console.log('✅ PDF generated and streaming to client');
        doc.end();
        break;
        
      case 'csv':
        console.log('🖨️ Generating CSV report...');
        try {
          const csv = new CsvParser().parse(reportData);
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', `attachment; filename=${type}-report.csv`);
          res.send(csv);
          console.log('✅ CSV generated and sent to client');
        } catch (err) {
          console.error('❌ CSV generation error', err);
          return res.status(500).json({
            success: false,
            error: 'Error generating CSV'
          });
        }
        break;
        
      case 'xlsx':
        console.log('🖨️ Generating Excel report...');
        const workbook = new Excel.Workbook();
        const worksheet = workbook.addWorksheet(reportTitle);
        
        // Add headers
        const headers = Object.keys(reportData[0] || {});
        worksheet.columns = headers.map(header => ({
          header: header.charAt(0).toUpperCase() + header.slice(1),
          key: header,
          width: 20
        }));
        
        // Add rows
        worksheet.addRows(reportData);
        
        // Apply some styling
        worksheet.getRow(1).font = { bold: true };
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${type}-report.xlsx`);
        
        await workbook.xlsx.write(res);
        console.log('✅ Excel file generated and sent to client');
        break;
        
      default:
        console.error(`❌ Invalid format: ${format}`);
        return res.status(400).json({
          success: false,
          error: 'Invalid format'
        });
    }
  } catch (error) {
    console.error('❌ Error generating report:', error);
    return res.status(500).json({
      success: false,
      error: 'Error generating report: ' + (error.message || 'Unknown error')
    });
  }
}); 