'use client';

import {useTheme} from 'next-themes';
import {useEffect, useState} from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';


export default function ThemeToggle() {
  const {theme, setTheme} = useTheme();
  const [mounted, setMounted] = useState(false);

  // Fix hydration mismatch
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={`relative inline-flex items-center rounded-full border-4 transition-colors duration-300`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className="flex items-center justify-between px-2 w-16">
        <div className={`p-1 rounded-md`}>
          <SunIcon className={`h-4 w-4 text-yellow-500 ${isDark ? 'hidden' : ''}`} />
        </div>
        <div className={`p-1 rounded-md`}>
          <MoonIcon className={`h-4 w-4 text-yellow-500 ${isDark ? '' : 'hidden'}`} />
        </div>
      </div>
    </button>
  );
}
