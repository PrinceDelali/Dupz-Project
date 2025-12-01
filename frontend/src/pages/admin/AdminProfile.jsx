import { useState, useEffect } from 'react';
import { FaUser, FaEnvelope, FaEdit, FaKey, FaCheck, FaSearch, FaTimes, FaInfoCircle, FaEye, FaEyeSlash } from 'react-icons/fa';
import axios from 'axios';
import Sidebar from '../../components/admin/Sidebar';
import LoadingOverlay from '../../components/LoadingOverlay';
import apiConfig from '../../config/apiConfig';

const AdminProfile = () => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false
  });
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    fetchAdminProfile();
  }, []);

  const fetchAdminProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiConfig.baseURL}/admin/profile`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const adminData = response.data.data;
      setUser(adminData);
      setFormData({
        firstName: adminData.firstName || '',
        lastName: adminData.lastName || '',
        email: adminData.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Error fetching admin profile:', error);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Update password strength when newPassword changes
    if (name === 'newPassword') {
      checkPasswordStrength(value);
      
      // Check if passwords match
      if (formData.confirmPassword) {
        setPasswordsMatch(value === formData.confirmPassword);
      }
    }
    
    // Check if passwords match when confirmPassword changes
    if (name === 'confirmPassword') {
      setPasswordsMatch(value === formData.newPassword);
    }
  };

  const checkPasswordStrength = (password) => {
    const hasMinLength = password.length >= 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    // Calculate score based on criteria (0-4)
    let score = 0;
    if (hasMinLength) score++;
    if (hasUpperCase) score++;
    if (hasLowerCase) score++;
    if (hasNumber) score++;
    if (hasSpecialChar) score++;
    
    // Normalize score to 0-4 range
    score = Math.min(4, Math.floor(score * 0.8));
    
    setPasswordStrength({
      score,
      hasMinLength,
      hasUpperCase,
      hasLowerCase,
      hasNumber,
      hasSpecialChar
    });
  };

  // Get color for password strength meter
  const getStrengthColor = () => {
    const { score } = passwordStrength;
    if (score <= 1) return 'bg-red-500';
    if (score === 2) return 'bg-yellow-500';
    if (score === 3) return 'bg-yellow-400';
    if (score >= 4) return 'bg-green-500';
    return 'bg-gray-200';
  };

  // Get text description for password strength
  const getStrengthText = () => {
    const { score } = passwordStrength;
    if (score === 0) return 'Very Weak';
    if (score === 1) return 'Weak';
    if (score === 2) return 'Fair';
    if (score === 3) return 'Good';
    if (score >= 4) return 'Strong';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await axios.put(`${apiConfig.baseURL}/admin/profile`, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setUser(response.data.data);
      setSuccess('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    // Password validation
    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    // Check password strength
    const hasUpperCase = /[A-Z]/.test(formData.newPassword);
    const hasLowerCase = /[a-z]/.test(formData.newPassword);
    const hasNumbers = /\d/.test(formData.newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword);
    
    if (!(hasUpperCase && hasLowerCase && (hasNumbers || hasSpecialChar))) {
      setError('Password must contain uppercase, lowercase, and at least one number or special character');
      setLoading(false);
      return;
    }

    try {
      // Fixed endpoint to match backend route
      await axios.put(`${apiConfig.baseURL}/admin/update-password`, {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setSuccess('Password updated successfully');
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (error) {
      console.error('Error updating password:', error);
      setError(error.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        {loading && <LoadingOverlay />}
        
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                <FaSearch />
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white">
                {user?.firstName?.charAt(0) || 'A'}
              </div>
            </div>
          </div>
          
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded flex items-center">
              <FaCheck className="mr-2" />
              {success}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Profile Information */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-lg font-medium">Profile Information</h2>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center text-purple-600 hover:text-purple-800"
                >
                  <FaEdit className="mr-1" />
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
              </div>
              
              <div className="p-6">
                {isEditing ? (
                  <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                          First Name
                        </label>
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name
                        </label>
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          required
                        />
                      </div>
                      
                      <div className="pt-4">
                        <button
                          type="submit"
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <FaUser className="text-gray-400 mr-3" />
                      <div>
                        <p className="text-xs text-gray-500">Name</p>
                        <p className="font-medium">
                          {user?.firstName} {user?.lastName}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <FaEnvelope className="text-gray-400 mr-3" />
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="font-medium">{user?.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="text-gray-400 mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Joined</p>
                        <p className="font-medium">
                          {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Password Management */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-lg font-medium">Change Password</h2>
              </div>
              
              <div className="p-6">
                <form onSubmit={handlePasswordChange}>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          id="currentPassword"
                          name="currentPassword"
                          value={formData.currentPassword}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 pr-10"
                          required
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? (
                            <FaEyeSlash className="text-gray-500" />
                          ) : (
                            <FaEye className="text-gray-500" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          id="newPassword"
                          name="newPassword"
                          value={formData.newPassword}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 pr-10"
                          required
                          minLength="6"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? (
                            <FaEyeSlash className="text-gray-500" />
                          ) : (
                            <FaEye className="text-gray-500" />
                          )}
                        </button>
                      </div>
                      
                      {/* Password strength meter */}
                      {formData.newPassword && (
                        <div className="mt-2">
                          <div className="flex items-center mb-1">
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                              <div 
                                className={`h-2.5 rounded-full ${getStrengthColor()}`} 
                                style={{ width: `${passwordStrength.score * 25}%` }}
                              ></div>
                            </div>
                            <span className="text-xs">{getStrengthText()}</span>
                          </div>
                          
                          {/* Password requirements */}
                          <div className="text-xs text-gray-600 space-y-1 mt-2">
                            <div className="flex items-center">
                              {passwordStrength.hasMinLength ? 
                                <FaCheck className="text-green-500 mr-1" /> : 
                                <FaTimes className="text-red-500 mr-1" />}
                              At least 6 characters
                            </div>
                            <div className="flex items-center">
                              {passwordStrength.hasUpperCase ? 
                                <FaCheck className="text-green-500 mr-1" /> : 
                                <FaTimes className="text-red-500 mr-1" />}
                              Uppercase letter
                            </div>
                            <div className="flex items-center">
                              {passwordStrength.hasLowerCase ? 
                                <FaCheck className="text-green-500 mr-1" /> : 
                                <FaTimes className="text-red-500 mr-1" />}
                              Lowercase letter
                            </div>
                            <div className="flex items-center">
                              {passwordStrength.hasNumber ? 
                                <FaCheck className="text-green-500 mr-1" /> : 
                                <FaTimes className="text-red-500 mr-1" />}
                              Number
                            </div>
                            <div className="flex items-center">
                              {passwordStrength.hasSpecialChar ? 
                                <FaCheck className="text-green-500 mr-1" /> : 
                                <FaTimes className="text-red-500 mr-1" />}
                              Special character
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          id="confirmPassword"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 pr-10 ${
                            formData.confirmPassword && !passwordsMatch 
                              ? 'border-red-500' 
                              : formData.confirmPassword && passwordsMatch
                                ? 'border-green-500'
                                : 'border-gray-300'
                          }`}
                          required
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <FaEyeSlash className="text-gray-500" />
                          ) : (
                            <FaEye className="text-gray-500" />
                          )}
                        </button>
                      </div>
                      {formData.confirmPassword && (
                        <div className="mt-1 text-xs flex items-center">
                          {passwordsMatch ? (
                            <>
                              <FaCheck className="text-green-500 mr-1" />
                              <span className="text-green-500">Passwords match</span>
                            </>
                          ) : (
                            <>
                              <FaTimes className="text-red-500 mr-1" />
                              <span className="text-red-500">Passwords do not match</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="pt-4">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center"
                      >
                        <FaKey className="mr-2" />
                        Update Password
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile; 