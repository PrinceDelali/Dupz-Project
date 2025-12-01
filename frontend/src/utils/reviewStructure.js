/**
 * This file contains the correct JSX structure for the reviews section in ProductDetailsPage
 * It should be used as a reference for fixing structural issues
 */

const correctReviewsSection = () => (
  <div className="mt-8">
    {activeTab === 'reviews' && (
      <div>
        <div className="mb-8">
          {/* Review content... */}
          
          {/* Reviews list */}
          {reviewsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-8">
              {/* Review items... */}
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
              {/* Pagination buttons... */}
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
  </div>
);

export default correctReviewsSection; 