import { cn } from "@/utils/twMerge";
import Link, { LinkProps } from "next/link";
import React, { useState, createContext, useContext } from "react";
import { useRouter } from "next/router";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";

// Define SidebarLinkData type
export interface SidebarLinkData {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

// Context for sidebar state
interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

// SidebarProvider component
export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);
  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

// Sidebar component
export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

// SidebarBody component
export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<"div">)} />
    </>
  );
};

// DesktopSidebar component
export const DesktopSidebar = ({ className, children, ...props }: React.ComponentProps<typeof motion.div>) => {
  const { open, animate } = useSidebar();

  return (
    <motion.div
      className={cn(
        "h-full px-4 py-4 hidden md:flex md:flex-col bg-[var(--grey)] flex-shrink-0",
        className
      )}
      animate={{
        width: animate ? (open ? "240px" : "80px") : "240px",
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// MobileSidebar component
export const MobileSidebar = ({ className, children, ...props }: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();

  return (
    <div className={cn("h-10 px-4 py-4 flex flex-row md:hidden items-center justify-between w-full")} {...props}>
      <div
        className="flex justify-end z-20 w-full"
        role="button"
        tabIndex={0}
        onClick={() => setOpen(!open)}
      >
        <Menu className="text-[--night]" />
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className={cn("fixed h-full w-full inset-0 bg-[var(--white)] p-10 z-[100] flex flex-col justify-between", className)}
          >
            <div
              className="absolute right-10 top-10 z-50 text-[--night]"
              role="button"
              tabIndex={0}
              onClick={() => setOpen((prev) => !prev)}
            >
              <X />
            </div>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// SidebarLink component with Active State
export const SidebarLink = ({
  link,
  className,
  onClick, 
  ...props
}: {
  link: SidebarLinkData;
  className?: string;
  onClick?: () => void;
  props?: LinkProps;
}) => {
  const { open } = useSidebar();
  const router = useRouter();

  // Detect active link
  const isActive = router.pathname === link.href;

  return (
    <Link
  href={link.href}
  className={cn(
    "flex items-center rounded-full transition-all duration-200 px-3 py-2",
    open ? "w-full justify-start gap-3" : "justify-center w-12 h-12",
    isActive ? "bg-[var(--black)] text-white" : "text-[var(--black)] hover:bg-[var(--orangeLightOut)]",
    className
  )}
  {...props}
  onClick={onClick}
>
  {/* Icon Container - Ensures Matching Size */}
  <div className="flex items-center justify-center w-10 h-10 rounded-full">
    {link.icon}
  </div>

  {/* Animate Text Visibility Based on Sidebar State */}
  <motion.span
    animate={{
      opacity: open ? 1 : 0,
      width: open ? "auto" : "0px",
    }}
    transition={{ duration: 0.2, ease: "easeInOut" }}
    className="overflow-hidden whitespace-nowrap font-medium text-sm"
  >
    {link.label}
  </motion.span>
</Link>
  );
};