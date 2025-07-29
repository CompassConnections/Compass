'use client';

import { useState } from 'react';

// Mock data for filter options
const GENDER_OPTIONS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'NonBinary', label: 'Non-binary' },
  { value: 'Other', label: 'Prefer not to say' },
];

// These would ideally come from your database
const INTEREST_OPTIONS = [
  'AI Safety',
  'Philosophy',
  'Effective Altruism',
  'Rationality',
  'Technology',
  'Science',
  'Policy',
];

const CAUSE_AREA_OPTIONS = [
  'AI Safety',
  'Global Health',
  'Animal Welfare',
  'Biosecurity',
  'Climate Change',
  'Global Poverty',
];

interface FilterProps {
  filters: {
    gender: string;
    interests: string[];
    causeAreas: string[];
    searchQuery: string;
  };
  onFilterChange: (key: string, value: any) => void;
  onToggleFilter: (key: 'interests' | 'causeAreas', value: string) => void;
  onReset: () => void;
}

export function ProfileFilters({ filters, onFilterChange, onToggleFilter, onReset }: FilterProps) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="w-full mb-8">
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Search by name, email, or description..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filters.searchQuery}
            onChange={(e) => onFilterChange('searchQuery', e.target.value)}
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 flex items-center gap-2 whitespace-nowrap"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow-sm border space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                className="w-full p-2 border rounded-lg"
                value={filters.gender}
                onChange={(e) => onFilterChange('gender', e.target.value)}
              >
                <option value="">Any Gender</option>
                {GENDER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Interests</label>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((interest) => (
                  <button
                    key={interest}
                    onClick={() => onToggleFilter('interests', interest)}
                    className={`px-3 py-1 text-sm rounded-full ${
                      filters.interests.includes(interest)
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cause Areas</label>
              <div className="flex flex-wrap gap-2">
                {CAUSE_AREA_OPTIONS.map((cause) => (
                  <button
                    key={cause}
                    onClick={() => onToggleFilter('causeAreas', cause)}
                    className={`px-3 py-1 text-sm rounded-full ${
                      filters.causeAreas.includes(cause)
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {cause}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onReset}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
