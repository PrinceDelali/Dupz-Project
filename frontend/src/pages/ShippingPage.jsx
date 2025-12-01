import React from 'react';

const ShippingPage = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Shipping Information</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Shipping Policy</h2>
        <p className="mb-4">
          At Sinosply, we strive to deliver your orders as quickly and efficiently as possible.
          Below you'll find detailed information about our shipping options, delivery times, and policies.
        </p>
        
        <h3 className="text-lg font-medium mt-6 mb-2">Delivery Options</h3>
        <ul className="list-disc ml-6 mb-4">
          <li className="mb-2">Standard Shipping (3-5 business days)</li>
          <li className="mb-2">Express Shipping (1-2 business days)</li>
          <li className="mb-2">International Shipping (7-14 business days)</li>
        </ul>
        
        <h3 className="text-lg font-medium mt-6 mb-2">Shipping Rates</h3>
        <p className="mb-4">
          Shipping rates are calculated based on the destination, weight, and dimensions of your order.
          You can view the exact shipping cost during checkout before completing your purchase.
        </p>
        
        <h3 className="text-lg font-medium mt-6 mb-2">Order Tracking</h3>
        <p className="mb-4">
          Once your order ships, you will receive a confirmation email with a tracking number.
          You can track your order status at any time by visiting the "Track Order" page on our website.
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
        
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2">When will my order ship?</h3>
          <p>
            Orders are typically processed within 1-2 business days. Once your order ships, you'll receive
            a confirmation email with tracking information.
          </p>
        </div>
        
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2">Do you ship internationally?</h3>
          <p>
            Yes, we ship to most countries worldwide. International shipping times and rates vary by location.
          </p>
        </div>
        
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2">What if my package is damaged or lost?</h3>
          <p>
            If your package is damaged upon arrival or gets lost during transit, please contact our customer
            service team immediately and we'll help resolve the issue.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShippingPage; 