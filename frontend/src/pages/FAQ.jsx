import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Search, HelpCircle } from 'lucide-react';

const FAQ = () => {
    const [activeIndex, setActiveIndex] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');

    const categories = [
        'All', 'General', 'Account', 'Shipping', 'Payments', 'Support'
    ];

    const faqs = [
        // General Category
        {
            question: 'What is Sinosply?',
            answer: 'Sinosply is a comprehensive digital platform offering e-commerce solutions, digital marketing tools, and customer engagement services to help businesses thrive in the digital ecosystem.',
            category: 'General'
        },
        {
            question: 'Who can use Sinosply?',
            answer: 'Sinosply is designed for businesses of all sizes, from startups to large enterprises, across various industries looking to enhance their digital presence and e-commerce capabilities.',
            category: 'General'
        },
        {
            question: 'What regions do you serve?',
            answer: 'We currently serve businesses globally, with a strong presence in North America, Europe, and Asia. Our platform supports multiple languages and currencies.',
            category: 'General'
        },
        {
            question: 'How often are platform features updated?',
            answer: 'We continuously improve our platform, with major feature updates released quarterly and minor improvements implemented monthly based on user feedback and technological advancements.',
            category: 'General'
        },

        // Account Category
        {
            question: 'How can I reset my password?',
            answer: 'You can reset your password by clicking the "Forgot Password" link on the login page. Follow the email instructions to create a new secure password.',
            category: 'Account'
        },
        {
            question: 'How do I create an account?',
            answer: 'Visit our website and click "Sign Up". You can register using your email, Google account, or LinkedIn. Complete the profile setup with your business details.',
            category: 'Account'
        },
        {
            question: 'What security measures protect my data?',
            answer: 'We use 256-bit SSL encryption, two-factor authentication, and comply with international data protection regulations to ensure your personal and financial information remains secure.',
            category: 'Account'
        },
        {
            question: 'Can I have multiple user roles?',
            answer: 'Yes, our platform supports multiple user roles with different access levels. Administrators can assign and manage roles like Manager, Editor, and Viewer.',
            category: 'Account'
        },

        // Shipping Category
        {
            question: 'Do you offer international shipping?',
            answer: 'Yes! We provide international shipping to over 50 countries. Shipping costs and delivery times vary by destination. Check our detailed Shipping Information page for specifics.',
            category: 'Shipping'
        },
        {
            question: 'What are your shipping timeframes?',
            answer: 'Domestic shipping typically takes 3-5 business days. International shipping ranges from 7-14 business days depending on the destination and customs processing.',
            category: 'Shipping'
        },
        {
            question: 'How can I track my order?',
            answer: 'Track your order using the unique tracking number from your confirmation email. Enter it on our dedicated Order Tracking page for real-time shipment updates.',
            category: 'Shipping'
        },
        {
            question: 'Do you offer expedited shipping?',
            answer: 'Yes, we offer expedited shipping options for an additional fee. Choose from 2-day or overnight shipping during checkout.',
            category: 'Shipping'
        },

        // Payments Category
        {
            question: 'What payment methods do you accept?',
            answer: 'We accept multiple payment options including major credit cards (Visa, MasterCard, American Express), PayPal, Apple Pay, and bank transfers.',
            category: 'Payments'
        },
        {
            question: 'Are there bulk purchase discounts?',
            answer: 'We offer customized pricing for bulk orders. Contact our sales team at sales@sinosply.com to discuss your specific requirements and potential volume discounts.',
            category: 'Payments'
        },
        {
            question: 'Is my payment information secure?',
            answer: 'We use PCI DSS compliant payment gateways and never store complete credit card details on our servers. All transactions are encrypted.',
            category: 'Payments'
        },
        {
            question: 'Do you offer payment plans?',
            answer: 'For eligible business customers, we offer flexible payment plans and financing options. Contact our sales team for more information.',
            category: 'Payments'
        },

        // Support Category
        {
            question: 'How can I contact customer support?',
            answer: 'Reach our support team via email (support@sinosply.com), phone (1-800-555-0199), or live chat. We\'re available Monday-Friday, 9 AM to 5 PM EST.',
            category: 'Support'
        },
        {
            question: 'What is your return policy?',
            answer: 'We offer a 30-day hassle-free return policy. Items must be unused, in original packaging. Initiate returns through our online Returns Center with a few simple steps.',
            category: 'Support'
        },
        {
            question: 'Can I change my order after placement?',
            answer: 'Order modifications are possible within 2 hours of placement. After that, you may need to cancel and place a new order. Contact customer support for assistance.',
            category: 'Support'
        },
        {
            question: 'Do you offer technical support?',
            answer: 'Yes, we provide technical support for platform-related issues. Our technical team can be reached via a dedicated support ticket system or during business hours.',
            category: 'Support'
        }
    ];

    const toggleFAQ = (index) => {
        setActiveIndex(activeIndex === index ? null : index);
    };

    const filteredFAQs = faqs.filter(faq => 
        (categoryFilter === 'All' || faq.category === categoryFilter) &&
        faq.question.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bg-gray-50 min-h-screen p-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 flex items-center justify-center gap-3">
                        <HelpCircle size={40} className="text-blue-500" />
                        Frequently Asked Questions
                    </h1>
                    <p className="text-gray-600 mt-2">Find answers to our most common questions</p>
                </div>

                <div className="mb-6 flex items-center space-x-4">
                    <div className="relative flex-grow">
                        <input 
                            type="text" 
                            placeholder="Search questions..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
                    </div>
                </div>

                <div className="flex justify-center space-x-2 mb-6">
                    {categories.map(category => (
                        <button 
                            key={category}
                            onClick={() => setCategoryFilter(category)}
                            className={`px-4 py-2 rounded-full text-sm transition-colors ${
                                categoryFilter === category 
                                    ? 'bg-blue-500 text-white' 
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {filteredFAQs.length === 0 ? (
                    <div className="text-center text-gray-500">
                        No FAQs found matching your search
                    </div>
                ) : (
                    filteredFAQs.map((faq, index) => (
                        <div 
                            key={index} 
                            className={`bg-white border border-gray-200 rounded-lg mb-4 overflow-hidden transition-shadow hover:shadow-md ${
                                activeIndex === index ? 'shadow-lg' : ''
                            }`}
                        >
                            <div 
                                className={`p-4 flex justify-between items-center cursor-pointer ${
                                    activeIndex === index ? 'bg-blue-50' : 'hover:bg-gray-50'
                                }`}
                                onClick={() => toggleFAQ(index)}
                            >
                                <h2 className="text-lg font-semibold text-gray-800">{faq.question}</h2>
                                {activeIndex === index ? (
                                    <ChevronUp className="text-blue-500" />
                                ) : (
                                    <ChevronDown className="text-gray-500" />
                                )}
                            </div>
                            {activeIndex === index && (
                                <div className="p-4 bg-white border-t border-gray-200 text-gray-700">
                                    {faq.answer}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default FAQ;