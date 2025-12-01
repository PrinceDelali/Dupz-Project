import  { useState } from 'react';
import { ChevronDown, Phone } from 'lucide-react';

const countries = [
  { name: 'United States', code: '+1', flag: 'https://flagcdn.com/us.svg' },
  { name: 'United Kingdom', code: '+44', flag: 'https://flagcdn.com/gb.svg' },
  { name: 'India', code: '+91', flag: 'https://flagcdn.com/in.svg' },
  { name: 'Canada', code: '+1', flag: 'https://flagcdn.com/ca.svg' },
  { name: 'Australia', code: '+61', flag: 'https://flagcdn.com/au.svg' },
  { name: 'Germany', code: '+49', flag: 'https://flagcdn.com/de.svg' },
  { name: 'France', code: '+33', flag: 'https://flagcdn.com/fr.svg' },
  { name: 'Spain', code: '+34', flag: 'https://flagcdn.com/es.svg' },
  { name: 'Italy', code: '+39', flag: 'https://flagcdn.com/it.svg' },
  { name: 'Japan', code: '+81', flag: 'https://flagcdn.com/jp.svg' }
];

const ContactVerification = () => {
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitting:', selectedCountry.code + phoneNumber);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Verify your phone number</h2>
        <p className="text-gray-600 mb-8">
          Please enter your phone number to receive a verification code
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <div className="relative flex">
              {/* Country Selector */}
              <div className="relative">
                <button
                  type="button"
                  className="flex items-center space-x-2 rounded-l-lg border border-r-0 border-gray-300 bg-white px-3 py-2.5 text-sm hover:bg-gray-50"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <div className="flex items-center gap-2">
                    <img src={selectedCountry.flag} alt={selectedCountry.name} className="h-5 w-8 object-cover" />
                    <span className="text-gray-900 whitespace-nowrap">{selectedCountry.code}</span>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </div>
                </button>

                {/* Dropdown */}
                {isDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-72 rounded-md bg-white shadow-lg border border-gray-200">
                    <ul className="py-1 max-h-64 overflow-auto">
                      {countries.map((country) => (
                        <li
                          key={country.name}
                          className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            setSelectedCountry(country);
                            setIsDropdownOpen(false);
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <img src={country.flag} alt={country.name} className="h-5 w-8 object-cover" />
                            <span className="text-gray-900">{country.name}</span>
                          </div>
                          <span className="ml-auto text-gray-500">{country.code}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Phone Input */}
              <div className="relative flex-1">
                <input
                  type="tel"
                  className="block w-full rounded-r-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
                <Phone className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Send Code
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          By continuing, you agree to receive SMS messages and acknowledge our{' '}
          <a href="#" className="text-blue-600 hover:underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="text-blue-600 hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
};

export default ContactVerification;
