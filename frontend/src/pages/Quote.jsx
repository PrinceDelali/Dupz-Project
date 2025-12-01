import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaCheckCircle, 
  FaInfoCircle, 
  FaCloudUploadAlt, 
  FaTimes, 
  FaEye, 
  FaDownload, 
  FaFileAlt,
  FaFile,
  FaFilePdf,
  FaFileImage,
  FaFileWord,
  FaFileExcel,
  FaFilePowerpoint
} from 'react-icons/fa';
import HomeNavbar from '../components/HomeNavbar';
import Footer from '../components/Footer';
import '../styles/Home.css';
import useQuoteStore from '../store/quoteStore';

const Quote = () => {
  const { submitQuote, isLoading, error } = useQuoteStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    productType: '',
    quantity: '',
    description: '',
    targetPrice: '',
    deadline: '',
    additionalRequirements: ''
  });
  
  const [files, setFiles] = useState([]);
  const [formStatus, setFormStatus] = useState(null); // null, 'success', 'error'
  const [errors, setErrors] = useState({});
  const [previewFile, setPreviewFile] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // Function to get file icon based on type
  const getFileIcon = (file) => {
    const type = file.type;
    if (type.includes('pdf')) return <FaFilePdf className="text-red-500" />;
    if (type.includes('image')) return <FaFileImage className="text-blue-500" />;
    if (type.includes('word')) return <FaFileWord className="text-blue-700" />;
    if (type.includes('excel') || type.includes('spreadsheet')) return <FaFileExcel className="text-green-600" />;
    if (type.includes('presentation') || type.includes('powerpoint')) return <FaFilePowerpoint className="text-orange-500" />;
    return <FaFile className="text-gray-500" />;
  };
  
  // Function to check if file is previewable
  const isPreviewable = (file) => {
    const type = file.type;
    return type.includes('image') || 
           type.includes('pdf') || 
           type.includes('text');
  };
  
  // Function to open file preview
  const openFilePreview = (file) => {
    setPreviewFile(file);
    setShowPreviewModal(true);
  };
  
  // Function to close file preview
  const closeFilePreview = () => {
    setPreviewFile(null);
    setShowPreviewModal(false);
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear errors for this field when it's modified
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selectedFiles]);
  };
  
  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  // Drag and drop handlers
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  }, [isDragging]);
  
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles(prevFiles => [...prevFiles, ...Array.from(e.dataTransfer.files)]);
    }
  }, []);
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    
    if (!formData.productType.trim()) newErrors.productType = 'Product type is required';
    if (!formData.quantity.trim()) newErrors.quantity = 'Quantity is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Call the submitQuote function from the store with progress callback
      await submitQuote(formData, files, (progress) => {
        setUploadProgress(progress);
      });
      
      // Set success status
      setFormStatus('success');
      
      // Reset form data and files
      setFormData({
        name: '',
        email: '',
        company: '',
        phone: '',
        productType: '',
        quantity: '',
        description: '',
        targetPrice: '',
        deadline: '',
        additionalRequirements: ''
      });
      setFiles([]);
    } catch (error) {
      console.error('Error submitting quote:', error);
      setFormStatus('error');
    } finally {
      // Reset success/error message after 5 seconds
      setTimeout(() => {
        setFormStatus(null);
      }, 5000);
      
      setIsUploading(false);
    }
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  const uploadAreaVariants = {
    idle: {
      backgroundColor: "rgba(249, 250, 251, 1)",
      borderColor: "rgba(229, 231, 235, 1)"
    },
    dragging: {
      backgroundColor: "rgba(236, 253, 245, 1)",
      borderColor: "rgba(110, 231, 183, 1)",
      scale: 1.01,
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <HomeNavbar />
      
      {/* Header Section */}
      <div className="relative bg-gradient-to-r from-red-600 to-black pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute left-0 top-0 h-full w-1/2 bg-white/5 transform -skew-x-12"></div>
          <div className="absolute right-0 bottom-0 h-1/2 w-1/3 bg-white/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold text-white mb-4"
          >
            Request a Quote
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-red-100 max-w-3xl mx-auto text-lg"
          >
            Tell us what you're looking for and we'll connect you with the perfect suppliers from China
          </motion.p>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 -mt-10">
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          {formStatus === 'success' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-green-50 p-4 flex items-start border-l-4 border-green-500"
            >
              <FaCheckCircle className="text-green-500 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-green-800 font-medium">Quote Request Received!</h3>
                <p className="text-green-700 text-sm mt-1">We'll review your request and get back to you within 24 hours.</p>
              </div>
            </motion.div>
          )}
          
          {formStatus === 'error' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-50 p-4 flex items-start border-l-4 border-red-500"
            >
              <FaInfoCircle className="text-red-500 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-red-800 font-medium">Something went wrong</h3>
                <p className="text-red-700 text-sm mt-1">
                  {error || "Please try again or contact our support team directly."}
                </p>
              </div>
            </motion.div>
          )}
          
          <div className="p-6 md:p-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {/* Form Column */}
              <div className="md:col-span-2">
                <motion.form 
                  onSubmit={handleSubmit}
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-6"
                >
                  <motion.div variants={itemVariants}>
                    <h2 className="text-2xl font-bold mb-6 text-gray-900">
                      Your Information
                      <div className="h-1 w-20 bg-red-600 rounded-full mt-2"></div>
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                            errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
                        />
                        {errors.name && (
                          <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                        )}
                      </div>
                      
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                            errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
                        />
                        {errors.email && (
                          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                        )}
                      </div>
                      
                      <div>
                        <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                          Company Name
                        </label>
                        <input
                          type="text"
                          id="company"
                          name="company"
                          value={formData.company}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          required
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                            errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
                        />
                        {errors.phone && (
                          <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                  
                  <motion.div variants={itemVariants} className="pt-6">
                    <h2 className="text-2xl font-bold mb-6 text-gray-900">
                      Product Requirements
                      <div className="h-1 w-20 bg-red-600 rounded-full mt-2"></div>
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="productType" className="block text-sm font-medium text-gray-700 mb-1">
                          Product Type <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="text"
                          id="productType"
                          name="productType"
                          value={formData.productType}
                          onChange={handleChange}
                          placeholder="e.g. Furniture, Electronics, Clothing"
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                            errors.productType ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
                        />
                        {errors.productType && (
                          <p className="mt-1 text-sm text-red-600">{errors.productType}</p>
                        )}
                      </div>
                      
                      <div>
                        <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                          Quantity <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="text"
                          id="quantity"
                          name="quantity"
                          value={formData.quantity}
                          onChange={handleChange}
                          placeholder="e.g. 100 units, 1000 pieces"
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                            errors.quantity ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
                        />
                        {errors.quantity && (
                          <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
                        )}
                      </div>
                      
                      <div className="md:col-span-2">
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                          Product Description <span className="text-red-600">*</span>
                        </label>
                        <textarea
                          id="description"
                          name="description"
                          value={formData.description}
                          onChange={handleChange}
                          rows={4}
                          placeholder="Please provide as much detail as possible about the product you're looking for"
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                            errors.description ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
                        />
                        {errors.description && (
                          <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                        )}
                      </div>
                      
                      <div>
                        <label htmlFor="targetPrice" className="block text-sm font-medium text-gray-700 mb-1">
                          Target Price (Optional)
                        </label>
                        <input
                          type="text"
                          id="targetPrice"
                          name="targetPrice"
                          value={formData.targetPrice}
                          onChange={handleChange}
                          placeholder="e.g. $10-15 per unit"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">
                          Target Deadline (Optional)
                        </label>
                        <input
                          type="text"
                          id="deadline"
                          name="deadline"
                          value={formData.deadline}
                          onChange={handleChange}
                          placeholder="e.g. 2 months, end of Q3"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                        />
                      </div>
                    </div>
                  </motion.div>
                  
                  <motion.div variants={itemVariants} className="pt-6">
                    <h2 className="text-2xl font-bold mb-6 text-gray-900">
                      Additional Information
                      <div className="h-1 w-20 bg-red-600 rounded-full mt-2"></div>
                    </h2>
                    
                    <div className="space-y-6">
                      <div>
                        <label htmlFor="additionalRequirements" className="block text-sm font-medium text-gray-700 mb-1">
                          Additional Requirements (Optional)
                        </label>
                        <textarea
                          id="additionalRequirements"
                          name="additionalRequirements"
                          value={formData.additionalRequirements}
                          onChange={handleChange}
                          rows={3}
                          placeholder="Any specific certifications, packaging requirements, or other details"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Upload Files (Optional)
                        </label>
                        <motion.div 
                          className="relative cursor-pointer"
                          variants={uploadAreaVariants}
                          animate={isDragging ? "dragging" : "idle"}
                          onClick={() => document.getElementById('file-upload').click()}
                          onDragEnter={handleDragEnter}
                          onDragLeave={handleDragLeave}
                          onDragOver={handleDragOver}
                          onDrop={handleDrop}
                        >
                          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg transition-colors">
                            <div className="space-y-1 text-center">
                              <motion.div
                                animate={{
                                  y: isDragging ? [-10, 0, -10] : 0,
                                  transition: {
                                    y: {
                                      repeat: Infinity,
                                      duration: isDragging ? 1 : 0,
                                      ease: "easeInOut",
                                    },
                                  },
                                }}
                              >
                                <FaCloudUploadAlt className={`mx-auto h-12 w-12 ${isDragging ? 'text-green-500' : 'text-gray-400'}`} />
                              </motion.div>
                              <div className="flex text-sm text-gray-600">
                                <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-red-600 hover:text-red-500 focus-within:outline-none">
                                  <span>Upload files</span>
                                  <input
                                    id="file-upload"
                                    name="file-upload"
                                    type="file"
                                    className="sr-only"
                                    multiple
                                    onChange={handleFileChange}
                                  />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                              </div>
                              <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
                              
                              {isDragging && (
                                <motion.div 
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  className="text-sm font-medium text-green-600 mt-2"
                                >
                                  Drop files here to upload
                                </motion.div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                        
                        <AnimatePresence>
                          {files.length > 0 && (
                            <motion.ul 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-3 divide-y divide-gray-200 border border-gray-200 rounded-lg"
                            >
                              {files.map((file, index) => (
                                <motion.li 
                                  key={index} 
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: 20 }}
                                  transition={{ duration: 0.2 }}
                                  className="flex items-center justify-between py-3 px-4 text-sm"
                                >
                                  <div className="flex items-center">
                                    {getFileIcon(file)}
                                    <span className="truncate max-w-xs ml-2">{file.name}</span>
                                    <span className="ml-2 text-gray-500 text-xs">({(file.size / 1024).toFixed(1)} KB)</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    {isPreviewable(file) && (
                                      <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        type="button"
                                        onClick={() => openFilePreview(file)}
                                        className="text-blue-600 hover:text-blue-800"
                                        title="Preview"
                                      >
                                        <FaEye />
                                      </motion.button>
                                    )}
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.95 }}
                                      type="button"
                                      onClick={() => removeFile(index)}
                                      className="text-red-600 hover:text-red-800"
                                      title="Remove"
                                    >
                                      <FaTimes />
                                    </motion.button>
                                  </div>
                                </motion.li>
                              ))}
                            </motion.ul>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                  
                  <motion.div variants={itemVariants} className="pt-6">
                    {isUploading && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Uploading Files: {uploadProgress}%
                        </label>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <motion.div 
                            className="bg-red-600 h-2.5 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${uploadProgress}%` }}
                            transition={{ duration: 0.2 }}
                          />
                        </div>
                      </div>
                    )}

                    <motion.button
                      type="submit"
                      disabled={isLoading || isUploading}
                      whileHover={{ y: -4, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" }}
                      whileTap={{ y: 0 }}
                      className={`w-full py-3 px-6 bg-gradient-to-r from-red-600 to-black text-white rounded-lg transition-all ${
                        isLoading || isUploading ? 'opacity-75 cursor-not-allowed' : ''
                      }`}
                    >
                      {isLoading || isUploading ? 'Submitting...' : 'Submit Quote Request'}
                    </motion.button>
                    <p className="text-sm text-gray-500 mt-3 text-center">
                      We typically respond to quote requests within 24 hours on business days.
                    </p>
                  </motion.div>
                </motion.form>
              </div>
              
              {/* Information Column */}
              <motion.div 
                variants={itemVariants}
                className="bg-gray-50 rounded-xl p-6 h-fit sticky top-20"
              >
                <h3 className="text-xl font-bold mb-4 text-gray-900">
                  How It Works
                  <div className="h-1 w-16 bg-red-600 rounded-full mt-2"></div>
                </h3>
                
                <ol className="space-y-6 mt-6">
                  <li className="flex">
                    <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600 font-bold mr-3">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Submit Your Request</h4>
                      <p className="mt-1 text-sm text-gray-500">Fill out the form with your product requirements and specifications.</p>
                    </div>
                  </li>
                  
                  <li className="flex">
                    <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600 font-bold mr-3">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Get Matched</h4>
                      <p className="mt-1 text-sm text-gray-500">Our team matches your request with qualified suppliers in China.</p>
                    </div>
                  </li>
                  
                  <li className="flex">
                    <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600 font-bold mr-3">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Receive Quotes</h4>
                      <p className="mt-1 text-sm text-gray-500">We'll send you detailed quotes from our verified suppliers.</p>
                    </div>
                  </li>
                  
                  <li className="flex">
                    <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600 font-bold mr-3">
                      4
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Place Your Order</h4>
                      <p className="mt-1 text-sm text-gray-500">Select the best supplier and we'll handle the rest of the process.</p>
                    </div>
                  </li>
                </ol>
                
                <div className="mt-8 p-4 bg-red-50 rounded-lg border border-red-100">
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <FaInfoCircle className="text-red-600 mr-2" />
                    Need Help?
                  </h4>
                  <p className="mt-2 text-sm text-gray-600">
                    If you have questions about our sourcing process, please contact our support team.
                  </p>
                  <a 
                    href="mailto:support@sinosply.com" 
                    className="mt-3 inline-block text-sm font-medium text-red-600 hover:text-red-800"
                  >
                    support@sinosply.com
                  </a>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
      
      {/* File Preview Modal */}
      <AnimatePresence>
        {showPreviewModal && previewFile && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-medium text-gray-900 truncate max-w-[400px]">
                  {previewFile.name}
                </h3>
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={closeFilePreview}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <FaTimes className="w-5 h-5" />
                </motion.button>
              </div>
              
              <div className="flex-1 overflow-auto bg-gray-100 p-4 flex items-center justify-center">
                {previewFile.type.includes('image') ? (
                  <img 
                    src={URL.createObjectURL(previewFile)} 
                    alt={previewFile.name}
                    className="max-w-full max-h-[70vh] object-contain"
                  />
                ) : previewFile.type.includes('pdf') ? (
                  <iframe
                    src={URL.createObjectURL(previewFile) + '#view=FitH'}
                    title={previewFile.name}
                    className="w-full h-[70vh]"
                  />
                ) : (
                  <div className="text-center p-8 bg-white rounded shadow-inner">
                    <FaFileAlt className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-700">This file type cannot be previewed.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <Footer />
    </div>
  );
};

export default Quote; 