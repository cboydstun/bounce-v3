import { MessageCircle } from "lucide-react";

interface ChatButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export default function ChatButton({ onClick, isOpen }: ChatButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{ position: "fixed", bottom: "24px", right: "24px" }}
      className={`z-[9999] flex items-center justify-center w-14 h-14 rounded-full bg-purple-600 hover:bg-purple-700 transition-all duration-200 shadow-lg ${
        isOpen ? "scale-0" : "scale-100"
      }`}
      aria-label={isOpen ? "Close chat" : "Open chat"}
    >
      <MessageCircle className="w-6 h-6 text-white" />
    </button>
  );
}
