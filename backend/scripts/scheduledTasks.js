/**
 * Scheduled Tasks Script
 * 
 * This script runs various scheduled tasks for the Sinosply backend.
 * It can be called manually or by a cron job.
 */

import pingServer from '../utils/keepAlive.js';

// Run all scheduled tasks
async function runScheduledTasks() {
  console.log('Running scheduled tasks...');
  
  try {
    // Task 1: Keep the server alive
    await pingServer();
    
    // Add more scheduled tasks here as needed:
    // - Database cleanup
    // - Cache invalidation
    // - Analytics processing
    // - Email digests
    // etc.
    
    console.log('All scheduled tasks completed successfully.');
  } catch (error) {
    console.error('Error running scheduled tasks:', error);
  }
}

// If this file is run directly, execute the tasks
runScheduledTasks().catch(err => {
  console.error('Fatal error in scheduled tasks:', err);
  process.exit(1);
});

export default runScheduledTasks; 