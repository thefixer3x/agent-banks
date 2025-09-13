
import { HomeIcon, BrainIcon, MessageSquareIcon, DatabaseIcon, ShieldIcon, SettingsIcon } from "lucide-react";
import Index from "./pages/Index";
import ChatPage from "./pages/ChatPage";
import MemoryPage from "./pages/MemoryPage";
import MCPPage from "./pages/MCPPage";
import AdminPage from "./pages/AdminPage";
import SettingsPage from "./pages/SettingsPage";

export const navItems = [
  {
    title: "Ghost Protocol Home",
    to: "/",
    icon: <HomeIcon className="h-4 w-4" />,
    page: <Index />,
  },
  {
    title: "AI Chat Interface",
    to: "/chat",
    icon: <MessageSquareIcon className="h-4 w-4" />,
    page: <ChatPage />,
  },
  {
    title: "Supabase MCP",
    to: "/mcp",
    icon: <DatabaseIcon className="h-4 w-4" />,
    page: <MCPPage />,
  },
  {
    title: "Memory Nexus",
    to: "/memory",
    icon: <BrainIcon className="h-4 w-4" />,
    page: <MemoryPage />,
  },
  {
    title: "Settings",
    to: "/settings",
    icon: <SettingsIcon className="h-4 w-4" />,
    page: <SettingsPage />,
  },
  {
    title: "Admin Panel",
    to: "/admin",
    icon: <ShieldIcon className="h-4 w-4" />,
    page: <AdminPage />,
  },
];
