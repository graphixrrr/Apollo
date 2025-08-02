'use client';

import { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  disabled?: boolean;
}

export function SearchBar({ onSearch, disabled = false }: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !disabled) {
      onSearch(query.trim());
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for people, companies, or titles..."
            className="input-field text-lg"
            disabled={disabled}
          />
        </div>
        <button
          type="submit"
          disabled={disabled || !query.trim()}
          className="btn-primary text-lg px-8 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {disabled ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Searching...
            </div>
          ) : (
            'Search'
          )}
        </button>
      </form>
      
      <div className="mt-4 text-sm text-gray-500 text-center">
        Try searching for: "John Smith CEO", "Marketing Director Apple", "Software Engineer Google"
      </div>
    </div>
  );
} 