// Simple Route Debug Script without ES modules

// Test routes
const routes = [
  '/api/v1/orders/debug',
  '/api/v1/orders/my-orders',
  '/api/v1/orders/123456'
];

// Simple route matching function
function matchRoute(path) {
  if (path === '/api/v1/orders/debug') {
    return 'Debug route';
  } else if (path === '/api/v1/orders/my-orders') {
    return 'My Orders route';
  } else if (path.match(/^\/api\/v1\/orders\/[^\/]+$/)) {
    return `Order ID route: ${path.split('/').pop()}`;
  } else {
    return 'No match found';
  }
}

// Run tests
console.log('=== Route Matching Test ===');
routes.forEach(route => {
  console.log(`\nTesting route: ${route}`);
  console.log(`Result: ${matchRoute(route)}`);
});
console.log('\n=== Test Complete ==='); 