import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaEnvelope, FaLock } from 'react-icons/fa';
import LoadingOverlay from './LoadingOverlay';
import apiConfig from '../config/apiConfig';
import { toast } from 'react-hot-toast';

const OtpVerification = ({ email, onVerificationComplete }) => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [timeLeft, setTimeLeft] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [resending, setResending] = useState(false);

    useEffect(() => {
        if (timeLeft > 0 && !canResend) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        } else if (timeLeft === 0) {
            setCanResend(true);
        }
    }, [timeLeft, canResend]);

    const handleChange = (element, index) => {
        if (isNaN(element.value)) return;

        setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

        if (element.value && element.nextSibling) {
            element.nextSibling.focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace') {
            if (!otp[index] && e.target.previousSibling) {
                e.target.previousSibling.focus();
            }
            const newOtp = [...otp];
            newOtp[index] = '';
            setOtp(newOtp);
        }
    };

    const verifyOtp = async (e) => {
        e.preventDefault();
        
        if (!isValidOtp(otp)) {
            toast.error('Please enter a valid 6-digit OTP');
            return;
        }
        
        try {
            setVerifying(true);
            
            const response = await axios.post(`${apiConfig.baseURL}/auth/verify-otp`, {
                email,
                otp
            });
            
            if (response.data.success) {
                toast.success('OTP verified successfully');
                
                if (onVerificationComplete) {
                    onVerificationComplete();
                }
            } else {
                toast.error(response.data.message || 'Invalid OTP');
            }
        } catch (error) {
            console.error('OTP verification error:', error);
            toast.error(error.response?.data?.message || 'Failed to verify OTP');
        } finally {
            setVerifying(false);
        }
    };

    const resendOtp = async () => {
        try {
            setResending(true);
            await axios.post(`${apiConfig.baseURL}/auth/resend-otp`, { email });
            
            toast.success('New OTP has been sent to your email');
            setOtp('');
            resetTimer();
        } catch (error) {
            console.error('Resend OTP error:', error);
            toast.error(error.response?.data?.message || 'Failed to resend OTP');
        } finally {
            setResending(false);
        }
    };

    const resetTimer = () => {
        setTimeLeft(60);
        setCanResend(false);
    };

    const isValidOtp = (otp) => {
        return otp.length === 6 && otp.every(digit => !isNaN(digit));
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            {loading && <LoadingOverlay />}
            
            <div className="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-xl shadow-lg">
                <div>
                    <h2 className="text-center text-3xl font-extrabold text-white">
                        Verify Your Email
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-400">
                        We've sent a verification code to {email}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-3 rounded relative">
                        {error}
                    </div>
                )}

                <form onSubmit={verifyOtp} className="mt-8 space-y-6">
                    <div className="flex justify-center space-x-2">
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                type="text"
                                maxLength="1"
                                value={digit}
                                onChange={(e) => handleChange(e.target, index)}
                                onKeyDown={(e) => handleKeyDown(e, index)}
                                className="w-12 h-12 text-center text-xl font-semibold text-white bg-gray-700 border-2 border-gray-600 rounded-lg focus:border-cyan-500 focus:ring-cyan-500"
                            />
                        ))}
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={otp.some(digit => !digit) || verifying}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Verify Email
                        </button>
                    </div>

                    <div className="text-center">
                        {canResend ? (
                            <button
                                type="button"
                                onClick={resendOtp}
                                className="text-cyan-500 hover:text-cyan-400 font-medium"
                            >
                                Resend Code
                            </button>
                        ) : (
                            <p className="text-gray-400">
                                Resend code in {timeLeft} seconds
                            </p>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default OtpVerification;
