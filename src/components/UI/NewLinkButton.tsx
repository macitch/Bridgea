import { useSidebar } from "../UI/SidebarElements";
import Link from "next/link";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/utils/twMerge";

export default function NewLinkButton() {
  const { open } = useSidebar();

  return (
    <Link
      href="/newlink"
      className={cn(
        "flex items-center rounded-full transition-all duration-200",
        open
          ? "bg-[var(--orange)] px-3 py-2 w-full max-w-sm text-white" // ✅ Sidebar Open: Full Button
          : "bg-[var(--orange)] w-12 h-12 justify-center" // ✅ Sidebar Closed: Small Orange Circle
      )}
    >
      {/* Icon: Changes Based on Sidebar State */}
      <div
        className={cn(
          "flex items-center justify-center rounded-full transition-all duration-200",
          open ? "w-10 h-10 mr-2" : "bg-transparent w-auto h-auto"
        )}
      >
        <Plus className={cn(open ? "h-6 w-6 text-white" : "h-6 w-6 text-white")} />
      </div>

      {/* Animated Text - Only Visible When Sidebar is Open */}
      <motion.span
        animate={{
          opacity: open ? 1 : 0,
          width: open ? "auto" : "0px",
        }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="overflow-hidden whitespace-nowrap"
      >
        New Link
      </motion.span>
    </Link>
  );
}