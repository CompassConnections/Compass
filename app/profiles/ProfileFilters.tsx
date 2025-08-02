'use client';

import {useEffect, useRef, useState} from 'react';
import {Gender} from "@prisma/client";
import Dropdown from "@/app/components/dropdown";
import Slider from '@mui/material/Slider';
import {DropdownKey, RangeKey} from "@/app/profiles/page";
import {capitalize} from "@/lib/format";

interface FilterProps {
  filters: {
    gender: string;
    interests: string[];
    connections: string[];
    causeAreas: string[];
    searchQuery: string;
    minAge?: number | null;
    maxAge?: number | null;
    minIntroversion?: number | null;
    maxIntroversion?: number | null;
  };
  onFilterChange: (key: string, value: any) => void;
  onShowFilters: (value: boolean) => void;
  onToggleFilter: (key: DropdownKey, value: string) => void;
  onReset: () => void;
}

export const dropdownConfig: { id: DropdownKey, name: string }[] = [
  {id: "connections", name: "Desired Connections"},
  {id: "interests", name: "Core Interests"},
  {id: "causeAreas", name: "Cause Areas"},
]

export const rangeConfig: { id: RangeKey, name: string, min: number, max: number }[] = [
  {id: "age", name: "Age", min: 15, max: 60},
  {id: "introversion", name: "Introversion (%)", min: 0, max: 100},
]

export function ProfileFilters({filters, onFilterChange, onShowFilters, onToggleFilter, onReset}: FilterProps) {
  interface Item {
    id: DropdownKey;
    name: string;
  }

  const [showFilters, setShowFilters] = useState(true);

  const dropDownStates = Object.fromEntries(dropdownConfig.map(({id}) => {
    const [all, setAll] = useState<Item[]>([]);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [newValue, setNewValue] = useState('');
    const ref = useRef<HTMLDivElement>(null);
    const [show, setShow] = useState(false);

    return [id, {
      options: {value: all, set: setAll},
      selected: {value: selected, set: setSelected},
      new: {value: newValue, set: setNewValue},
      ref: ref,
      show: {value: show, set: setShow},
    }]
  }))
  console.log(dropDownStates)

  useEffect(() => {
    async function fetchOptions() {
      try {
        const res = await fetch('/api/interests');
        if (res.ok) {
          const data = await res.json() as Record<string, Item[]>;
          console.log(data);
          for (const [id, values] of Object.entries(data)) {
            dropDownStates[id].options.set(values);
          }
        }
      } catch (error) {
        console.error('Error loading options:', error);
      }
    }

    fetchOptions();

    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      for (const id in dropDownStates) {
        const dropdown = dropDownStates[id];
        const ref = dropdown.ref;
        if (
          ref?.current &&
          !ref.current.contains(event.target as Node)
        ) {
          dropdown.show?.set?.(false); // Defensive chaining
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  const toggle = (id: DropdownKey, optionId: string) => {
    dropDownStates[id].selected.set(prev => {
      const newSet = new Set(prev);
      if (newSet.has(optionId)) {
        newSet.delete(optionId);
      } else {
        newSet.add(optionId);
      }
      return newSet;
    });
  };

  const handleKeyDown = (id: DropdownKey, key: string) => {
    if (key === 'Escape') dropDownStates[id].show.set(false);
  };

  const handleChange = (id: DropdownKey, e: string) => {
    dropDownStates[id].new.set(e);
  }

  const handleFocus = (id: DropdownKey) => {
    dropDownStates[id].show.set(true);
  }

  const handleClick = (id: DropdownKey) => {
    const shown = dropDownStates[id].show.value;
    dropDownStates[id].show.set(!shown);
  }

  function getDrowDown(id: DropdownKey, name: string) {

    return (
      <div key={id + '.div'}>
        <div className="relative" ref={dropDownStates[id].ref}>
          <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
            {name}
          </label>
          <Dropdown
            key={id}
            id={id}
            value={dropDownStates[id].new.value}
            onChange={handleChange}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            onClick={handleClick}
          />

          {(dropDownStates[id].show.value) && (
            <div
              className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-900 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black dark:ring-white ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
              {dropDownStates[id].options.value
                .filter(v => v.name.toLowerCase().includes(dropDownStates[id].new.value.toLowerCase()))
                .map((v) => (
                  <div
                    key={v.id}
                    className=" dark:text-white cursor-default select-none relative py-2 pl-3 pr-9 hover:bg-blue-50  dark:hover:bg-gray-700"
                    onClick={() => {
                      onToggleFilter(id, v.name);
                      toggle(id, v.id);
                    }}
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={dropDownStates[id].selected.value.has(v.id)}
                        onChange={() => {
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="font-normal ml-3 block truncate">
                              {v.name}
                            </span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {Array.from(dropDownStates[id].selected.value).map(vId => {
            const value = dropDownStates[id].options.value.find(i => i.id === vId);
            if (!value) return null;
            return (
              <span
                key={vId}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:text-white dark:bg-gray-700"
              >
                    {value.name}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(id, vId);
                    onToggleFilter(id, value.name);
                  }}
                  className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-blue-200 hover:bg-blue-300 dark:text-white dark:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                      <span className="sr-only">Remove {value.name}</span>
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

  function getSlider(id: RangeKey, name: string, min: number, max: number) {
    const minStr = 'min' + capitalize(id);
    const maxStr = 'max' + capitalize(id);
    const [minVal, setMinVal] = useState<number | undefined>(undefined);
    const [maxVal, setMaxVal] = useState<number | undefined>(undefined);
    return (
      <div key={id + '.div'}>

        <div className="w-full px-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">{name}</label>
          <Slider
            value={[minVal || min, maxVal || max]}
            onChange={(e, value) => {
              let [_min, _max] = value;
              setMinVal((_min || min) > min ? _min : undefined);
              setMaxVal((_max || max) < max ? _max : undefined);
            }}
            onChangeCommitted={(e, value) => {
              let [_min, _max] = value;
              onFilterChange(minStr, (_min || min) > min ? _min : undefined);
              onFilterChange(maxStr, (_max || max) < max ? _max : undefined);
            }}
            valueLabelDisplay="auto"
            min={min}
            max={max}
            sx={{
              color: '#3B82F6',
              '& .MuiSlider-valueLabel': {
                backgroundColor: '#3B82F6',
                color: '#fff',
              },
            }}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            {/*<label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Min Age</label>*/}
            <input
              type="number"
              min={min}
              max={max}
              className="w-full p-2 border rounded-lg"
              value={minVal || ''}
              onChange={(e) => {
                const value = e.target.value ? parseInt(e.target.value) : undefined;
                onFilterChange(minStr, value);
                setMinVal(value);
              }}
              placeholder="Min"
            />
          </div>
          <div>
            {/*<label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Max Age</label>*/}
            <input
              type="number"
              min={min}
              max={max}
              className="w-full p-2 border rounded-lg"
              value={maxVal || ''}
              onChange={(e) => {
                const value = e.target.value ? parseInt(e.target.value) : undefined;
                onFilterChange(maxStr, value);
                setMaxVal(value);
              }}
              placeholder="Max"
            />
          </div>
        </div>
      </div>
    )
  }

  const [text, setText] = useState<string>('');

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
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const value = (e.target as HTMLInputElement).value;
                    onFilterChange('searchQuery', value);
                  }
                }}
              />
              {filters.searchQuery && (
                <button
                  onClick={() => {
                    onFilterChange('searchQuery', '');
                    setText('');
                  }}
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
          className="px-4 py-2 border rounded-lg items-center gap-2 whitespace-nowrap hidden"
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

            {rangeConfig.map(({id, name, min, max}) => getSlider(id, name, min, max))}
            {dropdownConfig.map(({id, name}) => getDrowDown(id, name))}

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
                Object.values(dropDownStates).map((v) => {
                  v.selected.set(new Set());
                });
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
