import { useSidebar } from "../UI/SidebarElements";
import Link from "next/link";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/utils/twMerge";

// NewLinkButton component renders a link styled as a button that navigates to "/newlink".
// The appearance changes depending on whether the sidebar is open.
export default function NewLinkButton() {
  // Retrieve the sidebar open state from context.
  const { open } = useSidebar();

  return (
    <Link
      href="/newlink"
      // Merge Tailwind CSS classes based on the sidebar state:
      // When open, display a full-width button with padding and white text.
      // When closed, display a compact circular button.
      className={cn(
        "flex items-center rounded-full transition-all duration-200",
        open
          ? "bg-[var(--orange)] px-3 py-2 w-full max-w-sm text-white"
          : "bg-[var(--orange)] w-12 h-12 justify-center"
      )}
    >
      {/* Icon container: adjusts spacing based on sidebar state */}
      <div
        className={cn(
          "flex items-center justify-center rounded-full transition-all duration-200",
          open ? "w-10 h-10 mr-2" : "bg-transparent w-auto h-auto"
        )}
      >
        {/* Render the Plus icon; color and size remain consistent regardless of sidebar state */}
        <Plus className={cn(open ? "h-6 w-6 text-white" : "h-6 w-6 text-white")} />
      </div>

      {/* Animated text that appears only when the sidebar is open */}
      <motion.span
        animate={{
          opacity: open ? 1 : 0,  // Fully visible when open, hidden when closed.
          width: open ? "auto" : "0px",  // Auto width when open, zero width when closed.
        }}
        transition={{ duration: 0.2, ease: "easeInOut" }}  // Smooth transition for the text.
        className="overflow-hidden whitespace-nowrap"
      >
        New Link
      </motion.span>
    </Link>
  );
}