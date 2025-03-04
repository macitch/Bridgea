import React from "react";
// Import sidebar-related components and types.
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
  SidebarLinkData,
  useSidebar,
} from "../UI/SidebarElements";
// Import icons from lucide-react to be used in sidebar links.
import {
  LayoutDashboard,
  Library,
  Heart,
  Tags,
  Settings2,
  PanelLeft,
} from "lucide-react";
// Import Next.js Link for navigation.
import Link from "next/link";
// Import motion for animated components.
import { motion } from "framer-motion";
// Import Image component for optimized images.
import Image from "next/image";
// Import a custom button to create new links.
import NewLinkButton from "../UI/NewLinkButton";
// Import utility function for merging Tailwind classes.
import { cn } from "@/utils/twMerge";

// DashboardSidebar component: wraps the sidebar for the dashboard.
export default function DashboardSidebar({ children }: { children?: React.ReactNode }) {
  // Define an array of sidebar links with labels, hrefs, and corresponding icons.
  const links: SidebarLinkData[] = [
    { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="h-6 w-6" /> },
    { label: "Favorites", href: "/favorites", icon: <Heart className="h-6 w-6" /> },
    { label: "Categories", href: "/categories", icon: <Library className="h-6 w-6" /> },
    { label: "Tags", href: "/tags", icon: <Tags className="h-6 w-6" /> },
    { label: "Settings", href: "/settings", icon: <Settings2 className="h-6 w-6" /> },
  ];

  return (
    <div className="flex flex-col md:flex-row h-screen mx-auto overflow-hidden">
      {/* Render the Sidebar component which wraps the entire sidebar UI */}
      <Sidebar>
        {/* SidebarBody is used to structure the sidebar with spacing */}
        <SidebarBody className="justify-between gap-10">
          {/* SidebarContent handles the main content of the sidebar */}
          <div className={cn("flex flex-col flex-1 overflow-y-auto", "w-full")}>
            <SidebarContent links={links} />
          </div>
        </SidebarBody>
      </Sidebar>
    </div>
  );
}

// SidebarContent component that renders the logo, new link button, links list, and toggle button.
const SidebarContent = ({ links }: { links: SidebarLinkData[] }) => {
  // Get the current open state and a function to set it from the sidebar context.
  const { open, setOpen } = useSidebar();

  return (
    <>
      {/* Logo Section: Render full logo if sidebar is open, icon-only when collapsed */}
      {open ? <Logo /> : <LogoIcon />}

      {/* New Link Button and navigation links */}
      <div className={cn("flex flex-col gap-2 w-full", open ? "items-start" : "items-center")}>
        <NewLinkButton />
        {/* Map over the links array to render each sidebar link */}
        {links.map((link) => (
          <SidebarLink key={link.label} link={link} className="flex items-center" />
        ))}
      </div>

      {/* Sidebar Toggle Button: Only visible on medium devices and above */}
      <div className="mt-auto w-full hidden md:block">
        <SidebarLink
          link={{
            label: "Toggle Sidebar",
            href: "",
            icon: <PanelLeft className="h-6 w-6" />,
          }}
          className="flex items-center"
          // Toggle the sidebar open state when clicked.
          onClick={() => setOpen(!open)}
        />
      </div>
    </>
  );
};

/**
 * Logo Component
 * Renders the full logo along with the text "Bridgea." when the sidebar is open.
 */
const Logo = () => {
  // Get the sidebar open state from context.
  const { open } = useSidebar();

  return (
    <Link
      href="/dashboard"
      className={cn(
        "flex items-center rounded-full transition-all duration-200",
        // When open, apply padding and full width; when collapsed, center content with fixed size.
        open ? "px-3 py-2 w-full" : "justify-center w-12 h-12"
      )}
    >
      {/* Logo Icon: Ensures consistent size regardless of sidebar state */}
      <div className="flex items-center justify-center w-10 h-10 rounded-full">
        <Image src="/assets/logo.svg" alt="Bridgea Logo" width={24} height={24} className="object-contain" />
      </div>

      {/* Animated Text: Only visible when sidebar is open */}
      <motion.span
        animate={{
          opacity: open ? 1 : 0,
          width: open ? "auto" : "0px",
        }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="overflow-hidden whitespace-nowrap text-xl font-bold"
      >
        Bridgea.
      </motion.span>
    </Link>
  );
};

/**
 * LogoIcon Component
 * Renders only the logo icon for the collapsed sidebar.
 */
const LogoIcon = () => (
  <Link
    href="/dashboard"
    className="flex items-center justify-center rounded-full transition-all duration-200 w-12 h-12"
  >
    <Image src="/assets/logo.svg" alt="Bridgea Logo" width={24} height={24} className="object-contain" />
  </Link>
);

// Export Logo and LogoIcon components for use elsewhere if needed.
export { Logo, LogoIcon };