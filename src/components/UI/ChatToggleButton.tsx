import React from "react";
// Import the MessageCircle icon from lucide-react.
import { MessageCircle } from "lucide-react";
// Import the utility to merge Tailwind classes.
import { cn } from "@/utils/twMerge";

// Define the props for the ChatToggleButton component.
interface ChatToggleButtonProps {
  // onClick: function to be called when the button is clicked.
  onClick: () => void;
}

// ChatToggleButton component renders a button with an icon.
// When clicked, it triggers the onClick callback passed via props.
const ChatToggleButton: React.FC<ChatToggleButtonProps> = ({ onClick }) => {
  return (
    <button
      // Attach the onClick event handler.
      onClick={onClick}
      // Merge Tailwind CSS classes to style the button:
      // - flex: use flexbox
      // - items-center & justify-center: center the icon
      // - w-15 h-15: width and height
      // - rounded-full: circular shape
      // - border-2 & border-[var(--grey)]: 2px border with grey color variable
      // - bg-white: white background
      // - text-gray-600: grey text color
      // - hover:text-gray-800 & hover:bg-[var(--grey)]: on hover, change text and background colors
      // - transition-all duration-200: smooth transitions for all properties over 200ms
      className={cn(
        "flex items-center justify-center w-15 h-15 rounded-full border-2 border-[var(--grey)] bg-white text-gray-600",
        "hover:text-gray-800 hover:bg-[var(--grey)] transition-all duration-200"
      )}
    >
      {/* Render the MessageCircle icon with specified size. */}
      <MessageCircle className="w-5 h-5" />
    </button>
  );
};

export default ChatToggleButton;