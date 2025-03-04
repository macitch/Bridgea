import React from 'react';
// Import the left sidebar component.
import DashboardSidebar from './DashboardSidebar';
// Import the top navbar component.
import DashboardNavbar from './DashboardNavBar';

// Define the type for the component's props.
// This ensures that the children prop is a valid React node.
interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * DashboardLayout wraps the page content with a sidebar and navbar,
 * providing a consistent layout for all dashboard pages.
 *
 * The layout is divided into two main sections:
 * 1) The left sidebar.
 * 2) The right main section which contains a sticky navbar and the page content.
 */
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    // Main container for the dashboard layout.
    // Uses flexbox to arrange the sidebar and main content side by side.
    <div className="flex h-screen bg-[var(--grey)]">
      
      {/* 1) Left Sidebar */}
      {/* Renders the DashboardSidebar component which typically contains navigation links. */}
      <DashboardSidebar />

      {/* 2) Right Section: a column layout that contains the navbar and content. */}
      <div className="flex-1 flex flex-col bg-[var(--white)] rounded-tl-2xl">
        
        {/* 3) Scrolling container for the main area */}
        {/* This container allows the page content to scroll independently of the navbar. */}
        <div className="flex-1 overflow-y-auto">
          
          {/* 4) Sticky navbar at the top of this container */}
          {/* The navbar remains visible at the top as the content scrolls. */}
          <div className="sticky top-0 z-10 h-[80px]">
            <DashboardNavbar />
          </div>
          
          {/* 5) Page content below the navbar */}
          {/* The children prop contains the page-specific content passed into the layout. */}
          <div className="p-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}