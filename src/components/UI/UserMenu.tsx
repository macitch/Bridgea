import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { FirestoreUser } from '@/models/users'; 

// Define the props for the UserMenu component.
interface UserMenuProps {
  // The authenticated user data.
  user: FirestoreUser;
  // Callback when the "Profile" option is selected.
  onProfile: () => void;
  // Callback when the "Logout" option is selected.
  onLogout: () => void;
}

/**
 * UserMenu Component
 *
 * Renders a pill-shaped button that displays the user's profile picture,
 * display name, and a dropdown arrow. When clicked, it toggles a dropdown menu
 * with "Profile" and "Logout" options.
 */
const UserMenu: React.FC<UserMenuProps> = ({ user, onProfile, onLogout }) => {
  // Local state to control whether the dropdown is open.
  const [isOpen, setIsOpen] = useState(false);

  // Toggle the dropdown open/closed state.
  const handleToggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative inline-block">
      {/* Main container: a pill-shaped button that toggles the dropdown */}
      <div
        onClick={handleToggleDropdown}
        className="flex items-center border-2 border-[var(--grey)] rounded-full bg-white px-3 py-2 w-full max-w-sm cursor-pointer"
      >
        {/* Left section: User's profile picture or a fallback icon */}
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--grey)] mr-2 overflow-hidden">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            // Fallback SVG icon if no profile picture is available.
            <svg
              className="h-4 w-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.354a4.354 4.354 0 110 8.708 4.354 4.354 0 010-8.708zM6.403 19.388a7.056 7.056 0 0111.195 0"
              />
            </svg>
          )}
        </div>

        {/* Center section: Display the user's display name */}
        <span className="text-[var(--black)] text-base mr-1">{user.displayName}</span>

        {/* Right section: Dropdown arrow icon */}
        <ChevronDown className="w-4 h-4 text-[var(--black)]" />
      </div>

      {/* Dropdown Menu: Only rendered when isOpen is true */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white border-2 border-[var(--grey)] rounded-md shadow-lg py-2 z-20">
          {/* "Profile" option */}
          <button
            onClick={onProfile}
            className="block w-full text-left px-4 py-2 text-sm text-[var(--black)] hover:bg-gray-100"
          >
            Profile
          </button>
          {/* "Logout" option */}
          <button
            onClick={onLogout}
            className="block w-full text-left px-4 py-2 text-sm text-[var(--black)] hover:bg-gray-100"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;