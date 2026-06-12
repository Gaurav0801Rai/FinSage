import "server-only";
import { getAuthenticatedUser } from "@/lib/firebase/session";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants";
import ChatInterface from "@/components/chatbot/chat-interface";

export const metadata = {
  title: "FinSage ChatBot — AI Market Intelligence",
  description: "Chat with your personalized AI agent about your portfolio holdings, live market performances, and relevant financial news.",
};

export default async function ChatbotPage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect(ROUTES.login);
  }

  return (
    <div className="flex-1 w-full flex flex-col p-6 space-y-6">
      {/* Title block */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gradient">
          FinSage ChatBot
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Interactive chat based on your holdings and processed portfolio news.
        </p>
      </div>

      {/* Main conversational container stretching full width & height */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Glow ambient background behind chat container */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/5 blur-3xl pointer-events-none rounded-full" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-500/5 blur-3xl pointer-events-none rounded-full" />
        
        <ChatInterface />
      </div>
    </div>
  );
}
