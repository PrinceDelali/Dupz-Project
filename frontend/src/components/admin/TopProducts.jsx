import { FaArrowUp, FaArrowDown } from 'react-icons/fa';

const TopProducts = () => {
  const products = [
    {
      id: 1,
      name: 'Product A',
      sales: 120,
      revenue: 2400,
      growth: 12.5
    },
    {
      id: 2,
      name: 'Product B',
      sales: 95,
      revenue: 1900,
      growth: -5.2
    },
    // Add more products...
  ];

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Top Products</h2>
        <button className="text-cyan-500 hover:text-cyan-400 text-sm">View All</button>
      </div>
      <div className="space-y-4">
        {products.map((product) => (
          <div key={product.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
            <div>
              <h3 className="text-white font-medium">{product.name}</h3>
              <p className="text-gray-400 text-sm">{product.sales} sales</p>
            </div>
            <div className="text-right">
              <p className="text-white font-medium">${product.revenue}</p>
              <p className={`text-sm flex items-center justify-end ${
                product.growth >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {product.growth >= 0 ? (
                  <FaArrowUp className="mr-1" />
                ) : (
                  <FaArrowDown className="mr-1" />
                )}
                {Math.abs(product.growth)}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopProducts; 