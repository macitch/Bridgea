import React from 'react';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSearch: (value: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search...',
  value,
  onChange,
  onSearch,
}) => {
  // Trigger search when user presses "Enter" key
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      onSearch(value);
    }
  };

  return (
    <div className="flex items-center border-2 border-[var(--grey)] rounded-full bg-white px-3 py-2 w-full max-w-sm">
      {/* Icon in its own circle with background color */}
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--grey)] mr-2">
        <svg
          className="h-4 w-4 text-[var(--black)]"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11 5a7 7 0 015.196 11.857l3.912 3.912
               a1 1 0 01-1.414 1.414l-3.912-3.912
               A7 7 0 1111 5z"
          />
        </svg>
      </div>

      {/* Text input */}
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        className="flex-1 outline-none text-gray-700 placeholder-gray-400 text-sm bg-transparent"
      />
    </div>
  );
};

export default SearchBar;