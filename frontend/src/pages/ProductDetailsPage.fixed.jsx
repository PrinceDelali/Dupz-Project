// This is a fixed version of the reviews section JSX structure
            {activeTab === 'reviews' && (
              <div>
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-gray-900">Customer Reviews</h3>
                  <div className="flex items-center mt-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < Math.floor(getReviewStats().avgRating || 0) 
                              ? 'text-yellow-400 fill-current' 
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="ml-3 text-sm text-gray-500">Based on {getReviewStats().reviewCount || 0} reviews</span>
                  </div>
                  
                  {/* Rating distribution */}
                  {getReviewStats().ratingDistribution && (
                    <div className="mb-6 space-y-2">
                      {[5, 4, 3, 2, 1].map(rating => {
                        const count = getReviewStats().ratingDistribution[rating] || 0;
                        const percentage = getReviewStats().reviewCount > 0 
                          ? Math.round((count / getReviewStats().reviewCount) * 100) 
                          : 0;
                        
                        return (
                          <div key={rating} className="flex items-center">
                            <span className="w-12 text-sm text-gray-600">{rating} star</span>
                            <div className="flex-1 mx-3 h-2.5 rounded-full bg-gray-200">
                              <div 
                                className="h-2.5 rounded-full bg-yellow-400" 
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="w-12 text-sm text-gray-500">{percentage}%</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Sort controls */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <label htmlFor="review-sort" className="text-sm font-medium text-gray-700 mr-2">
                        Sort by:
                      </label>
                      <select
                        id="review-sort"
                        className="text-sm border-gray-300 rounded-md focus:ring-black focus:border-black"
                        value={reviewSortBy}
                        onChange={(e) => handleReviewSortChange(e.target.value)}
                      >
                        <option value="newest">Newest</option>
                        <option value="oldest">Oldest</option>
                        <option value="highest">Highest Rating</option>
                        <option value="lowest">Lowest Rating</option>
                        <option value="helpful">Most Helpful</option>
                      </select>
                    </div>
                    
                    {/* Write review button (for non-mobile) */}
                    {isAuthenticated && (
                      <button
                        type="button"
                        className="hidden sm:flex items-center text-sm font-medium text-white bg-black px-4 py-2 rounded-md hover:bg-gray-800"
                        onClick={() => document.getElementById('write-review-section').scrollIntoView({ behavior: 'smooth' })}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Write a Review
                      </button>
                    )}
                  </div>
                  
                  {/* Reviews list */}
                  {reviewsLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
                    </div>
                  ) : reviews.length > 0 ? (
                    <div className="space-y-8">
                      {reviews.map((review) => {
                        const isExpanded = expandedReviews.includes(review._id);
                        const hasLongText = review.comment.length > 300;
                        const displayText = !hasLongText || isExpanded 
                          ? review.comment 
                          : `${review.comment.substring(0, 300)}...`;
                        
                        return (
                          <div key={review._id} className="border-b border-gray-200 pb-8">
                            {/* Review content... */}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <MessageCircle className="mx-auto h-10 w-10 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No reviews yet</h3>
                      <p className="mt-1 text-sm text-gray-500">Be the first to share your thoughts on this product</p>
                    </div>
                  )}
                  
                  {/* Pagination */}
                  {totalReviewPages > 1 && (
                    <div className="mt-6 flex justify-center">
                      {/* Pagination controls */}
                    </div>
                  )}
                  
                  {/* Write a review section */}
                  <div id="write-review-section" className="mt-12 bg-gray-50 p-4 sm:p-6 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Share Your Thoughts</h3>
                    
                    {isAuthenticated ? (
                      <form onSubmit={handleSubmitReview}>
                        {/* Form fields... */}
                      </form>
                    ) : (
                      <div className="bg-blue-50 p-4 rounded-lg flex items-start">
                        <AlertTriangle className="text-blue-500 w-5 h-5 mt-0.5 mr-2 flex-shrink-0" />
                        <div>
                          <p className="text-blue-700 text-sm">
                            You need to be logged in to write a review.
                          </p>
                          <button
                            onClick={() => navigate('/login')}
                            className="mt-2 text-sm text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded"
                          >
                            Log In
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )} 