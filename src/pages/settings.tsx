import React, { useState, useEffect } from "react";
// Import the DashboardLayout to wrap the Settings page.
import DashboardLayout from "@/components/Dashboard/DashboardLayout";

// Define the available theme and language options.
const availableThemes = ["auto", "light", "dark"];
const availableLanguages = ["English", "Spanish", "French", "German"];

const Settings = () => {
  // Local state for theme and language.
  // Defaults: theme = "auto", language = "English".
  const [theme, setTheme] = useState("auto");
  const [language, setLanguage] = useState("English");

  // On component mount, load saved settings from localStorage if available.
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    const storedLanguage = localStorage.getItem("language");
    if (storedTheme) setTheme(storedTheme);
    if (storedLanguage) setLanguage(storedLanguage);
  }, []);

  // Handler to save current settings to localStorage.
  const handleSave = () => {
    localStorage.setItem("theme", theme);
    localStorage.setItem("language", language);
    alert("Settings saved!");
  };

  return (
    // Main container with padding, white background, and minimum screen height.
    <div className="p-8 bg-white min-h-screen">
      {/* Page title */}
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Settings</h1>
      {/* Form container with rounded corners, shadow, and centered horizontally */}
      <div className="bg-[var(--grey)] rounded-xl p-6 shadow-lg max-w-lg mx-auto">
        <div className="space-y-6">
          {/* Theme Selection */}
          <div>
            <label
              htmlFor="theme"
              className="block text-lg font-medium text-gray-700 mb-2"
            >
              Theme
            </label>
            <select
              id="theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--orange)]"
            >
              {availableThemes.map((option) => (
                <option key={option} value={option}>
                  {/* Capitalize the first letter for display */}
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Language Selection */}
          <div>
            <label
              htmlFor="language"
              className="block text-lg font-medium text-gray-700 mb-2"
            >
              Language
            </label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--orange)]"
            >
              {availableLanguages.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="w-full py-3 bg-[var(--orange)] text-white rounded-lg font-bold hover:bg-[var(--orange)] transition-colors duration-200"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

// Use DashboardLayout as the layout for this page.
Settings.getLayout = function getLayout(page: React.ReactNode) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default Settings;