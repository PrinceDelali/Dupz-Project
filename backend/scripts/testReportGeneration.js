import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import PDFDocument from 'pdfkit';
import { Parser as CsvParser } from 'json2csv';
import Excel from 'exceljs';

// Get directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Create test folder if it doesn't exist
const testFolder = path.join(__dirname, '..', 'temp', 'reports-test');
if (!fs.existsSync(testFolder)) {
  fs.mkdirSync(testFolder, { recursive: true });
}

// Connect to MongoDB
const connectDB = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB connected');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    return false;
  }
};

// Test PDF Generation
const testPDFGeneration = () => {
  try {
    console.log('🔄 Testing PDF generation...');
    
    // Create a sample PDF
    const doc = new PDFDocument();
    const outputPath = path.join(testFolder, 'test-report.pdf');
    
    // Pipe output to file
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);
    
    // Add content
    doc.fontSize(25).text('Test PDF Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text('This is a test PDF generated to check the PDF library', { align: 'center' });
    doc.moveDown(2);
    
    // Add a table
    const tableData = [
      ['ID', 'Name', 'Value'],
      ['1', 'Item 1', '$100.00'],
      ['2', 'Item 2', '$200.00'],
      ['3', 'Item 3', '$300.00']
    ];
    
    const tableTop = 150;
    const tableLeft = 100;
    const colWidth = 100;
    let rowTop = tableTop;
    
    // Draw header
    doc.fontSize(10).font('Helvetica-Bold');
    tableData[0].forEach((header, i) => {
      doc.text(header, tableLeft + i * colWidth, rowTop);
    });
    
    // Draw rows
    rowTop += 20;
    doc.font('Helvetica');
    for (let i = 1; i < tableData.length; i++) {
      tableData[i].forEach((cell, j) => {
        doc.text(cell, tableLeft + j * colWidth, rowTop);
      });
      rowTop += 20;
    }
    
    // End document
    doc.end();
    
    console.log(`✅ PDF successfully generated at: ${outputPath}`);
    return true;
  } catch (error) {
    console.error('❌ Error generating PDF:', error.message);
    return false;
  }
};

// Test CSV Generation
const testCSVGeneration = () => {
  try {
    console.log('🔄 Testing CSV generation...');
    
    // Sample data
    const data = [
      { id: 1, name: 'Product 1', price: 100, stock: 50 },
      { id: 2, name: 'Product 2', price: 200, stock: 30 },
      { id: 3, name: 'Product 3', price: 300, stock: 10 }
    ];
    
    // Generate CSV
    const csv = new CsvParser().parse(data);
    const outputPath = path.join(testFolder, 'test-report.csv');
    
    // Write to file
    fs.writeFileSync(outputPath, csv);
    
    console.log(`✅ CSV successfully generated at: ${outputPath}`);
    return true;
  } catch (error) {
    console.error('❌ Error generating CSV:', error.message);
    return false;
  }
};

// Test Excel Generation
const testExcelGeneration = async () => {
  try {
    console.log('🔄 Testing Excel generation...');
    
    // Sample data
    const data = [
      { id: 1, name: 'Product 1', price: 100, stock: 50 },
      { id: 2, name: 'Product 2', price: 200, stock: 30 },
      { id: 3, name: 'Product 3', price: 300, stock: 10 }
    ];
    
    // Create a workbook
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet('Test');
    
    // Add headers
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Name', key: 'name', width: 20 },
      { header: 'Price', key: 'price', width: 15 },
      { header: 'Stock', key: 'stock', width: 15 }
    ];
    
    // Add rows
    worksheet.addRows(data);
    
    // Add some styling
    worksheet.getRow(1).font = { bold: true };
    
    // Write to file
    const outputPath = path.join(testFolder, 'test-report.xlsx');
    await workbook.xlsx.writeFile(outputPath);
    
    console.log(`✅ Excel file successfully generated at: ${outputPath}`);
    return true;
  } catch (error) {
    console.error('❌ Error generating Excel file:', error.message);
    return false;
  }
};

// Main test function
const runTests = async () => {
  console.log('🧪 REPORT GENERATION TEST SCRIPT 🧪');
  console.log('==================================');
  
  // Connect to DB
  const dbConnected = await connectDB();
  if (!dbConnected) {
    console.log('⚠️ Skipping tests that require database connection');
  }
  
  // Run library tests
  const pdfResult = testPDFGeneration();
  const csvResult = testCSVGeneration();
  const excelResult = await testExcelGeneration();
  
  // Report results
  console.log('\n📋 TEST RESULTS:');
  console.log('----------------------------------');
  console.log(`MongoDB Connection: ${dbConnected ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`PDF Generation: ${pdfResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`CSV Generation: ${csvResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Excel Generation: ${excelResult ? '✅ PASS' : '❌ FAIL'}`);
  
  // Close MongoDB connection
  if (dbConnected) {
    await mongoose.disconnect();
    console.log('✅ MongoDB disconnected');
  }
};

// Run tests
runTests().catch(err => {
  console.error('Unhandled error in test script:', err);
  process.exit(1);
}); 