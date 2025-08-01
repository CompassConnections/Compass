'use client';

import {useEffect, useRef, useState} from 'react';
import {Gender} from "@prisma/client";
import Dropdown from "@/app/components/dropdown";

interface FilterProps {
  filters: {
    gender: string;
    interests: string[];
    causeAreas: string[];
    searchQuery: string;
    minAge?: number | null;
    maxAge?: number | null;
  };
  onFilterChange: (key: string, value: any) => void;
  onShowFilters: (value: boolean) => void;
  onToggleFilter: (key: 'interests' | 'causeAreas', value: string) => void;
  onReset: () => void;
}

export function ProfileFilters({filters, onFilterChange, onShowFilters, onToggleFilter, onReset}: FilterProps) {
  const [showFilters, setShowFilters] = useState(true);
  const [allCauseAreas, setAllCauseAreas] = useState<{ id: string, name: string }[]>([]);
  const [allInterests, setAllInterests] = useState<{ id: string, name: string }[]>([]);
  const [allConnections, setAllConnections] = useState<{ id: string, name: string }[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [newInterest, setNewInterest] = useState('');

  useEffect(() => {
    async function fetchInterests() {
      try {
        const res = await fetch('/api/interests');
        if (res.ok) {
          const data = await res.json();
          setAllInterests(data.interests || []);
          setAllCauseAreas(data.causeAreas || []);
          setAllConnections(data.desiredConnections || []);
          console.log('All interests:', data.interests);
          console.log('All cause areas:', data.causeAreas);
          console.log('All Connections:', data.desiredConnections);
          // console.log('Gender', Gender);
        }
      } catch (error) {
        console.error('Error loading interests:', error);
      }
    }

    fetchInterests();

    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  const toggleInterest = (interestId: string) => {
    setSelectedInterests(prev => {
      const newSet = new Set(prev);
      if (newSet.has(interestId)) {
        newSet.delete(interestId);
      } else {
        newSet.add(interestId);
      }
      return newSet;
    });
  };

  const handleKeyDown = (key: string) => {
    if (key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const dropdownConfig = [
    {id: "interests",},
  ]

  const [values, setValues] = useState<Record<string, string>>({
    v: "",
    // showDropdown: false,
  })

  const handleChange = (id: string, value: string) => {
    setValues((prev) => ({ ...prev, [id]: value }))
  }

  const handleFocus = (id: string) => {
    console.log(`Focused: ${id}`)
    setShowDropdown[id](true)
  }


  function getDrowDown() {
    return (
      <div>
        <div className="relative" ref={dropdownRef}>
          <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
            Core Interests
          </label>

          {dropdownConfig.map(({ id }) => (
            <Dropdown
              key={id}
              id={id}
              // options={options}
              value={values[id]}
              onChange={handleChange}
              onFocus={handleFocus}
              onKeyDown={handleKeyDown}
              setShowDropdown={() => setShowDropdown[id]}
              showDropdown={}
            />
          ))}

          {(showDropdown) && (
            <div
              className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-900 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black dark:ring-white ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
              {/* Filtered interests */}
              {allInterests
                .filter(interest =>
                  interest.name.toLowerCase().includes(newInterest.toLowerCase())
                )
                .map((interest) => (
                  <div
                    key={interest.id}
                    className=" dark:text-white cursor-default select-none relative py-2 pl-3 pr-9 hover:bg-blue-50  dark:hover:bg-gray-700"
                    onClick={() => {
                      onToggleFilter('interests', interest.name);
                      toggleInterest(interest.id);
                      // setNewInterest('');
                    }}
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={selectedInterests.has(interest.id)}
                        onChange={() => {
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      />
                      <span className="font-normal ml-3 block truncate">
                              {interest.name}
                            </span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {Array.from(selectedInterests).map(interestId => {
            const interest = allInterests.find(i => i.id === interestId);
            if (!interest) return null;
            return (
              <span
                key={interestId}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:text-white dark:bg-gray-700"
              >
                    {interest.name}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleInterest(interestId);
                    onToggleFilter('interests', interest.name);
                  }}
                  className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-blue-200 hover:bg-blue-300 dark:text-white dark:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                      <span className="sr-only">Remove {interest.name}</span>
                      <svg className="h-2 w-2" fill="currentColor" viewBox="0 0 8 8">
                        <path
                          d="M4 3.293L6.646.646a.5.5 0 01.708.708L4.707 4l2.647 2.646a.5.5 0 01-.708.708L4 4.707l-2.646 2.647a.5.5 0 01-.708-.708L3.293 4 .646 1.354a.5.5 0 01.708-.708L4 3.293z"/>
                      </svg>
                    </button>
                  </span>
            );
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full mb-8">
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        {showFilters && (
          <div className="relative flex-grow">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name or description..."
                className="w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                // value={filters.searchQuery}
                // onChange={(e) => onFilterChange('searchQuery', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const value = (e.target as HTMLInputElement).value;
                    onFilterChange('searchQuery', value);
                  }
                }}
              />
              {filters.searchQuery && (
                <button
                  onClick={() => onFilterChange('searchQuery', '')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  type="button"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24"
                       stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              )}
            </div>
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24"
                   stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
          </div>
        )}

        <button
          onClick={() => {
            setShowFilters(!showFilters);
            onShowFilters(!showFilters);
          }}
          className="px-4 py-2 border rounded-lg flex items-center gap-2 whitespace-nowrap hidden"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24"
               stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
          </svg>
          {showFilters ? 'Hide' : 'Show'}
        </button>
      </div>

      {showFilters && (
        <div className="p-4 rounded-lg shadow-sm border space-y-4">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Gender</label>
                <select
                  className="w-full p-2 border rounded-lg"
                  value={filters.gender}
                  onChange={(e) => onFilterChange('gender', e.target.value)}
                >
                  <option value="">Any Gender</option>
                  {Object.keys(Gender).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Min Age</label>
                <input
                  type="number"
                  min="15"
                  max="100"
                  className="w-full p-2 border rounded-lg"
                  value={filters.minAge || ''}
                  onChange={(e) => onFilterChange('minAge', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="Min"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Max Age</label>
                <input
                  type="number"
                  min="18"
                  max="100"
                  className="w-full p-2 border rounded-lg"
                  value={filters.maxAge || ''}
                  onChange={(e) => onFilterChange('maxAge', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="Max"
                />
              </div>
            </div>

            {getDrowDown()}

            {/*<div>*/}
            {/*  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Cause Areas</label>*/}
            {/*  <div className="flex flex-wrap gap-2">*/}
            {/*    {allCauseAreas.map((cause) => (*/}
            {/*      <button*/}
            {/*        key={cause.name}*/}
            {/*        onClick={() => onToggleFilter('causeAreas', cause.name)}*/}
            {/*        className={`px-3 py-1 text-sm rounded-full ${*/}
            {/*          filters.causeAreas.includes(cause.name)*/}
            {/*            ? 'bg-green-100 dark:text-white dark:bg-green-900 text-green-800 border border-green-200'*/}
            {/*            : 'bg-gray-100 dark:text-white dark:bg-gray-700 text-gray-800 border border-gray-200 hover:bg-gray-200'*/}
            {/*        }`}*/}
            {/*      >*/}
            {/*        {cause.name}*/}
            {/*      </button>*/}
            {/*    ))}*/}
            {/*  </div>*/}
            {/*</div>*/}

          </div>

          <div className="flex justify-end">
            <button
              onClick={() => {
                onReset();
                setSelectedInterests(new Set());
              }}
              className="px-4 py-2 text-sm text-gray-600  dark:text-white hover:text-gray-800"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
