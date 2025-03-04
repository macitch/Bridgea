import React from 'react';

// Define props for the SearchBar component.
interface SearchBarProps {
  // Placeholder text for the input field.
  placeholder?: string;
  // The current value of the search input.
  value: string;
  // Callback when the input value changes.
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  // Callback to trigger a search with the current value.
  onSearch: (value: string) => void;
}

// SearchBar component renders an input field with a search icon.
const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search...',
  value,
  onChange,
  onSearch,
}) => {
  // Handle key down events on the input.
  // If the user presses "Enter", trigger the onSearch callback with the current value.
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      onSearch(value);
    }
  };

  return (
    <div className="flex items-center border-2 border-[var(--grey)] rounded-full bg-white px-3 py-2 w-full max-w-sm">
      {/* Icon container: renders a magnifying glass icon in its own circle. */}
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
            // SVG path for a magnifying glass icon.
            d="M11 5a7 7 0 015.196 11.857l3.912 3.912
               a1 1 0 01-1.414 1.414l-3.912-3.912
               A7 7 0 1111 5z"
          />
        </svg>
      </div>

      {/* Text input field for entering search queries.
          It expands to fill available space and listens for changes and key events. */}
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