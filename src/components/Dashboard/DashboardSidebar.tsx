import React, { useState } from "react";
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
  SidebarLinkData,
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
import { cn } from "@/lib/utils";
import { logout } from "@/firebase/auth";
import { useAuth } from "@/context/AuthProvider";
import ProtectedRoute from "../Shared/ProtectedRoute";
import DashboardNavBar from "./DashboardNavBar"; // Make sure this component exists

export default function DashboardSidebar({ children }: { children?: React.ReactNode }) {
  const links: SidebarLinkData[] = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="text-night h-6 w-6 flex-shrink-0" />,
    },
    {
      label: "New Link",
      href: "/newlink",
      icon: <Plus className="text-night h-6 w-6 flex-shrink-0" />,
    },
    {
      label: "Favorites",
      href: "/favorites",
      icon: <Heart className="text-night h-6 w-6 flex-shrink-0" />,
    },
    {
      label: "Categories",
      href: "/categories",
      icon: <Library className="text-night h-6 w-6 flex-shrink-0" />,
    },
    {
      label: "Tags",
      href: "/tags",
      icon: <Tags className="text-night h-6 w-6 flex-shrink-0" />,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: <Settings2 className="text-night h-6 w-6 flex-shrink-0" />,
    },
  ];
  const { userData } = useAuth();
  const [open, setOpen] = useState(true);
  const avatarUrl = userData?.photoURL || "/assets/logo.png";

  return (
    <ProtectedRoute>
      {/* DashboardNavBar stays at the top */}
      <DashboardNavBar />
      <div className={cn("flex flex-col md:flex-row h-screen mx-auto bg-[var(--white)] overflow-hidden")}
      style={{ height: "calc(100vh - 60px)" }}
      >
        {/* Sidebar */}
        <Sidebar open={open} setOpen={setOpen}>
          <SidebarBody className="h-full flex flex-col justify-between gap-10">
            {/* Link items */}
            <div className="flex flex-col gap-2">
              {links.map((link) => (
                <SidebarLink key={link.label} link={link} />
              ))}
            </div>
            {/* Toggle button at the bottom */}
            <div className="mt-auto">
              <SidebarLink
                link={{
                  label: "Toggle Sidebar",
                  href: "#",
                  icon: <PanelLeft />,
                  onClick: () => {
                    setOpen((prev) => !prev);
                    console.log("Menu Icon Tapped");
                  },
                }}
              />
            </div>
          </SidebarBody>
        </Sidebar>

        {/* Main Content Area */}
        <main className="w-full overflow-y-auto bg-[#e4e4e4] p-4 rounded-tl-2xl">
          {children || <div className="text-gray-700">No content available.</div>}
        </main>
      </div>
    </ProtectedRoute>
  );
}

const Logo = () => (
  <Link href="/dashboard" className="font-normal flex items-center space-x-2 text-xl text-black py-1">
    <Image src="/assets/logo.svg" alt="Bridgea Logo" width={32} height={32} className="object-contain" />
    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-medium text-black whitespace-pre">
      Bridgea.
    </motion.span>
  </Link>
);

const LogoIcon = () => (
  <Link href="/dashboard" className="font-normal flex items-center space-x-2 text-xl text-black py-1">
    <Image src="/assets/logo.svg" alt="Bridgea Logo" width={32} height={32} className="object-contain" />
  </Link>
);