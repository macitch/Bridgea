import React from "react";
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
  SidebarLinkData,
  useSidebar,
} from "../UI/SidebarElements";
import {
  LayoutDashboard,
  Library,
  Plus,
  Heart,
  Tags,
  Settings2,
  PanelLeft,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import NewLinkButton from "../UI/NewLinkButton";

/**
 * DashboardSidebar Component
 * 
 * This component is responsible for rendering the **sidebar** and the **main content area**.
 * - The sidebar includes navigational links such as Dashboard, New Link, Favorites, etc.
 * - The main content area renders the children passed to the component.
 * - Uses `Sidebar` and `SidebarBody` from `SidebarElements.tsx` for layout.
 */
export default function DashboardSidebar({ children }: { children?: React.ReactNode }) {
  /**
   * Sidebar navigation links.
   * Each link contains:
   * - `label`: The text displayed in the sidebar.
   * - `href`: The route it navigates to.
   * - `icon`: The associated icon for better UI/UX.
   */
  const links: SidebarLinkData[] = [
    { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="h-7 w-7" /> },
    { label: "New Link", href: "/newlink", icon: <Plus className="h-7 w-7" /> },
    { label: "Favorites", href: "/favorites", icon: <Heart className="h-7 w-7" /> },
    { label: "Categories", href: "/categories", icon: <Library className="h-7 w-7" /> },
    { label: "Tags", href: "/tags", icon: <Tags className="h-7 w-7" /> },
    { label: "Settings", href: "/settings", icon: <Settings2 className="h-7 w-7" /> },
  ];

  return (
    <div className="flex flex-col md:flex-row h-screen mx-auto overflow-hidden">
      {/* Sidebar Section */}
      <Sidebar>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto items-start w-full">
            {/* Render Sidebar Links */}
            <SidebarContent links={links} />
          </div>
        </SidebarBody>
      </Sidebar>
    </div>
  );
}

/**
 * SidebarContent Component
 * 
 * - This component is responsible for rendering the sidebar's navigation links.
 * - It includes the **toggle button** to expand/collapse the sidebar (only on desktop).
 * - Uses `useSidebar()` to track sidebar state (`open` and `setOpen`).
 *      
 *  {/* Main Content Area */ /*
<main className="w-full overflow-y-auto bg-[var(--grey)] p-4 rounded-tl-2xl">
 {/* Render children content if provided; otherwise, show default message *//*
 {children || <div className="text-gray-700">No content available.</div>}
</main>
 */
const SidebarContent = ({ links }: { links: SidebarLinkData[] }) => {
  const { open, setOpen } = useSidebar(); // Access sidebar open/close state

  return (
    <>
      {/* Display either the full logo (when sidebar is open) or just the icon */}
      { open ? <Logo /> : <LogoIcon />}
      <NewLinkButton />
      {/* Render Sidebar Links */}
      <div className="flex flex-col gap-2 w-full">
        {links.map((link) => (
          <SidebarLink key={link.label} link={link} />
        ))}
      </div>

      {/* Sidebar Toggle Button (Hidden on Mobile) */}
      <div className="mt-auto w-full hidden md:block">
        <SidebarLink
          link={{
            label: "Toggle Sidebar",
            href: "", // No navigation, just toggle functionality
            icon: <PanelLeft className="h-7 w-" />,
          }}
          onClick={() => setOpen(!open)} // Click event toggles sidebar state
        />
      </div>
    </>
  );
};

/**
 * Logo Component
 * 
 * - Displays the full logo with text when the sidebar is **open**.
 * - Uses `motion.span` for smooth animations.
 */
const Logo = () => {
  const { open } = useSidebar(); // Access sidebar state

  return (
    <Link
      href="/dashboard"
      className="flex space-x-2 items-center text-black py-1 relative z-20 h-[32px]" 
    >
      {/* Logo Icon Always Visible */}
      <Image
        src="/assets/logo.svg"
        alt="Bridgea Logo"
        width={24}
        height={24}
        className="object-contain"
      />

      {/* Animated Text - Wrap in a `div` for Fixed Height */}
      <motion.div
        className="overflow-hidden flex items-center h-[24px]"
        animate={{
          opacity: open ? 1 : 0,
          width: open ? "100px" : "0px", 
        }}
        transition={{ duration: 0.2, ease: "easeInOut" }} 
      >
        <span className="whitespace-nowrap text-xl font-bold leading-none">
          Bridgea.
        </span>
      </motion.div>
    </Link>
  );
};

/**
 * LogoIcon Component
 * 
 * - Displays only the **logo icon** when the sidebar is **closed**.
 */
const LogoIcon = () => (
  <Link href="/dashboard" className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20 h-[32px]">
    {/* Logo Image */}
    <Image src="/assets/logo.svg" alt="Bridgea Logo" width={24} height={24} className="object-contain" />
  </Link>
);


// Remove sidebar when the user click on the url 