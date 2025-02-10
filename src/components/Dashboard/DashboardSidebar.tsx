import React, { useState } from "react";
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
  SidebarLinkData,
} from "../UI/SidebarElements";
import { LayoutDashboard,Library ,Plus, Heart, Tags,Settings2, Search, } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { logout } from "@/firebase/auth";
import { useAuth } from "@/context/AuthProvider";
import ProtectedRoute from "../Shared/ProtectedRoute";

export default function DashboardSidebar({ children }: { children?: React.ReactNode }) {
  const links: SidebarLinkData[] = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="text-night h-6 w-6 flex-shrink-0" />,
    },
    {
      label: "Add Links",
      href: "/addlink",
      icon: <Plus className="text-night h-6 w-6 flex-shrink-0" />,
    },
    {
      label: "Categories",
      href: "/categories",
      icon: <Library className="text-night h-6 w-6 flex-shrink-0" />,
    },
    {
      label: "Favorites",
      href: "/favorites",
      icon: <Heart className="text-night h-6 w-6 flex-shrink-0" />,
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
  const [open, setOpen] = useState(false);
  const avatarUrl = userData?.photoURL || "/assets/logo.png";

  return (
    <ProtectedRoute>
    <div className={cn("flex flex-col md:flex-row h-screen mx-auto bg-[#ffffff] overflow-hidden border border-neutral-300","h-[100vh]"
    )}>
      {/* Sidebar */}
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link) => (
                <SidebarLink key={link.label} link={link} />
              ))}
            </div>
          </div>
          <div>
          <SidebarLink
  link={{
    label: `${userData?.displayName || "Guest"}`,
    href: "#",
    icon: (
      <Image
        src={avatarUrl}
        className="h-7 w-7 flex-shrink-0 rounded-full"
        width={50}
        height={50}
        alt="Avatar"
      />
    ),
    onClick: async () => {
      try {
        console.log("🚪 Logging out...");
        await logout(); 
        window.location.href = "/login"; 
      } catch (error) {
        console.error("❌ Logout failed:", error);
      }
    },
  }}
/>
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Main Content Area */}
      <main className="w-full overflow-y-auto bg-[#d1d1d1] p-4 rounded-tl-2xl">
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