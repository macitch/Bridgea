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
  Heart,
  Tags,
  Settings2,
  PanelLeft,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import NewLinkButton from "../UI/NewLinkButton";
import { cn } from "@/utils/twMerge";

export default function DashboardSidebar({ children }: { children?: React.ReactNode }) {
  const links: SidebarLinkData[] = [
    { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="h-6 w-6" /> },
    { label: "Favorites", href: "/favorites", icon: <Heart className="h-6 w-6" /> },
    { label: "Categories", href: "/categories", icon: <Library className="h-6 w-6" /> },
    { label: "Tags", href: "/tags", icon: <Tags className="h-6 w-6" /> },
    { label: "Settings", href: "/settings", icon: <Settings2 className="h-6 w-6" /> },
  ];

  return (
    <div className="flex flex-col md:flex-row h-screen mx-auto overflow-hidden">
      <Sidebar>
        <SidebarBody className="justify-between gap-10">
          <div className={cn("flex flex-col flex-1 overflow-y-auto", "w-full")}>
            <SidebarContent links={links} />
          </div>
        </SidebarBody>
      </Sidebar>
    </div>
  );
}

const SidebarContent = ({ links }: { links: SidebarLinkData[] }) => {
  const { open, setOpen } = useSidebar();

  return (
    <>
      {/* Logo Section - Consistent Height */}
      {open ? <Logo /> : <LogoIcon />}

      {/* New Link Button - Consistent Height */}
      <div className={cn("flex flex-col gap-2 w-full", open ? "items-start" : "items-center")}>
        <NewLinkButton />
        {links.map((link) => (
          <SidebarLink key={link.label} link={link} className="flex items-center" />
        ))}
      </div>

      {/* Sidebar Toggle Button - Consistent Height */}
      <div className="mt-auto w-full hidden md:block">
        <SidebarLink
          link={{
            label: "Toggle Sidebar",
            href: "",
            icon: <PanelLeft className="h-6 w-6" />,
          }}
          className="flex items-center"
          onClick={() => setOpen(!open)} 
        />
      </div>
    </>
  );
};

/**
 * Logo Component - Matches Sidebar Elements
 */
const Logo = () => {
  const { open } = useSidebar();

  return (
    <Link
      href="/dashboard"
      className={cn(
        "flex items-center rounded-full transition-all duration-200",
        open ? "px-3 py-2 w-full" : "justify-center w-12 h-12"
      )}
    >
      {/* Logo Icon - Ensures Consistent Size */}
      <div className="flex items-center justify-center w-10 h-10 rounded-full">
        <Image src="/assets/logo.svg" alt="Bridgea Logo" width={24} height={24} className="object-contain" />
      </div>

      {/* Animated Text - Visible When Sidebar is Open */}
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
 * LogoIcon Component - For Collapsed Sidebar
 */
const LogoIcon = () => (
  <Link
    href="/dashboard"
    className="flex items-center justify-center rounded-full transition-all duration-200 w-12 h-12"
  >
    <Image src="/assets/logo.svg" alt="Bridgea Logo" width={24} height={24} className="object-contain" />
  </Link>
);

export { Logo, LogoIcon };