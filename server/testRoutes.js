const express = require('express');
const roomRoutes = require('./routes/roomRoutes');

const app = express();

// Test if roomRoutes loads without errors
try {
  console.log('✅ roomRoutes loaded successfully');
  
  // Check if the routes are properly registered
  app.use('/api/rooms', roomRoutes);
  console.log('✅ roomRoutes registered successfully');
  
  // List all routes
  const routes = [];
  function extractRoutes(stack, basePath = '') {
    stack.forEach(middleware => {
      if (middleware.route) {
        // Regular route
        const methods = Object.keys(middleware.route.methods);
        methods.forEach(method => {
          routes.push(`${method.toUpperCase()} ${basePath}${middleware.route.path}`);
        });
      } else if (middleware.name === 'router' && middleware.handle.stack) {
        // Router middleware
        const routerBasePath = middleware.regexp.source
          .replace('^\\\/', '')
          .replace('\\\\', '')
          .replace('\\/?(?=\\/|$)', '')
          .replace(/\\\//g, '/');
        extractRoutes(middleware.handle.stack, `/${routerBasePath}`);
      }
    });
  }
  
  extractRoutes(app._router.stack);
  
  console.log('\n📋 Available routes:');
  routes.forEach(route => console.log(`  ${route}`));
  
} catch (error) {
  console.error('❌ Error loading roomRoutes:', error);
}