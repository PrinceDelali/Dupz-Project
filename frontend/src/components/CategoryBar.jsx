import { Link, useLocation } from 'react-router-dom';

const CategoryBar = () => {
  const location = useLocation();
  
  const categories = [
    {
      name: 'NEW ARRIVALS',
      path: '/new-arrivals',
    },
    {
      name: 'BESTSELLERS',
      path: '/best-sellers',
    },
    {
      name: 'TOPS',
      path: '/tops',
    },
    {
      name: 'DRESSES',
      path: '/dresses',
    },
    {
      name: 'BOTTOMS',
      path: '/bottoms',
    },
    {
      name: 'BACK IN STOCK',
      path: '/back-in-stock',
    }
  ];

  return (
    <div className="w-full border-b border-gray-200 bg-white hidden md:block">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex justify-center space-x-8 py-3">
          {categories.map((category) => (
            <Link 
              key={category.path}
              to={category.path}
              className={`text-sm font-medium transition-colors ${
                location.pathname === category.path
                  ? 'text-black border-b-2 border-black'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryBar; 