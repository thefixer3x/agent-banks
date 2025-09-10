
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./components/layout/Layout";
import Index from "./pages/Index";
import ChatPage from "./pages/ChatPage";
import MCPPage from "./pages/MCPPage";
import MemoryPage from "./pages/MemoryPage";
import AuthPage from "./pages/AuthPage";
import AdminPage from "./pages/AdminPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppRoutes = () => {
  return (
    <Routes>
      {/* All routes are now public - no authentication required */}
      <Route path="/auth" element={
        <Layout showNavigation={false}>
          <AuthPage />
        </Layout>
      } />
      
      <Route path="/" element={
        <Layout>
          <Index />
        </Layout>
      } />
      
      <Route path="/chat" element={
        <Layout>
          <ChatPage />
        </Layout>
      } />
      
      <Route path="/mcp" element={
        <Layout>
          <MCPPage />
        </Layout>
      } />
      
      <Route path="/memory" element={
        <Layout>
          <MemoryPage />
        </Layout>
      } />
      
      <Route path="/settings" element={
        <Layout>
          <SettingsPage />
        </Layout>
      } />
      
      <Route path="/admin" element={
        <Layout>
          <AdminPage />
        </Layout>
      } />
      
      {/* 404 Route */}
      <Route path="*" element={
        <Layout>
          <NotFound />
        </Layout>
      } />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
