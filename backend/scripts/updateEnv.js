import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '.env');

try {
  // Check if .env file exists
  if (!fs.existsSync(envPath)) {
    console.error('.env file not found at', envPath);
    process.exit(1);
  }

  // Read current .env content
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Remove SMTP-related variables and their comments
  const smtpVarsToRemove = [
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_SECURE',
    'SMTP_EMAIL',
    'SMTP_PASSWORD'
  ];
  
  // Create a regex pattern to match each SMTP variable and its comment line
  for (const varName of smtpVarsToRemove) {
    // Match both the variable and any comment lines immediately preceding it
    const pattern = new RegExp(`(^|\n)(#[^\n]*\n)?\\s*${varName}=.*(\n|$)`, 'g');
    envContent = envContent.replace(pattern, '$1');
  }
  
  // Check if Resend variables already exist
  const needsResendApiKey = !envContent.includes('RESEND_API_KEY=');
  const needsResendVerifiedEmail = !envContent.includes('RESEND_VERIFIED_EMAIL=');
  
  // Add Resend variables if needed
  let resendSection = '';
  
  if (needsResendApiKey || needsResendVerifiedEmail) {
    resendSection += '\n# Email Configuration (Resend)\n';
    
    if (needsResendApiKey) {
      resendSection += `# Sign up at https://resend.com to get your API key
RESEND_API_KEY=re_your_api_key_here\n`;
    }
    
    if (needsResendVerifiedEmail) {
      resendSection += `# With Resend's free tier, you can only send to your own verified email until you verify a domain
RESEND_VERIFIED_EMAIL=your-email@example.com\n`;
    }
  }

  // Add Resend section to the env file
  if (resendSection) {
    if (envContent.includes('# OAuth Credentials')) {
      // Insert before OAuth section
      envContent = envContent.replace(
        '# OAuth Credentials', 
        `${resendSection}\n# OAuth Credentials`
      );
    } else {
      // Just append to the end
      envContent += resendSection;
    }
  }

  // Write updated content back to file
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('Successfully updated .env file:');
  console.log('- Removed SMTP configuration');
  console.log('- Ensured Resend configuration is present');
  
} catch (error) {
  console.error('Error updating .env file:', error);
  process.exit(1);
}
