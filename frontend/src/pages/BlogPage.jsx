import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import HomeNavbar from '../components/HomeNavbar';
import { motion } from 'framer-motion';

const BlogPage = () => {
  // Sample blog posts data
  const [blogPosts] = useState([
    {
      id: 1,
      title: "The Top Fashion Trends for 2023",
      excerpt: "Discover the hottest fashion trends that are taking over this year.",
      author: "Jane Smith",
      date: "May 15, 2023",
      category: "Fashion",
      image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
      slug: "top-fashion-trends-2023"
    },
    {
      id: 2,
      title: "Sustainable Shopping: Making Better Choices",
      excerpt: "Learn how your shopping habits can contribute to a more sustainable future.",
      author: "Mark Johnson",
      date: "April 22, 2023",
      category: "Sustainability",
      image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
      slug: "sustainable-shopping-better-choices"
    },
    {
      id: 3,
      title: "Behind the Scenes: Our Manufacturing Process",
      excerpt: "Take a look at how we ensure quality in every product we make.",
      author: "Lisa Chen",
      date: "March 10, 2023",
      category: "Company",
      image: "https://images.unsplash.com/photo-1581091226033-d5c48150dbaa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
      slug: "behind-the-scenes-manufacturing"
    },
    {
      id: 4,
      title: "How to Style Your Home with Our Latest Collection",
      excerpt: "Tips and tricks for incorporating our new pieces into your living space.",
      author: "Alex Williams",
      date: "February 5, 2023",
      category: "Home Decor",
      image: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
      slug: "style-home-latest-collection"
    },
    {
      id: 5,
      title: "Meet the Designers Behind Our Exclusive Lines",
      excerpt: "Get to know the creative minds shaping our signature collections.",
      author: "Sarah Parker",
      date: "January 18, 2023",
      category: "Design",
      image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
      slug: "meet-the-designers"
    },
  ]);

  // Filter categories for the filter dropdown
  const categories = [...new Set(blogPosts.map(post => post.category))];

  return (
    <>
      <Helmet>
        <title>Blog | Sinosply</title>
        <meta name="description" content="Latest news, trends, and updates from Sinosply" />
      </Helmet>

      <HomeNavbar />

      <div className="container mx-auto px-4 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
            <div>
              <h1 className="text-3xl font-bold mb-2">Sinosply Blog</h1>
              <p className="text-gray-600">Insights, trends, and stories from our team</p>
            </div>
            
            <div className="mt-4 md:mt-0">
              <select 
                className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Featured Post */}
          <div className="mb-16">
            <Link to={`/blog/${blogPosts[0].slug}`} className="block group">
              <div className="relative rounded-lg overflow-hidden mb-6">
                <div className="aspect-w-16 aspect-h-9">
                  <img src={blogPosts[0].image} alt={blogPosts[0].title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                </div>
                <div className="absolute top-4 left-4 bg-black text-white px-3 py-1 text-sm font-medium rounded">
                  {blogPosts[0].category}
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2 group-hover:underline">{blogPosts[0].title}</h2>
              <p className="text-gray-600 mb-3">{blogPosts[0].excerpt}</p>
              <div className="flex items-center text-sm text-gray-500">
                <span>{blogPosts[0].author}</span>
                <span className="mx-2">•</span>
                <span>{blogPosts[0].date}</span>
              </div>
            </Link>
          </div>

          {/* Recent Posts Grid */}
          <h2 className="text-2xl font-bold mb-6">Recent Articles</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.slice(1).map(post => (
              <motion.div 
                key={post.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: post.id * 0.1 }}
                className="rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                <Link to={`/blog/${post.slug}`}>
                  <div className="aspect-w-16 aspect-h-10">
                    <img src={post.image} alt={post.title} className="w-full h-48 object-cover" />
                  </div>
                  <div className="p-5">
                    <div className="text-sm text-black font-medium mb-2">{post.category}</div>
                    <h3 className="text-xl font-bold mb-2 hover:underline">{post.title}</h3>
                    <p className="text-gray-600 mb-4 text-sm">{post.excerpt}</p>
                    <div className="flex items-center text-sm text-gray-500">
                      <span>{post.author}</span>
                      <span className="mx-2">•</span>
                      <span>{post.date}</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Newsletter Signup */}
          <div className="mt-16 bg-gray-100 rounded-lg p-8 text-center">
            <h3 className="text-xl font-bold mb-2">Subscribe to Our Newsletter</h3>
            <p className="text-gray-600 mb-4">Get the latest articles, news, and trends delivered to your inbox.</p>
            <form className="max-w-md mx-auto flex">
              <input 
                type="email" 
                placeholder="Your email address" 
                className="flex-1 px-4 py-2 rounded-l border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
              />
              <button 
                type="submit" 
                className="bg-black text-white px-6 py-2 rounded-r hover:bg-gray-800 transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </motion.div>
      </div>

      <Footer />
    </>
  );
};

export default BlogPage; 