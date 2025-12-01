import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import HomeNavbar from '../components/HomeNavbar';
import Footer from '../components/Footer';
import { 
  FaSearch, 
  FaRobot, 
  FaExternalLinkAlt, 
  FaInfoCircle, 
  FaStar, 
  FaExclamationTriangle, 
  FaLightbulb, 
  FaListAlt,
  FaBullseye
} from 'react-icons/fa';
import apiConfig from '../config/apiConfig';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');
  const isAISearch = searchParams.get('ai') === 'true';

  const [results, setResults] = useState([]);
  const [aiResults, setAiResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedItemIndex, setExpandedItemIndex] = useState(null);

  useEffect(() => {
    if (!query) return;

    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      setExpandedItemIndex(null);

      try {
        // Regular search request
        const searchResponse = await axios.get(`${apiConfig.baseURL}/search?query=${encodeURIComponent(query)}`);
        setResults(searchResponse.data.results || []);

        // AI search request (if enabled)
        if (isAISearch) {
          const aiSearchResponse = await axios.get(`${apiConfig.baseURL}/search/ai?query=${encodeURIComponent(query)}`);
          setAiResults(aiSearchResponse.data);
        }
      } catch (error) {
        console.error('Search error:', error);
        setError('An error occurred while fetching search results. Please try again later.');
        
        // Fallback mock data for development
        setResults(getMockSearchResults(query));
        if (isAISearch) {
          setAiResults(getMockAIResults(query));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query, isAISearch]);

  // Toggle expanded state for analysis items
  const toggleExpand = (index) => {
    if (expandedItemIndex === index) {
      setExpandedItemIndex(null);
    } else {
      setExpandedItemIndex(index);
    }
  };

  // Helper function to get relevance class
  const getRelevanceClass = (relevance) => {
    switch (relevance) {
      case 'Very High':
        return 'bg-emerald-100 text-emerald-800';
      case 'High':
        return 'bg-green-100 text-green-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Fallback mock data for development
  const getMockSearchResults = (query) => {
    return [
      {
        id: '1',
        title: 'Bamboo Furniture Collection',
        description: 'Sustainable and eco-friendly bamboo furniture for modern homes. Our bamboo collection features chairs, tables, and storage solutions.',
        type: 'product',
        category: 'Furniture',
        image: 'https://images.unsplash.com/photo-1540638349517-3abd5afc5847?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80',
        url: '/products/bamboo'
      },
      {
        id: '2',
        title: 'Sourcing Services',
        description: 'We connect you with verified manufacturers in China, ensuring quality products at competitive prices.',
        type: 'page',
        image: 'https://images.unsplash.com/photo-1553413077-190dd305871c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&q=80',
        url: '/services'
      },
      {
        id: '3',
        title: 'Smart Home Gadgets',
        description: 'Cutting-edge smart home technology to simplify and enhance your lifestyle.',
        type: 'product',
        category: 'Electronics',
        image: 'https://images.unsplash.com/photo-1546054454-aa26e2b734c7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80',
        url: '/products/gadgets'
      }
    ].filter(item => 
      item.title.toLowerCase().includes(query.toLowerCase()) || 
      item.description.toLowerCase().includes(query.toLowerCase())
    );
  };

  const getMockAIResults = (query) => {
    return {
      summary: `Here are the search results for "${query}" on Sinosply. I found comprehensive information related to furniture, sourcing services, and smart home gadgets that align with your search criteria.`,
      analysis: [
        {
          title: 'Bamboo Furniture Collection',
          relevance: 'Very High',
          highlights: [
            'Sustainable and eco-friendly bamboo furniture',
            'Modern design aesthetic with natural materials',
            'Includes chairs, tables, and storage options',
            'Bamboo is renewable and has a lower environmental impact'
          ],
          keywordRelevance: {
            "furniture": "Direct match to bamboo furniture products",
            "sustainable": "Products are made with renewable bamboo material",
            "eco-friendly": "Low environmental impact compared to traditional materials"
          },
          context: 'This product collection aligns with eco-friendly home decor trends. The bamboo material is renewable and durable, making it ideal for environmentally conscious consumers.',
          recommendation: 'If you\'re looking for sustainable furniture options with modern design elements, this bamboo collection offers excellent value and environmental benefits.'
        },
        {
          title: 'Sourcing Services',
          relevance: 'High',
          highlights: [
            'Connects you with verified Chinese manufacturers',
            'Quality assurance and competitive pricing',
            'End-to-end sourcing solutions',
            'Factory audits and production monitoring available'
          ],
          keywordRelevance: {
            "sourcing": "Direct match to our core business services",
            "manufacturing": "We connect clients with verified manufacturers",
            "quality": "We provide quality assurance services"
          },
          context: 'Sinosply specializes in direct factory connections for businesses looking to source products from China. Our services include quality control, logistics, and financial solutions.',
          recommendation: 'Consider exploring these services if you need help with product procurement or manufacturing in China, especially if quality control is important to your business.'
        },
        {
          title: 'Smart Home Gadgets',
          relevance: 'Medium',
          highlights: [
            'Cutting-edge technology for modern homes',
            'Enhances lifestyle through automation',
            'Various smart home categories available',
            'Competitive pricing on high-quality electronics'
          ],
          keywordRelevance: {
            "gadgets": "Direct match to our smart home products",
            "technology": "Products feature cutting-edge tech features",
            "home": "Designed specifically for residential use"
          },
          context: 'Smart home technology is a growing sector with increasing consumer adoption. Our curated selection meets high quality standards.',
          recommendation: 'These products could complement a modern home aesthetic, especially if you\'re interested in home automation and convenience features.'
        }
      ],
      relatedQueries: [
        'sustainable furniture options',
        'bamboo vs wood furniture',
        'china manufacturers quality control',
        'smart home starter kit',
        'eco-friendly home products',
        'verified Chinese suppliers'
      ],
      missedKeywordsAnalysis: {
        missedKeywords: ["shipping", "logistics"],
        recommendation: "Consider adding 'shipping' or 'logistics' to your search to find information about our delivery and transportation services."
      }
    };
  };

  return (
    <div className="min-h-screen bg-white">
      <HomeNavbar />
      
      {/* Header Section */}
      <section className="relative pt-32 pb-16 bg-gradient-to-r from-red-600 to-black">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute left-0 top-0 h-full w-1/2 bg-white/5 transform -skew-x-12"></div>
          <div className="absolute right-0 bottom-0 h-1/2 w-1/3 bg-white/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold text-white mb-4 flex items-center justify-center"
          >
            <FaSearch className="mr-3" /> Search Results
            {isAISearch && <FaRobot className="ml-3 text-3xl" />}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-red-100 max-w-3xl mx-auto text-lg mb-8"
          >
            {isAISearch 
              ? `AI-powered search results for "${query}"`
              : `Search results for "${query}"`
            }
          </motion.p>
        </div>
      </section>
      
      {/* Main Content Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-600 mb-4"></div>
              <p className="text-gray-600">
                {isAISearch ? 'Our AI is analyzing your search...' : 'Fetching results...'}
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <FaInfoCircle className="text-red-500 text-4xl mb-4 mx-auto" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
              <p className="text-gray-600 max-w-lg mx-auto">{error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Results Column */}
              <div className={`${isAISearch ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Found {results.length} Results</h2>
                
                {results.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <p className="text-gray-600 mb-4">No results found for your search query.</p>
                    <p className="text-gray-500">Try using different keywords or check for typos.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {results.map((result) => (
                      <motion.div 
                        key={result.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 flex flex-col md:flex-row"
                      >
                        {result.image && (
                          <div className="md:w-1/3 h-48 md:h-auto overflow-hidden">
                            <img 
                              src={result.image} 
                              alt={result.title} 
                              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                            />
                          </div>
                        )}
                        <div className="p-6 md:w-2/3 flex flex-col h-full">
                          <div className="mb-2 flex justify-between items-start">
                            <div>
                              <span className={`text-xs font-medium px-2 py-1 rounded ${
                                result.type === 'product' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {result.type === 'product' ? `Product${result.category ? `: ${result.category}` : ''}` : 'Page'}
                              </span>
                            </div>
                          </div>
                          <h3 className="text-xl font-bold mb-2 text-gray-900">{result.title}</h3>
                          <p className="text-gray-600 mb-4 flex-grow">{result.description}</p>
                          <div className="mt-auto">
                            <Link 
                              to={result.url}
                              className="inline-flex items-center text-red-600 hover:text-red-800 transition-colors font-medium"
                            >
                              View {result.type === 'product' ? 'Product' : 'Page'}
                              <FaExternalLinkAlt className="ml-1 text-sm" />
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* AI Analysis Column */}
              {isAISearch && aiResults && (
                <div className="lg:col-span-1">
                  <div className="bg-gray-50 rounded-xl p-6 sticky top-24 max-h-[85vh] overflow-y-auto">
                    <div className="flex items-center mb-4">
                      <FaRobot className="text-red-600 mr-2 text-xl" />
                      <h2 className="text-xl font-bold text-gray-900">AI Analysis</h2>
                    </div>
                    
                    <div className="mb-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
                        <FaStar className="text-yellow-500 mr-2" /> Summary
                      </h3>
                      <p className="text-gray-600 text-sm">{aiResults.summary}</p>
                    </div>
                    
                    <div className="mb-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
                        <FaListAlt className="text-blue-500 mr-2" /> Detailed Analysis
                      </h3>
                      <div className="space-y-4">
                        {aiResults.analysis.map((item, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                            <div 
                              className="flex justify-between items-center p-3 bg-white cursor-pointer"
                              onClick={() => toggleExpand(index)}
                            >
                              <h4 className="font-medium text-gray-900">{item.title}</h4>
                              <span className={`text-xs font-medium px-2 py-1 rounded ${getRelevanceClass(item.relevance)}`}>
                                {item.relevance} Relevance
                              </span>
                            </div>
                            
                            <div className={`transition-all duration-300 ${expandedItemIndex === index ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                              <div className="p-3 bg-gray-50 border-t border-gray-200">
                                <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                  <FaBullseye className="text-green-500 mr-2" /> Key Highlights
                                </h5>
                                <ul className="text-sm text-gray-600 mb-3 list-disc pl-5 space-y-1">
                                  {item.highlights.map((highlight, i) => (
                                    <li key={i}>{highlight}</li>
                                  ))}
                                </ul>

                                {item.keywordRelevance && (
                                  <>
                                    <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center mt-4">
                                      <FaSearch className="text-indigo-500 mr-2" /> Keyword Relevance
                                    </h5>
                                    <div className="space-y-2">
                                      {Object.entries(item.keywordRelevance).map(([keyword, explanation], i) => (
                                        <div key={i} className="text-xs">
                                          <span className="font-medium text-indigo-600">"{keyword}"</span>: <span className="text-gray-600">{explanation}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </>
                                )}
                                
                                <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center mt-4">
                                  <FaInfoCircle className="text-blue-500 mr-2" /> Context
                                </h5>
                                <p className="text-xs text-gray-600 mb-3">{item.context}</p>
                                
                                <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                  <FaLightbulb className="text-yellow-500 mr-2" /> Recommendation
                                </h5>
                                <p className="text-xs text-gray-600">{item.recommendation}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {aiResults.relatedQueries && aiResults.relatedQueries.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
                          <FaSearch className="text-purple-500 mr-2" /> Related Searches
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {aiResults.relatedQueries.map((relatedQuery, index) => (
                            <Link 
                              key={index}
                              to={`/search?q=${encodeURIComponent(relatedQuery)}&ai=true`}
                              className="text-sm bg-white px-3 py-1 rounded-full border border-gray-200 hover:bg-gray-100 transition-colors"
                            >
                              {relatedQuery}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {aiResults.missedKeywordsAnalysis && (
                      <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-800 mb-2 flex items-center">
                          <FaExclamationTriangle className="text-yellow-500 mr-2" /> Missed Keywords
                        </h3>
                        
                        {aiResults.missedKeywordsAnalysis.missedKeywords && 
                         aiResults.missedKeywordsAnalysis.missedKeywords.length > 0 ? (
                          <>
                            <p className="text-xs text-gray-600 mb-2">Some keywords had limited or no matching content:</p>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {aiResults.missedKeywordsAnalysis.missedKeywords.map((keyword, i) => (
                                <span key={i} className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          </>
                        ) : (
                          <p className="text-xs text-gray-600 mb-2">All keywords in your search were addressed.</p>
                        )}
                        
                        {aiResults.missedKeywordsAnalysis.recommendation && (
                          <p className="text-xs text-gray-700 mt-1">{aiResults.missedKeywordsAnalysis.recommendation}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default SearchResults; 