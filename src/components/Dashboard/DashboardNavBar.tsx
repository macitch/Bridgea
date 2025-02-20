import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { logout } from "@/utils/auth";
import { useAuth } from "@/context/AuthProvider";
import { cn } from "@/lib/utils"; // Import cn function

export default function DashboardNavBar() {
  const { userData } = useAuth();
  const avatarUrl = userData?.photoURL || "/assets/logo.png";
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => setDropdownOpen(!isDropdownOpen);

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 w-full bg-white px-4 py-2 z-50 flex items-center justify-between",
        "md:px-8"
      )}
    >
      {/* Left Side: Logo & Title */}
      <div className="flex items-center space-x-1">
        <Image src="/assets/logo.svg" alt="Bridgea Logo" width={32} height={32} />
        <h1 className={cn("text-lg font-bold text-gray-800", "md:text-xl")}>Bridgea</h1>
      </div>

      {/* Center: Search Bar */}
      <div className="flex-grow flex justify-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-700" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Right Side: User Profile Dropdown */}
      <div className="flex items-center space-x-4">
        <div ref={dropdownRef} className="relative">
          <button onClick={toggleDropdown} className="flex items-center space-x-2 focus:outline-none">
            <Image
              src={avatarUrl}
              alt="User Avatar"
              width={40}
              height={40}
              className="border-2 border-gray-700 rounded-sm"
            />
            <span className="text-gray-700 font-base hidden md:block">{userData?.displayName}</span>
            <ChevronDown
              size={20}
              className={`text-gray-700 transition-transform duration-200 ${
                isDropdownOpen ? "rotate-180" : "rotate-0"
              }`}
            />
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
              <Link
                href="/profile"
                onClick={() => setDropdownOpen(false)}
                className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
              >
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}