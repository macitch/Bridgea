import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { FirestoreUser } from '@/models/users'; 

interface UserMenuProps {
  user: FirestoreUser;
  onProfile: () => void;
  onLogout: () => void;
}

/**
 * UserMenu Component
 *
 * - Uses the styling from the search bar component.
 * - Replaces the search icon with the user's profile picture.
 * - Displays the user's displayName.
 * - Provides a dropdown with "Profile" and "Logout" options.
 */
const UserMenu: React.FC<UserMenuProps> = ({ user, onProfile, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative inline-block">
      {/* Pill-shaped container */}
      <div
        onClick={handleToggleDropdown}
        className="flex items-center border-2 border-[var(--grey)] rounded-full bg-white px-3 py-2 w-full max-w-sm cursor-pointer"
      >
        {/* Left: Profile Picture or fallback icon */}
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--grey)] mr-2 overflow-hidden">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
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

        {/* Center: User's displayName */}
        <span className="text-[var(--black)] text-base mr-1">{user.displayName}</span>

        {/* Right: Dropdown arrow */}
        <ChevronDown className="w-4 h-4 text-[var(--black)]" />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white border-2 border-[var(--grey)] rounded-md shadow-lg py-2 z-20">
          <button
            onClick={onProfile}
            className="block w-full text-left px-4 py-2 text-sm text-[var(--black)] hover:bg-gray-100"
          >
            Profile
          </button>
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