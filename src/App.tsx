import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AICopilot } from "@/components/AICopilot";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Characters from "./pages/Characters";
import Episodes from "./pages/Episodes";
import EpisodeDetail from "./pages/EpisodeDetail";
import Workflow from "./pages/Workflow";
import Auth from "./pages/Auth";
import CreateProject from "./pages/CreateProject";
import MediaLibrary from "./pages/MediaLibrary";
import Analytics from "./pages/Analytics";
import SystemMonitor from "./pages/SystemMonitor";
import ViralBots from "./pages/ViralBots";
import Install from "./pages/Install";
import VideoGeneration from "./pages/VideoGeneration";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/install" element={<ProtectedRoute><Install /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/characters" element={<ProtectedRoute><Characters /></ProtectedRoute>} />
          <Route path="/episodes" element={<ProtectedRoute><Episodes /></ProtectedRoute>} />
          <Route path="/episodes/:id" element={<ProtectedRoute><EpisodeDetail /></ProtectedRoute>} />
          <Route path="/workflow" element={<ProtectedRoute><Workflow /></ProtectedRoute>} />
          <Route path="/create" element={<ProtectedRoute><CreateProject /></ProtectedRoute>} />
          <Route path="/media" element={<ProtectedRoute><MediaLibrary /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/system-monitor" element={<ProtectedRoute><SystemMonitor /></ProtectedRoute>} />
          <Route path="/viral-bots" element={<ProtectedRoute><ViralBots /></ProtectedRoute>} />
          <Route path="/video-generation" element={<ProtectedRoute><VideoGeneration /></ProtectedRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <AICopilot />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
