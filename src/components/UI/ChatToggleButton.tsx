import React from "react";
import { MessageCircle } from "lucide-react";
import { cn } from "@/utils/twMerge";

interface ChatToggleButtonProps {
  onClick: () => void;
}

const ChatToggleButton: React.FC<ChatToggleButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-center w-15 h-15 rounded-full border-2 border-[var(--grey)] bg-white text-gray-600",
        "hover:text-gray-800 hover:bg-[var(--grey)] transition-all duration-200"
      )}
    >
      <MessageCircle className="w-5 h-5" />
    </button>
  );
};

export default ChatToggleButton;