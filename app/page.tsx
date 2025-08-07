'use client';


import { useState, useRef } from 'react';
import { FaBus, FaSearch, FaMapMarkerAlt, FaExchangeAlt, FaClock, FaInfoCircle } from 'react-icons/fa';
import { routeData as busData } from '@/server/busroute';

const locations = [
  "Gabtoli", "Technical", "Ansar Camp", "Mirpur 1", "Sony Cinema Hall",
  "Mirpur 2", "Mirpur 10", "Mirpur 11", "Purobi", "Kalshi", "ECB Square",
  "MES", "Shewra", "Kuril Bishwa Road", "Jamuna Future Park", "Bashundhara",
  "Nadda", "Notun Bazar", "Bashtola", "Shahjadpur", "Uttar Badda",
  "Badda – Madhya Badda", "Merul", "Rampura Bridge", "Banasree",
  "Demra Staff Quarter"
];

export default function BusRouteFinder() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [results, setResults] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState({ from: false, to: false });
  const [expandedCard, setExpandedCard] = useState(null);
  const searchRef = useRef(null);

  const handleSearch = () => {
    if (!from || !to) return;

    const filteredResults = busData.filter(item =>
      item.route.toLowerCase().includes(from.toLowerCase()) &&
      item.route.toLowerCase().includes(to.toLowerCase())
    );

    setResults(filteredResults);
    setExpandedCard(null);

    // Scroll to results
    setTimeout(() => {
      if (searchRef.current) {
        searchRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handleSwap = () => {
    setFrom(to);
    setTo(from);
  };

  const handleSelectSuggestion = (value, field) => {
    if (field === 'from') {
      setFrom(value);
      setShowSuggestions({ ...showSuggestions, from: false });
    } else {
      setTo(value);
      setShowSuggestions({ ...showSuggestions, to: false });
    }
  };

  const filteredFromSuggestions = locations.filter(loc =>
    loc.toLowerCase().includes(from.toLowerCase()) && loc.toLowerCase() !== from.toLowerCase()
  );

  const filteredToSuggestions = locations.filter(loc =>
    loc.toLowerCase().includes(to.toLowerCase()) && loc.toLowerCase() !== to.toLowerCase()
  );

  const toggleCardExpand = (id) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 font-sans">
      {/* Thin Header */}
      <header className="bg-blue-800 text-white py-3 shadow-md">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FaBus className="text-xl text-blue-300" />
            <h1 className="text-xl font-semibold tracking-tight">Bus Route Finder</h1>
          </div>
          <div className="flex items-center">
            <div className="bg-blue-700 rounded-full px-3 py-1 text-xs flex items-center">
              <span>Live</span>
              <div className="ml-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
            Find Your Perfect Bus Route
          </h2>
          <p className="text-gray-600 max-w-md mx-auto text-sm">
            Search bus routes between locations in Dhaka with real-time information
          </p>
        </div>

        {/* Compact Search Form */}
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-2 items-end">
            <div className="md:col-span-3">
              <label className="block text-gray-700 text-xs font-medium uppercase tracking-wide mb-1">
                From Location
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaMapMarkerAlt className="text-gray-400 text-sm" />
                </div>
                <input
                  type="text"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  onFocus={() => setShowSuggestions({ ...showSuggestions, from: true })}
                  onBlur={() => setTimeout(() => setShowSuggestions({ ...showSuggestions, from: false }), 200)}
                  placeholder="Enter starting point"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
                {showSuggestions.from && filteredFromSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                    {filteredFromSuggestions.map((loc, index) => (
                      <div
                        key={index}
                        className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                        onMouseDown={() => handleSelectSuggestion(loc, 'from')}
                      >
                        {loc}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-center items-center md:col-span-1">
              <button
                onClick={handleSwap}
                className="bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors text-gray-600"
                aria-label="Swap locations"
              >
                <FaExchangeAlt className="text-xs" />
              </button>
            </div>

            <div className="md:col-span-3">
              <label className="block text-gray-700 text-xs font-medium uppercase tracking-wide mb-1">
                To Location
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaMapMarkerAlt className="text-gray-400 text-sm" />
                </div>
                <input
                  type="text"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  onFocus={() => setShowSuggestions({ ...showSuggestions, to: true })}
                  onBlur={() => setTimeout(() => setShowSuggestions({ ...showSuggestions, to: false }), 200)}
                  placeholder="Enter destination"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
                {showSuggestions.to && filteredToSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                    {filteredToSuggestions.map((loc, index) => (
                      <div
                        key={index}
                        className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                        onMouseDown={() => handleSelectSuggestion(loc, 'to')}
                      >
                        {loc}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={handleSearch}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center text-sm"
            >
              <FaSearch className="mr-2" />
              Search Bus Routes
            </button>
          </div>
        </div>

        {/* Results Section */}
        <div className='max-w-2xl mx-auto ' ref={searchRef}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Available Bus Routes</h2>
            <span className="text-gray-600 text-sm">{results.length} routes found</span>
          </div>

          {results.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg shadow">
              <FaBus className="mx-auto text-4xl text-gray-300 mb-3" />
              <h3 className="text-lg font-medium text-gray-700 mb-1">No buses found</h3>
              <p className="text-gray-600 text-sm">Try different locations or check your spelling</p>
            </div>
          ) : (
            <div className="grid grid-cols-1  gap-3">
              {results.map((bus) => (
                <div
                  key={bus.id}
                  className={`bg-white rounded-lg shadow-sm border border-gray-200 transition-all overflow-hidden ${expandedCard === bus.id ? 'border-blue-300 shadow-md' : 'hover:shadow'}`}
                >
                  <div className="p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-800 text-base truncate">{bus.bus}</h3>
                        <div className="flex items-center mt-1">
                          <span className="text-xs bg-blue-100 text-blue-800 py-1 px-2 rounded mr-2">{bus.service}</span>
                          <div className="flex items-center text-gray-600 text-xs">
                            <FaClock className="mr-1 text-gray-500" />
                            <span>{bus.time}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs font-semibold text-gray-700">
                        {bus.fare}
                      </div>
                    </div>

                    <div className="mt-2">
                      <div className="flex items-start">
                        <FaMapMarkerAlt className="text-red-500 mt-1 mr-1 text-xs flex-shrink-0" />
                        <div className="text-gray-600 text-xs">
                          <span className="font-medium">Route:</span>
                          <div className={`mt-1 text-gray-700 ${expandedCard === bus.id ? '' : 'line-clamp-2'}`}>
                            {bus.route}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 px-3 py-2">
                    <button
                      onClick={() => toggleCardExpand(bus.id)}
                      className="text-blue-600 hover:text-blue-800 text-xs flex items-center w-full justify-center"
                    >
                      <FaInfoCircle className="mr-1" />
                      {expandedCard === bus.id ? 'Show Less' : 'Show More Details'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Thin Footer */}
      <footer className="bg-gray-800 text-white py-4 mt-8 border-t border-gray-700">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-2 md:mb-0 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start">
                <FaBus className="text-xl text-blue-300 mr-2" />
                <span className="text-sm font-medium">Bus Route Finder</span>
              </div>
              <p className="text-gray-400 text-xs mt-1">Find your perfect bus route in seconds</p>
            </div>
            <div className="text-gray-400 text-xs">
              © {new Date().getFullYear()} Bus Route Finder. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}