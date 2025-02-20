import React from "react";
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
  SidebarLinkData,
  SidebarProvider, // ✅ Import SidebarProvider
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
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthProvider";
import ProtectedRoute from "../Shared/ProtectedRoute";

export default function DashboardSidebar({ children }: { children?: React.ReactNode }) {
  const links: SidebarLinkData[] = [
    { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="h-6 w-6" /> },
    { label: "New Link", href: "/newlink", icon: <Plus className="h-6 w-6" /> },
    { label: "Favorites", href: "/favorites", icon: <Heart className="h-6 w-6" /> },
    { label: "Categories", href: "/categories", icon: <Library className="h-6 w-6" /> },
    { label: "Tags", href: "/tags", icon: <Tags className="h-6 w-6" /> },
    { label: "Settings", href: "/settings", icon: <Settings2 className="h-6 w-6" /> },
  ];

  const { userData } = useAuth();
  const avatarUrl = userData?.photoURL || "/assets/logo.png";

  return (
    <SidebarProvider> {/* ✅ Wrap the whole sidebar in SidebarProvider */}
      <ProtectedRoute>
        <div className="flex flex-col md:flex-row h-screen mx-auto bg-[var(--white)] overflow-hidden">
          {/* Sidebar */}
          <Sidebar>
            <SidebarBody className="justify-between gap-10">
              <div className="flex flex-col flex-1 overflow-y-auto items-start w-full">
                <SidebarContent links={links} />
              </div>
            </SidebarBody>
          </Sidebar>

          {/* Main Content Area */}
          <main className="w-full overflow-y-auto bg-[#e4e4e4] p-4 rounded-tl-2xl">
            {children || <div className="text-gray-700">No content available.</div>}
          </main>
        </div>
      </ProtectedRoute>
    </SidebarProvider>
  );
}

// Extract Sidebar content for clarity
const SidebarContent = ({ links }: { links: SidebarLinkData[] }) => {
  const { open, setOpen } = useSidebar(); // ✅ Get context state

  return (
    <>
      {open ? <Logo /> : <LogoIcon />}
      <div className="flex flex-col gap-2 w-full">
        {links.map((link) => (
          <SidebarLink key={link.label} link={link} />
        ))}
      </div>
      {/* Toggle button */}
      <div className="mt-auto w-full">
      <SidebarLink
                link={{
                  label: "Toggle Sidebar",
                  href: "#",
                  icon: <PanelLeft />,
                  onClick: () => {
                    console.log("Button tapped")
                    setOpen(!open);
                    console.log("Menu Icon Tapped");
                  },
                }}
              />
      </div>
    </>
  );
};

const Logo = () => {
  const { open } = useSidebar();
  return (
    <Link href="/dashboard" className="flex items-center space-x-2 text-xl text-black py-1">
      <Image src="/assets/logo.svg" alt="Bridgea Logo" width={24} height={24} className="object-contain" />
      <motion.span
        initial={{ opacity: 0, width: 0 }}
        animate={{ opacity: open ? 1 : 0, width: open ? "auto" : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="overflow-hidden whitespace-nowrap font-small text-black"
      >
        Bridgea.
      </motion.span>
    </Link>
  );
};

const LogoIcon = () => (
  <Link href="/dashboard" className="flex items-center space-x-2 text-xl text-black py-1">
    <Image src="/assets/logo.svg" alt="Bridgea Logo" width={24} height={24} className="object-contain" />
  </Link>
);