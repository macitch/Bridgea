import { useSidebar } from "../UI/SidebarElements"; // Custom hook to manage sidebar state (open/closed)
import Link from "next/link"; // Next.js Link component for client-side navigation
import { Plus } from "lucide-react"; // Icon component for the plus symbol
import { motion } from "framer-motion"; // Framer Motion component for animation

/**
 * NewLinkButton component renders a button that navigates to the "newlink" page.
 * The button adapts its appearance based on whether the sidebar is open or closed.
 */
export default function NewLinkButton() {
  // Destructure 'open' from the sidebar hook to know if the sidebar is expanded
  const { open } = useSidebar();

  return (
    // The Link component wraps the entire button to make it clickable and navigate to '/newlink'
    <Link
      href="/newlink"
      // Conditional classes adjust padding, width, and justification based on sidebar state.
      // When 'open' is true, the button is wider with padding and text aligned to the start.
      // When 'open' is false, the button is compact (32px square) and centers its content.
      className={`flex items-center gap-2 bg-orange-500 text-white font-medium rounded-md py-3 transition-all duration-200
        ${open ? "px-4 w-full justify-start" : "w-[32px] h-[32px] justify-center"}
      `}
    >
      {/* The Plus icon is always visible */}
      <Plus className="h-6 w-6" />

      {/* The text label "New Link" is wrapped in a motion.span for smooth animations */}
      <motion.span
        // Animate the span's opacity and width based on the sidebar state:
        // When sidebar is open, set opacity to 1 and width to auto (to display the text).
        // When sidebar is closed, set opacity to 0 and width to 0px (hiding the text).
        animate={{
          opacity: open ? 1 : 0,
          width: open ? "auto" : "0px",
        }}
        // Classes ensure text is hidden when not visible and transitions smoothly.
        className="overflow-hidden whitespace-nowrap transition-all duration-200"
      >
        New Link
      </motion.span>
    </Link>
  );
}