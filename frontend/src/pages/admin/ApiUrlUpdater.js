/**
 * Script to update hardcoded localhost URLs in all admin pages
 * Run this script from the command line: npm run updateApiUrls
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const adminPagesDir = __dirname;

// Process all JavaScript and JSX files in the admin directory
const processFiles = (dir) => {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      // Recursively process subdirectories
      processFiles(filePath);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      // Skip the updater script itself
      if (file === 'ApiUrlUpdater.js') return;
      
      console.log(`Processing file: ${filePath}`);
      
      // Read the file content
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Check if the file already imports apiConfig
      const hasApiConfigImport = content.includes("import apiConfig from '../../config/apiConfig'");
      
      // Add the import if needed
      if (!hasApiConfigImport && content.includes('http://localhost:5000')) {
        console.log(`  Adding apiConfig import to ${file}`);
        
        // Find a good spot to add the import - after other imports
        const importLines = content.match(/^import.*$/gm);
        if (importLines && importLines.length > 0) {
          const lastImport = importLines[importLines.length - 1];
          content = content.replace(
            lastImport,
            `${lastImport}\nimport apiConfig from '../../config/apiConfig';`
          );
        }
      }
      
      // Replace hardcoded URLs with apiConfig
      if (content.includes('http://localhost:5000')) {
        console.log(`  Replacing hardcoded URLs in ${file}`);
        content = content.replace(
          /(['"`])http:\/\/localhost:5000\/api\/v1/g, 
          '$1${apiConfig.baseURL}'
        );
      }
      
      // Write the updated content back to the file
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`  Updated ${file}`);
    }
  });
};

// Start processing
console.log('Updating API URLs in admin pages...');
processFiles(adminPagesDir);
console.log('Done!'); 